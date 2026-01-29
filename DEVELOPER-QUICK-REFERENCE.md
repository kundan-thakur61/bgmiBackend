# 🚀 Developer Quick Reference

## Quick Start (5 minutes)

### Local Development
```bash
# Clone repo
git clone https://github.com/your-org/bgmi.git
cd bgmi

# Backend
cd backend && npm install && npm run dev

# Frontend (in new terminal)
cd frontend && npm install && npm run dev

# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

### Docker Development
```bash
docker-compose up -d
# All services running in containers
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

---

## Essential Commands

### Backend
```bash
cd backend

# Development
npm run dev              # Start dev server
npm test                # Run tests
npm run lint            # Check code style
npm run build           # Build for production

# Database
npm run migrate:latest  # Run migrations
npm run seed            # Seed data
npm run db:check        # Test connection

# Debugging
NODE_DEBUG=http npm run dev  # Debug network
DEBUG=* npm run dev          # Debug everything
```

### Frontend
```bash
cd frontend

# Development
npm run dev             # Start dev server
npm test               # Run tests
npm run build          # Build for production
npm run lint           # Check code style

# Next.js specific
npm run analyze        # Analyze bundle size
npm run export         # Static export
```

### Docker
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs backend --tail=100

# Execute command in container
docker-compose exec backend npm test
docker-compose exec backend npm run migrate:latest

# Rebuild services
docker-compose build
docker-compose up -d

# Clean up
docker system prune -a
docker volume prune
```

---

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/battlezone
JWT_SECRET=dev-secret-key
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
RAZORPAY_KEY_SECRET=your-secret
CLOUDINARY_CLOUD_NAME=your-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-id
```

---

## Common Tasks

### Add New API Endpoint

1. **Create model** (if needed)
   ```javascript
   // backend/models/NewModel.js
   const schema = new Schema({ ... });
   module.exports = mongoose.model('NewModel', schema);
   ```

2. **Create controller**
   ```javascript
   // backend/controllers/newController.js
   exports.create = async (req, res) => {
     try { ... }
     catch (err) { res.status(400).json({ error: err.message }); }
   };
   ```

3. **Create route**
   ```javascript
   // backend/routes/new.js
   router.post('/', auth, createNew);
   module.exports = router;
   ```

4. **Register route**
   ```javascript
   // backend/app.js
   app.use('/api/new', require('./routes/new'));
   ```

### Add New Frontend Page

1. **Create page**
   ```javascript
   // frontend/src/pages/newpage.js
   export default function NewPage() {
     return <div>New Page</div>;
   }
   ```

2. **Add navigation**
   ```javascript
   // Update navigation component
   <Link href="/newpage">New Page</Link>
   ```

### Add Database Migration

```javascript
// backend/scripts/migrations/001_init.js
exports.up = async (db) => {
  await db.createCollection('users');
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
};

exports.down = async (db) => {
  await db.collection('users').drop();
};
```

### Run Tests

```bash
cd backend

# All tests
npm test

# Specific file
npm test -- auth.test.js

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific test
npm test -- -t "should login"
```

---

## Debugging

### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Backend",
      "program": "${workspaceFolder}/backend/app.js",
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

### Browser DevTools
- F12 to open
- Network tab for API calls
- Console for JavaScript errors
- Application tab for Storage

### MongoDB Debugging
```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/battlezone"

# Find documents
db.users.find()
db.users.findOne({ email: "test@example.com" })

# Update
db.users.updateOne({ _id: ObjectId("...") }, { $set: { name: "New" } })

# Delete
db.users.deleteOne({ email: "test@example.com" })
```

---

## Git Workflow

### Branch Strategy
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create Pull Request on GitHub
# After approval, merge to main
```

### Commit Message Format
```
feat: add new feature
fix: bug fix
docs: documentation update
style: code style changes
refactor: code refactoring
perf: performance improvement
test: add/update tests
chore: maintenance tasks
```

### Common Git Commands
```bash
# Check status
git status

# See changes
git diff
git diff --staged

# Undo changes
git checkout -- filename          # Discard changes
git reset HEAD~1                  # Undo last commit
git revert <commit-hash>          # Revert commit

# Sync with remote
git pull origin main
git fetch origin

# View history
git log
git log --oneline
git log --graph --all
```

---

## Performance Tips

### Backend
- Use indexes on frequently queried fields
- Implement caching with Redis
- Use connection pooling
- Compress responses with gzip
- Implement rate limiting
- Monitor query performance

### Frontend
- Code splitting with Next.js
- Image optimization
- Lazy loading components
- Minimize CSS/JS bundles
- Use efficient state management
- Profile with Lighthouse

### Database
```bash
# Create index
db.collection.createIndex({ field: 1 })

# Check index usage
db.collection.explain("executionStats").find({ field: value })

# Remove unused index
db.collection.dropIndex("index_name")
```

---

## Security Checklist

- [ ] No secrets in code
- [ ] .env file not committed
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using ORM)
- [ ] XSS prevention (sanitize user input)
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Error messages don't leak info

---

## Useful Tools

| Tool | Command | Use |
|------|---------|-----|
| Postman | `postman` | API testing |
| MongoDB Compass | `mongosh` | Database GUI |
| VS Code REST | Install extension | HTTP requests |
| Git Graph | `git log --graph` | Visualize branches |
| Docker Desktop | Docker icon | Manage containers |
| Node Inspector | `node --inspect` | Debug Node.js |

---

## Documentation Links

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [API Documentation](docs/API.md)
- [Database Schema](docs/SCHEMA.md)
- [Deployment Guide](PRODUCTION-DEPLOYMENT.md)
- [Security Guide](SECURITY-INCIDENT-RESPONSE.md)

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Test connection
mongosh "mongodb://localhost:27017"

# Check environment variables
echo $MONGODB_URI

# Restart MongoDB
docker-compose restart mongodb
```

### Docker Build Failed
```bash
# Clear cache
docker build --no-cache .

# Check Dockerfile
docker build --progress=plain .
```

### Node Modules Issues
```bash
# Clear cache
npm cache clean --force

# Reinstall
rm -rf node_modules
npm install
```

### Test Failures
```bash
# Check test setup
cat jest.config.js

# Run with verbose output
npm test -- --verbose

# Run specific test
npm test -- auth.test.js
```

---

## Regular Maintenance

### Weekly
- [ ] Check logs for errors
- [ ] Review recent commits
- [ ] Test backup process
- [ ] Monitor disk space

### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Run security audit: `npm audit`
- [ ] Review database indexes
- [ ] Analyze performance metrics

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Dependency updates
- [ ] Documentation review

---

## Team Communication

### Daily Standup
- What did I do yesterday?
- What am I doing today?
- Any blockers?

### Code Review Checklist
- [ ] Code follows style guide
- [ ] Tests included
- [ ] No security issues
- [ ] Performance acceptable
- [ ] Documentation updated

### Deployment Steps
1. Merge to main
2. CI/CD pipeline runs
3. Tests pass
4. Deploy to staging
5. Manual testing
6. Deploy to production

---

## Quick Links

- [GitHub Repository](https://github.com/your-org/bgmi)
- [Issue Tracker](https://github.com/your-org/bgmi/issues)
- [Pull Requests](https://github.com/your-org/bgmi/pulls)
- [Deployments](https://github.com/your-org/bgmi/deployments)
- [Actions](https://github.com/your-org/bgmi/actions)

---

**Last Updated:** January 29, 2026  
**Version:** 1.0
