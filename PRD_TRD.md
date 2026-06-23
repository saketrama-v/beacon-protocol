# Project Specification: Universal Agent SOS Protocol & Receiver Dashboard
**Codename: BEACON**
**Version: 1.0.0**
**Target Platform: Antigravity**

---

## 1. PROJECT OVERVIEW

### 1.1 What Is BEACON?

BEACON is a cross-vendor, open-standard escalation layer for AI agents. It has two parts:

1. **The SOS Protocol** — a standardized JSON schema that any AI agent (regardless of framework: LangChain, CrewAI, AutoGen, OpenAI Assistants, custom) can emit when it hits a decision boundary, confidence threshold, or error state.
2. **The Universal Receiver Dashboard** — a real-time web application that ingests SOS signals from any agent, routes alerts to operators via Slack/email/webhook, and lets humans review, decide, and respond — closing the loop back to the waiting agent.

### 1.2 The Core Problem Being Solved

Today, every AI agent framework handles escalation differently:
- LangChain: custom callbacks
- OpenAI Assistants: requires polling and interrupt tooling
- CrewAI: ad hoc print/log statements
- AutoGen: proprietary human input mode

There is no standard "I need help" signal that any monitoring tool can universally receive and understand. BEACON is that standard.

### 1.3 Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js + Express |
| Database | PostgreSQL (via Prisma ORM) |
| Real-time | WebSockets (Socket.io) |
| Frontend Dashboard | React + Tailwind CSS |
| Auth | JWT + API Keys |
| Notification Delivery | Nodemailer (email), Slack Webhook, Generic Webhook |
| Queue | Bull (Redis-backed job queue) |
| SDK | TypeScript package (published to npm) |
| Containerization | Docker + Docker Compose |
| Testing | Jest + Supertest |

---

## 2. THE SOS PROTOCOL SPECIFICATION

### 2.1 Signal Schema (Full)

This is the complete, canonical SOS packet that any agent emits:

```json
{
  "$schema": "https://beacon-protocol.dev/schema/v1/sos.json",
  "protocol_version": "1.0.0",
  "signal": "SOS_INTERVENTION_REQUIRED",
  "signal_id": "uuid-v4",
  "agent_id": "string — unique identifier for this agent instance",
  "agent_name": "string — human-readable name (e.g. 'Refund Processing Agent')",
  "agent_framework": "enum: langchain | crewai | autogen | openai_assistants | custom",
  "tenant_id": "string — the org/team this agent belongs to",
  "timestamp": "ISO 8601",
  "urgency": "enum: LOW | MEDIUM | HIGH | CRITICAL",
  "confidence_score": "float 0.0–1.0 — agent's self-reported confidence at time of SOS",
  "trigger_type": "enum: LOW_CONFIDENCE | IRREVERSIBLE_ACTION | POLICY_BOUNDARY | AMBIGUOUS_INPUT | TIMEOUT | MANUAL",
  "context_snapshot": {
    "task_description": "string — what the agent was originally asked to do",
    "steps_taken": [
      {
        "step_number": 1,
        "action": "string",
        "result": "string",
        "timestamp": "ISO 8601"
      }
    ],
    "current_state": "string — free-text summary of where the agent is right now",
    "data_in_scope": ["array of string keys describing what data is being handled"]
  },
  "decision_needed": {
    "question": "string — the specific yes/no or choice the human must make",
    "options": [
      {
        "option_id": "A",
        "label": "string",
        "consequence": "string — plain English explanation of what happens if chosen"
      }
    ],
    "default_if_timeout": "string — option_id to use if human doesn't respond in time"
  },
  "timeout_seconds": 300,
  "metadata": {
    "estimated_value_at_risk": "number — optional, e.g. dollar amount of pending transaction",
    "affected_user_id": "string — optional, end user affected",
    "tags": ["array of strings for filtering, e.g. 'finance', 'pii', 'external-api'"],
    "custom": {}
  }
}
```

### 2.2 Resolution Packet (sent back to agent)

When a human responds in the dashboard, BEACON sends this back:

```json
{
  "protocol_version": "1.0.0",
  "signal_id": "same uuid as the SOS",
  "resolution": "enum: APPROVED | REJECTED | OVERRIDE | ESCALATED | TIMED_OUT",
  "chosen_option_id": "string — which option the human picked",
  "instructions": "string — optional free-text note from the human to the agent",
  "resolved_by": "string — human operator ID or 'SYSTEM' if auto-timed-out",
  "resolved_at": "ISO 8601",
  "resolution_time_ms": "number — how long it took"
}
```

