# Pulsify Discord Poster

A tool to automate Discord channel posting.

## System Requirements

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **Operating System**:
  - Windows 10/11
  - macOS 10.15 or higher
  - Ubuntu 20.04+ / Debian 11+ / other Linux distributions
- **RAM**: 2GB minimum
- **Internet connection** (required for initial setup to download browser binaries)

## 🚀 Installation

### Windows
1. Run `setup.bat`
   - This script will automatically request Admin privileges to check/install Node.js if missing.
   - It will install all dependencies in the new `source` directory.
2. (Optional) Configure your `.env` file in `source\backend`. The application works with default settings.
3. Run `start.bat` to launch the application.

### Linux / Mac
1. Ensure Node.js is installed.
2. Navigate to the `mac-linux` folder:
   ```bash
   cd mac-linux
   ```
3. Run setup:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
4. (Optional) Configure your `.env` file in `source/backend`. The application works with default settings.
5. Run start:
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

## Project Structure
- `source/`: Contains the `backend` and `frontend` code.
- `mac-linux/`: Contains shell scripts for Unix-based systems.
- `setup.bat` / `start.bat`: Windows automation scripts.

## Troubleshooting

### "Playwright browsers not found"
Run in the `source/backend` folder:
```bash
npx playwright install chromium
```

### Port already in use
Change ports in:
- Backend: Create `source/backend/.env` and set `PORT=5001`
- Frontend: Edit `source/frontend/vite.config.js` and change server port

### Permission errors (Mac/Linux)
Make scripts executable:
```bash
cd mac-linux
chmod +x setup.sh start.sh
```

## Development

### Running Tests
```bash
cd source/backend
npm test
```

### Building for Production
```bash
cd source/frontend
npm run build
```
