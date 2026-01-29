# 🚨 Security Incident Response Guide

## Table of Contents
1. [Immediate Actions](#immediate-actions)
2. [Containment Steps](#containment-steps)
3. [Investigation](#investigation)
4. [Recovery](#recovery)
5. [Post-Incident](#post-incident)

---

## Immediate Actions

### The Current Situation ⚠️

**ALERT LEVEL: 🔴 CRITICAL**

Your repository on GitHub currently contains:
- Real MongoDB credentials
- Real JWT secrets
- Real API keys (Razorpay, Cloudinary, Twilio, Google)
- Real admin credentials

### 1. Stop Active Services (Optional - Only if Compromised)
```bash
# If you believe the system is compromised:
docker-compose down

# Notify your team immediately
```

### 2. Assume Credentials Are Compromised
Even if you haven't seen evidence of abuse, treat all exposed credentials as compromised.

### 3. Begin Rotation Process
Start with the highest-risk credentials first.

---

## Containment Steps

### Step 1: Revoke Immediate Access (First Hour)

```bash
# 1a. MongoDB - Change password
# Go to MongoDB Atlas → Database Access → Edit User
# Change password for kundathakur8161_db_user
# Or create a new admin user and delete old one

# 1b. Razorpay
# Go to Dashboard → Settings → API Keys
# Regenerate both Key ID and Secret
# Note: Old test keys may still work for test transactions

# 1c. Google OAuth
# Go to Google Cloud Console → APIs & Services → Credentials
# Delete existing OAuth client
# Create new OAuth client with new ID & Secret

# 1d. Cloudinary
# Go to Account Settings → API Keys
# Regenerate API Secret

# 1e. Twilio
# Go to Account → Settings → API Credentials
# Regenerate Auth Token

# 1f. JWT Secret
# Generate new random secret
openssl rand -hex 32
# Output: use this as new JWT_SECRET
```

### Step 2: Remove Secrets from Git History (First Hour)

**This is CRITICAL and must be done immediately:**

```bash
# Go to your local repository
cd /path/to/bgmi

# Remove .env file from entire git history
git filter-branch --tree-filter 'rm -f backend/.env backend/.env.production' HEAD

# Force push to remote (WARNING: This rewrites history!)
git push -f origin main
git push -f origin develop

# Notify all collaborators to:
# 1. Delete their local clone
# 2. Pull fresh copy: git clone <repo-url>
# 3. They should NOT rebase on old history
```

### Step 3: Update .gitignore (First Hour)

Already done ✅ but verify:

```bash
# Check .gitignore contains:
cat .gitignore | grep ".env"

# Should see:
# .env
# .env.local
# .env.production.local
# .env.*.local
```

### Step 4: Set Up GitHub Branch Protection (First Hour)

```bash
# In GitHub:
# Settings → Branches → Add Rule
# Branch pattern: main
# ✓ Require pull request reviews
# ✓ Require status checks to pass
# ✓ Require branches to be up to date
# ✓ Restrict who can push to matching branches
```

---

## Investigation

### Step 1: Check Access Logs

```bash
# MongoDB Atlas
# Go to Dashboard → Database Access → View Activity
# Look for:
# - Unexpected connection IPs
# - Unusual query patterns
# - Data modifications

# Google Cloud
# Go to Cloud Audit Logs
# Filter: credential service
# Look for: unexpected access patterns

# GitHub
# Go to Settings → Audit Log
# Look for: unusual access or key uses
```

### Step 2: Monitor Financial Activity

```bash
# Razorpay
# Go to Dashboard → Transactions
# Look for: unauthorized transactions
# Check: recent payment attempts

# Bank account
# Review recent transactions
# Report suspicious activity to bank
```

### Step 3: Monitor Database Activity

```bash
# Connect to MongoDB
mongosh "mongodb+srv://new_user:new_password@..."

# Check recent queries
db.getProfilingStatus()

# View audit log
db.system.auditLog.find().limit(10)

# Check for suspicious collections
db.getCollectionNames()
```

### Step 4: Check Application Logs

```bash
# View backend logs
docker-compose logs backend | grep -i "error\|warning" | tail -100

# Look for:
# - Unexpected user creation
# - Unusual payment transactions
# - Database modifications
# - API calls from unknown IPs
```

---

## Recovery

### Phase 1: Deployment (Immediately)

```bash
# 1. Pull latest code with clean .env
cd /app/bgmi
git fetch origin
git reset --hard origin/main

# 2. Create new .env with NEW credentials
cat > backend/.env.production << 'EOF'
# All variables with NEW credentials
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://NEW_USER:NEW_PASSWORD@...
JWT_SECRET=YOUR_NEW_SECRET
RAZORPAY_KEY_ID=rzp_live_NEW_KEY
RAZORPAY_KEY_SECRET=NEW_SECRET
GOOGLE_CLIENT_ID=NEW_CLIENT_ID
GOOGLE_CLIENT_SECRET=NEW_SECRET
CLOUDINARY_CLOUD_NAME=YOUR_NAME
CLOUDINARY_API_KEY=NEW_KEY
CLOUDINARY_API_SECRET=NEW_SECRET
TWILIO_ACCOUNT_SID=NEW_SID
TWILIO_AUTH_TOKEN=NEW_TOKEN
# ... other variables
EOF

chmod 600 backend/.env.production

# 3. Restart services with new credentials
docker-compose down
docker-compose up -d

# 4. Verify services
docker-compose ps
curl https://yourdomain.com/health
```

### Phase 2: User Communication

```bash
# Send notification to all users:

Subject: Security Update - Please Reset Your Password

Dear User,

We detected exposed credentials in our repository. As a precautionary measure:
- Your password is STILL SAFE (stored securely with hashing)
- Payment methods are STILL SAFE (processed by Razorpay)
- We have rotated all API keys and server credentials
- No data was modified or accessed

RECOMMENDED ACTIONS:
1. Change your password at /settings/security
2. Review your recent transactions
3. Contact support if you see suspicious activity

We apologize for this incident and will implement additional safeguards.

Thanks,
Security Team
```

### Phase 3: Audit User Accounts

```bash
# Check for suspicious accounts created
db.users.find({ createdAt: { $gt: ISODate("2024-01-25") } })

# Review recent KYC submissions
db.kycs.find({ status: "approved" }).sort({ approvedAt: -1 }).limit(10)

# Check for unusual wallet activity
db.wallets.find({ lastModified: { $gt: ISODate("2024-01-25") } })

# If suspicious activity found:
# - Suspend accounts: update users set status = 'suspended'
# - Lock transactions: update transactions set status = 'blocked'
# - Notify affected users
```

---

## Post-Incident

### Step 1: Root Cause Analysis (Within 24 Hours)

**What went wrong?**
- Secret was committed to git repository
- `.env` file wasn't in `.gitignore`
- No pre-commit hooks to prevent secrets

**Why did it happen?**
- Development workflow didn't enforce secret separation
- No automated secret scanning
- Manual configuration without automation

### Step 2: Implement Preventive Measures

```bash
# 1. Install git hooks to prevent future commits
npm install --save-dev husky lint-staged

# 2. Setup pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Prevent committing .env files
if git diff --cached --name-only | grep -E "\.env($|\.)" ; then
    echo "❌ ERROR: Do not commit .env files!"
    exit 1
fi
EOF

chmod +x .git/hooks/pre-commit

# 3. Setup secret scanning
# GitHub: Settings → Code security and analysis → Enable secret scanning
# GitGuardian: https://www.gitguardian.com/ (free tier)
```

### Step 3: Implement Secret Management

```bash
# Option 1: Environment-based (Current)
# ✅ Store in production server securely
# ✅ Never commit to git
# ✅ Use .env files locally only

# Option 2: AWS Secrets Manager / Azure Key Vault (Recommended)
# Install aws-sdk
npm install aws-sdk

# Update backend to fetch secrets
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

// Auto-load secrets from AWS at startup
```

### Step 4: Documentation & Training

```bash
# Create security guidelines document
cat > SECURITY.md << 'EOF'
# Security Guidelines

## Secrets Management
- NEVER commit .env files
- Use environment variables in production
- Store secrets in secure vaults
- Rotate credentials regularly

## Before Each Deployment
- Verify no secrets in git: git diff origin/main
- Check for sensitive logs
- Review database queries

## Incident Response
- See INCIDENT-RESPONSE.md
EOF

# Send team email about security practices
```

### Step 5: Update Deployment Process

```bash
# Update CI/CD to scan for secrets
# Add to .github/workflows/ci-cd.yml:

- name: Scan for secrets
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: HEAD
```

### Step 6: Monitor Going Forward

```bash
# GitHub: Enable security alerts
# Settings → Code security and analysis
# ✓ Enable all options

# Services to monitor:
# 1. Razorpay Dashboard - check for unauthorized transactions
# 2. MongoDB Atlas - monitor connections and queries
# 3. Google Cloud - audit API key usage
# 4. GitHub - watch for secret detection

# Setup alerts
# Email: security-alerts@yourdomain.com
```

---

## Incident Report Template

```markdown
# Security Incident Report

**Date:** January 29, 2026
**Severity:** CRITICAL
**Status:** RESOLVED

## Summary
Sensitive credentials were exposed in public GitHub repository.

## What Happened
- .env file committed to git history
- Contained: MongoDB, JWT, API keys
- Exposed for: ~24 hours (example)

## Impact Assessment
- ✅ No unauthorized database access detected
- ✅ No unauthorized transactions detected
- ✅ No data exfiltration detected
- ⚠️ Potential for future abuse if not rotated

## Immediate Actions Taken
1. Rotated all credentials
2. Removed from git history
3. Updated .gitignore
4. Redeployed services

## Root Cause
- .env not in .gitignore initially
- No pre-commit hooks
- No secret scanning enabled

## Preventive Measures Implemented
1. Pre-commit hook added
2. GitHub secret scanning enabled
3. Trufflehog integration in CI/CD
4. Security guidelines documented
5. Team training scheduled

## Recommendations
1. Implement secrets vault (AWS/Azure)
2. Rotate credentials quarterly
3. Monthly security audits
4. Implement rate limiting per IP
5. Enable IP whitelisting for admin
```

---

## Emergency Contacts

- **Security Officer:** security@yourdomain.com
- **DevOps Lead:** devops@yourdomain.com
- **CEO Notification:** Required if user data accessed
- **Legal Team:** Notify if breach confirmed
- **CERT-IN:** India's computer emergency response team (if needed)

---

## Useful Resources

- [OWASP - Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub - Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [Incident Response Checklist](https://www.cisa.gov/emergency-preparedness-and-response)

---

**REMEMBER:** Security incidents happen. The important thing is responding quickly and learning from them.

**Last Updated:** January 29, 2026
**Next Review:** Quarterly
