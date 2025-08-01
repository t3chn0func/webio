# WebRTC SIP API - Windows PowerShell Installation Script
# Requires: PowerShell 5.1+ and Administrator privileges for some operations

param(
    [switch]$SkipNodeJS,
    [switch]$SkipDependencies,
    [switch]$Development
)

# Set execution policy for current session
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Color functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Install Chocolatey package manager
function Install-Chocolatey {
    Write-Info "Installing Chocolatey package manager..."
    
    if (Test-Command "choco") {
        Write-Success "Chocolatey is already installed"
        return
    }
    
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Success "Chocolatey installed successfully"
    }
    catch {
        Write-Error "Failed to install Chocolatey: $($_.Exception.Message)"
        Write-Info "Please install Node.js manually from https://nodejs.org/"
        exit 1
    }
}

# Install Node.js
function Install-NodeJS {
    if ($SkipNodeJS) {
        Write-Info "Skipping Node.js installation"
        return
    }
    
    Write-Info "Checking Node.js installation..."
    
    if (Test-Command "node") {
        $nodeVersion = node --version
        $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        
        if ($majorVersion -ge 18) {
            Write-Success "Node.js $nodeVersion is already installed"
            return
        }
        else {
            Write-Warning "Node.js $nodeVersion is installed but version 18+ is required"
        }
    }
    
    Write-Info "Installing Node.js..."
    
    if (Test-Administrator) {
        # Install via Chocolatey if running as admin
        Install-Chocolatey
        choco install nodejs -y
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Success "Node.js installed via Chocolatey"
    }
    else {
        Write-Warning "Administrator privileges required for automatic Node.js installation"
        Write-Info "Please download and install Node.js manually from https://nodejs.org/"
        Write-Info "Then run this script again"
        exit 1
    }
}

# Install Git
function Install-Git {
    Write-Info "Checking Git installation..."
    
    if (Test-Command "git") {
        Write-Success "Git is already installed"
        return
    }
    
    if (Test-Administrator) {
        Write-Info "Installing Git..."
        choco install git -y
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Success "Git installed successfully"
    }
    else {
        Write-Warning "Git not found. Please install Git manually from https://git-scm.com/"
    }
}

# Install project dependencies
function Install-ProjectDependencies {
    if ($SkipDependencies) {
        Write-Info "Skipping dependency installation"
        return
    }
    
    Write-Info "Installing project dependencies..."
    
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found. Are you in the correct directory?"
        exit 1
    }
    
    try {
        npm install
        Write-Success "Dependencies installed successfully"
    }
    catch {
        Write-Error "Failed to install dependencies: $($_.Exception.Message)"
        exit 1
    }
}

# Install PM2 globally
function Install-PM2 {
    Write-Info "Installing PM2 process manager..."
    
    if (Test-Command "pm2") {
        Write-Success "PM2 is already installed"
        return
    }
    
    try {
        npm install -g pm2
        npm install -g pm2-windows-startup
        
        Write-Success "PM2 installed successfully"
        Write-Info "To enable PM2 startup on Windows boot, run: pm2-startup install"
    }
    catch {
        Write-Error "Failed to install PM2: $($_.Exception.Message)"
    }
}

# Setup project structure
function Setup-ProjectStructure {
    Write-Info "Setting up project structure..."
    
    # Create required directories
    $directories = @("data", "logs", "backups")
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Info "Created directory: $dir"
        }
    }
    
    # Setup environment file
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Success "Created .env file from template"
            Write-Warning "Please edit .env file with your configuration before starting the application"
        }
        else {
            Write-Warning ".env.example not found. You'll need to create .env manually"
        }
    }
    else {
        Write-Success ".env file already exists"
    }
    
    Write-Success "Project structure setup completed"
}

# Setup PM2 ecosystem
function Setup-PM2Ecosystem {
    Write-Info "Setting up PM2 ecosystem configuration..."
    
    $ecosystemConfig = @"
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
"@
    
    $ecosystemConfig | Out-File -FilePath "ecosystem.config.js" -Encoding UTF8
    Write-Success "PM2 ecosystem configuration created"
}

