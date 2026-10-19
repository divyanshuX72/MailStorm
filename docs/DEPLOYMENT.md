# Deployment Guide

This guide covers deploying the Email Campaign Management System to a production environment using PM2 and Nginx.

## 1. Prepare the Server
Install Node.js, MySQL, and Nginx on your VPS (e.g., Ubuntu).
```bash
sudo apt update
sudo apt install nodejs npm mysql-server nginx
npm install -g pm2
```

## 2. Deploy Backend
```bash
cd backend
npm install
npm run build
npx prisma migrate deploy
```
Start with PM2:
```bash
pm2 start dist/server.js --name "email-backend"
pm2 save
```

## 3. Deploy Frontend
```bash
cd frontend
npm install
npm run build
```
Copy the `dist` folder to your web root (e.g., `/var/www/email-frontend`).

## 4. Configure Nginx
Create an Nginx server block:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/email-frontend;
        try_files $uri /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the site and reload Nginx. Secure it using certbot (Let's Encrypt).
