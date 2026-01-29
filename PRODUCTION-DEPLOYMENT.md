# BGMI Battle Zone - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### Security
- [ ] All API keys rotated and stored securely
- [ ] `.env` files removed from git history
  ```bash
  # To remove from history:
  git filter-branch --tree-filter 'rm -f .env .env.production' HEAD
  git push -f origin main
  ```
- [ ] MongoDB credentials secured
- [ ] JWT_SECRET changed to strong random value
- [ ] Razorpay switched to LIVE keys
- [ ] CORS hardened with specific domain
- [ ] HTTPS/SSL certificates ready
- [ ] Database backup strategy in place

### Infrastructure
- [ ] Server provisioned (minimum 2GB RAM, 2vCPU)
- [ ] Docker and Docker Compose installed
- [ ] Nginx reverse proxy configured
- [ ] SSL certificates obtained (Let's Encrypt recommended)
- [ ] DNS records pointed to server
- [ ] Firewall rules configured (80, 443, SSH)

### Database
- [ ] MongoDB Atlas cluster created or self-hosted configured
- [ ] Database backups automated
- [ ] Connection pooling configured
- [ ] Indexes created for frequently queried fields
- [ ] Test data imported/setup completed

### Monitoring & Logging
- [ ] Sentry account created
- [ ] DataDog/New Relic subscription (if using)
- [ ] Log aggregation setup (ELK/CloudWatch)
- [ ] Health check endpoint verified
- [ ] Alerts configured for critical errors

## 🚀 Deployment Steps

### 1. Prepare Environment Variables

Create `.env.production` on the server with ALL secrets:

```bash
ssh user@your-server
cd /app/bgmi
nano .env.production
```

Required variables:
- `MONGODB_URI` - Production MongoDB connection
- `JWT_SECRET` - Strong 64+ character random string
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - LIVE keys
- `CLOUDINARY_*` - Production credentials
- `GOOGLE_CLIENT_*` - Production OAuth credentials
- `TWILIO_*` - Production credentials
- `REDIS_URL` - Production Redis endpoint
- `FRONTEND_URL` - Your production domain
- `SENTRY_DSN` - Error tracking endpoint

### 2. Clone Repository

```bash
cd /app
git clone https://github.com/your-org/bgmi.git
cd bgmi
```

### 3. Build and Start Services

```bash
# Pull latest code
git pull origin main

# Build and start services
docker-compose -f docker-compose.yml up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f backend
```

### 4. Database Migrations

```bash
# Run pending migrations
docker-compose exec backend npm run migrate:latest

# Seed initial data (if needed)
docker-compose exec backend npm run seed
```

### 5. Health Checks

```bash
# Check backend health
curl https://yourdomain.com/health

# Check database connection
docker-compose exec backend npm run db:check

# Check Redis connection
docker-compose exec redis redis-cli ping
```

### 6. SSL Certificate Setup (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Update nginx.conf paths and reload
sudo systemctl reload nginx
```

## 🔄 Continuous Deployment

The GitHub Actions CI/CD pipeline automatically:

1. **Security scanning** - Checks for exposed secrets
2. **Unit tests** - Runs backend and frontend tests
3. **Build** - Creates Docker image
4. **Push** - Pushes to Docker registry
5. **Deploy** - SSH to server and updates services

### Setup CI/CD Secrets

In GitHub repository settings, add secrets:

```
DEPLOY_HOST=your-server-ip
DEPLOY_USER=deploy-user
DEPLOY_KEY=private-ssh-key
DEPLOY_PORT=22
SLACK_WEBHOOK=your-slack-webhook-url
SNYK_TOKEN=your-snyk-token
```

## 📊 Monitoring & Logging

### Sentry Integration

```javascript
// Already configured in backend
const Sentry = require("@sentry/node");
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Log Levels

- `error` - Critical failures requiring immediate action
- `warn` - Potential issues to investigate
- `info` - Application flow and important events
- `debug` - Detailed troubleshooting information

### Access Logs

View Nginx access logs:
```bash
docker-compose exec nginx tail -f /var/log/nginx/access.log
```

## 🔧 Common Operations

### Scale Backend

```bash
# Increase backend replicas
docker-compose up -d --scale backend=3
```

### Update Backend Code

```bash
git pull origin main
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Database Backup

```bash
# Manual backup
docker-compose exec mongodb mongodump --uri="mongodb://admin:password@localhost:27017" --out=/backup

# Automated backup (cron job)
0 2 * * * docker-compose exec mongodb mongodump --uri="mongodb://..." --out=/backup/$(date +\%Y\%m\%d)
```

### View Logs

```bash
# Backend logs
docker-compose logs -f backend --tail=100

# All services
docker-compose logs -f --tail=50

# Specific time range
docker-compose logs --since 2024-01-01 backend
```

## 🚨 Incident Response

### Service Down

```bash
# Check status
docker-compose ps

# Restart all services
docker-compose restart

# View error logs
docker-compose logs --tail=500 backend

# Check resources
docker stats
```

### High Memory Usage

```bash
# Kill and restart
docker-compose down
docker-compose up -d

# Check Docker cleanup
docker system prune -a
```

### Database Connection Issues

```bash
# Verify MongoDB is running
docker-compose logs mongodb

# Test connection
docker-compose exec backend npm run db:check

# Restart MongoDB
docker-compose restart mongodb
```

## 📈 Performance Optimization

### Database Indexes

```javascript
// Ensure these indexes exist:
db.users.createIndex({ email: 1 }, { unique: true });
db.matches.createIndex({ status: 1, createdAt: -1 });
db.teams.createIndex({ leaderboardPosition: 1 });
db.wallets.createIndex({ userId: 1 }, { unique: true });
```

### Caching Strategy

- Implement Redis caching for frequently accessed data
- Cache session data
- Cache API responses with 5-minute TTL

### CDN Configuration

- Use CloudFlare or AWS CloudFront for static assets
- Cache images via Cloudinary CDN
- Set proper cache headers in Nginx

## 🔐 Security Hardening

### Regular Security Audits

```bash
# Check dependencies
npm audit
npm audit fix

# Scan codebase
snyk test

# Run OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://yourdomain.com
```

### Firewall Rules

```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

### Regular Backups

```bash
# Daily database backups
0 3 * * * /app/bgmi/scripts/backup-database.sh

# Weekly code snapshots
0 4 * * 0 /app/bgmi/scripts/backup-code.sh
```

## 📞 Support & Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port
sudo lsof -i :5000
# Kill process
sudo kill -9 <PID>
```

**Docker permission denied:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
```

**Certificate renewal:**
```bash
# Automatic renewal (cron runs certbot daily)
0 0 * * * certbot renew --quiet
```

For production issues, check:
1. Docker logs: `docker-compose logs`
2. Sentry dashboard
3. Nginx error logs
4. MongoDB connection status
5. Redis connection status

## 📝 Rollback Plan

If deployment fails:

```bash
# Stop current deployment
docker-compose down

# Switch to previous version
git checkout HEAD~1

# Restart with previous code
docker-compose up -d

# Notify team via Slack
```

## ✅ Post-Deployment Verification

- [ ] API endpoints responding (test `/api/health`)
- [ ] Database connected and accessible
- [ ] Authentication working
- [ ] Payment gateway (Razorpay) connected
- [ ] Socket.io real-time features working
- [ ] Uploads to Cloudinary working
- [ ] Email notifications sending
- [ ] Monitoring alerts active
- [ ] Logs aggregating properly
- [ ] Backups running successfully

---

**Last Updated:** January 29, 2026
**Maintainer:** DevOps Team
