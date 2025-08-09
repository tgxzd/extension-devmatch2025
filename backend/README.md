# DonateStream Backend

Express.js backend server for handling donation messages from the DonateStream browser extension.

## Features

- 📨 **Store Donations**: Receives and stores donation messages in JSON format
- 🔍 **Fetch by Streamer**: Retrieve donations for specific streamers
- 📊 **Streamer Dashboard**: Web interface for streamers to view their donations
- ✅ **Mark as Read**: Track which donations have been viewed
- 🔄 **Real-time Updates**: Auto-refresh dashboard every 30 seconds

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Server
```bash
npm start
# or for development with auto-restart:
npm run dev
```

The server will start on `http://localhost:3001`

### 3. Access the Dashboard
Open your browser and go to: `http://localhost:3001/dashboard`

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if server is running

### Donations
- **POST** `/api/donations` - Create a new donation
- **GET** `/api/donations` - Get all donations
- **GET** `/api/donations/:streamerName` - Get donations for a specific streamer
- **PUT** `/api/donations/:donationId/read` - Mark donation as read
- **PUT** `/api/donations/:streamerName/read-all` - Mark all donations as read for a streamer

### Dashboard
- **GET** `/dashboard` - Streamer dashboard interface

## Data Storage

Donations are stored in `backend/data/donations.json` as an array of objects with the following structure:

```json
{
  "id": "1640995200000",
  "streamerName": "ExampleStreamer",
  "streamerPlatform": "YouTube",
  "donorName": "Anonymous Donor",
  "amount": 5.00,
  "message": "Keep up the great work!",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "read": false
}
```

## Browser Extension Integration

The browser extension sends POST requests to `/api/donations` when users make donations. Make sure:

1. The backend server is running on port 3001
2. CORS is enabled (already configured)
3. The extension has the correct API endpoint URL

## Dashboard Features

### For Streamers:
- 👤 **Profile Setup**: Enter your streamer name and platform
- 📊 **Live Stats**: View total donations, amounts, and unread counts
- 💬 **Message Management**: Read donation messages and mark as read
- 🔔 **Notifications**: Visual indicators for new donations
- 🔄 **Auto-refresh**: Dashboard updates every 30 seconds
- 📱 **Responsive Design**: Works on desktop and mobile

### Dashboard Usage:
1. Open `http://localhost:3001/dashboard`
2. Enter your streamer name (must match what viewers see in the extension)
3. Optionally filter by platform (YouTube, Twitch, etc.)
4. Click "Load Donations" to see your messages
5. Use "Mark as Read" or "Mark All Read" to manage notifications

## Development

### File Structure
```
backend/
├── server.js          # Main Express server
├── package.json       # Dependencies and scripts
├── data/             # Data storage directory
│   └── donations.json # JSON file storing all donations
└── public/           # Static files for dashboard
    └── index.html    # Streamer dashboard
```

### Environment Variables
- `PORT` - Server port (default: 3001)

### Dependencies
- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **body-parser** - Request body parsing
- **fs** - File system operations (built-in)
- **path** - Path utilities (built-in)

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check if port 3001 is available
   - Run `npm install` to ensure dependencies are installed

2. **Dashboard shows no donations**
   - Verify the streamer name matches exactly what's used in the extension
   - Check the browser console for API errors
   - Ensure the backend server is running

3. **Extension can't send donations**
   - Verify the backend URL in the extension code
   - Check CORS settings in server.js
   - Ensure the server is accessible from the extension

4. **Data not persisting**
   - Check file permissions in the `data/` directory
   - Verify JSON file format in `donations.json`

### Logs
The server logs important events to the console:
- Server startup confirmation
- API request errors
- File I/O operations

## Security Notes

- This is a development setup. For production:
  - Add authentication for the dashboard
  - Implement rate limiting
  - Use a proper database instead of JSON files
  - Add input validation and sanitization
  - Use HTTPS
  - Implement proper error handling

## Support

If you encounter issues:
1. Check the console logs for errors
2. Verify all dependencies are installed
3. Ensure the correct ports are used
4. Test API endpoints directly with curl or Postman