### 2.3 Urgency Auto-Calculation Rules

If the emitting agent doesn't set urgency, the receiver auto-calculates:

| Condition | Urgency |
|---|---|
| confidence_score < 0.3 | CRITICAL |
| confidence_score 0.3–0.5 | HIGH |
| estimated_value_at_risk > $10,000 | CRITICAL |
| trigger_type = IRREVERSIBLE_ACTION | HIGH minimum |
| timeout_seconds < 60 | HIGH minimum |
| tags include "pii" or "financial" | HIGH minimum |

---

## 3. BACKEND API

### 3.1 Project Structure

```
/beacon-backend
  /src
    /api
      /routes
        agents.ts         — agent registration + API key management
        signals.ts        — receive and process SOS packets
        resolutions.ts    — human resolution submission
        webhooks.ts       — outbound delivery config
        dashboard.ts      — dashboard data endpoints
        auth.ts           — login, JWT refresh
      /middleware
        auth.middleware.ts
        validate.middleware.ts
        rateLimit.middleware.ts
    /services
      signal.service.ts   — core SOS ingestion logic
      resolution.service.ts
      notification.service.ts
      queue.service.ts
      websocket.service.ts
    /jobs
      timeout.job.ts      — fires when SOS timeout expires
      cleanup.job.ts      — purges old resolved signals
    /db
      schema.prisma
      seed.ts
    /lib
      urgency-calculator.ts
      schema-validator.ts
    /types
      sos.types.ts
      resolution.types.ts
  /tests
    /unit
    /integration
  docker-compose.yml
  .env.example
  README.md
```

### 3.2 Database Schema (Prisma)

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
  config    Json         — stores URL, channel, token etc
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
  status      String   — sent | failed | pending
  sentAt      DateTime?
  error       String?
}
```

### 3.3 API Endpoints (Complete)

#### Auth
```
POST   /api/v1/auth/register          — create org + admin user
POST   /api/v1/auth/login             — returns JWT
POST   /api/v1/auth/refresh           — refresh JWT
POST   /api/v1/auth/logout
```

#### Agents (requires JWT)
```
GET    /api/v1/agents                 — list all agents in org
POST   /api/v1/agents                 — register new agent, returns API key
GET    /api/v1/agents/:id             — get agent details
PATCH  /api/v1/agents/:id             — update agent name/framework
DELETE /api/v1/agents/:id             — deactivate agent
POST   /api/v1/agents/:id/rotate-key  — rotate API key
```

#### Signals (inbound — requires Agent API Key in header)
```
POST   /api/v1/signals                — CORE: receive SOS packet from agent
GET    /api/v1/signals/:id/status     — agent polls for resolution (long-poll supported)
DELETE /api/v1/signals/:id            — agent cancels its own pending SOS
```

#### Signals (dashboard — requires JWT)
```
GET    /api/v1/dashboard/signals           — paginated list with filters
GET    /api/v1/dashboard/signals/:id       — full signal detail
GET    /api/v1/dashboard/signals/live      — WebSocket upgrade endpoint
GET    /api/v1/dashboard/stats             — counts by status/urgency/agent
```

#### Resolutions (requires JWT)
```
POST   /api/v1/resolutions/:signalId       — submit human resolution
```

#### Webhooks (requires JWT)
```
GET    /api/v1/webhooks                    — list configured webhooks
POST   /api/v1/webhooks                    — add new webhook
PATCH  /api/v1/webhooks/:id                — update webhook
DELETE /api/v1/webhooks/:id                — remove webhook
POST   /api/v1/webhooks/:id/test           — send test notification
```

### 3.4 Signal Ingestion Flow (signal.service.ts)

When `POST /api/v1/signals` is called:

1. Authenticate API key → resolve Agent + Org
2. Validate packet against JSON schema (ajv)
3. Auto-calculate urgency if not provided
4. Compute `expiresAt = now + timeout_seconds`
5. Write Signal to database with status = PENDING
6. Emit `signal:new` event over WebSocket to all connected dashboard clients in the org
7. Enqueue timeout job in Bull: fires at `expiresAt`
8. Enqueue notification jobs for each active webhook in the org
9. Return `{ signal_id, status: "PENDING", polling_url, websocket_url }`

### 3.5 Timeout Job (timeout.job.ts)

When a signal's timer fires:
1. Check if signal is still PENDING
2. If yes: set status = TIMED_OUT
3. Look up `default_if_timeout` from `decision_needed`
4. Create Resolution record with `resolvedById = null`, `resolution = TIMED_OUT`, `chosenOptionId = default_if_timeout`
5. Emit `signal:resolved` WebSocket event
6. Send timeout notification to org webhooks

### 3.6 Resolution Delivery to Agent

Agents can retrieve their resolution two ways:

**Polling:** `GET /api/v1/signals/:id/status` — returns current status + resolution if complete. Supports long-polling via `?wait=30` (holds connection for up to 30s).

**WebSocket (advanced):** Agents can connect to `wss://beacon.yourdomain.com/agent-ws?api_key=xxx` and receive `resolution` events in real time.