# Create backup script
function Create-BackupScript {
    Write-Info "Creating backup script..."
    
    $backupScript = @"
# WebRTC SIP API Backup Script for Windows
# Run with: powershell -ExecutionPolicy Bypass -File backup.ps1

`$date = Get-Date -Format "yyyyMMdd_HHmmss"
`$backupDir = "./backups"
`$dbFile = "./data/calls.db"
`$logFile = "./logs/backup.log"

# Create backup directory if it doesn't exist
if (-not (Test-Path `$backupDir)) {
    New-Item -ItemType Directory -Path `$backupDir -Force | Out-Null
}

# Backup database
if (Test-Path `$dbFile) {
    Copy-Item `$dbFile "`$backupDir/calls_`$date.db"
    Add-Content -Path `$logFile -Value "`$(Get-Date): Database backup created: calls_`$date.db"
    Write-Host "Database backup created: calls_`$date.db" -ForegroundColor Green
}
else {
    Add-Content -Path `$logFile -Value "`$(Get-Date): Database file not found: `$dbFile"
    Write-Host "Database file not found: `$dbFile" -ForegroundColor Yellow
}

# Backup configuration
if (Test-Path ".env") {
    Copy-Item ".env" "`$backupDir/env_`$date.backup"
    Add-Content -Path `$logFile -Value "`$(Get-Date): Configuration backup created: env_`$date.backup"
    Write-Host "Configuration backup created: env_`$date.backup" -ForegroundColor Green
}

# Clean old backups (keep last 7 days)
`$cutoffDate = (Get-Date).AddDays(-7)
Get-ChildItem `$backupDir -Filter "calls_*.db" | Where-Object { `$_.LastWriteTime -lt `$cutoffDate } | Remove-Item
Get-ChildItem `$backupDir -Filter "env_*.backup" | Where-Object { `$_.LastWriteTime -lt `$cutoffDate } | Remove-Item

Add-Content -Path `$logFile -Value "`$(Get-Date): Backup cleanup completed"
Write-Host "Backup cleanup completed" -ForegroundColor Green
"@
    
    $backupScript | Out-File -FilePath "backup.ps1" -Encoding UTF8
    Write-Success "Backup script created (backup.ps1)"
    Write-Info "To schedule backups, use Windows Task Scheduler"
}

# Configure Windows Firewall
function Configure-Firewall {
    if (-not (Test-Administrator)) {
        Write-Warning "Administrator privileges required to configure Windows Firewall"
        return
    }
    
    Write-Info "Configuring Windows Firewall..."
    
    try {
        # Allow Node.js through firewall
        New-NetFirewallRule -DisplayName "WebRTC SIP API - HTTP" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction SilentlyContinue
        New-NetFirewallRule -DisplayName "WebRTC SIP API - HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
        
        Write-Success "Windows Firewall configured"
    }
    catch {
        Write-Warning "Failed to configure Windows Firewall: $($_.Exception.Message)"
    }
}

# Run tests
function Run-Tests {
    Write-Info "Running tests..."
    
    try {
        npm test
        Write-Success "All tests passed"
    }
    catch {
        Write-Warning "Some tests failed. Please review before deploying to production."
    }
}

# Create Windows service (optional)
function Create-WindowsService {
    if (-not (Test-Administrator)) {
        Write-Info "Skipping Windows service creation (requires administrator privileges)"
        return
    }
    
    Write-Info "Creating Windows service is optional. Consider using PM2 instead."
    Write-Info "To create a Windows service, you can use tools like:"
    Write-Info "- NSSM (Non-Sucking Service Manager)"
    Write-Info "- node-windows package"
    Write-Info "- PM2 with pm2-windows-startup"
}

# Print final instructions
function Show-FinalInstructions {
    Write-Success "Installation completed successfully!"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Edit .env file with your configuration:"
    Write-Host "   notepad .env"
    Write-Host ""
    Write-Host "2. Start the application:"
    Write-Host "   # Development mode:"
    Write-Host "   npm run dev"
    Write-Host ""
    Write-Host "   # Production mode with PM2:"
    Write-Host "   pm2 start ecosystem.config.js --env production"
    Write-Host ""
    Write-Host "3. Check application status:"
    Write-Host "   Invoke-RestMethod -Uri http://localhost:3000/api/v1/health"
    Write-Host ""
    Write-Host "4. View logs:"
    Write-Host "   Get-Content -Path logs/combined.log -Wait"
    Write-Host ""
    Write-Host "For more information, see:" -ForegroundColor Cyan
    Write-Host "- DEPLOYMENT_GUIDE.md"
    Write-Host "- DEPLOYMENT_CHECKLIST.md"
    Write-Host "- README.md"
    
    if ($Development) {
        Write-Host ""
        Write-Host "Development mode enabled. Additional tools:" -ForegroundColor Yellow
        Write-Host "- Hot reload: npm run dev"
        Write-Host "- Debug mode: npm run debug"
        Write-Host "- Lint code: npm run lint"
    }
}

# Main installation function
function Start-Installation {
    Write-Info "Starting WebRTC SIP API installation for Windows..."
    Write-Host ""
    
    # Check PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt 5) {
        Write-Error "PowerShell 5.1 or higher is required"
        exit 1
    }
    
    # Warn about administrator privileges
    if (-not (Test-Administrator)) {
        Write-Warning "Some features require administrator privileges:"
        Write-Warning "- Automatic Node.js installation"
        Write-Warning "- Windows Firewall configuration"
        Write-Warning "- Windows service creation"
        Write-Host ""
        
        $continue = Read-Host "Continue with limited installation? (Y/n)"
        if ($continue -eq 'n' -or $continue -eq 'N') {
            exit 0
        }
    }
    
    try {
        Install-NodeJS
        Install-Git
        Install-ProjectDependencies
        Install-PM2
        Setup-ProjectStructure
        Setup-PM2Ecosystem
        Create-BackupScript
        Configure-Firewall
        Run-Tests
        Create-WindowsService
        Show-FinalInstructions
    }
    catch {
        Write-Error "Installation failed: $($_.Exception.Message)"
        exit 1
    }
}

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the project root directory."
    exit 1
}

# Start installation
Start-Installation