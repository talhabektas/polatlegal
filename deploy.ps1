# Polat Legal - Production Deployment Script (PowerShell)
# Server: root@134.122.64.162
# Domain: polatlegal.com

param(
    [switch]$Help
)

# Configuration
$ServerIP = "134.122.64.162"
$ServerUser = "root"
$Domain = "polatlegal.com"
$ProjectDir = "/opt/polatlegal"
$BackupDir = "/opt/backups/polatlegal_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

function Show-Help {
    Write-Host "Polat Legal Deployment Script" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1"
    Write-Host ""
    Write-Host "This script will:" -ForegroundColor Yellow
    Write-Host "  1. Backup existing deployment"
    Write-Host "  2. Prepare server environment (install Docker, etc.)"
    Write-Host "  3. Deploy application files"
    Write-Host "  4. Setup SSL certificate (Let's Encrypt)"
    Write-Host "  5. Start services with Docker Compose"
    Write-Host "  6. Verify deployment"
    Write-Host ""
    Write-Host "Requirements:" -ForegroundColor Yellow
    Write-Host "  - SSH access to the server (use ssh key or password)"
    Write-Host "  - rsync or scp capability"
    Write-Host "  - Domain DNS configured to point to server IP"
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Yellow
    Write-Host "  -Help    Show this help message"
}

function Test-Dependencies {
    Write-Host "🔍 Checking dependencies..." -ForegroundColor Cyan
    
    # Check if ssh is available (Git Bash, WSL, or Windows SSH)
    $sshFound = $false
    try {
        ssh -V 2>$null
        $sshFound = $true
    }
    catch {
        Write-Host "❌ SSH is required but not found in PATH." -ForegroundColor Red
        Write-Host "Please install Git for Windows, WSL, or Windows OpenSSH feature." -ForegroundColor Yellow
        exit 1
    }
    
    if ($sshFound) {
        Write-Host "✅ SSH found" -ForegroundColor Green
    }
    
    Write-Host "✅ Dependencies check passed" -ForegroundColor Green
}

function Backup-CurrentDeployment {
    Write-Host "💾 Creating backup of current deployment..." -ForegroundColor Cyan
    
    $backupScript = @"
if [ -d $ProjectDir ]; then
    mkdir -p /opt/backups
    cp -r $ProjectDir $BackupDir
    echo 'Backup created at $BackupDir'
else
    echo 'No existing deployment to backup'
fi
"@
    
    ssh "$ServerUser@$ServerIP" $backupScript
}

function Prepare-Server {
    Write-Host "🔧 Preparing server environment..." -ForegroundColor Cyan
    
    $setupScript = @"
# Update system
apt-get update

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo 'Installing Docker...'
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo 'Installing Docker Compose...'
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-`$(uname -s)-`$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create project directory
mkdir -p $ProjectDir
mkdir -p /opt/backups

# Create SSL directory
mkdir -p $ProjectDir/ssl

echo 'Server environment prepared'
"@
    
    ssh "$ServerUser@$ServerIP" $setupScript
}

function Stop-ExistingServices {
    Write-Host "⏹️ Stopping existing services..." -ForegroundColor Cyan
    
    $stopScript = @"
cd $ProjectDir
if [ -f docker-compose.yml ]; then
    docker-compose down || true
    docker system prune -f || true
fi
echo 'Existing services stopped'
"@
    
    ssh "$ServerUser@$ServerIP" $stopScript
}

function Deploy-Application {
    Write-Host "🚚 Deploying application files..." -ForegroundColor Cyan
    
    # Create temporary tar file
    $tempFile = "deployment_$(Get-Date -Format 'yyyyMMddHHmmss').tar.gz"
    
    Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
    
    # Use tar to create archive (works with Git Bash on Windows)
    $excludeFiles = @(
        "--exclude=.git", 
        "--exclude=*.log", 
        "--exclude=node_modules",
        "--exclude=backend/polatlegal-backend",
        "--exclude=backend/polatlegal-backend.exe"
    )
    
    & tar -czf $tempFile $excludeFiles .
    
    Write-Host "📤 Uploading to server..." -ForegroundColor Yellow
    & scp $tempFile "${ServerUser}@${ServerIP}:/tmp/"
    
    Write-Host "📂 Extracting on server..." -ForegroundColor Yellow
    $extractScript = @"
cd $ProjectDir
tar -xzf /tmp/$tempFile
rm /tmp/$tempFile
echo 'Application files deployed'
"@
    
    ssh "$ServerUser@$ServerIP" $extractScript
    
    # Clean up local temp file
    Remove-Item $tempFile -Force
    
    Write-Host "✅ Application files deployed" -ForegroundColor Green
}

