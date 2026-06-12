---
title: Technical Requirements Document (TRD)
tags: [beacon, documentation, trd, technical]
---

# 🛠️ Technical Requirements Document (TRD)

## 1. TECH STACK

| Layer | Technology |
|---|---|
| Backend API | Node.js + Express |
| Database | PostgreSQL (via Prisma ORM) |
| Real-time | WebSockets (Socket.io) |
| Frontend Dashboard | React + Vite + Tailwind CSS |
| Auth | JWT + API Keys |
| Notification Delivery | Nodemailer (email), Slack Webhook, Generic Webhook |
| Queue | Bull (Redis-backed job queue) |
| SDK | TypeScript package |
| Containerization | Docker + Docker Compose |
| Testing | Jest + Supertest |

## 2. BACKEND ARCHITECTURE

### 2.1 Services & Core Logic
- **Signal Service**: Validates SOS packets (AJV), calculates urgency, stores in PostgreSQL, emits WebSocket events, and queues timeouts/notifications.
- **Resolution Service**: Handles operator input, stores resolution, clears timeouts, and responds to agent polling or WebSocket.
- **Notification Service**: Manages Slack, Email, and generic webhook dispatch using Bull queue.
- **Queue Service**: Redis-backed delayed jobs for processing timeouts exactly at `expiresAt`.

### 2.2 Security & Auth
- **Admin/Operator Access**: Secured via JWT with role-based access.
- **Agent Access**: Secured via unique API keys passed in headers.
- **Isolation**: Every query is strictly filtered by `orgId` to ensure multi-tenant security.

## 3. FRONTEND ARCHITECTURE

### 3.1 State Management
- **Local State**: React `useState` / `useReducer`.
- **Global State**: Zustand for auth tokens and user preferences.
- **Real-Time Data**: Custom `useSignals` hook integrating Socket.io with REST fallbacks.

### 3.2 Component Strategy
- Atomic design principles.
- Use of Tailwind for utility-first styling.
- Extracted reusable components like `SignalCard`, `UrgencyBadge`, `TimerBar`.

## 4. SDK ARCHITECTURE

### 4.1 BeaconClient
- Node.js native fetching mechanism (or Axios).
- Polling strategy for legacy frameworks with long-polling fallback.
- Support for persistent WebSocket connection for real-time resolution.

### 4.2 Adapters
- Pluggable architecture to hook into LangChain callbacks and AutoGen hooks seamlessly.

## 5. DEPLOYMENT & INFRASTRUCTURE

- Development relies on `docker-compose.yml` to orchestrate PostgreSQL, Redis, Backend API, and Frontend Vite server.
- The `.env` file controls secrets (JWT secret, Database URLs, SMTP configs).
