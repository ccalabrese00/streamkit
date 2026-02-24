# StreamKit

## Overview

A web application for managing stream overlays, scenes, and alerts. Features user authentication, a dashboard-style interface with sidebar navigation, and CRUD management for all stream assets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui components (New York style)
- **State Management**: TanStack React Query for server state, React useState for local state
- **Build Tool**: Vite with custom plugins for Replit integration
- **Auth**: Custom hook (`useAuth`) wrapping session-based authentication

Pages:
- Auth page (login/signup tabs) — shown when logged out
- Dashboard with sidebar navigation — shown when logged in
  - Overlays panel — create/edit/delete overlays
  - Scenes panel — create/edit/delete scenes
  - Alerts panel — create/edit/delete alerts (follower, donation, subscriber)
  - Settings panel — account info and logout

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful JSON endpoints under `/api/*`
- **Authentication**: Passport.js with local strategy (email/password), express-session
- **Password Hashing**: bcryptjs

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit (`drizzle-kit push`)
- **Tables**: users, overlays, scenes, alerts

### Project Structure
```
client/           # React frontend (Vite)
  src/
    components/   # shadcn/ui components
    pages/        # Auth page, Dashboard
      panels/     # Overlays, Scenes, Alerts, Settings panels
    hooks/        # useAuth, use-toast
    lib/          # Utilities, queryClient
server/           # Express backend
  auth.ts         # Passport setup, auth routes
  db.ts           # Database connection
  routes.ts       # CRUD API routes
  storage.ts      # Database storage implementation
shared/           # Shared types and database schema
```

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe queries and schema management

### Frontend Libraries
- Radix UI primitives for accessible components
- Google Fonts (Outfit, IBM Plex Mono)
- Lucide React for icons

### Build & Development
- Vite for frontend bundling
- esbuild for server bundling (production)
- tsx for TypeScript execution in development
