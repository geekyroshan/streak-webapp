# Deploying Streak Web App to Vercel

This guide explains how to deploy the Streak Web App to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (for database)
3. GitHub OAuth credentials for the production environment

## Deployment Steps

1. Push all code changes to your GitHub repository
2. Go to [Vercel](https://vercel.com) and log in with your GitHub account
3. Click "Add New Project" and import your GitHub repository
4. Configure the following environment variables in the Vercel project settings:

   **Required variables:**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth app client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth app secret
   - `JWT_SECRET`: A secure random string for JWT signing
   - `NODE_ENV`: Set to `production`
   
   **Optional variables:**
   - `GITHUB_REDIRECT_URI`: Set to `https://your-vercel-domain.com/api/auth/github/callback`
   - `ALLOWED_ORIGINS`: Set to `https://your-vercel-domain.com`
   - `SCHEDULER_ENABLED`: Set to `true` to enable the commit scheduler

5. Click "Deploy" to start the deployment process

## After Deployment

1. Update your GitHub OAuth app settings:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Update the Authorization callback URL to `https://your-vercel-domain.com/api/auth/github/callback`
   - Update the Homepage URL to your Vercel domain

2. Test the deployment:
   - Visit your Vercel deployment URL
   - Try logging in with GitHub
   - Test creating backdated commits

## Troubleshooting

If you encounter any issues:

1. Check Vercel logs in the deployment dashboard
2. Make sure all environment variables are properly set
3. Verify your MongoDB Atlas connection string and network access settings
4. Check that your GitHub OAuth app settings are correct 