function Setup-SSLCertificate {
    Write-Host "🔒 Setting up SSL certificate..." -ForegroundColor Cyan
    
    $sslScript = @"
cd $ProjectDir

# Install Certbot if not present
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
fi

# Generate SSL certificate
if [ ! -f ssl/cert.pem ]; then
    echo 'Generating SSL certificate...'
    certbot certonly --standalone --non-interactive --agree-tos --email admin@$Domain -d $Domain -d www.$Domain || {
        echo 'SSL certificate generation failed, continuing with HTTP only'
    }
    
    # Copy certificates if generated successfully
    if [ -f /etc/letsencrypt/live/$Domain/fullchain.pem ]; then
        cp /etc/letsencrypt/live/$Domain/fullchain.pem ssl/cert.pem
        cp /etc/letsencrypt/live/$Domain/privkey.pem ssl/key.pem
        chmod 600 ssl/key.pem
        echo 'SSL certificates configured'
    fi
else
    echo 'SSL certificate already exists'
fi
"@
    
    ssh "$ServerUser@$ServerIP" $sslScript
}

function Start-Services {
    Write-Host "🎬 Starting services..." -ForegroundColor Cyan
    
    $startScript = @"
cd $ProjectDir

# Build and start containers
docker-compose up -d --build

# Wait for services to be ready
echo 'Waiting for services to start...'
sleep 30

# Check service status
docker-compose ps

echo 'Services started successfully'
"@
    
    ssh "$ServerUser@$ServerIP" $startScript
}

function Show-DNSInfo {
    Write-Host ""
    Write-Host "🌐 Domain DNS Configuration Info:" -ForegroundColor Green
    Write-Host "   Add these DNS records to your domain registrar (GoDaddy):" -ForegroundColor Yellow
    Write-Host "   Type: A Record"
    Write-Host "   Name: @ (or leave blank for root domain)"
    Write-Host "   Value: $ServerIP"
    Write-Host "   TTL: 3600 (1 hour)"
    Write-Host ""
    Write-Host "   Type: A Record"
    Write-Host "   Name: www"
    Write-Host "   Value: $ServerIP"
    Write-Host "   TTL: 3600 (1 hour)"
    Write-Host ""
    Write-Host "   After DNS propagation (may take up to 24 hours), your site will be available at:" -ForegroundColor Green
    Write-Host "   http://$Domain"
    Write-Host "   http://www.$Domain"
}

function Test-Deployment {
    Write-Host "✅ Verifying deployment..." -ForegroundColor Cyan
    
    $testScript = @"
cd $ProjectDir

echo 'Service Status:'
docker-compose ps

echo -e '\nContainer Logs (last 20 lines):'
docker-compose logs --tail=20

echo -e '\nTesting local connections:'
curl -s -o /dev/null -w '%{http_code}' http://localhost/ || echo 'Frontend test failed'
curl -s -o /dev/null -w '%{http_code}' http://localhost/api/services || echo 'Backend API test failed'
"@
    
    ssh "$ServerUser@$ServerIP" $testScript
}

function Start-Deployment {
    Write-Host "🚀 Polat Legal Production Deployment Started..." -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Configuration:" -ForegroundColor Yellow
    Write-Host "   Server: $ServerUser@$ServerIP"
    Write-Host "   Domain: $Domain"
    Write-Host "   Project Directory: $ProjectDir"
    Write-Host "   Backup Directory: $BackupDir"
    Write-Host ""
    
    try {
        Test-Dependencies
        Backup-CurrentDeployment
        Prepare-Server
        Stop-ExistingServices
        Deploy-Application
        Setup-SSLCertificate
        Start-Services
        Test-Deployment
        
        Write-Host ""
        Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Your website should be available at:" -ForegroundColor Yellow
        Write-Host "   http://$Domain (and https if SSL was configured)"
        Write-Host "   http://$ServerIP (direct IP access)"
        Write-Host ""
        Write-Host "🔧 Admin panel: http://$Domain/admin" -ForegroundColor Cyan
        Write-Host "📊 API endpoint: http://$Domain/api" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "💡 To check logs: ssh $ServerUser@$ServerIP 'cd $ProjectDir && docker-compose logs -f'" -ForegroundColor Green
        Write-Host "💡 To restart: ssh $ServerUser@$ServerIP 'cd $ProjectDir && docker-compose restart'" -ForegroundColor Green
        
        Show-DNSInfo
        
    }
    catch {
        Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Start-Deployment
