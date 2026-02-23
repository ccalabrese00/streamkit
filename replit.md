# Twitch Scene Maker

## Overview

A web application for creating animated Twitch stream scenes (Starting Soon, Be Right Back, Stream Ending) with a visual editor. Users can customize themes, social media handles, and preview scenes full-screen. The app also includes a drag-and-drop overlay builder for creating custom stream overlays.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **Styling**: Tailwind CSS v4 with shadcn/ui components (New York style)
- **Animation**: Framer Motion for scene transitions and effects
- **State Management**: TanStack React Query for server state, React useState for local state
- **Build Tool**: Vite with custom plugins for Replit integration

Key pages:
- `/` - Main scene editor with preset management
- `/scene/:id` - Fullscreen scene preview (opening, brb, ending)
- `/overlay/builder` - Drag-and-drop custom overlay editor
- `/overlay/view` - Overlay preview with URL-encoded configuration

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful JSON endpoints under `/api/*`
- **Development**: Vite dev server with HMR proxied through Express

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit (`drizzle-kit push`)
- **Session Storage**: In-memory storage class (`MemStorage`) for development, with `connect-pg-simple` available for production sessions

### AI Integration
- **Provider**: OpenAI API via Replit AI Integrations
- **Use Case**: AI-powered scene generation from text prompts
- **Model**: GPT for generating scene configurations based on user descriptions

### Project Structure
```
client/           # React frontend (Vite)
  src/
    components/   # shadcn/ui components
    pages/        # Route components
    lib/          # Utilities and config types
    hooks/        # Custom React hooks
server/           # Express backend
  replit_integrations/  # AI features (audio, chat, image, batch)
shared/           # Shared types and database schema
```

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe queries and schema management

### AI Services
- OpenAI API via Replit AI Integrations
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Frontend Libraries
- Radix UI primitives for accessible components
- Embla Carousel for carousel functionality
- Google Fonts (Outfit, IBM Plex Mono)

### GitHub Integration
- GitHub OAuth via Replit Connectors (`@octokit/rest`)
- Client code: `server/github.ts`
- API endpoints: `GET /api/github/repos`, `GET /api/github/user`
- Permissions: read:org, read:project, read:user, repo, user:email

### Build & Development
- Vite for frontend bundling
- esbuild for server bundling (production)
- tsx for TypeScript execution in development