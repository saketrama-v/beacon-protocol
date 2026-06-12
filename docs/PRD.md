---
title: Product Requirements Document (PRD)
tags: [beacon, documentation, prd, requirements]
---

# 📋 Product Requirements Document (PRD)

## 1. PROJECT OVERVIEW

### 1.1 What Is BEACON?
BEACON is a cross-vendor, open-standard escalation layer for AI agents. It consists of two parts:
1. **The SOS Protocol**: A standardized JSON schema that any AI agent can emit when it hits a decision boundary, confidence threshold, or error state.
2. **The Universal Receiver Dashboard**: A real-time web application that ingests SOS signals from any agent, routes alerts to operators via Slack/email/webhook, and lets humans review, decide, and respond.

### 1.2 The Core Problem Being Solved
Currently, every AI agent framework handles escalation differently (LangChain uses custom callbacks, OpenAI Assistants require polling, CrewAI uses ad hoc logging, AutoGen has a proprietary input mode). There is no standard "I need help" signal that any monitoring tool can universally receive and understand. BEACON solves this by providing a unified protocol and dashboard.

## 2. THE SOS PROTOCOL SPECIFICATION

### 2.1 Signal Schema
The SOS packet contains the agent's identifier, state, confidence score, trigger type, full context snapshot, and the specific decision needed from the operator.

### 2.2 Resolution Packet
Once a human responds, the dashboard sends back a Resolution packet containing the approved/rejected action, chosen option, and optional text instructions.

### 2.3 Urgency Auto-Calculation
If the emitting agent doesn't set an urgency level, BEACON auto-calculates it based on factors such as:
- Confidence score (e.g., < 0.3 = CRITICAL)
- Estimated value at risk (e.g., > $10k = CRITICAL)
- Trigger type (e.g., IRREVERSIBLE_ACTION = HIGH)
- Tags (e.g., "pii", "financial")

## 3. ACCEPTANCE CRITERIA
1. An agent calls `beacon.sos(...)` and the signal appears on the dashboard within 1 second.
2. A Slack message is delivered within 5 seconds of signal receipt.
3. A human clicks an option in the dashboard and the agent's `await beacon.sos(...)` call returns the resolution.
4. If no human responds in time, the agent receives a TIMED_OUT resolution with the default option.
5. CRITICAL signals visually pulse on the dashboard.
6. API keys can be rotated without restarting anything.
7. Multiple orgs are fully isolated (no cross-org signal visibility).
8. All endpoints return proper 401 for unauthenticated requests.
9. `docker-compose up` starts the entire system without manual steps.
10. The SDK is installable via `npm install beacon-protocol-sdk`.
