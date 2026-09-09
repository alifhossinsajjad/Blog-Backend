# 🚀 Enterprise-Grade Blog API

A robust, scalable, and highly performant Blog application backend built with **Node.js, Express, TypeScript, and PostgreSQL**. 

This project demonstrates a production-ready architecture employing modern backend development practices, including message queues for background processing, structured logging, type-safe database access, and secure authentication.

---

## ✨ Key Features

- **Modular Architecture:** Clean code structure following domain-driven design principles for scalability and maintainability.
- **Type Safety:** 100% TypeScript with rigorous static typing and runtime validation using **Zod**.
- **Advanced Authentication:** Secure authentication flows implemented with **Better Auth**, including session management and role-based access control (RBAC).
- **Asynchronous Processing:** Background job processing with **BullMQ** and **Redis** (e.g., sending emails asynchronously without blocking the main event loop).
- **Media Management:** Efficient file uploads handling via **Multer** and seamless integration with **Cloudinary** for image storage and optimization.
- **Database Abstraction:** Type-safe database interactions and schema migrations using **Prisma ORM** with the PostgreSQL adapter.
- **Robust Error Handling:** Centralized global error handling mechanism, ensuring consistent API responses and preventing information leakage.
- **Structured Logging:** Comprehensive application logging using **Winston** for easier debugging and observability.
- **Security Best Practices:** Integrated with **Helmet**, **CORS**, and **Express Rate Limit** to protect against common web vulnerabilities and brute-force attacks.

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Core** | Node.js, Express.js, TypeScript |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Authentication** | Better Auth |
| **Queue & Caching** | Redis, BullMQ |
| **File Storage** | Cloudinary, Multer |
| **Validation** | Zod |
| **Logging** | Winston, Morgan |
| **Email Service** | Nodemailer |

## 📁 Project Structure

```text
├── src/
│   ├── app.ts                 # Express app initialization and middleware setup
│   ├── server.ts              # Server entry point
│   ├── config/                # Environment variables and configuration files
│   ├── errors/                # Custom error classes
│   ├── lib/                   # External service integrations (e.g., better-auth)
│   ├── middlewares/           # Global middlewares (auth, validation, error handler)
│   ├── modules/               # Domain-specific modules (auth, users, posts, comments)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── posts/
│   │   └── comments/
│   ├── queues/                # BullMQ queue definitions
│   ├── script/                # Utility scripts (e.g., database seeding)
│   ├── types/                 # Global TypeScript interfaces and types
│   ├── utils/                 # Helper functions and utilities
│   └── workers/               # BullMQ worker processors
├── prisma/
│   ├── schema/                # Modularized Prisma schemas
│   │   ├── user.prisma
│   │   ├── post.prisma
│   │   ├── comment.prisma
│   │   └── schema.prisma
│   └── migrations/            # Database migration history
└── ...
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** database
- **Redis** server
- **Cloudinary** account (for image uploads)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blog-app-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory and populate it with the necessary environment variables:
   ```env
   # Application
   PORT=5000
   NODE_ENV=development
   
   # Database (PostgreSQL)
   DATABASE_URL=******************
   
   # Redis
   REDIS_URL=**************
   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   
   # JWT & Auth
   JWT_SECRET="your_super_secret_key"
   
   # Email Config (Nodemailer)
   SMTP_HOST="smtp.example.com"
   SMTP_PORT=587
   SMTP_USER="user@example.com"
   SMTP_PASS="password"
   ```

4. **Database Migration**
   Run Prisma migrations to sync the schema with your PostgreSQL database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Seed the Database (Optional)**
   Create an initial admin user:
   ```bash
   npm run seed
   ```

### Running the Application

**Development Mode:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

## 🧠 Design Decisions & Architecture Highlights

- **Domain-Driven Directory Structure:** The `src/modules` directory isolates features (e.g., posts, users, comments). Each module encapsulates its own controllers, services, interfaces, and routes, promoting high cohesion and low coupling.
- **Event-Driven Background Processing:** Critical but slow operations like email dispatching and image optimization are offloaded to **BullMQ** workers. This keeps API response times incredibly fast.
- **Modularized Database Schema:** As the project grows, managing a massive `schema.prisma` file becomes cumbersome. The Prisma schema is beautifully split into logical models (`user.prisma`, `post.prisma`, `comment.prisma`) utilizing the `prisma/schema` directory structure.
- **Fail-Safe Error Management:** A custom wrapper for async route handlers guarantees that uncaught promise rejections seamlessly flow into the global error handler (`globalErrorHandler.ts`), preventing memory leaks and application crashes while ensuring client-friendly error formatting.

---
*Developed with a focus on clean code, scalability, and modern backend practices.*
