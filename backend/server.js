const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Data storage path
const DATA_DIR = path.join(__dirname, 'data');
const DONATIONS_FILE = path.join(DATA_DIR, 'donations.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Initialize donations file if it doesn't exist
async function initializeDonationsFile() {
  try {
    await fs.access(DONATIONS_FILE);
  } catch (error) {
    await fs.writeFile(DONATIONS_FILE, JSON.stringify([], null, 2));
  }
}

// Load donations from file
async function loadDonations() {
  try {
    const data = await fs.readFile(DONATIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading donations:', error);
    return [];
  }
}

// Save donations to file
async function saveDonations(donations) {
  try {
    await fs.writeFile(DONATIONS_FILE, JSON.stringify(donations, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving donations:', error);
    return false;
  }
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'DonateStream Backend is running' });
});

// POST endpoint to receive donations
app.post('/api/donations', async (req, res) => {
  try {
    const { 
      streamerName, 
      streamerPlatform, 
      donorName, 
      amount, 
      message, 
      timestamp 
    } = req.body;

    // Validate required fields
    if (!streamerName || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: streamerName and amount are required' 
      });
    }

    // Load existing donations
    const donations = await loadDonations();

    // Create new donation object
    const newDonation = {
      id: Date.now().toString(), // Simple ID generation
      streamerName: streamerName.trim(),
      streamerPlatform: streamerPlatform || 'Unknown',
      donorName: donorName || 'Anonymous',
      amount: parseFloat(amount),
      message: message || '',
      timestamp: timestamp || new Date().toISOString(),
      read: false // Flag to track if streamer has seen this donation
    };

    // Add to donations array
    donations.push(newDonation);

    // Save to file
    const saved = await saveDonations(donations);

    if (saved) {
      res.status(201).json({ 
        success: true, 
        message: 'Donation saved successfully',
        donationId: newDonation.id
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to save donation' 
      });
    }

  } catch (error) {
    console.error('Error processing donation:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// GET endpoint to fetch donations for a specific streamer
app.get('/api/donations/:streamerName', async (req, res) => {
  try {
    const { streamerName } = req.params;
    const { platform, unreadOnly } = req.query;

    // Load donations
    const donations = await loadDonations();

    // Filter donations for the specific streamer
    let filteredDonations = donations.filter(donation => 
      donation.streamerName.toLowerCase() === streamerName.toLowerCase()
    );

    // Filter by platform if specified
    if (platform) {
      filteredDonations = filteredDonations.filter(donation => 
        donation.streamerPlatform.toLowerCase() === platform.toLowerCase()
      );
    }

    // Filter unread only if specified
    if (unreadOnly === 'true') {
      filteredDonations = filteredDonations.filter(donation => !donation.read);
    }

    // Sort by timestamp (newest first)
    filteredDonations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      streamerName,
      totalDonations: filteredDonations.length,
      donations: filteredDonations
    });

  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// GET endpoint to fetch all donations (for admin/debugging)
app.get('/api/donations', async (req, res) => {
  try {
    const donations = await loadDonations();
    
    // Sort by timestamp (newest first)
    donations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      totalDonations: donations.length,
      donations
    });

  } catch (error) {
    console.error('Error fetching all donations:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// PUT endpoint to mark donations as read
app.put('/api/donations/:donationId/read', async (req, res) => {
  try {
    const { donationId } = req.params;

    // Load donations
    const donations = await loadDonations();

    // Find and update donation
    const donationIndex = donations.findIndex(d => d.id === donationId);

    if (donationIndex === -1) {
      return res.status(404).json({ 
        error: 'Donation not found' 
      });
    }

    donations[donationIndex].read = true;

    // Save updated donations
    const saved = await saveDonations(donations);

    if (saved) {
      res.json({ 
        success: true, 
        message: 'Donation marked as read' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to update donation' 
      });
    }

  } catch (error) {
    console.error('Error marking donation as read:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// PUT endpoint to mark all donations as read for a streamer
app.put('/api/donations/:streamerName/read-all', async (req, res) => {
  try {
    const { streamerName } = req.params;

    // Load donations
    const donations = await loadDonations();

    // Update all donations for this streamer
    let updatedCount = 0;
    donations.forEach(donation => {
      if (donation.streamerName.toLowerCase() === streamerName.toLowerCase() && !donation.read) {
        donation.read = true;
        updatedCount++;
      }
    });

    // Save updated donations
    const saved = await saveDonations(donations);

    if (saved) {
      res.json({ 
        success: true, 
        message: `Marked ${updatedCount} donations as read`,
        updatedCount
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to update donations' 
      });
    }

  } catch (error) {
    console.error('Error marking donations as read:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Serve static files for the streamer dashboard
app.use('/dashboard', express.static(path.join(__dirname, 'public')));

// Serve the main dashboard at /dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the public donation page
app.get('/donate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'donate.html'));
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'DonateStream Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      donations: {
        create: 'POST /api/donations',
        getAll: 'GET /api/donations',
        getByStreamer: 'GET /api/donations/:streamerName',
        markRead: 'PUT /api/donations/:donationId/read',
        markAllRead: 'PUT /api/donations/:streamerName/read-all'
      },
      dashboard: 'GET /dashboard'
    }
  });
});

// Initialize and start server
async function startServer() {
  try {
    await ensureDataDirectory();
    await initializeDonationsFile();
    
    app.listen(PORT, () => {
      console.log(`✅ DonateStream Backend running on port ${PORT}`);
      console.log(`📊 Dashboard available at: http://localhost:${PORT}/dashboard`);
      console.log(`🔗 API Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