---

## 4. FRONTEND DASHBOARD

### 4.1 Project Structure

```
/beacon-dashboard
  /src
    /pages
      Login.tsx
      Register.tsx
      Dashboard.tsx       — main real-time feed
      SignalDetail.tsx     — full signal review + resolution UI
      Agents.tsx          — agent management
      Webhooks.tsx        — notification config
      Settings.tsx
      Analytics.tsx
    /components
      /signals
        SignalFeed.tsx     — real-time list
        SignalCard.tsx     — summary card
        SignalBadge.tsx    — urgency pill
        ContextViewer.tsx  — expandable step-by-step context
        DecisionPanel.tsx  — the resolution UI (core interaction)
        TimerBar.tsx       — countdown to timeout
      /layout
        Sidebar.tsx
        TopNav.tsx
        Toaster.tsx
      /agents
        AgentList.tsx
        AgentCard.tsx
        AddAgentModal.tsx
      /webhooks
        WebhookList.tsx
        AddWebhookModal.tsx
      /analytics
        UrgencyChart.tsx
        ResolutionTimeChart.tsx
        AgentActivityChart.tsx
    /hooks
      useSignals.ts       — WebSocket + REST state management
      useAuth.ts
      useToast.ts
    /lib
      api.ts              — axios instance + interceptors
      websocket.ts        — socket.io client setup
      formatters.ts       — time, urgency, etc
    /store
      auth.store.ts       — Zustand
      signals.store.ts
  /public
  index.html
  tailwind.config.js
```

### 4.2 Page-by-Page Breakdown

#### Dashboard Page (main view)
- Split layout: left sidebar (agent list with live indicators), main panel (signal feed)
- Signal feed sorted by urgency DESC, then receivedAt DESC
- Each signal card shows: agent name, urgency badge (color-coded), trigger type, confidence score bar, question preview, countdown timer
- CRITICAL signals pulse red
- Clicking a card opens SignalDetail
- WebSocket connection shows "Live" indicator in top nav
- Filter bar: by urgency, agent, status, trigger type, date range

#### SignalDetail Page
- Full `context_snapshot` rendered as a timeline of steps
- `decision_needed.question` shown prominently
- Options rendered as large clickable buttons with consequence text
- Free-text "Instructions to Agent" box
- Timer bar showing time remaining before auto-resolution
- "Acknowledge" button (sets status = ACKNOWLEDGED, pauses timeout — optional feature)
- Submit Resolution button — confirms choice, sends to backend
- After resolution: shows confirmation + resolution packet sent to agent

#### Agents Page
- Table of registered agents: name, framework, status, last active, signal count
- "Register New Agent" button → modal → returns API key (shown once, copy to clipboard)
- API key rotation button per agent
- Click agent → filtered signal history for that agent

#### Webhooks Page
- List of configured notification channels
- Add Slack: input webhook URL + optional channel override + test button
- Add Email: input address(es) + test button
- Add Generic Webhook: input URL + optional auth header
- Toggle active/inactive per webhook
- Per webhook: choose which urgency levels trigger it (e.g., Slack only for HIGH/CRITICAL, email for all)

#### Analytics Page
- Time-range selector (24h, 7d, 30d)
- Cards: total signals, avg resolution time, timeout rate, most active agent
- Bar chart: signals by urgency over time
- Line chart: avg resolution time trend
- Pie chart: resolution type breakdown (APPROVED/REJECTED/TIMED_OUT)
- Table: top 5 agents by signal volume

### 4.3 Real-Time Updates

Dashboard uses Socket.io client. Events:
- `signal:new` → prepend to feed, play audio cue for CRITICAL
- `signal:acknowledged` → update card status
- `signal:resolved` → update card, remove from pending feed
- `signal:timeout_warning` → flash card at T-30s

---

## 5. SDK (npm package: `beacon-protocol-sdk`)

