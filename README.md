[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/EdN1T4tj)

# MemiCare Backend API

## Overview

MemiCare is a mental health counseling platform connecting clients with professional counselors. The backend is a REST API built with NestJS, TypeScript, and PostgreSQL that powers the MemiCare web application. It supports:

- Multi-role authentication (Admin, Client, Counselor)
- Counselor discovery with filtering
- Appointment lifecycle management (booking → payment → session → review)
- Payment proof verification workflow
- Real-time notifications
- Dashboard analytics per role

## Swagger Live API Documentation

When the server is running, interactive API documentation is available at:

```
http://localhost:3001/api/docs
```

Features:

- Try all endpoints directly from the browser
- Authorize with JWT tokens (click "Authorize" button)
- View request/response schemas
- Swagger JSON available at `http://localhost:3001/api/docs-json`

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| CounselorProfile : "has optional"
    User ||--o{ Notification : "receives"
    User ||--o{ Appointment : "books as client"

    CounselorProfile ||--o{ CounselorSpecialization : "has"
    CounselorProfile ||--o{ SessionTypeConfig : "offers"
    CounselorProfile ||--o{ Appointment : "assigned"
    CounselorProfile ||--o{ CounselorSchedule : "schedules"

    Specialization ||--o{ CounselorSpecialization : "linked via"
    AppointmentSessionType ||--o{ SessionTypeConfig : "configured in"

    Appointment ||--o| PaymentProof : "has proof"
    Appointment ||--o| Review : "reviewed"

    User {
        string id PK
        string email UK
        string password
        string fullName
        string role
        string phone
        string dateOfBirth
        string emergencyContact
        string avatarUrl
        string counselorId FK
        boolean isActive
        string refreshToken
    }

    CounselorProfile {
        string id PK
        string userId UK
        string licenseNumber UK
        string availability
        float rating
        int reviewCount
        string languages
        boolean isAvailable
    }

    Specialization {
        string id PK
        string name UK
        string description
    }

    AppointmentSessionType {
        string id PK
        string name
        int durationMinutes
        float price
        int tier
        boolean isOnline
    }

    Appointment {
        string id PK
        string clientId FK
        string counselorId FK
        string sessionType
        datetime date
        string time
        string endTime
        int durationMinutes
        float rate
        string status
        string meetingLink
        string notes
        string referenceCode
    }

    PaymentProof {
        string id PK
        string appointmentId UK
        string filename
        datetime submittedAt
        string status
        string rejectionReason
    }

    Review {
        string id PK
        string appointmentId UK
        int rating
        string comment
    }

    Notification {
        string id PK
        string userId FK
        string type
        string title
        string message
        boolean isRead
    }

    CounselorSchedule {
        string id PK
        string counselorId FK
        string dayOfWeek
        string startTime
        string endTime
    }

    CounselorSpecialization {
        string id PK
        string counselorId FK
        string specializationId FK
    }

    SessionTypeConfig {
        string id PK
        string counselorId FK
        string sessionType
        string appointmentSessionTypeId FK
        string clinicAddress
    }
```

## Architecture

### Module Structure

The application follows a strict **layered architecture** with domain-driven modules:

```
Controller → Service → Repository → Database (Prisma)
```

| Layer      | Responsibility                                          |
| ---------- | ------------------------------------------------------- |
| Controller | HTTP routing, param parsing, Swagger docs, guards       |
| Service    | Business logic, validation, error throwing, DTO mapping |
| Repository | Prisma queries, transactions, raw data access           |

Each feature module encapsulates its own controller, service, repository, and DTOs.

### Dependency Injection Choices

- **PrismaService** — Globally provided via `@Global()` PrismaModule. Injected into all repositories.
- **Repositories** — Exported from their modules so other modules can import them (e.g., AppointmentsRepository used by PaymentProofs and Reviews)
- **Guards** — `JwtAuthGuard` and `RolesGuard` live in `src/common/guards/` and are applied at controller/method level
- **Custom Decorators** — `@GetUser()`, `@Roles()`, throttle decorators in `src/common/decorators/`
- **ThrottlerModule** — Globally configured in AppModule with custom decorators for tiered rate limiting

### Auth Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant API as NestJS API
    participant DB as PostgreSQL

    Client->>API: POST /api/v1/auth/register {email, password, fullName}
    API->>DB: Create user (hashed password)
    DB-->>API: User created
    API-->>Client: {accessToken, refreshToken}

    Client->>API: POST /api/v1/auth/login {email, password}
    API->>DB: Verify credentials
    DB-->>API: User found
    API-->>Client: {accessToken, refreshToken}

    Client->>API: GET /api/v1/users/me (Bearer accessToken)
    API->>API: JwtAuthGuard validates token
    API->>DB: Find user by ID from JWT
    DB-->>API: User data
    API-->>Client: UserResponseDto

    Client->>API: POST /api/v1/auth/refresh (Bearer refreshToken)
    API->>API: RefreshTokenGuard validates
    API->>DB: Verify stored refreshToken
    API-->>Client: {accessToken, refreshToken} (rotated)

    Client->>API: POST /api/v1/auth/logout (Bearer accessToken)
    API->>DB: Clear refreshToken
    API-->>Client: {message: "Successfully logged out"}
```

**Key decisions:**

- JWT access tokens (short-lived, configurable via `JWT_EXPIRES_IN`)
- Refresh tokens stored in DB (enables server-side revocation)
- Role-based access: `ADMIN`, `CLIENT`, `COUNSELOR` enforced via `@Roles()` + `RolesGuard`
- Passwords hashed with bcrypt

## Project Structure

```
memicare-be/
├── prisma/
│   ├── schema.prisma              # Database schema (12 models, 7 enums)
│   └── migrations/                # Prisma migrations
├── src/
│   ├── main.ts                    # Bootstrap, Swagger, CORS, ValidationPipe
│   ├── app.module.ts              # Root module (13 feature modules)
│   ├── app.controller.ts          # Health check
│   ├── prisma/
│   │   ├── prisma.module.ts       # @Global() module
│   │   └── prisma.service.ts      # PrismaClient wrapper
│   ├── common/
│   │   ├── decorators/            # @GetUser, @Roles, throttle helpers
│   │   ├── guards/                # JwtAuthGuard, RolesGuard
│   │   └── interfaces/            # Shared TypeScript interfaces
│   └── modules/
│       ├── auth/                  # Register, login, refresh, logout
│       ├── users/                 # User management (admin + self)
│       ├── counselors/            # Public counselor browsing
│       ├── counselor-profile/     # Counselor self-management
│       ├── counselor-schedules/   # Weekly schedule management
│       ├── specializations/       # Counselor specializations (CRUD)
│       ├── session-types/         # Session type catalog (CRUD)
│       ├── appointments/          # Full appointment lifecycle (12 endpoints)
│       ├── payment-proofs/        # Payment proof upload/verify/reject
│       ├── reviews/               # Client reviews + rating recalculation
│       ├── notifications/         # User notifications
│       └── dashboard/             # Role-specific analytics
├── test/                          # E2E tests
├── uploads/                       # File uploads (payment proofs)
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL** >= 14.x
- **Prisma CLI** (installed as project dependency)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd crack-be-leogurning
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/memicare?schema=public"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN=900
ALLOWED_ORIGINS="http://localhost:3000"
PORT=3001
NODE_ENV=development
```

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to browse data
npx prisma studio
```

### 5. Create uploads directory

```bash
mkdir -p uploads/payment-proofs
```

### 6. Run the application

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### 7. Run tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

The API will be available at `http://localhost:3001/api/v1` and Swagger docs at `http://localhost:3001/api/docs`.

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Endpoint    | Auth          | Description                   |
| ------ | ----------- | ------------- | ----------------------------- |
| POST   | `/register` | —             | Register a new user           |
| POST   | `/login`    | —             | Login with email/password     |
| POST   | `/refresh`  | Refresh Token | Rotate access token           |
| POST   | `/logout`   | JWT           | Logout and invalidate refresh |

### Users (`/api/v1/users`)

| Method | Endpoint             | Auth  | Description                |
| ------ | -------------------- | ----- | -------------------------- |
| GET    | `/`                  | Admin | List all users (paginated) |
| GET    | `/me`                | JWT   | Get own profile            |
| PATCH  | `/me`                | JWT   | Update own profile         |
| PATCH  | `/:id/toggle-active` | Admin | Toggle user active status  |

### Counselors (`/api/v1/counselors`)

| Method | Endpoint | Auth   | Description                                  |
| ------ | -------- | ------ | -------------------------------------------- |
| GET    | `/`      | Public | Browse counselors (search, filter, paginate) |
| GET    | `/:id`   | Public | Counselor detail with reviews & schedule     |

### Counselor Profile (`/api/v1/counselor-profile`)

| Method | Endpoint | Auth      | Description        |
| ------ | -------- | --------- | ------------------ |
| GET    | `/me`    | Counselor | Get own profile    |
| PATCH  | `/me`    | Counselor | Update own profile |

### Counselor Schedules (`/api/v1/counselor-schedules`)

| Method | Endpoint        | Auth      | Description           |
| ------ | --------------- | --------- | --------------------- |
| GET    | `/:counselorId` | Public    | Get weekly schedule   |
| PUT    | `/:counselorId` | Counselor | Bulk replace schedule |

### Specializations (`/api/v1/specializations`)

| Method | Endpoint | Auth   | Description              |
| ------ | -------- | ------ | ------------------------ |
| GET    | `/`      | Public | List all specializations |
| POST   | `/`      | Admin  | Create specialization    |
| PATCH  | `/:id`   | Admin  | Update specialization    |
| DELETE | `/:id`   | Admin  | Delete specialization    |

### Session Types (`/api/v1/session-types`)

| Method | Endpoint | Auth   | Description            |
| ------ | -------- | ------ | ---------------------- |
| GET    | `/`      | Public | List all session types |
| POST   | `/`      | Admin  | Create session type    |
| PATCH  | `/:id`   | Admin  | Update session type    |
| DELETE | `/:id`   | Admin  | Delete session type    |

### Appointments (`/api/v1/appointments`)

| Method | Endpoint                  | Auth      | Description          |
| ------ | ------------------------- | --------- | -------------------- |
| POST   | `/`                       | Client    | Create appointment   |
| GET    | `/`                       | JWT       | List (role-filtered) |
| GET    | `/:id`                    | JWT       | Get detail           |
| PATCH  | `/:id`                    | JWT       | Update notes/link    |
| PATCH  | `/:id/confirm`            | Counselor | Confirm appointment  |
| PATCH  | `/:id/cancel`             | JWT       | Cancel appointment   |
| PATCH  | `/:id/reschedule`         | Client    | Request reschedule   |
| PATCH  | `/:id/start`              | Counselor | Start session        |
| PATCH  | `/:id/complete`           | Counselor | Complete session     |
| PATCH  | `/:id/confirm-reschedule` | Counselor | Confirm reschedule   |
| PATCH  | `/:id/reject-reschedule`  | Counselor | Reject reschedule    |
| DELETE | `/:id`                    | Admin     | Delete appointment   |

### Payment Proofs (`/api/v1/payment-proofs`)

| Method | Endpoint      | Auth   | Description          |
| ------ | ------------- | ------ | -------------------- |
| POST   | `/`           | Client | Upload payment proof |
| PATCH  | `/:id/verify` | Admin  | Verify payment       |
| PATCH  | `/:id/reject` | Admin  | Reject payment       |

### Reviews (`/api/v1/reviews`)

| Method | Endpoint                  | Auth   | Description           |
| ------ | ------------------------- | ------ | --------------------- |
| POST   | `/`                       | Client | Create review         |
| GET    | `/counselor/:counselorId` | Public | Get counselor reviews |

### Notifications (`/api/v1/notifications`)

| Method | Endpoint    | Auth | Description        |
| ------ | ----------- | ---- | ------------------ |
| GET    | `/`         | JWT  | List notifications |
| PATCH  | `/read-all` | JWT  | Mark all as read   |
| PATCH  | `/:id/read` | JWT  | Mark one as read   |

### Dashboard (`/api/v1/dashboard`)

| Method | Endpoint     | Auth      | Description          |
| ------ | ------------ | --------- | -------------------- |
| GET    | `/client`    | Client    | Client statistics    |
| GET    | `/counselor` | Counselor | Counselor statistics |
| GET    | `/admin`     | Admin     | Platform analytics   |

---

**Total: 41 API endpoints** across 12 feature modules.
