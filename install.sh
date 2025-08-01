#!/bin/bash

# WebRTC SIP API - Automated Installation Script
# Supports: Ubuntu/Debian, CentOS/RHEL, macOS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect operating system
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
        else
            OS="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        OS="unknown"
    fi
    log_info "Detected OS: $OS"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Node.js
install_nodejs() {
    log_info "Installing Node.js..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            log_success "Node.js $NODE_VERSION is already installed"
            return
        else
            log_warning "Node.js $NODE_VERSION is installed but version 18+ is required"
        fi
    fi
    
    case $OS in
        "debian")
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        "redhat")
            curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
            sudo yum install -y nodejs npm
            ;;
        "macos")
            if command_exists brew; then
                brew install node
            else
                log_error "Homebrew not found. Please install Node.js manually from https://nodejs.org/"
                exit 1
            fi
            ;;
        *)
            log_error "Unsupported OS. Please install Node.js manually from https://nodejs.org/"
            exit 1
            ;;
    esac
    
    log_success "Node.js installed successfully"
}

# Install system dependencies
install_system_deps() {
    log_info "Installing system dependencies..."
    
    case $OS in
        "debian")
            sudo apt-get update
            sudo apt-get install -y curl wget git build-essential python3 sqlite3
            ;;
        "redhat")
            sudo yum update -y
            sudo yum groupinstall -y "Development Tools"
            sudo yum install -y curl wget git python3 sqlite
            ;;
        "macos")
            if command_exists brew; then
                brew install git sqlite3
            else
                log_warning "Homebrew not found. Some dependencies might be missing."
            fi
            ;;
    esac
    
    log_success "System dependencies installed"
}

# Install PM2 for process management
install_pm2() {
    log_info "Installing PM2 process manager..."
    
    if command_exists pm2; then
        log_success "PM2 is already installed"
        return
    fi
    
    npm install -g pm2
    log_success "PM2 installed successfully"
}

# Setup project
setup_project() {
    log_info "Setting up project..."
    
    # Install project dependencies
    if [ -f "package.json" ]; then
        log_info "Installing project dependencies..."
        npm install
        log_success "Dependencies installed"
    else
        log_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    # Create required directories
    log_info "Creating required directories..."
    mkdir -p data logs backups
    chmod 755 data logs backups
    
    # Setup environment file
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            log_info "Creating .env file from template..."
            cp .env.example .env
            log_warning "Please edit .env file with your configuration before starting the application"
        else
            log_warning ".env.example not found. You'll need to create .env manually"
        fi
    else
        log_success ".env file already exists"
    fi
    
    log_success "Project setup completed"
}

# Setup systemd service (Linux only)
setup_systemd_service() {
    if [[ "$OS" != "debian" && "$OS" != "redhat" ]]; then
        return
    fi
    
    log_info "Setting up systemd service..."
    
    SERVICE_FILE="/etc/systemd/system/webrtc-sip-api.service"
    CURRENT_DIR=$(pwd)
    CURRENT_USER=$(whoami)
    
    sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=WebRTC SIP API Service
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$CURRENT_DIR
Environment=NODE_ENV=production
ExecStart=$(which node) src/api-server.js
Restart=on-failure
RestartSec=10
KillMode=mixed
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable webrtc-sip-api
    
    log_success "Systemd service created and enabled"
    log_info "Use 'sudo systemctl start webrtc-sip-api' to start the service"
}

# Setup PM2 ecosystem
setup_pm2_ecosystem() {
    log_info "Setting up PM2 ecosystem..."
    
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'webrtc-sip-api',
    script: 'src/api-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096'
  }]
};
EOF
    
    log_success "PM2 ecosystem configuration created"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    if npm test; then
        log_success "All tests passed"
    else
        log_warning "Some tests failed. Please review before deploying to production."
    fi
}

# Setup firewall (Linux only)
setup_firewall() {
    if [[ "$OS" != "debian" && "$OS" != "redhat" ]]; then
        return
    fi
    
    log_info "Configuring firewall..."
    
    if command_exists ufw; then
        sudo ufw allow 22/tcp    # SSH
        sudo ufw allow 80/tcp    # HTTP
        sudo ufw allow 443/tcp   # HTTPS
        sudo ufw allow 3000/tcp  # Application (development)
        sudo ufw --force enable
        log_success "UFW firewall configured"
    elif command_exists firewall-cmd; then
        sudo firewall-cmd --permanent --add-port=22/tcp
        sudo firewall-cmd --permanent --add-port=80/tcp
        sudo firewall-cmd --permanent --add-port=443/tcp
        sudo firewall-cmd --permanent --add-port=3000/tcp
        sudo firewall-cmd --reload
        log_success "Firewalld configured"
    else
        log_warning "No firewall management tool found. Please configure firewall manually."
    fi
}

# Create backup script
setup_backup_script() {
    log_info "Creating backup script..."
    
    cat > backup.sh <<'EOF'
#!/bin/bash

# WebRTC SIP API Backup Script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_FILE="./data/calls.db"
LOG_FILE="./logs/backup.log"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/calls_$DATE.db"
    echo "$(date): Database backup created: calls_$DATE.db" >> $LOG_FILE
else
    echo "$(date): Database file not found: $DB_FILE" >> $LOG_FILE
fi

# Backup configuration
if [ -f ".env" ]; then
    cp ".env" "$BACKUP_DIR/env_$DATE.backup"
    echo "$(date): Configuration backup created: env_$DATE.backup" >> $LOG_FILE
fi

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "calls_*.db" -mtime +7 -delete
find $BACKUP_DIR -name "env_*.backup" -mtime +7 -delete

echo "$(date): Backup cleanup completed" >> $LOG_FILE
EOF
    
    chmod +x backup.sh
    log_success "Backup script created (backup.sh)"
    log_info "Consider adding to crontab: 0 2 * * * /path/to/backup.sh"
}

# Print final instructions
print_final_instructions() {
    log_success "Installation completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Edit .env file with your configuration:"
    echo "   nano .env"
    echo
    echo "2. Start the application:"
    echo "   # Development mode:"
    echo "   npm run dev"
    echo
    echo "   # Production mode with PM2:"
    echo "   pm2 start ecosystem.config.js --env production"
    echo
    echo "   # Or with systemd (Linux):"
    echo "   sudo systemctl start webrtc-sip-api"
    echo
    echo "3. Check application status:"
    echo "   curl http://localhost:3000/api/v1/health"
    echo
    echo "4. View logs:"
    echo "   tail -f logs/combined.log"
    echo
    echo "For more information, see:"
    echo "- DEPLOYMENT_GUIDE.md"
    echo "- DEPLOYMENT_CHECKLIST.md"
    echo "- README.md"
}

# Main installation function
main() {
    log_info "Starting WebRTC SIP API installation..."
    
    detect_os
    install_system_deps
    install_nodejs
    install_pm2
    setup_project
    setup_pm2_ecosystem
    setup_systemd_service
    setup_firewall
    setup_backup_script
    run_tests
    print_final_instructions
}

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    log_warning "Running as root is not recommended for security reasons."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run main function
main