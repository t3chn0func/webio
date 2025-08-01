# WebRTC SIP API - GitHub Upload Guide

This guide provides step-by-step instructions for uploading your WebRTC SIP API application to GitHub using both the web interface and command-line methods.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Method 1: GitHub Web Interface (Beginner-Friendly)](#method-1-github-web-interface-beginner-friendly)
3. [Method 2: Git Command Line (Recommended)](#method-2-git-command-line-recommended)
4. [Method 3: GitHub Desktop (Visual Interface)](#method-3-github-desktop-visual-interface)
5. [Repository Configuration](#repository-configuration)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Next Steps](#next-steps)

## Prerequisites

### Required Items
- ✅ GitHub account (free at [github.com](https://github.com))
- ✅ Your WebRTC SIP API project files
- ✅ Git installed on your computer (for command-line method)
- ✅ Text editor or IDE

### Check if Git is Installed
```bash
# Open Command Prompt or PowerShell and run:
git --version

# If not installed, download from: https://git-scm.com/downloads
```

---

## Method 1: GitHub Web Interface (Beginner-Friendly)

### Step 1: Create GitHub Account

1. **Sign Up for GitHub**
   - Go to [https://github.com](https://github.com)
   - Click "Sign up" in the top-right corner
   - Enter your email, password, and username
   - Verify your email address

### Step 2: Create New Repository

1. **Create Repository**
   - After logging in, click the "+" icon in the top-right corner
   - Select "New repository"

2. **Repository Settings**
   - **Repository name**: `webrtc-sip-api`
   - **Description**: `WebRTC SIP API for real-time communication with SIP integration`
   - **Visibility**: 
     - ✅ **Public** (recommended for open source)
     - ⚠️ **Private** (if you want to keep it private)
   - **Initialize repository**:
     - ✅ Add a README file
     - ✅ Add .gitignore (choose "Node" template)
     - ✅ Choose a license (MIT License recommended)
   - Click "Create repository"

### Step 3: Upload Files via Web Interface

1. **Upload Files**
   - In your new repository, click "uploading an existing file"
   - **Option A: Drag and Drop**
     - Open your project folder in File Explorer
     - Select all files (Ctrl+A)
     - Drag and drop them into the GitHub upload area
   
   - **Option B: Choose Files**
     - Click "choose your files"
     - Navigate to your project folder
     - Select all files and folders
     - Click "Open"

2. **Commit Changes**
   - **Commit message**: `Initial commit: WebRTC SIP API application`
   - **Description** (optional): 
     ```
     - Added complete WebRTC SIP API implementation
     - Included deployment guides and configuration files
     - Added Docker and Kubernetes support
     - Included AWS deployment documentation
     ```
   - Select "Commit directly to the main branch"
   - Click "Commit changes"

### Step 4: Verify Upload

1. **Check Repository**
   - Your repository should now show all uploaded files
   - Click on different files to verify they uploaded correctly
   - Check that the README.md displays properly

---

## Method 2: Git Command Line (Recommended)

### Step 1: Create Repository on GitHub

1. **Create Repository**
   - Follow steps 1-2 from Method 1
   - **Important**: Do NOT initialize with README, .gitignore, or license
   - Click "Create repository"
   - Keep the repository page open for the next steps

### Step 2: Prepare Local Repository

1. **Open Terminal/Command Prompt**
   - Navigate to your project directory:
   ```bash
   cd "C:\Users\Naveen\OneDrive\Documents\Desktop\Webpage"
   ```

2. **Initialize Git Repository**
   ```bash
   # Initialize git repository
   git init
   
   # Configure git (if not done before)
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

### Step 3: Create .gitignore File

1. **Create .gitignore**
   ```bash
   # Create .gitignore file
   echo. > .gitignore
   ```

2. **Edit .gitignore** (add the following content):
   ```gitignore
   # Dependencies
   node_modules/
   npm-debug.log*
   yarn-debug.log*
   yarn-error.log*
   
   # Environment variables
   .env
   .env.local
   .env.development.local
   .env.test.local
   .env.production.local
   
   # Logs
   logs/
   *.log
   
   # Runtime data
   pids/
   *.pid
   *.seed
   *.pid.lock
   
   # Coverage directory used by tools like istanbul
   coverage/
   
   # Database files
   *.db
   *.sqlite
   *.sqlite3
   data/
   
   # Temporary folders
   tmp/
   temp/
   
   # OS generated files
   .DS_Store
   .DS_Store?
   ._*
   .Spotlight-V100
   .Trashes
   ehthumbs.db
   Thumbs.db
   
   # IDE files
   .vscode/
   .idea/
   *.swp
   *.swo
   *~
   
   # Build outputs
   dist/
   build/
   
   # SSL certificates
   *.pem
   *.key
   *.crt
   
   # Backup files
   backups/
   *.backup
   
   # Package manager lock files (optional)
   # package-lock.json
   # yarn.lock
   ```

### Step 4: Add and Commit Files

1. **Add Files to Git**
   ```bash
   # Add all files to staging
   git add .
   
   # Check what will be committed
   git status
   ```

2. **Create Initial Commit**
   ```bash
   # Commit files
   git commit -m "Initial commit: WebRTC SIP API application
   
   - Added complete WebRTC SIP API implementation
   - Included deployment guides and configuration files
   - Added Docker and Kubernetes support
   - Included AWS deployment documentation"
   ```

### Step 5: Connect to GitHub Repository

1. **Add Remote Repository**
   ```bash
   # Replace 'yourusername' with your actual GitHub username
   git remote add origin https://github.com/yourusername/webrtc-sip-api.git
   
   # Verify remote was added
   git remote -v
   ```

2. **Set Default Branch**
   ```bash
   # Rename branch to main (if needed)
   git branch -M main
   ```

### Step 6: Push to GitHub

1. **Push Files**
   ```bash
   # Push to GitHub
   git push -u origin main
   ```

2. **Enter Credentials**
   - **Username**: Your GitHub username
   - **Password**: Your GitHub password or Personal Access Token
   
   **Note**: GitHub now requires Personal Access Tokens instead of passwords for command-line access.

### Step 7: Create Personal Access Token (if needed)

1. **Generate Token**
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - **Note**: `WebRTC SIP API Repository Access`
   - **Expiration**: Choose appropriate duration
   - **Scopes**: Select `repo` (Full control of private repositories)
   - Click "Generate token"
   - **Important**: Copy the token immediately (you won't see it again)

2. **Use Token**
   - When prompted for password, use the Personal Access Token instead

---

## Method 3: GitHub Desktop (Visual Interface)

### Step 1: Install GitHub Desktop

1. **Download and Install**
   - Go to [https://desktop.github.com/](https://desktop.github.com/)
   - Download GitHub Desktop
   - Install and sign in with your GitHub account

### Step 2: Create Repository

1. **Add Local Repository**
   - Open GitHub Desktop
   - Click "Add an Existing Repository from your Hard Drive"
   - Browse to your project folder: `C:\Users\Naveen\OneDrive\Documents\Desktop\Webpage`
   - Click "Add Repository"

2. **Publish Repository**
   - Click "Publish repository"
   - **Name**: `webrtc-sip-api`
   - **Description**: `WebRTC SIP API for real-time communication`
   - Choose **Public** or **Private**
   - Uncheck "Keep this code private" if you want it public
   - Click "Publish Repository"

### Step 3: Commit and Push

1. **Review Changes**
   - GitHub Desktop will show all files to be committed
   - Review the changes in the left panel

2. **Commit Changes**
   - **Summary**: `Initial commit: WebRTC SIP API application`
   - **Description**: Add details about your application
   - Click "Commit to main"

3. **Push to GitHub**
   - Click "Push origin" to upload to GitHub

---

## Repository Configuration

### Step 1: Update README.md

1. **Edit README.md** (replace the default content):
   ```markdown
   # WebRTC SIP API
   
   A comprehensive WebRTC SIP API for real-time communication with SIP integration, featuring call management, WebSocket support, and enterprise-grade deployment options.
   
   ## 🚀 Features
   
   - **WebRTC Integration**: Real-time peer-to-peer communication
   - **SIP Protocol Support**: Integration with SIP servers and PBX systems
   - **Call Management**: Comprehensive call handling and routing
   - **WebSocket Support**: Real-time bidirectional communication
   - **RESTful API**: Complete REST API for call management
   - **Enterprise Ready**: Production-grade deployment configurations
   
   ## 📋 Quick Start
   
   ### Prerequisites
   - Node.js 18+ 
   - npm or yarn
   - SIP server (optional)
   
   ### Installation
   
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/webrtc-sip-api.git
   cd webrtc-sip-api
   
   # Install dependencies
   npm install
   
   # Configure environment
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start development server
   npm run dev
   ```
   
   ## 📚 Documentation
   
   - [Deployment Guide](DEPLOYMENT_GUIDE.md)
   - [AWS Deployment](AWS_DEPLOYMENT_GUIDE.md)
   - [AWS EC2 UI Guide](AWS_EC2_UI_DEPLOYMENT_GUIDE.md)
   - [Setup Instructions](setup.md)
   
   ## 🐳 Docker Deployment
   
   ```bash
   # Using Docker Compose
   docker-compose up -d
   
   # Using Docker
   docker build -t webrtc-sip-api .
   docker run -p 3000:3000 -p 8080:8080 webrtc-sip-api
   ```
   
   ## ☁️ Cloud Deployment
   
   - **AWS**: ECS, Fargate, EC2, Elastic Beanstalk
   - **Kubernetes**: Complete K8s manifests included
   - **Docker**: Multi-stage optimized Dockerfile
   
   ## 🔧 Configuration
   
   Key environment variables:
   
   ```bash
   NODE_ENV=production
   PORT=3000
   WS_PORT=8080
   JWT_SECRET=your-secret-key
   SIP_SERVER_HOST=your-sip-server.com
   SIP_SERVER_PORT=5060
   ```
   
   ## 🤝 Contributing
   
   1. Fork the repository
   2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
   3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
   4. Push to the branch (`git push origin feature/AmazingFeature`)
   5. Open a Pull Request
   
   ## 📄 License
   
   This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
   
   ## 📞 Support
   
   For support and questions:
   - Create an [Issue](https://github.com/yourusername/webrtc-sip-api/issues)
   - Check the [Documentation](docs/)
   - Review [Deployment Guides](DEPLOYMENT_GUIDE.md)
   ```

### Step 2: Add Repository Topics

1. **Add Topics**
   - Go to your repository on GitHub
   - Click the gear icon next to "About"
   - Add topics: `webrtc`, `sip`, `api`, `nodejs`, `websocket`, `real-time`, `communication`, `voip`
   - Add website URL (if applicable)
   - Click "Save changes"

### Step 3: Configure Repository Settings

1. **Repository Settings**
   - Go to Settings tab in your repository
   - **General**:
     - Enable "Issues" for bug tracking
     - Enable "Wiki" for documentation
     - Enable "Discussions" for community
   
   - **Branches**:
     - Set "main" as default branch
     - Add branch protection rules (for production)
   
   - **Pages** (optional):
     - Enable GitHub Pages for documentation
     - Source: Deploy from a branch
     - Branch: main / docs

---

## Best Practices

### 1. Repository Structure
```
webrtc-sip-api/
├── .github/
│   └── workflows/          # GitHub Actions
├── docs/                   # Documentation
├── src/                    # Source code
├── tests/                  # Test files
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose
├── package.json           # Node.js dependencies
├── README.md              # Project documentation
└── LICENSE                # License file
```

### 2. Commit Message Guidelines
```bash
# Good commit messages
git commit -m "feat: add WebSocket connection handling"
git commit -m "fix: resolve SIP authentication issue"
git commit -m "docs: update deployment guide"
git commit -m "refactor: improve error handling"

# Commit types:
# feat: new feature
# fix: bug fix
# docs: documentation
# style: formatting
# refactor: code restructuring
# test: adding tests
# chore: maintenance
```

### 3. Branching Strategy
```bash
# Create feature branch
git checkout -b feature/websocket-improvements

# Work on feature
git add .
git commit -m "feat: improve WebSocket error handling"

# Push feature branch
git push origin feature/websocket-improvements

# Create Pull Request on GitHub
# Merge after review
```

### 4. Security Considerations
- ✅ Never commit sensitive data (.env files, keys, passwords)
- ✅ Use .gitignore to exclude sensitive files
- ✅ Use GitHub Secrets for CI/CD credentials
- ✅ Enable two-factor authentication
- ✅ Use Personal Access Tokens instead of passwords

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failed
```bash
# Error: Authentication failed
# Solution: Use Personal Access Token

# Generate token at: GitHub → Settings → Developer settings → Personal access tokens
# Use token as password when prompted
```

#### 2. Large File Upload Issues
```bash
# Error: File too large
# Solution: Use Git LFS for large files

git lfs install
git lfs track "*.mp3"
git lfs track "*.zip"
git add .gitattributes
git commit -m "Add Git LFS tracking"
```

#### 3. Permission Denied
```bash
# Error: Permission denied (publickey)
# Solution: Set up SSH keys

# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
# Use SSH URL: git@github.com:username/webrtc-sip-api.git
```

#### 4. Merge Conflicts
```bash
# When conflicts occur
git status                    # Check conflicted files
# Edit files to resolve conflicts
git add .                     # Stage resolved files
git commit -m "resolve merge conflicts"
```

### Debug Commands
```bash
# Check repository status
git status
git log --oneline

# Check remote repositories
git remote -v

# Check branch information
git branch -a

# Check differences
git diff
git diff --staged
```

---

## Next Steps

### 1. Set Up GitHub Actions (CI/CD)

1. **Create Workflow File**
   - Create `.github/workflows/deploy.yml`
   - Add automated testing and deployment

2. **Example Workflow**:
   ```yaml
   name: Deploy WebRTC SIP API
   
   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v3
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '18'
       - run: npm install
       - run: npm test
   
     deploy:
       needs: test
       runs-on: ubuntu-latest
       if: github.ref == 'refs/heads/main'
       steps:
       - uses: actions/checkout@v3
       - name: Deploy to AWS
         run: |
           # Add deployment commands
   ```

### 2. Create Releases

1. **Tag Versions**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **Create Release on GitHub**
   - Go to repository → Releases → Create a new release
   - Choose tag, add release notes
   - Attach binaries if needed

### 3. Set Up Project Management

1. **GitHub Projects**
   - Create project boards for task management
   - Set up issue templates
   - Configure automated workflows

2. **Documentation**
   - Set up GitHub Wiki
   - Create API documentation
   - Add contribution guidelines

---

## Quick Reference

### Essential Git Commands
```bash
# Repository setup
git init
git clone <url>
git remote add origin <url>

# Daily workflow
git status
git add .
git commit -m "message"
git push
git pull

# Branching
git branch <branch-name>
git checkout <branch-name>
git checkout -b <new-branch>
git merge <branch-name>

# Undo changes
git reset --hard HEAD~1
git revert <commit-hash>
git checkout -- <file>
```

### GitHub URLs
- **Repository**: `https://github.com/yourusername/webrtc-sip-api`
- **Clone HTTPS**: `https://github.com/yourusername/webrtc-sip-api.git`
- **Clone SSH**: `git@github.com:yourusername/webrtc-sip-api.git`
- **Issues**: `https://github.com/yourusername/webrtc-sip-api/issues`
- **Releases**: `https://github.com/yourusername/webrtc-sip-api/releases`

---

This comprehensive guide covers all methods for uploading your WebRTC SIP API to GitHub. Choose the method that best fits your comfort level and workflow preferences. The command-line method (Method 2) is recommended for ongoing development work.