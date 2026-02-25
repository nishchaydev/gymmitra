# Gym Mitra ERP - Architecture & Features Overview

Gym Mitra is a comprehensive, multi-tenant Enterprise Resource Planning (ERP) platform designed specifically for gym owners and fitness centers. 

## Technology Stack

The platform is built on a modern, highly scalable "T3-adjacent" stack:

*   **Frontend Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Radix UI / shadcn/ui
*   **Backend & Authentication:** Supabase (Auth, Storage, PostgreSQL)
*   **Database ORM:** Prisma (`prisma-client-js`)
*   **Hosting & Analytics:** Vercel
*   **Transactional Emails:** Resend

## Architecture

*   **Multi-Tenant SaaS (BaaS + Custom UI):** Combines the rapid development speed of a Backend-as-a-Service (Supabase) with the absolute control and customizability of a bespoke Next.js enterprise application.
*   **Tenant Isolation:** Strict data isolation using `gymId` foreign keys across almost every major table (`Member`, `Product`, `MembershipPlan`, `Sale`, `Invoice`, etc.).
*   **Connection Pooling:** Built to scale seamlessly on serverless/edge environments using Prisma's `directUrl` feature alongside Supavisor / PgBouncer.
*   **PWA Ready:** Constructed to be a Progressive Web App, offering a mobile-optimized, offline-capable experience for users.

## Core Features & Schema Design

### 🏢 1. Multi-Tenant Gym Management
*   **Schema (`GymProfile`, `RegistrationCode`):** 
    *   Tracks branch details, GST, Business Name, customized Logos, and onboarding steps.
    *   Custom invoice prefixing (`invoicePrefix`) and counting (`invoiceCounter`).
    *   SaaS tier management via `SaaSPlan` Enum (`BASIC`, `GROWTH`, `ENTERPRISE`).
    *   Secure onboarding workflows using the `RegistrationCode` model.

### 👥 2. Complete Member Lifecycle Management
*   **Schema (`Member`):**
    *   Stores personal details, profile photos, and unique phone numbers.
    *   Safety built-in via emergency contact details parsing (`emergencyName`, `emergencyPhone`, `emergencyRelation`).
    *   Dynamic lifecycle classification using `MemberStatus` Enum (`ACTIVE`, `INACTIVE`, `EXPIRED`).

### 💳 3. Subscription & Plan Handling
*   **Schema (`MembershipPlan`, `MemberSubscription`):**
    *   Flexible `MembershipPlan` featuring price, duration, and custom `features` arrays.
    *   `MemberSubscription` tracks `startDate`, `endDate`, `autoRenew` flags, and statuses natively (e.g., `ACTIVE`, `EXPIRED`).
    *   Integrated financial tracking with `PaymentStatus` (`PAID`, `PENDING`, `OVERDUE`, `PARTIAL`).

### 🛍️ 4. Inventory & Point of Sale (POS)
*   **Schema (`Product`, `Sale`):**
    *   Tracks physical inventory via `Product` (pricing, stock levels, low-stock alerts, categories like `PROTEIN`, `SUPPLEMENT`).
    *   Checkout sessions processed via `Sale`, aggregating quantities, unit prices, discounts, and finalizing amounts precisely using PostgreSQL `Decimal(10, 2)`.
    *   Maps transactions to specific `PaymentMethod`s (`CASH`, `CARD`, `UPI`).

### 🧾 5. Automated Billing & Invoicing
*   **Schema (`Invoice`, `InvoiceItem`):**
    *   Enterprise-grade engine that connects dynamically to memberships, generic sales, or renewals.
    *   Supports robust subtotal and tax matrices.
    *   Generates secure `shareToken`s for public view/download of PDF invoices.

### 📅 6. Smart Attendance & Access
*   **Schema (`Attendance`):**
    *   Records daily footfall with precise `checkInTime` and `checkOutTime`.
    *   Strict unique constraint on `[memberId, checkInDate]` to ensure perfectly clean daily log data.

### 🏋️ 7. Staff & Personal Training (PT) Management
*   **Schema (`StaffMember`, `PTSession`):**
    *   Defines distinct roles via `Role` Enum (`STAFF` vs. `TRAINER`).
    *   Links staff directly to their employer via `gymId` while linking them securely to a `userId` (Supabase Auth reference).
    *   Manages trainer workloads via `PTSession` with careful constraint checks (e.g., `@@unique([trainerId, startTime])` to natively prevent double-booking).

### 🔔 8. Automated Operations & Notifications
*   **Schema (`Notification`):**
    *   Internal engagement system using targeted read/unread flags and extendable JSON `metadata`.
    *   Automated by precise `NotificationType`s (`BIRTHDAY`, `EXPIRY_REMINDER`, `PAYMENT_OVERDUE`, `LOW_STOCK`, `MONTHLY_SUMMARY`).

## Key Database Strengths (Prisma + PostgreSQL)
1.  **Impenetrable Tenant Security:** Extensive use of `@@index([gymId])` and foreign keys across schemas guarantees fast isolation.
2.  **Referential Integrity:** Aggressive deployment of `onDelete: Cascade` rules prevents orphaned rows and keeps the database clean upon entity deletions.
3.  **Precision Finance Tracking:** Usage of `Decimal` completely eliminates floating-point math inaccuracies across prices, taxes, and final amounts.
