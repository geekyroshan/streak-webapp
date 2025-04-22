# GitHub Streak Manager - Backend

Backend API server for the GitHub Streak Manager application.

## Features

- GitHub OAuth authentication
- Repository management
- Contribution analytics
- Streak statistics
- Backdated commit functionality
- Bulk scheduling of commits
- User settings and preferences

## Tech Stack

- Node.js + Express
- TypeScript
- MongoDB with Mongoose
- GitHub API integration
- JSON Web Tokens for authentication

## Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- GitHub OAuth application credentials

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd github-streak-manager/server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your credentials:
- Create a GitHub OAuth app: https://github.com/settings/developers
- Set the callback URL to match your `GITHUB_REDIRECT_URI` in the .env file
- Add your MongoDB connection string

5. Build the TypeScript code:
```bash
npm run build
```

6. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `GET /api/auth/logout` - Log out
- `GET /api/auth/me` - Get current user

### Repositories
- `GET /api/repositories` - Get user repositories
- `GET /api/repositories/:owner/:repo` - Get repository details

### Streak Management
- `POST /api/streak/backdated-commit` - Create backdated commit
- `GET /api/streak/history` - Get commit history
- `POST /api/streak/bulk` - Schedule bulk commits

### Contributions
- `GET /api/contributions` - Get user contributions
- `GET /api/contributions/stats` - Get streak statistics

### User Settings
- `GET /api/user/settings` - Get user settings
- `PATCH /api/user/settings` - Update user settings
- `POST /api/user/settings/templates` - Add commit template
- `DELETE /api/user/settings/templates` - Remove commit template

## Development

### Building
```bash
npm run build
```

### Running in Production
```bash
npm start
```

### Testing
```bash
npm test
``` 