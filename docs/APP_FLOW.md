---
title: Application Flow
tags: [beacon, documentation, app-flow]
---

# 🌊 Application Flow (User Journey)

This document outlines the user journey and application flow for both the AI Agents and Human Operators using the BEACON protocol.

## 1. Agent Flow (The SOS Lifecycle)

1. **Task Execution**: Agent performs its standard operations.
2. **Trigger Condition**: Agent encounters a threshold (low confidence, irreversible action, policy boundary, etc.).
3. **Signal Emission**: Agent constructs an SOS JSON packet and POSTs it to the BEACON API (`/api/v1/signals`).
4. **Waiting State**: 
   - *Polling*: Agent polls `GET /api/v1/signals/:id/status`.
   - *WebSocket*: Agent waits for `resolution` event via WebSocket connection.
5. **Resolution Reception**: Agent receives the resolution (Approved, Rejected, Override, Escalated, or Timed Out).
6. **Continuation**: Agent executes the chosen consequence and resumes its task or halts if instructed.

## 2. Operator Flow (Dashboard Experience)

### 2.1 Authentication
- **Register**: Org Admin creates an organization and admin account.
- **Login**: Operator logs in using email and password to receive a JWT.

### 2.2 Dashboard (Main Feed)
- **Monitoring**: Operator views the live, real-time signal feed sorted by urgency.
- **Alert**: A new CRITICAL signal arrives (WebSocket `signal:new`). The UI flashes, and an audio cue plays.
- **Triage**: Operator sees the card with agent name, urgency, and countdown timer.
- **Action**: Operator clicks the signal card to view details.

### 2.3 Signal Resolution (SignalDetail View)
- **Context Gathering**: Operator reads the `task_description`, `steps_taken`, and `current_state` to understand the situation.
- **Decision Review**: Operator reads the `question` and reviews the `options` and their consequences.
- **Action**: Operator selects an option (e.g., "Approve Refund").
- **Instructions (Optional)**: Operator types a custom note to the agent.
- **Submission**: Operator clicks "Submit Resolution" (`POST /api/v1/resolutions/:signalId`).
- **Confirmation**: UI confirms resolution and redirects back to the main feed.

### 2.4 Agent Management
- **View Agents**: Operator navigates to "Agents" to see all registered agents.
- **Register Agent**: Operator adds a new agent and copies the newly generated API key to configure the agent.

### 2.5 Webhook Configuration
- **Setup Notifications**: Operator navigates to "Webhooks".
- **Add Channel**: Operator adds a Slack Webhook and configures it to only alert on HIGH and CRITICAL urgencies.

### 2.6 Analytics
- **Review Performance**: Admin navigates to "Analytics" to view average resolution time, timeout rates, and most active agents.

## 3. System Background Flow (Timeouts & Notifications)

1. **Ingestion**: Signal arrives.
2. **Notification Dispatch**: Bull queue processes notification jobs (Slack, Email).
3. **Timeout Job**: Bull queue schedules a timeout job based on `timeout_seconds`.
4. **Expiration**: If no human responds, the timeout job fires.
5. **Auto-Resolution**: System uses `default_if_timeout`, resolves the signal, and notifies the agent and dashboard.
