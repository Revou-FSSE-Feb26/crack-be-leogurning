-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COUNSELOR', 'CLIENT', 'ROOT');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'AWAITING_PAYMENT', 'PAYMENT_UPLOADED', 'PAYMENT_VERIFIED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PENDING_RESCHEDULE', 'REJECTED_SCHEDULE');

-- CreateEnum
CREATE TYPE "CancelledBy" AS ENUM ('CLIENT', 'COUNSELOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "PaymentProofStatus" AS ENUM ('SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_REMINDER', 'PAYMENT_CONFIRMED', 'PAYMENT_REJECTED', 'SESSION_CANCELLED', 'NEW_BOOKING', 'GENERAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "emergencyContact" TEXT,
    "avatarUrl" TEXT,
    "counselorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counselor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "availability" TEXT[],
    "rating" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "languages" TEXT[],
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "counselor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specializations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "specializations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_session_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "tier" INTEGER NOT NULL,
    "isOnline" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "appointment_session_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counselor_schedules" (
    "id" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "counselor_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counselor_specializations" (
    "id" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "specializationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "counselor_specializations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_type_configs" (
    "id" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "appointmentSessionTypeId" TEXT NOT NULL,
    "clinicAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "session_type_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "meetingLink" TEXT,
    "notes" TEXT,
    "referenceCode" TEXT,
    "cancellationNotes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" "CancelledBy",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_proofs" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "status" "PaymentProofStatus" NOT NULL DEFAULT 'SUBMITTED',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_counselorId_key" ON "users"("counselorId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "counselor_profiles_userId_key" ON "counselor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "counselor_profiles_licenseNumber_key" ON "counselor_profiles"("licenseNumber");

-- CreateIndex
CREATE INDEX "counselor_profiles_userId_idx" ON "counselor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "specializations_name_key" ON "specializations"("name");

-- CreateIndex
CREATE INDEX "appointment_session_types_isOnline_idx" ON "appointment_session_types"("isOnline");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "counselor_schedules_counselorId_dayOfWeek_idx" ON "counselor_schedules"("counselorId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "counselor_schedules_counselorId_dayOfWeek_startTime_key" ON "counselor_schedules"("counselorId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "counselor_specializations_counselorId_idx" ON "counselor_specializations"("counselorId");

-- CreateIndex
CREATE INDEX "counselor_specializations_specializationId_idx" ON "counselor_specializations"("specializationId");

-- CreateIndex
CREATE UNIQUE INDEX "counselor_specializations_counselorId_specializationId_key" ON "counselor_specializations"("counselorId", "specializationId");

-- CreateIndex
CREATE INDEX "session_type_configs_counselorId_idx" ON "session_type_configs"("counselorId");

-- CreateIndex
CREATE INDEX "session_type_configs_appointmentSessionTypeId_idx" ON "session_type_configs"("appointmentSessionTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "session_type_configs_counselorId_sessionType_key" ON "session_type_configs"("counselorId", "sessionType");

-- CreateIndex
CREATE INDEX "appointments_clientId_idx" ON "appointments"("clientId");

-- CreateIndex
CREATE INDEX "appointments_counselorId_idx" ON "appointments"("counselorId");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_date_idx" ON "appointments"("date");

-- CreateIndex
CREATE UNIQUE INDEX "payment_proofs_appointmentId_key" ON "payment_proofs"("appointmentId");

-- CreateIndex
CREATE INDEX "payment_proofs_status_idx" ON "payment_proofs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_appointmentId_key" ON "reviews"("appointmentId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "counselor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselor_schedules" ADD CONSTRAINT "counselor_schedules_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "counselor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselor_specializations" ADD CONSTRAINT "counselor_specializations_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "counselor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselor_specializations" ADD CONSTRAINT "counselor_specializations_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "specializations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_type_configs" ADD CONSTRAINT "session_type_configs_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "counselor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_type_configs" ADD CONSTRAINT "session_type_configs_appointmentSessionTypeId_fkey" FOREIGN KEY ("appointmentSessionTypeId") REFERENCES "appointment_session_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "counselor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
