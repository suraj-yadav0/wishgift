# WishGift 🎁

**WishGift** is a modern full-stack web application designed for creating, managing, and sharing wishlists. Users can curate gift ideas, reserve items on friends' wishlists, follow other users, and explore public gift lists for various occasions.

---

## 🚀 Features

- **Personalized Wishlists**: Create public or private wishlists for birthdays, holidays, weddings, or personal goals.
- **Gift Items Management**: Add items with custom priority levels, links, prices, quantities, and images.
- **Gift Reservation System**: Friends and family can anonymously or publicly reserve items to prevent duplicate gifts.
- **Social Features**: Follow friends, discover public wishlists, and see trending lists.
- **Secure Authentication**: Built-in user registration and sign-in powered by NextAuth.js.
- **Responsive & Modern UI**: Sleek layout crafted with React 19, Tailwind CSS v4, and Radix UI components.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI & Styling**: React 19, Tailwind CSS v4, Radix UI, Framer Motion, Lucide Icons
- **Database & ORM**: SQLite, [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Credentials provider with `bcryptjs`)
- **State & Data Fetching**: Zustand, TanStack React Query

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed on your system:

- **Node.js**: `v18.x` or `v20.x` (or newer)
- **npm** (comes with Node.js) or **yarn** / **pnpm** / **bun**

---

## ⚡ Quick Start Guide

Follow these steps to set up and run WishGift locally.

### 1. Install Dependencies

In the project root directory, run:

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (or copy `.env.example`):

```bash
cp .env.example .env
```

Ensure `.env` contains the required environment variables:

```env
DATABASE_URL="file:../db/custom.db"
NEXTAUTH_SECRET="wishgift-super-secret-key-change-in-production-2024"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Initialize the Database

Generate the Prisma client and sync the SQLite database schema:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to SQLite database
npm run db:push
```

### 4. Run the Application

#### 🔹 Development Mode
To start the hot-reloading development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 🔹 Production Mode
To test the production build locally:

```bash
# Step 1: Build the Next.js application
npm run build

# Step 2: Start the production server
npm run start
```

> **Note**: Running `npm start` requires a prior build step (`npm run build`). Running `npm start` without building first will result in an error: `Could not find a production build in the '.next' directory`.

---

## 📜 Available NPM Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on port `3000` |
| `npm run build` | Compiles and builds the production app into `.next` |
| `npm run start` | Starts the production server (requires `npm run build` first) |
| `npm run lint` | Runs ESLint checks across the codebase |
| `npm run db:generate` | Generates the Prisma client based on `prisma/schema.prisma` |
| `npm run db:push` | Pushes local schema changes to the SQLite database |
| `npm run db:migrate` | Runs database migrations |
| `npm run db:reset` | Resets the SQLite database |

---

## 📁 Project Structure

```text
wishgift/
├── db/                   # SQLite database directory (custom.db)
├── prisma/               # Prisma ORM schema definition
│   └── schema.prisma
├── public/               # Static assets (images, icons, etc.)
├── src/
│   ├── app/              # Next.js App Router (pages, API routes, layout)
│   ├── components/       # Reusable React components & UI primitives
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions, Prisma client instance, auth options
│   └── store/            # State management (Zustand)
├── .env                  # Local environment configuration
├── package.json          # Project dependencies & scripts
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

---

## 🤝 Troubleshooting

- **Error: Could not find a production build in the '.next' directory**
  - **Solution**: Run `npm run build` before executing `npm run start`, or use `npm run dev` for local development.

- **Database Connection Issues / Prisma Errors**
  - **Solution**: Run `npm run db:generate` followed by `npm run db:push` to ensure Prisma client and database file are up to date.
