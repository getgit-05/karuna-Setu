# Vercel Deployment Guide for Karuna Setu

## Pre-Deployment Checklist

### ✅ Files Created/Updated
- [x] `vercel.json` - Vercel configuration
- [x] `api/index.ts` - Vercel serverless function entry point
- [x] `env.example` - Environment variables template
- [x] `package.json` - Updated build scripts for pnpm

### 🔧 Required Environment Variables

Before deploying, you need to set up these environment variables in Vercel:

#### Database Configuration
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/karunasetu
MONGODB_DB=karunasetu
```

#### Admin Authentication
```
ADMIN_EMAIL=karunasetu@gmail.com
ADMIN_PASSWORD=your_secure_password_here
ADMIN_JWT_SECRET=your_jwt_secret_key_here
```

#### Cloudinary (for image uploads)
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Optional
```
PING_MESSAGE=ping
```

## Deployment Steps

### 1. Prepare Your Database
- Set up MongoDB Atlas (recommended) or use another MongoDB service
- Get your connection string
- Create a database named `karunasetu`

### 2. Set Up Cloudinary (for image uploads)
- Create a Cloudinary account
- Get your cloud name, API key, and API secret
- This is required for the gallery functionality

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add ADMIN_EMAIL
vercel env add ADMIN_PASSWORD
vercel env add ADMIN_JWT_SECRET
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure the following:

**Build Settings:**
- Framework Preset: `Other`
- Build Command: `pnpm run vercel-build`
- Output Directory: `dist/spa`
- Install Command: `pnpm install`

**Environment Variables:**
Add all the environment variables listed above in the Vercel dashboard.

### 4. Post-Deployment Configuration

#### Test Your Deployment
1. Visit your deployed URL
2. Test the API endpoints:
   - `https://your-app.vercel.app/api/ping`
   - `https://your-app.vercel.app/api/demo`
3. Test admin login at `/admin`
4. Test gallery functionality

#### Domain Configuration (Optional)
- Add custom domain in Vercel dashboard
- Configure DNS settings as instructed by Vercel

## Troubleshooting

### Common Issues

#### 1. Build Failures
- Ensure all dependencies are in `dependencies` not `devDependencies`
- Check that `pnpm` is used consistently
- Verify TypeScript compilation passes locally

#### 2. API Routes Not Working
- Check that `api/index.ts` is properly configured
- Verify environment variables are set
- Check Vercel function logs

#### 3. Database Connection Issues
- Verify MongoDB URI is correct
- Check network access in MongoDB Atlas
- Ensure database name matches `MONGODB_DB` variable

#### 4. Image Upload Issues
- Verify Cloudinary credentials
- Check file size limits (Vercel has 4.5MB limit for serverless functions)
- Consider using Cloudinary's direct upload for larger files

### Monitoring
- Use Vercel Analytics to monitor performance
- Check function logs in Vercel dashboard
- Monitor MongoDB Atlas for database performance

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to git
2. **JWT Secret**: Use a strong, random secret for production
3. **Admin Password**: Use a strong password
4. **MongoDB**: Enable authentication and network restrictions
5. **CORS**: Configure CORS properly for your domain

## Performance Optimization

1. **Image Optimization**: Use Cloudinary's automatic optimization
2. **Caching**: Implement proper caching headers
3. **Database Indexing**: Add indexes for frequently queried fields
4. **CDN**: Vercel automatically provides global CDN

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test API endpoints individually
4. Check MongoDB and Cloudinary service status
