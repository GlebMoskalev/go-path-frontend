# Frontend Deployment Instructions

## GitHub Actions Setup

The CI/CD workflow is configured in `.github/workflows/deploy.yml`. It will automatically deploy when you push to the `main` branch.

## Required GitHub Secrets

Add these secrets to your GitHub repository settings:

- `VM_HOST` - Your VM's IP address or domain
- `VM_USER` - SSH username for the VM
- `SSH_PRIVATE_KEY` - Private SSH key for VM access

## VM Setup Instructions

### 1. Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. Configure Nginx

1. Copy the provided nginx configuration:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/go-path-frontend
```

2. Update the server_name in the config file:
```bash
sudo nano /etc/nginx/sites-available/go-path-frontend
# Replace "your-domain.com" with your actual domain or IP
```

3. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/go-path-frontend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### 3. Create Deployment Directory

```bash
sudo mkdir -p /opt/go-path-frontend
sudo chown $USER:$USER /opt/go-path-frontend
```

### 4. Setup SSH Key for GitHub Actions

Generate SSH key on your VM:
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions
```

Add the public key to authorized_keys:
```bash
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
```

Add the private key content to GitHub secrets as `SSH_PRIVATE_KEY`.

## Deployment Process

1. Push changes to `main` branch
2. GitHub Actions will:
   - Build the frontend with Vite
   - Create archive with dist/ folder
   - Copy to VM via SCP
   - Extract and restart nginx
3. Frontend will be available at your domain/IP

## Manual Deployment (if needed)

```bash
cd /opt/go-path-frontend
tar -xzf frontend.tar.gz
sudo systemctl reload nginx
```

## Troubleshooting

- Check nginx status: `sudo systemctl status nginx`
- View nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check if files exist: `ls -la /opt/go-path-frontend/dist/`
