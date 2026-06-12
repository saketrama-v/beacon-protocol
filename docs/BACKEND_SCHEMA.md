---
title: Backend Schema
tags: [beacon, documentation, backend, database, schema]
---

# 🗄️ Backend Schema & API Contracts

## 1. Database Schema (Prisma)

The BEACON protocol relies on a relational database managed by Prisma ORM.

### 1.1 Core Entities

- **Organization**: Top-level tenant. Contains Users, Agents, Signals, Webhooks.
- **User**: Human operator or admin. Belongs to an Organization.
- **Agent**: The AI entity that emits SOS signals. Has a unique `apiKey` for authentication.
- **Signal**: The SOS packet emitted by an Agent.
- **Resolution**: The human response to a Signal. 1:1 relationship with Signal.
- **Webhook**: Configuration for external notifications (Slack, Email, Generic).
- **Notification**: Log of notifications sent for a given Signal.

### 1.2 Prisma Schema Models

```prisma
model Organization {
  id         String   @id @default(uuid())
  name       String
  createdAt  DateTime @default(now())
  agents     Agent[]
  users      User[]
  webhooks   Webhook[]
  signals    Signal[]
}

model User {
  id             String       @id @default(uuid())
  email          String       @unique
  passwordHash   String
  role           Role         @default(OPERATOR)
  orgId          String
  org            Organization @relation(fields: [orgId], references: [id])
  resolutions    Resolution[]
  createdAt      DateTime     @default(now())
}

enum Role {
  ADMIN
  OPERATOR
  VIEWER
}

model Agent {
  id          String       @id @default(uuid())
  name        String
  framework   String
  apiKey      String       @unique @default(uuid())
  orgId       String
  org         Organization @relation(fields: [orgId], references: [id])
  signals     Signal[]
  createdAt   DateTime     @default(now())
  isActive    Boolean      @default(true)
}

model Signal {
  id                  String      @id @default(uuid())
  protocolVersion     String
  agentId             String
  agent               Agent       @relation(fields: [agentId], references: [id])
  orgId               String
  org                 Organization @relation(fields: [orgId], references: [id])
  urgency             Urgency
  confidenceScore     Float?
  triggerType         String
  contextSnapshot     Json
  decisionNeeded      Json
  timeoutSeconds      Int
  metadata            Json?
  status              SignalStatus @default(PENDING)
  receivedAt          DateTime    @default(now())
  expiresAt           DateTime
  resolution          Resolution?
  notificationsSent   Notification[]
}

enum Urgency {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum SignalStatus {
  PENDING
  ACKNOWLEDGED
  RESOLVED
  TIMED_OUT
  CANCELLED
}

model Resolution {
  id               String     @id @default(uuid())
  signalId         String     @unique
  signal           Signal     @relation(fields: [signalId], references: [id])
  resolution       String
  chosenOptionId   String?
  instructions     String?
  resolvedById     String?
  resolvedBy       User?      @relation(fields: [resolvedById], references: [id])
  resolvedAt       DateTime   @default(now())
  resolutionTimeMs Int
}

model Webhook {
  id        String       @id @default(uuid())
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id])
  type      WebhookType
  config    Json         // stores URL, channel, token etc
  isActive  Boolean      @default(true)
  createdAt DateTime     @default(now())
}

enum WebhookType {
  SLACK
  EMAIL
  GENERIC_WEBHOOK
  PAGERDUTY
}

model Notification {
  id          String   @id @default(uuid())
  signalId    String
  signal      Signal   @relation(fields: [signalId], references: [id])
  channel     String
  status      String   // sent | failed | pending
  sentAt      DateTime?
  error       String?
}
```

## 2. API Contracts

### 2.1 Auth Endpoints
- `POST /api/v1/auth/register`: Create organization and initial admin user.
- `POST /api/v1/auth/login`: Authenticate and return JWT token.
- `POST /api/v1/auth/refresh`: Refresh expired JWT.
- `POST /api/v1/auth/logout`: Invalidate session.

### 2.2 Agent Endpoints (Requires JWT)
- `GET /api/v1/agents`: List all active agents.
- `POST /api/v1/agents`: Register an agent and obtain an API key.
- `GET /api/v1/agents/:id`: Retrieve agent details.
- `PATCH /api/v1/agents/:id`: Update agent name or framework.
- `DELETE /api/v1/agents/:id`: Deactivate agent.
- `POST /api/v1/agents/:id/rotate-key`: Generate a new API key.

### 2.3 Signal Endpoints (Inbound from Agents)
- `POST /api/v1/signals`: Submit a new SOS packet (Requires Agent API Key).
- `GET /api/v1/signals/:id/status`: Poll for resolution status.
- `DELETE /api/v1/signals/:id`: Cancel a pending SOS signal.

### 2.4 Dashboard Signal Endpoints (Requires JWT)
- `GET /api/v1/dashboard/signals`: Fetch paginated signals.
- `GET /api/v1/dashboard/signals/:id`: Fetch specific signal full details.
- `GET /api/v1/dashboard/stats`: Retrieve top-level analytics counts.

### 2.5 Resolution Endpoints (Requires JWT)
- `POST /api/v1/resolutions/:signalId`: Submit a human operator's decision.

### 2.6 Webhook Endpoints (Requires JWT)
- `GET /api/v1/webhooks`: List all notification webhooks.
- `POST /api/v1/webhooks`: Create a new webhook integration.
- `PATCH /api/v1/webhooks/:id`: Update an existing webhook.
- `DELETE /api/v1/webhooks/:id`: Remove a webhook.
- `POST /api/v1/webhooks/:id/test`: Trigger a test notification.
