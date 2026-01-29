# 🚀 Quick Start Guide - Production Migration Checklist

## CRITICAL - DO IMMEDIATELY ⚠️

### 1. Remove Secrets from Git History (URGENT)
```bash
# This will remove .env from ALL git history
git filter-branch --tree-filter 'rm -f backend/.env backend/.env.production' HEAD
git push -f origin main

# Force all collaborators to rebase
```

### 2. Rotate ALL Credentials
Your current secrets are **EXPOSED** on GitHub:
- ❌ MongoDB: `kundathakur8161_db_user:CxedkfPTB5vYZVjA`
- ❌ Razorpay: `rzp_test_S0gpIKQyhKKUvI`
- ❌ Cloudinary: `dm3gc47rx`
- ❌ JWT_SECRET: `5a7b021c10a6cfac2594099b9ebb9b3227a333fd92b4b99ccfda3ad1a23c32fcffbb866e302606b7b921a59a0359742cbeb9c2c8335e187e09c844b4f01a6179`

**Action Items:**
- [ ] Generate new MongoDB credentials
- [ ] Create new Razorpay test/live keys
- [ ] Reset all API keys (Cloudinary, Twilio, Google OAuth)
- [ ] Generate new JWT_SECRET (use `openssl rand -hex 32`)
- [ ] Change admin credentials

### 3. Fix Critical Bugs
- [ ] **DONE**: CORS syntax error in app.js:74 ✅
- [ ] Verify Redis config for production

---

## Phase 1: Local Development (Complete) ✅

- [x] Fix CORS syntax error
- [x] Secure .env file
- [x] Create .env.example  
- [x] Create .env.production template
- [x] Update .gitignore
- [x] Create Dockerfile
- [x] Create docker-compose.yml
- [x] Create nginx.conf
- [x] Create CI/CD workflow
- [x] Update README

---

## Phase 2: Pre-Production Deployment

### 2.1 Server Setup
```bash
# On your production server:

# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Create app directory
sudo mkdir -p /app/bgmi
cd /app/bgmi

# Clone repo (if not done)
git clone https://github.com/your-org/bgmi.git .
```

### 2.2 Environment Configuration
```bash
# Create .env.production with REAL credentials
cat > backend/.env.production << EOF
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=$(openssl rand -hex 32)
# ... (all other variables)
EOF

chmod 600 backend/.env.production
```

### 2.3 SSL/HTTPS Setup
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx.conf with cert paths:
# ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### 2.4 Database Preparation
```bash
# Test MongoDB connection
docker run --rm mongo:6 mongosh "mongodb+srv://user:pass@cluster.mongodb.net/battlezone" --eval "db.adminCommand('ping')"

# Backup existing data (if migrating)
mongodump --uri="mongodb+srv://old_user:pass@old_cluster.mongodb.net" --out=/backup

# Restore to production
mongorestore --uri="mongodb+srv://new_user:pass@new_cluster.mongodb.net" /backup
```

### 2.5 Deploy Services
```bash
cd /app/bgmi

# Build and start
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs -f backend

# Run migrations
docker-compose exec backend npm run migrate:latest
```

### 2.6 Verify Deployment
```bash
# Test API endpoints
curl https://yourdomain.com/health
curl https://yourdomain.com/api/auth/register

# Check logs for errors
docker-compose logs backend | grep ERROR

# Test payment gateway
curl -X POST https://yourdomain.com/api/wallet/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

---

## Phase 3: Security Hardening

### 3.1 Firewall Configuration
```bash
sudo ufw default deny incoming
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

### 3.2 SSH Hardening
```bash
# Disable password auth
sudo sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Change SSH port (optional)
sudo sed -i 's/^#Port 22/Port 2222/' /etc/ssh/sshd_config

sudo systemctl restart sshd
```

### 3.3 Docker Security
```bash
# Run containers as non-root (already in Dockerfile)
# Use read-only filesystems where possible
# Implement resource limits

# Add to docker-compose.yml:
# memory: 512M
# memswap_limit: 512M
```

### 3.4 Database Security
```bash
# Enable MongoDB authentication
# Already configured in docker-compose.yml

# Create admin user
mongosh --uri="mongodb://localhost:27017" << EOF
db.createUser({
  user: "admin",
  pwd: "STRONG_PASSWORD",
  roles: ["root"]
})
EOF
```

---

## Phase 4: Monitoring & Alerting

### 4.1 Application Monitoring
```bash
# Install monitoring container (optional)
docker run -d \
  --name monitoring \
  -p 9090:9090 \
  prom/prometheus
```

