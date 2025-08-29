# Environment Configuration Guide

This project uses environment-specific configuration files to handle different deployment scenarios.

## Environment Files

### 📁 File Structure
```
.env                 # Main production config (used as fallback)
.env.development     # Local development config  
.env.production      # Production deployment config
.env.example         # Template for new developers
```

### 🔧 How It Works

The application automatically loads the appropriate environment file based on `NODE_ENV`:

- **Development**: `NODE_ENV=development` → loads `.env.development`
- **Production**: `NODE_ENV=production` → loads `.env.production`
- **Fallback**: Always loads `.env` as backup for missing variables

## 🚀 Scripts

### Development
```bash
npm run dev          # Uses .env.development (localhost URLs)
npm run start:dev    # Alternative development start
```

### Production  
```bash
npm run start        # Uses .env.production (production URLs)
npm run start:prod   # Alternative production start
```

## 🔑 Key Configuration Differences

### Development (.env.development)
- `CLIENT_URL=http://localhost:8000`
- `GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback`
- `NODE_ENV=development`
- SQLite database for easy local development
- Debug logging enabled

### Production (.env.production)
- `CLIENT_URL=https://streamscene.net`
- `GOOGLE_CALLBACK_URL=https://streamscene.net/auth/google/callback`
- `NODE_ENV=production`
- MySQL database for production
- Error-level logging only

## 🛡️ Security Notes

- All `.env*` files are in `.gitignore`
- Production secrets should be different from development
- Never commit real API keys or production credentials
- Use environment variables in deployment platforms (Heroku, AWS, etc.)

## 🔄 OAuth Configuration

### Google Cloud Console Setup

Your OAuth client needs **both** callback URLs configured:

**Authorized Redirect URIs:**
- `http://localhost:8000/auth/google/callback` (development)
- `https://streamscene.net/auth/google/callback` (production)

This allows the same OAuth client to work in both environments.

## 🐛 Troubleshooting

### "redirect_uri_mismatch" Error
- Check Google Cloud Console has both localhost and production URLs
- Verify the correct environment file is being loaded
- Check the console logs for "Loading environment from: ..."

### Wrong Environment Loading
- Verify `NODE_ENV` is set correctly in your npm scripts
- Check console output for environment file path
- Ensure environment files exist and have correct syntax

### Production Not Working
- Verify `.env.production` has all required production URLs
- Check deployment platform environment variables
- Ensure production secrets are properly configured

## ✅ Testing Your Setup

1. **Development**: `npm run dev` should show localhost URLs in logs
2. **Production**: `NODE_ENV=production npm start` should show production URLs
3. **Google Login**: Should work in both environments with proper OAuth setup

---

*Last updated: August 2025*
