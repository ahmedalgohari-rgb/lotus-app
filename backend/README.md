# 🌿 Lotus Backend API

Plant care application backend built with Node.js, Express, TypeScript, and Prisma.

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL database
- Docker (optional, for local database)

## Quick Start

### 1. Database Setup

**Option A: Using Docker**
```bash
docker run --name lotus-postgres -e POSTGRES_PASSWORD=lotus123 -e POSTGRES_DB=lotus_dev -p 5432:5432 -d postgres:15
```

**Option B: Local PostgreSQL**
- Install PostgreSQL 15+
- Create database: `lotus_dev`
- Update DATABASE_URL in `.env`

### 2. Backend Setup

```bash
# Install dependencies
npm install

# Setup database and generate Prisma client
npm run db:generate
npm run db:migrate

# Start development server
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login  
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/revoke-all-tokens` - Revoke all user tokens

### Health Check
- `GET /health` - API health status

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://postgres:lotus123@localhost:5432/lotus_dev
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

## Development Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

## Database Schema

### Core Models
- **User** - User accounts with authentication
- **Plant** - Plant information and care settings
- **CareLog** - Plant care history (watering, fertilizing, etc.)
- **RefreshToken** - JWT refresh token management
- **Diagnosis** - Plant health diagnoses
- **Notification** - User notifications
- **AuditLog** - Security and action logging

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on authentication endpoints
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet
- Comprehensive error handling
- Audit logging

## Tech Stack

- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 15 with Prisma ORM
- **Authentication:** JWT with refresh tokens
- **Validation:** Zod + express-validator
- **Security:** Helmet, CORS, rate limiting
- **Logging:** Winston
- **Testing:** Jest + Supertest

## Architecture

```
src/
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── config/          # Configuration
└── index.ts         # Application entry point
```

## Contributing

1. Follow TypeScript strict mode
2. Use Prettier for code formatting
3. Run ESLint before committing
4. Write tests for new features
5. Follow RESTful API conventions

## License

Private - Lotus Plant Care App