### 4.2 Log Aggregation
```bash
# View logs
docker-compose logs -f backend

# Save logs to file
docker-compose logs backend > backend.log

# Set up log rotation
cat > /etc/logrotate.d/docker-bgmi << EOF
/var/lib/docker/containers/*/*.log {
    rotate 10
    size 100M
    compress
    delaycompress
    copytruncate
}
EOF
```

### 4.3 Health Checks
```bash
# Manually test health endpoint
curl https://yourdomain.com/health

# Set up monitoring alert (e.g., Uptime Robot)
# Check every 5 minutes
# Alert if status != 200
```

### 4.4 Backup Automation
```bash
# Create backup script
cat > /app/bgmi/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/db_$TIMESTAMP"

# Backup application files
tar -czf "$BACKUP_DIR/app_$TIMESTAMP.tar.gz" /app/bgmi

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed at $TIMESTAMP"
EOF

chmod +x /app/bgmi/backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /app/bgmi/backup.sh
```

---

## Phase 5: Performance Optimization

### 5.1 Database Indexes
```bash
docker-compose exec backend npm run db:ensure-indexes

# Or manually:
db.users.createIndex({ email: 1 }, { unique: true });
db.matches.createIndex({ status: 1, createdAt: -1 });
db.teams.createIndex({ leaderboardPosition: 1 });
db.wallets.createIndex({ userId: 1 }, { unique: true });
```

### 5.2 Caching Strategy
```bash
# Redis is automatically used for sessions
# Configure cache TTL in backend/config

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### 5.3 Load Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test with 100 concurrent requests
ab -n 10000 -c 100 https://yourdomain.com/

# Or use k6 for more detailed testing
```

---

## Phase 6: Post-Deployment Testing

### Functional Testing
- [ ] User registration works
- [ ] Google OAuth login works
- [ ] Tournament creation works
- [ ] Razorpay payment flow works
- [ ] KYC upload and verification works
- [ ] Real-time leaderboard updates
- [ ] WebSocket chat functionality
- [ ] Admin dashboard functions

### Security Testing
- [ ] CORS headers correct
- [ ] XSS prevention working
- [ ] SQL injection protected
- [ ] Rate limiting active
- [ ] HTTPS enforced
- [ ] Security headers present

### Performance Testing
- [ ] API response time < 200ms
- [ ] Database queries optimized
- [ ] No memory leaks after 24h
- [ ] Load handles 100 concurrent users
- [ ] Error rate < 0.1%

---

## Emergency Procedures

### If Services Down
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs --tail=200 backend

# Restart
docker-compose restart backend

# Full restart
docker-compose down
docker-compose up -d
```

### If Database Connection Fails
```bash
# Test connection
docker-compose exec backend npm run db:check

# Restart MongoDB
docker-compose restart mongodb

# Check MongoDB logs
docker-compose logs mongodb
```

### If Memory Usage High
```bash
# Check memory
docker stats

# Clean up
docker system prune -a
docker volume prune

# Restart with increased limits
docker-compose down
# Edit docker-compose.yml to increase memory
docker-compose up -d
```

### Rollback to Previous Version
```bash
# Tag current as stable
git tag stable-1.0

# Revert to previous
git checkout previous-tag
docker-compose build
docker-compose up -d
```

---

## Useful Commands

```bash
# View real-time logs
docker-compose logs -f backend

# SSH into container
docker-compose exec backend /bin/sh

# Run database migrations
docker-compose exec backend npm run migrate:latest

# Seed data
docker-compose exec backend npm run seed

# Run tests
docker-compose exec backend npm test

# Database backup
docker-compose exec mongodb mongodump --out=/backup

# Clean unused resources
docker system prune -a

# Check container resource usage
docker stats

# Update to latest code
git pull origin main
docker-compose build
docker-compose up -d

# View environment variables
docker-compose exec backend env | grep MONGODB
```

---

## Timeline Recommendation

| Timeline | Action | Priority |
|----------|--------|----------|
| **NOW** | Remove secrets from git | 🔴 CRITICAL |
| **TODAY** | Rotate all credentials | 🔴 CRITICAL |
| **TODAY** | Setup production server | 🔴 CRITICAL |
| **Day 2** | Deploy to production | 🟠 HIGH |
| **Day 3** | Enable monitoring | 🟠 HIGH |
| **Day 4** | Setup automated backups | 🟠 HIGH |
| **Day 5-7** | Performance testing | 🟡 MEDIUM |
| **Week 2** | Security audit | 🟡 MEDIUM |
| **Ongoing** | Maintenance & monitoring | 🟢 LOW |

---

## Support Contacts

- DevOps Team: devops@yourdomain.com
- On-call: +91-XXXXXXXXXX
- Status Page: status.yourdomain.com

---

**Last Updated:** January 29, 2026
**Next Review:** February 5, 2026
