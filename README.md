# Discord Poster

A tool to automate Discord channel posting.

## System Requirements

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **Operating System**:
  - Windows 10/11
  - macOS 10.15 or higher
  - Ubuntu 20.04+ / Debian 11+ / other Linux distributions
- **RAM**: 2GB minimum
- **Internet connection** (required for initial setup to download browser binaries)

## Installation

### Quick Install

#### Windows
1. Double-click `install.bat`
2. Wait for installation to complete

#### Mac/Linux
1. Open Terminal in the project folder
2. Run: `chmod +x install.sh && ./install.sh`
3. Wait for installation to complete

### Manual Install

If the scripts don't work, you can install manually:

```bash
# Install backend
cd backend
npm install

# Install frontend  
cd ../frontend
npm install
```

## Quick Start (No Configuration Needed!)

The app works immediately with smart defaults. Just install and run!

**Default Settings:**
- Port: 3000
- Authentication: Disabled
- Concurrent tabs: 3

## Running the Application

### Quick Start

#### Windows
Double-click `start.bat`

#### Mac/Linux
```bash
chmod +x start.sh
./start.sh
```

### Manual Start

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## First Time Setup

1. Open the frontend in your browser (http://localhost:3000)
2. Go to Settings
3. Click "Connect to Discord"
4. Log in to Discord in the popup window
5. Wait for the session to be saved

## Optional: Advanced Configuration

Only needed if you want to customize settings:

1. Copy `backend/.env.example` to `backend/.env`
2. Edit `backend/.env`:
   ```env
   # Backend port (default: 3000)
   PORT=3000
   
   # Enable password protection (default: false)
   ENABLE_AUTH=false
   AUTH_USERNAME=admin
   AUTH_PASSWORD=your_password
   
   # Number of simultaneous browser tabs (default: 3)
   CONCURRENT_TABS=3
   ```
3. Restart the application

## Platform-Specific Notes

### Windows
- Scripts will open in separate Command Prompt windows
- You can minimize but don't close the windows while using the app

### Mac
- You may need to allow Terminal to control other applications
- Grant permissions in System Preferences → Security & Privacy if prompted

### Linux
- Make scripts executable: `chmod +x *.sh`
- If Playwright fails to install browsers, run: `npx playwright install-deps`

## Troubleshooting

### "Playwright browsers not found"
Run in the backend folder:
```bash
npx playwright install chromium
```

### Port already in use
Change ports in:
- Backend: Create `backend/.env` and set `PORT=5001`
- Frontend: Edit `frontend/vite.config.js` and change server port

### Permission errors (Mac/Linux)
Make scripts executable:
```bash
chmod +x install.sh start.sh
```

## Development

### Running Tests
```bash
cd backend
npm test
```

### Building for Production
```bash
cd frontend
npm run build
```

## License

[Your License]

## Support

[Your support contact]
