# WishGift

WishGift is a full-stack web application for creating, managing, and sharing wishlists. Users can curate gift ideas, reserve items on wishlists, send and manage follow requests, and view public lists shared by accepted followers.

---

## System Architecture

WishGift follows a modular, serverless-ready architecture built on Next.js 16 (App Router), Prisma ORM, and modern web standards.

```text
[ Client Browser ]
       │
       ▼
[ Next.js 16 Frontend (React 19, Tailwind CSS v4, Zustand) ]
       │
       ▼
[ Next.js API Routes (zod validation & authorization checks) ]
       │
       ├── NextAuth.js (JWT Credentials Provider: Email or Username login)
       │
       ▼
[ Data Access Layer (Prisma ORM & LibSQL Client) ]
       │
       ▼
[ SQLite / Turso LibSQL Database ]
```

### Key Architectural Modules

1. **Authentication & Session Management**:
   - Managed via NextAuth.js with JWT session strategy.
   - Supports user authentication using either Email Address or Username.
   - Password hashes are stored securely using `bcryptjs`.

2. **Follow Request Workflow & Privacy Model**:
   - Follow relationships operate on a two-step approval process (`PENDING` -> `ACCEPTED` / `REJECTED`).
   - Clicking "Follow" submits a pending request. The recipient receives an in-app notification and can accept or reject the request.
   - Access to public wishlists is strictly restricted to accepted followers (`status: "ACCEPTED"`).

3. **Wishlist & Gift Reservation System**:
   - Users can mark wishlists as Public (visible to accepted followers) or Private (owner only).
   - Friends can reserve items on wishlists (publicly or anonymously) to avoid duplicate gifting.

4. **Database & ORM**:
   - Uses Prisma ORM connected to SQLite locally or Turso LibSQL in production.

---

## Features

- **Wishlist Management**: Create, edit, and organize wishlists with optional occasions and privacy settings.
- **Gift Item Management**: Add items with images, multi-currency prices, priorities, and store links.
- **Follow Request System**: Send follow requests, manage incoming requests (Accept/Reject), and track follower status.
- **Follower-Only Visibility**: Restrict public wishlist access exclusively to approved followers.
- **Gift Reservations**: Reserve gift items on wishlists to coordinate gift giving without duplicates.
- **Flexible Sign-In**: Log in using either your email address or username.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19, Tailwind CSS v4, Radix UI, Framer Motion, Lucide Icons
- **State Management**: Zustand, TanStack React Query
- **Authentication**: NextAuth.js (`bcryptjs`)
- **Database & ORM**: SQLite / Turso LibSQL, Prisma ORM
- **Validation**: Zod

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Node.js**: Version 18.x, 20.x, or higher
- **npm**: Version 9.x or higher

---

## Development Environment Setup

Follow these steps to set up and run WishGift on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/wishgift.git
cd wishgift
```

### 2. Install Dependencies

Install project dependencies using npm:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying the example template:

```bash
cp .env.example .env
```

Open `.env` and configure the following variables:

```env
DATABASE_URL="file:../db/custom.db"
NEXTAUTH_SECRET="your-development-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Initialize Database & Run Migrations

Generate the Prisma client types and apply schema migrations to your local SQLite database:

```bash
# Generate Prisma Client types
npm run db:generate

# Push schema changes to SQLite database
npm run db:push

# Apply database column migrations (if using Turso or existing SQLite)
node scripts/migrate-all-dbs.mjs
```

### 5. Start Development Server

Run the local development server with hot reloading:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

---

## Production Build & Start

To build and test the application in production mode locally:

```bash
# Step 1: Build production bundle
npm run build

# Step 2: Start production server
npm run start
```

---

## Project Directory Structure

```text
wishgift/
├── db/                         # Local SQLite database files
├── prisma/                     # Prisma schema definitions
│   └── schema.prisma
├── public/                     # Static assets (images, icons)
├── scripts/                    # Database migration & utility scripts
│   └── migrate-all-dbs.mjs
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── api/                # REST API endpoints (auth, follow, wishlists, gifts)
│   │   ├── layout.tsx          # Root layout with providers
│   │   └── page.tsx            # Application entry page
│   ├── components/             # UI components and view modules
│   │   ├── app/                # Application views (UserProfileView, DiscoverView, etc.)
│   │   └── ui/                 # Reusable UI primitives (Button, Card, Dialog, etc.)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # API client, database connection, NextAuth options
│   └── store/                  # Client-side state management (Zustand)
├── .env.example                # Template for environment variables
├── package.json                # Project manifest and scripts
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

---

## Available Commands

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `next dev -p 3000` | Starts hot-reloading development server on port 3000 |
| `npm run build` | `next build` | Compiles and builds production application |
| `npm run start` | `next start` | Starts production server after `npm run build` |
| `npm run lint` | `eslint .` | Runs static code analysis and linting checks |
| `npm run db:generate` | `prisma generate` | Generates Prisma Client types from schema |
| `npm run db:push` | `prisma db push` | Syncs Prisma schema changes to target database |

---

## API Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account | Public |
| `POST` | `/api/auth/[...nextauth]` | NextAuth sign-in (Email or Username) | Public |
| `GET` | `/api/users` | Search users by name or username | Authenticated |
| `GET` | `/api/users/[username]` | Fetch profile details for a given user | Authenticated |
| `GET` | `/api/follow` | Fetch list of users actively followed | Authenticated |
| `POST` | `/api/follow` | Send a follow request (`PENDING`) | Authenticated |
| `DELETE` | `/api/follow` | Cancel follow request or unfollow user | Authenticated |
| `GET` | `/api/follow/requests` | List incoming pending follow requests | Authenticated |
| `POST` | `/api/follow/requests` | Accept or reject incoming follow request | Authenticated |
| `GET` | `/api/wishlists` | List wishlists (filtered by follower access) | Authenticated |
| `POST` | `/api/wishlists` | Create a new wishlist | Authenticated |
| `GET` | `/api/wishlists/[id]` | Fetch single wishlist (follower restricted) | Authenticated |
| `POST` | `/api/gifts/reserve` | Reserve an item on a public wishlist | Accepted Followers |

---

## Deployment Guide

### Deploying to Vercel

1. Push your repository to GitHub.
2. Import the repository into your Vercel dashboard.
3. Configure Environment Variables in Vercel settings:
   - `DATABASE_URL`: Hosted LibSQL/Turso connection URL.
   - `NEXTAUTH_SECRET`: Random secure string.
   - `NEXTAUTH_URL`: Canonical site URL (e.g., `https://your-domain.vercel.app`).
4. Click **Deploy**.

---

## License

This project is open-source and available under the MIT License.
