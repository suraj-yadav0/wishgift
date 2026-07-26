# WishGift

WishGift is a full-stack web application designed for creating, managing, and sharing wishlists. Users can curate gift ideas with custom pricing and multi-currency support, reserve items on friends' wishlists, follow other users, and explore public lists.

---

## Features

- **Wishlist Management**: Create public or private wishlists for birthdays, holidays, weddings, or personal goals.
- **Gift Items Management**: Add items with priority levels, links, multi-currency pricing (INR, USD, EUR, GBP, CAD, AUD, JPY, CNY), quantities, and image URLs.
- **Gift Reservation System**: Allow friends and family to reserve items anonymously or publicly to avoid duplicate gifts.
- **Social Features**: Follow users, view activity feeds, and discover public wishlists.
- **Authentication**: User registration and sign-in powered by NextAuth.js.
- **Responsive Interface**: User interface built with React 19, Tailwind CSS v4, and Radix UI components.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, Tailwind CSS v4, Radix UI, Framer Motion, Lucide Icons
- **Database & ORM**: SQLite / Turso libSQL, Prisma ORM
- **Authentication**: NextAuth.js (Credentials provider with `bcryptjs`)
- **State & Data Fetching**: Zustand, TanStack React Query

---

## Prerequisites

Before running the project, ensure the following tools are installed:

- **Node.js**: `v18.x` or `v20.x` (or newer)
- **npm**: `v9.x` or newer (or yarn / pnpm / bun)

---

## Quick Start Guide

Follow these steps to set up and run WishGift locally.

### 1. Install Dependencies

In the project root directory, run:

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to create a local `.env` file:

```bash
cp .env.example .env
```

Ensure `.env` contains the required environment variables:

```env
DATABASE_URL="file:../db/custom.db"
NEXTAUTH_SECRET="wishgift-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Initialize the Database

Generate the Prisma client and push the schema to your database:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to SQLite database
npm run db:push
```

### 4. Run the Application

#### Development Mode
To start the hot-reloading development server:

```bash
npm run dev
```

Access the application at `http://localhost:3000`.

#### Production Mode
To build and run the production server locally:

```bash
# Step 1: Build the Next.js application
npm run build

# Step 2: Start the production server
npm run start
```

> **Note**: Running `npm start` requires a prior build step (`npm run build`). Executing `npm start` without building first will result in a missing build error.

---

## Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on port `3000` |
| `npm run build` | Compiles and builds the production app into `.next` |
| `npm run start` | Starts the production server (requires `npm run build` first) |
| `npm run lint` | Runs ESLint static analysis across the codebase |
| `npm run db:generate` | Generates the Prisma client based on `prisma/schema.prisma` |
| `npm run db:push` | Pushes local schema changes to the SQLite database |
| `npm run db:migrate` | Runs database migrations |
| `npm run db:reset` | Resets the database |

---

## Project Structure

```text
wishgift/
├── db/                   # Local SQLite database directory
├── prisma/               # Prisma ORM schema and SQL migration definitions
│   ├── schema.prisma
│   └── schema.sql
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router (pages, API routes, layout)
│   ├── components/       # UI components and view modules
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions, Prisma instance, API client
│   └── store/            # Client state management (Zustand)
├── .env.example          # Environment variables template
├── package.json          # Project dependencies and scripts
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

---

## Deployment Guide

### Option 1: Deploying to Vercel (Recommended)

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and import the repository.
3. Add the required Environment Variables in the project settings:
   - `DATABASE_URL`: Hosted database connection URL (e.g. Turso libSQL or PostgreSQL).
   - `NEXTAUTH_SECRET`: A secure random string.
   - `NEXTAUTH_URL`: Your live domain (e.g. `https://your-app.vercel.app`).
4. Click **Deploy**.

### Option 2: Deploying to Render or Railway

If keeping local SQLite database persistence:

1. Create a Web Service on Render or Railway.
2. Set the Build Command:
   ```bash
   npm install && npm run db:generate && npm run db:push && npm run build
   ```
3. Set the Start Command:
   ```bash
   npm run start
   ```
4. Attach a Persistent Disk mounted at `/app/db` to preserve database state across redeployments.
5. Set the necessary environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).

---

## Troubleshooting

- **Error: Could not find a production build in the '.next' directory**
  - **Solution**: Execute `npm run build` before running `npm run start`, or use `npm run dev` for local development.

- **Database Connection Issues / Prisma Errors**
  - **Solution**: Run `npm run db:generate` followed by `npm run db:push` to ensure the Prisma client and schema are synchronized.
