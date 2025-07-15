# Poorboy Gaming Application

A gaming subscription management application with separate frontend and backend dependencies.

## Project Structure

```
poorboygaming/
├── package.json              # Root package.json (frontend + management scripts)
├── server/
│   ├── package.json          # Backend dependencies
│   └── index.js             # Express server
├── src/                     # React frontend source
└── README.md               # This file
```

## Dependencies Separation

This project uses separated dependencies for better organization:

### Frontend Dependencies (Root package.json)
- **React & React DOM**: Core React framework
- **Axios**: HTTP client for API calls
- **Lucide React**: Icon library
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling framework
- **TypeScript**: Type checking
- **ESLint**: Code linting

### Backend Dependencies (server/package.json)
- **Express**: Web framework
- **CORS**: Cross-origin resource sharing
- **MySQL2**: Database driver
- **Bcryptjs**: Password hashing
- **JSON Web Token**: Authentication
- **CryptoJS**: Encryption/decryption
- **Dotenv**: Environment variables
- **Nodemon**: Development server (dev dependency)

## Installation

### Option 1: Install All Dependencies (Recommended)
```bash
npm run install:all
```

### Option 2: Install Separately
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run server:install
```

## Development

### Start Both Frontend and Backend
```bash
npm run dev:all
```

### Start Only Frontend
```bash
npm run dev
```

### Start Only Backend
```bash
npm run server:dev
```

## Production

### Start Both Services
```bash
npm run start:all
```

### Start Only Backend
```bash
npm run server:start
```

### Build Frontend
```bash
npm run build
```

## Available Scripts

### Root Package.json Scripts
- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint frontend code
- `npm run server:dev` - Start backend development server
- `npm run server:start` - Start backend production server
- `npm run server:install` - Install backend dependencies
- `npm run install:all` - Install both frontend and backend dependencies
- `npm run dev:all` - Start both frontend and backend in development
- `npm run start:all` - Start both frontend and backend in production

### Server Package.json Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (placeholder)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Encryption
ENCRYPTION_KEY=your_encryption_key

# Server Port
PORT=5000
```

## Database Setup

The application requires a MySQL database with the following tables:
- `users`
- `subscription_plans`
- `user_subscriptions`
- `games`

See the Supabase migrations folder for database schema.

## Features

- User authentication and authorization
- Subscription plan management
- Game access control
- Admin dashboard
- User management
- Subscription expiry handling
- Encrypted game token generation

## Technology Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- TypeScript
- Axios

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- Bcrypt Password Hashing
- CryptoJS Encryption

## Development Workflow

1. Install all dependencies: `npm run install:all`
2. Set up environment variables
3. Start development servers: `npm run dev:all`
4. Frontend will be available at `http://localhost:5173`
5. Backend API will be available at `http://localhost:5000`

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 5173 (frontend) and 5000 (backend) are available
2. **Database connection**: Verify MySQL is running and credentials are correct
3. **Missing dependencies**: Run `npm run install:all` to install all dependencies
4. **Environment variables**: Ensure `.env` file exists with required variables

### Dependency Management

- Frontend dependencies are managed in the root `package.json`
- Backend dependencies are managed in `server/package.json`
- Use `npm run install:all` to install both sets of dependencies
- Individual installation: `npm install` (frontend) and `npm run server:install` (backend) 