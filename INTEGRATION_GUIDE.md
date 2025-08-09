# DonateStream - Complete Integration Guide

This guide explains how the entire DonateStream system works and how to test it end-to-end.

## 🏗️ System Architecture

```
┌─────────────────┐    HTTP POST     ┌─────────────────┐
│  Browser        │ ───────────────► │  Express.js     │
│  Extension      │                  │  Backend        │
│  (Donor Side)   │                  │  (Port 3001)    │
└─────────────────┘                  └─────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  JSON File      │
                                     │  Storage        │
                                     │  donations.json │
                                     └─────────────────┘
                                              ▲
                                              │
┌─────────────────┐    HTTP GET      ┌─────────────────┐
│  Streamer       │ ◄─────────────── │  Dashboard      │
│  Dashboard      │                  │  Website        │
│  (Web Browser)  │                  │  (Port 3001)    │
└─────────────────┘                  └─────────────────┘
```

## 🔄 How The Logic Works

### 1. **Donation Flow (Frontend → Backend)**
```
1. User visits YouTube/Twitch in browser
2. Opens DonateStream extension
3. Extension detects streamer name from current tab
4. User enters donation amount and message
5. Extension sends POST request to backend:
   POST http://localhost:3001/api/donations
   {
     "streamerName": "DetectedStreamerName",
     "streamerPlatform": "YouTube",
     "donorName": "Anonymous Donor",
     "amount": 5.00,
     "message": "Great content!",
     "timestamp": "2024-01-01T12:00:00.000Z"
   }
6. Backend saves to donations.json file
7. Extension shows success message
```

### 2. **Streamer Dashboard Flow (Backend → Frontend)**
```
1. Streamer opens http://localhost:3001/dashboard
2. Enters their streamer name (must match detection)
3. Dashboard sends GET request to backend:
   GET http://localhost:3001/api/donations/StreamerName
4. Backend reads donations.json and filters by streamer
5. Dashboard displays donations with real-time updates
6. Streamer can mark messages as read
7. Dashboard auto-refreshes every 30 seconds
```

## 🚀 Step-by-Step Testing Instructions

### Step 1: Start the Backend Server

**Option A: Using start scripts**
```bash
# Windows
cd extension-devmatch2025/backend
start.bat

# Mac/Linux
cd extension-devmatch2025/backend
./start.sh
```

**Option B: Manual setup**
```bash
cd extension-devmatch2025/backend
npm install
npm start
```

**Expected Output:**
```
✅ DonateStream Backend running on port 3001
📊 Dashboard available at: http://localhost:3001/dashboard
🔗 API Health check: http://localhost:3001/api/health
```

### Step 2: Test Backend API

Open browser and test these URLs:

1. **Health Check**: http://localhost:3001/api/health
   - Should show: `{"status":"OK","message":"DonateStream Backend is running"}`

2. **API Overview**: http://localhost:3001/
   - Should show JSON with all available endpoints

3. **Empty Donations**: http://localhost:3001/api/donations
   - Should show: `{"success":true,"totalDonations":0,"donations":[]}`

### Step 3: Load Browser Extension

1. **Build the extension:**
   ```bash
   cd extension-devmatch2025
   npm install  # if not already done
   npm run build
   ```

2. **Load in Chrome:**
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `extension-devmatch2025/build/chrome-mv3-dev/` folder

3. **Extension should appear** in Chrome toolbar

### Step 4: Test Complete Flow

1. **Go to a streaming platform:**
   - Open YouTube: `https://youtube.com/watch?v=VIDEO_ID`
   - Or Twitch: `https://twitch.tv/STREAMER_NAME`

2. **Open the extension:**
   - Click the DonateStream icon in Chrome toolbar
   - Click "Connect Wallet"
   - Should detect streamer name from current tab

3. **Make a test donation:**
   - Enter amount (e.g., "5.00")
   - Add message (e.g., "Test donation!")
   - Click "Donate $5.00 USDC"
   - Should show success animation

4. **Verify in backend:**
   - Check: http://localhost:3001/api/donations
   - Should show your test donation in JSON format

5. **Open streamer dashboard:**
   - Go to: http://localhost:3001/dashboard
   - Enter the detected streamer name
   - Click "Load Donations"
   - Should display your test donation with "New" badge

6. **Test dashboard features:**
   - Mark donation as read
   - Check stats (total amount, unread count)
   - Test auto-refresh (make another donation and wait 30 seconds)

## 🛠️ Troubleshooting

### Backend Issues

**"Port 3001 already in use"**
```bash
# Find what's using port 3001
netstat -ano | findstr 3001  # Windows
lsof -i :3001               # Mac/Linux

# Kill the process or change port in server.js
```

**"Cannot connect to backend"**
- Verify server is running: http://localhost:3001/api/health
- Check extension console for CORS errors
- Ensure no firewall blocking port 3001

### Extension Issues

**"No streamer detected"**
- Make sure you're on a valid YouTube/Twitch page
- Check the URL matches detection patterns in popup.tsx
- Look at browser console for errors

**"Donation not appearing in dashboard"**
- Verify streamer name matches exactly (case-sensitive)
- Check network tab for failed API requests
- Ensure backend received the POST request

### Dashboard Issues

**"No donations found"**
- Verify streamer name is correct
- Check if donations exist: http://localhost:3001/api/donations
- Try refreshing the dashboard

## 📁 File Structure

```
extension-devmatch2025/
├── popup.tsx              # Extension frontend (donor interface)
├── style.css              # Extension styles
├── package.json           # Extension dependencies
├── backend/
│   ├── server.js          # Express.js API server
│   ├── package.json       # Backend dependencies
│   ├── start.bat          # Windows startup script
│   ├── start.sh           # Unix startup script
│   ├── README.md          # Backend documentation
│   ├── data/              # Data storage
│   │   └── donations.json # JSON file storing donations
│   └── public/
│       └── index.html     # Streamer dashboard website
└── INTEGRATION_GUIDE.md   # This file
```

## 🔍 Data Flow Example

**Example donation.json after testing:**
```json
[
  {
    "id": "1704067200000",
    "streamerName": "ExampleYouTuber",
    "streamerPlatform": "YouTube", 
    "donorName": "Anonymous Donor",
    "amount": 5.00,
    "message": "Love your content! Keep it up!",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "read": false
  },
  {
    "id": "1704067260000", 
    "streamerName": "TwitchStreamer",
    "streamerPlatform": "Twitch",
    "donorName": "Anonymous Donor", 
    "amount": 10.00,
    "message": "Great stream tonight!",
    "timestamp": "2024-01-01T12:01:00.000Z",
    "read": true
  }
]
```

## ✅ Success Criteria

The system is working correctly when:

1. ✅ Backend starts without errors on port 3001
2. ✅ Extension detects streamer names from YouTube/Twitch tabs
3. ✅ Donations are saved to JSON file via API
4. ✅ Dashboard loads and displays donations for correct streamer
5. ✅ Real-time features work (auto-refresh, mark as read)
6. ✅ Stats are calculated correctly (totals, unread counts)

## 🚀 Production Considerations

For a production deployment, you would need:

- **Database**: Replace JSON file with PostgreSQL/MongoDB
- **Authentication**: Secure the dashboard with login
- **HTTPS**: Use SSL certificates
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Sanitize all user inputs
- **Error Handling**: Proper error pages and logging
- **Hosting**: Deploy backend to cloud service
- **CDN**: Host dashboard assets on CDN

## 📞 Support

If you need help:
1. Check the console logs in both extension and browser
2. Verify API endpoints with curl or Postman
3. Test each component separately before integration
4. Ensure all dependencies are installed correctly
