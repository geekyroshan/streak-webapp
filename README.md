# GitHub Streak Manager

A modern web application that helps developers maintain their GitHub contribution streaks.

## Features

- 📊 **Contribution Calendar**: Visualize your GitHub contributions over the past year
- 🔥 **Streak Statistics**: Track your current and longest GitHub contribution streaks
- ⏱️ **Backdating Tool**: Fix missed days in your contribution history
- 📱 **Responsive Design**: Beautiful modern UI that works on all devices

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **Authentication**: GitHub OAuth

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas connection)
- GitHub OAuth App credentials

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/github-streak-manager.git
   cd github-streak-manager
   ```

2. Install dependencies
   ```bash
   npm run install:all
   ```

3. Set up environment variables
   - Copy `env.example` to `.env.local` in the root directory
   - Copy `server/.env.example` to `server/.env`
   - Update the environment variables with your MongoDB URI and GitHub OAuth credentials

4. Run the development servers
   ```bash
   npm run dev:all
   ```

5. Open [http://localhost:8080](http://localhost:8080) in your browser

## Development

- Frontend: `npm run dev`
- Backend: `npm run server:dev`
- Build: `npm run build`

## Deployment

### Frontend (Vercel)

1. Push your code to a GitHub repository
2. Import the project into Vercel
3. Set the following configurations:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add the environment variables:
   - `VITE_API_URL`: Your backend API URL (e.g., https://api.yourdomain.com/api)
5. Deploy

### Backend (Various Options)

#### Railway
1. Create a new project in Railway
2. Connect your GitHub repository
3. Add MongoDB as a plugin or use an external MongoDB connection
4. Configure the environment variables
5. Set the start command to `npm run server:start`

#### Render
1. Create a new Web Service in Render
2. Connect to your GitHub repository
3. Set the build command to `cd server && npm install`
4. Set the start command to `cd server && npm run start`
5. Add your environment variables

#### Heroku
1. Create a new app in Heroku
2. Connect to your GitHub repository
3. Set up the MongoDB add-on or use an external connection
4. Configure the environment variables
5. Deploy the app

### Important Configuration Notes

- Update the OAuth redirect URLs in your GitHub OAuth App settings
- Ensure CORS is properly configured in `server/src/index.ts` to allow requests from your frontend domain
- Make sure your backend service has enough memory for handling scheduled commits
- Set up a proper database backup strategy for MongoDB

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