### 5.1 Structure

```
/beacon-sdk
  /src
    client.ts         — BeaconClient class
    signal-builder.ts — fluent builder for SOS packets
    types.ts          — exported TypeScript types
    /adapters
      langchain.ts    — LangChain callback handler
      crewai.ts       — CrewAI hook (Python, separate package)
      autogen.ts      — AutoGen reply_func wrapper
  /dist
  package.json
  README.md
```

### 5.2 SDK API (TypeScript)

```typescript
// Initialize
const beacon = new BeaconClient({
  apiKey: process.env.BEACON_API_KEY,
  agentId: process.env.BEACON_AGENT_ID,
  baseUrl: 'https://your-beacon-instance.com', // or cloud URL
  timeout: 300, // default timeout for all signals
});

// Simple usage
const resolution = await beacon.sos({
  urgency: 'HIGH',
  triggerType: 'LOW_CONFIDENCE',
  confidenceScore: 0.38,
  contextSnapshot: {
    taskDescription: 'Process refund for order #8821',
    stepsTaken: [
      { step: 1, action: 'Looked up order', result: 'Order found, $12,400' },
      { step: 2, action: 'Checked policy', result: 'Ambiguous for orders > $10k' },
    ],
    currentState: 'Awaiting authorization for large refund',
  },
  decisionNeeded: {
    question: 'Should I execute this refund of $12,400?',
    options: [
      { id: 'A', label: 'Approve Refund', consequence: 'Immediately issues $12,400 refund to customer card' },
      { id: 'B', label: 'Reject', consequence: 'Sends rejection email to customer' },
      { id: 'C', label: 'Escalate to Manager', consequence: 'Creates Zendesk ticket for manager review' },
    ],
    defaultIfTimeout: 'B', // safe default
  },
  metadata: {
    estimatedValueAtRisk: 12400,
    affectedUserId: 'cust_88211',
    tags: ['finance', 'refund'],
  },
});

// resolution is the Resolution packet
if (resolution.resolution === 'APPROVED' && resolution.chosenOptionId === 'A') {
  await executeRefund();
} else if (resolution.chosenOptionId === 'C') {
  await createZendeskTicket();
}
```

### 5.3 LangChain Adapter

```typescript
import { BeaconHumanInterruptCallback } from 'beacon-protocol-sdk/adapters/langchain';

const chain = new AgentExecutor({
  agent,
  tools,
  callbacks: [
    new BeaconHumanInterruptCallback(beacon, {
      // When to auto-fire SOS:
      interceptToolCalls: ['execute_payment', 'delete_record', 'send_email'],
      confidenceThreshold: 0.5,
    }),
  ],
});
```

### 5.4 Builder Pattern (alternative)

```typescript
const resolution = await beacon
  .signal()
  .urgency('CRITICAL')
  .trigger('IRREVERSIBLE_ACTION')
  .describe('About to permanently delete customer account #4421')
  .steps(stepLog)
  .ask('Confirm permanent deletion of customer account?')
  .option('A', 'Delete', 'Permanently removes all data. Cannot be undone.')
  .option('B', 'Cancel', 'Aborts the deletion, no changes made.')
  .defaultOnTimeout('B')
  .valueAtRisk(0)
  .tags(['destructive', 'gdpr'])
  .send();
```

---

## 6. NOTIFICATION DELIVERY

### 6.1 Slack Notification Format

```
🚨 *BEACON — CRITICAL SOS*
*Agent:* Refund Processing Agent
*Trigger:* Low Confidence (38%)
*Question:* Should I execute this refund of $12,400?
*Time Remaining:* 4m 52s
👉 <https://beacon.yourdomain.com/signals/abc123|Review & Respond>
```

Urgency → emoji mapping:
- CRITICAL: 🚨
- HIGH: ⚠️
- MEDIUM: 🔔
- LOW: ℹ️

### 6.2 Email Format

Subject: `[BEACON] ⚠️ HIGH — Refund Processing Agent needs your decision`

Body: HTML email with:
- Agent name + framework
- The question in large text
- Each option as a button (links to dashboard)
- Context summary (last 3 steps)
- Countdown timer (static: "Expires at HH:MM:SS UTC")
- Footer: "Reply not monitored — respond via dashboard"

### 6.3 Generic Webhook Payload

```json
{
  "event": "SOS_RECEIVED",
  "signal_id": "...",
  "dashboard_url": "https://beacon.yourdomain.com/signals/...",
  "urgency": "HIGH",
  "agent_name": "...",
  "question": "...",
  "expires_at": "ISO 8601",
  "full_signal": { ...complete signal object... }
}
```

