<div align="center">
  <h1>🚨 BEACON Protocol</h1>
  <p><b>Breakpoint Execution And Contextual Oversight Network</b></p>
  
  [![Build Status](https://img.shields.io/github/actions/workflow/status/saketrama-v/beacon-protocol/ci.yml?branch=main&style=for-the-badge)](https://github.com/saketrama-v/beacon-protocol/actions)
  [![PyPI - Version](https://img.shields.io/pypi/v/beacon-protocol-sdk?color=blue&style=for-the-badge)](https://pypi.org/project/beacon-protocol-sdk/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-success?style=for-the-badge&logo=nodedotjs)](https://nodejs.org)
  [![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
</div>

<br/>

**BEACON** is an enterprise-grade safety protocol designed to prevent autonomous AI agents from executing dangerous, ambiguous, or highly impactful actions without human oversight.

When an AI Agent detects it is about to violate a policy or take an irreversible action, the BEACON Protocol physically **pauses** the agent's execution, captures its entire context (memory, plan, targeted data), and pages a human operator via the real-time BEACON Dashboard. The human can review the exact context and decide whether to **Approve**, **Abort**, or **Modify** the action.

> [!CAUTION]
> **The Cooperative Safety Caveat**
> BEACON is a cooperative safety layer, not a hard execution sandbox or hypervisor kill-switch. It relies on the agent invoking the SDK tool when it encounters an ambiguous policy boundary. If a deeply compromised LLM explicitly decides to skip tool invocation and execute rogue code directly, BEACON cannot intercept it. BEACON does not substitute for strict infrastructure sandboxing (e.g., Docker/gVisor).

---

## ✨ Core Features
- **⏸️ Execution Freezing:** Instantly halt LangChain, CrewAI, or AutoGen execution threads.
- **⚡ Live WebSockets:** Real-time bi-directional SOS broadcasting to a central dashboard.
- **🏢 Multi-Tenant:** JIT (Just-In-Time) provisioning isolates organizations and API Keys.
- **🛡️ Fail-Closed SLA Failsafes:** If a human does not respond within a specific timeout, the protocol forces the AI to securely abort the action. (Verify the logic in [`timeout.job.ts`](file:///beacon-backend/src/jobs/timeout.job.ts) and our test suites).

---

## 🏗️ System Architecture

The protocol is split into 4 resilient components:

1. **The Backend (`/beacon-backend`)**: A robust Node.js + Express API backed by PostgreSQL and Prisma. Handles real-time WebSocket broadcasting and handles Just-in-Time agent provisioning.
2. **The Dashboard (`/beacon-dashboard`)**: A beautiful, real-time React + Vite UI styled with a custom Matrix-themed Tailwind system. Allows human operators to monitor live anomalies and resolve them instantly.
3. **Python SDK (`beacon-protocol-sdk`)**: A pip-installable SDK leveraging Pydantic to securely pause Python agents (like CrewAI or LangChain).
4. **Node SDK (`/beacon-sdk`)**: An npm-installable SDK for TypeScript/JavaScript agents.

```mermaid
graph TD
    A[Autonomous AI Agent] -->|Tool Invocation| B[BEACON SDK]
    B -->|Encrypted SOS Packet| C[BEACON Node.js Backend]
    C -->|WebSocket Stream| D[BEACON React Dashboard]
    D -->|Human Review| D
    D -->|Resolution POST| C
    C -->|Webhook/Polling| B
    B -->|Inject Decision| A
    style A fill:#2e3440,stroke:#88c0d0,stroke-width:2px,color:white
    style B fill:#bf616a,stroke:#3b4252,stroke-width:2px,color:white
    style C fill:#4c566a,stroke:#a3be8c,stroke-width:2px,color:white
    style D fill:#3b4252,stroke:#ebcb8b,stroke-width:2px,color:white
```

---

## 🔌 Integrating BEACON into your AI Projects

BEACON was designed to be deeply integrated into the "Toolkit" of your existing AI agents.

### Python Agents (LangChain, CrewAI, AutoGen)
The easiest way to integrate BEACON is to install the official SDK from PyPI.

**1. Install the SDK**
```bash
pip install beacon-protocol-sdk
```
*(If you are using LangChain or CrewAI, run `pip install beacon-protocol-sdk[langchain]`)*

**2. Inject the BEACON Tool into your Agent's prompt:**
```python
from beacon_sdk.client import BeaconClient, BeaconClientConfig
from beacon_sdk.adapters.langchain import BeaconLangChainTool

# Initialize connection to your BEACON Server
client = BeaconClient(BeaconClientConfig(
    api_key="your_api_key", # Get this from your BEACON Dashboard
    api_url="https://beacon-backend-qloq.onrender.com/api/v1",
    agent_id="my_finance_agent",
    agent_name="FinanceGPT",
    agent_framework="langchain",
    tenant_id="default"
))

# Provide the tool to the LLM (or CrewAI Agent)
ask_human_tool = BeaconLangChainTool(client=client)
tools = [ask_human_tool, search_tool, database_tool]

# The LLM will now autonomously call `ask_human_for_help` when it gets stuck!
```

### Node.js / TypeScript Agents

**1. Install the SDK**
```bash
npm install beacon-protocol-sdk
```

**2. Initialize and bind to your agent:**
```typescript
import { BeaconClient } from 'beacon-protocol-sdk';
import { BeaconLangChainTool } from 'beacon-protocol-sdk/adapters/langchain';

const client = new BeaconClient({
  apiUrl: 'https://beacon-backend-qloq.onrender.com/api/v1',
  apiKey: 'your_api_key', // Get this from your BEACON Dashboard
  agentId: 'node_agent_1',
  agentName: 'NodeGPT',
  agentFramework: 'langchain',
  tenantId: 'default'
});

const askHumanTool = new BeaconLangChainTool(client);
const tools = [askHumanTool];
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Docker & Docker Compose
- Node.js v18+
- Python 3.9+
- A free account at [Clerk.com](https://clerk.com) for authentication.

### 2. Environment Configuration
You must create `.env` files in both the dashboard and backend directories.

**`beacon-dashboard/.env`**:
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=pk_test_... # Get this from Clerk Dashboard
```

**`beacon-backend/.env`**:
```env
PORT=3001
DATABASE_URL="postgresql://beacon_user:beacon_password@localhost:5432/beacon?schema=public"
REDIS_URL="redis://localhost:6379" # Optional: For timeout processing
CLERK_SECRET_KEY=sk_test_... # Get this from Clerk Dashboard
CORS_ORIGIN="http://localhost:5173"
```

### 3. Start the Infrastructure (Database)
```bash
docker-compose up -d
```

### 4. Boot the Services
Open two separate terminals:

**Terminal 1: Backend**
```bash
cd beacon-backend
npm install
npx prisma db push
npm run dev
```

**Terminal 2: Dashboard**
```bash
cd beacon-dashboard
npm install
npm run dev
```

### 5. Multitenant Testing
1. Open `http://localhost:5173` and register a new account via Clerk.
2. The backend will intercept your first login, dynamically provision an **Organization** for you, and generate a **Default Agent**.
3. Navigate to the **Settings** page in the dashboard and click to copy your **API Key**.
4. Open `beacon-agent-example/main.py` and replace the `api_key="..."` field with your copied API Key.
5. Run the Python agent (`python main.py`) to trigger an anomaly that routes securely and exclusively to your dashboard!

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
