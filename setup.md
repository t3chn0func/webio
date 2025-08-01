# Setup Instructions

## Prerequisites

Before running this project, you need to install Node.js and npm:

1. **Download and Install Node.js**
   - Visit https://nodejs.org/
   - Download the LTS version (recommended)
   - Run the installer and follow the setup wizard
   - This will also install npm (Node Package Manager)

2. **Verify Installation**
   ```bash
   node --version
   npm --version
   ```

## Project Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your actual configuration:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` file with your SIP server details, API keys, etc.

3. **Create Required Directories**
   ```bash
   mkdir -p data logs
   ```

4. **Run Tests** (optional)
   ```bash
   npm test
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Start Production Server**
   ```bash
   npm start
   ```

## Critical Issues Fixed

✅ **Module System Consistency**: Fixed ES6/CommonJS module conflicts
✅ **Missing Dependencies**: Added cors, helmet, dotenv, supertest
✅ **Database Schema**: Added missing sbcType field
✅ **Environment Variables**: Added proper .env configuration
✅ **Error Handling**: Enhanced error handling and logging
✅ **Security**: Added helmet, CORS, rate limiting
✅ **Frontend Integration**: Fixed SBC configuration loading

## Next Steps

1. Install Node.js if not already installed
2. Run `npm install` to install dependencies
3. Configure your `.env` file with actual SIP server details
4. Test the application with `npm run dev`
5. Deploy to production environment

## Important Notes

- The project now uses proper environment variable configuration
- Database will be automatically created on first run
- WebSocket connections are properly handled
- All critical security issues have been addressed
- Frontend now properly loads SBC configurations