---

## 7. DOCKER & DEPLOYMENT

### 7.1 docker-compose.yml

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: beacon
      POSTGRES_USER: beacon
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./beacon-backend
    environment:
      DATABASE_URL: postgresql://beacon:${POSTGRES_PASSWORD}@postgres:5432/beacon
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  dashboard:
    build: ./beacon-dashboard
    environment:
      VITE_API_URL: http://localhost:3001
      VITE_WS_URL: ws://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 7.2 Environment Variables (.env.example)

```
# Backend
DATABASE_URL=postgresql://beacon:password@localhost:5432/beacon
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Email (optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-key
EMAIL_FROM=beacon@yourdomain.com

# Frontend
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

---

## 8. BUILD ORDER (for Antigravity)

Build in this exact sequence to avoid dependency issues:

### Phase 1: Backend Foundation
1. Initialize Node.js + Express + TypeScript project
2. Set up Prisma with PostgreSQL schema (all models above)
3. Set up Redis + Bull queue
4. Implement auth routes (register, login, JWT middleware)
5. Implement agent registration + API key generation
6. Write schema validator (ajv) for SOS packet

### Phase 2: Core Signal Pipeline
7. Implement `POST /api/v1/signals` (ingestion)
8. Implement urgency auto-calculator
9. Implement timeout job in Bull
10. Implement `GET /api/v1/signals/:id/status` with long-polling
11. Set up Socket.io server + emit `signal:new` and `signal:resolved`

### Phase 3: Resolution & Notifications
12. Implement `POST /api/v1/resolutions/:signalId`
13. Implement webhook model CRUD
14. Implement Slack notification delivery
15. Implement email notification delivery
16. Implement generic webhook delivery
17. Wrap all notifications in Bull jobs (async, with retry)

### Phase 4: Dashboard API
18. Implement paginated signal list with filters
19. Implement dashboard stats endpoint
20. Implement WebSocket room scoping per org

### Phase 5: Frontend
21. Scaffold React + Vite + Tailwind + Zustand
22. Build auth pages (login, register)
23. Build sidebar + layout shell
24. Build SignalFeed with WebSocket integration
25. Build SignalCard component with urgency badges + countdown timer
26. Build SignalDetail page with ContextViewer + DecisionPanel
27. Build Agents management page
28. Build Webhooks configuration page
29. Build Analytics page with Recharts

### Phase 6: SDK
30. Create TypeScript SDK package
31. Implement BeaconClient with send + poll logic
32. Implement fluent builder
33. Implement LangChain adapter
34. Write SDK README with usage examples

### Phase 7: Finalization
35. Write Jest unit tests for: signal ingestion, urgency calculator, timeout job, resolution delivery
36. Write integration tests for core API flows
37. Write docker-compose.yml
38. Write root README.md with quickstart

---

## 9. ACCEPTANCE CRITERIA

The project is complete when all of the following work end-to-end:

1. An agent calls `beacon.sos(...)` and the signal appears on the dashboard within 1 second
2. A Slack message is delivered within 5 seconds of signal receipt
3. A human clicks an option in the dashboard and the agent's `await beacon.sos(...)` call returns the resolution
4. If no human responds in time, the agent receives a TIMED_OUT resolution with the default option
5. CRITICAL signals visually pulse on the dashboard
6. API keys can be rotated without restarting anything
7. Multiple orgs are fully isolated (no cross-org signal visibility)
8. All endpoints return proper 401 for unauthenticated requests
9. `docker-compose up` starts the entire system with no manual steps beyond `.env` setup
10. The SDK is installable via `npm install beacon-protocol-sdk` and works in a plain Node.js script

---

## 10. FUTURE EXTENSIONS (NOT in v1, but document stubs for)

- **PagerDuty integration** — high-urgency signals create PagerDuty incidents
- **Zendesk integration** — ESCALATED resolutions auto-create tickets
- **Python SDK** — `pip install beacon-protocol-sdk` for LangChain/CrewAI Python agents
- **Audit log export** — CSV/JSON export of all signals + resolutions for compliance
- **RBAC escalation chains** — define "if no response in 60s, notify manager"
- **A2A protocol bridge** — translate BEACON SOS signals into Google A2A task interrupts
- **Confidence calibration tooling** — track agent's stated vs actual confidence over time
- **Public schema registry** — host `beacon-protocol.dev` with versioned JSON schema URLs
