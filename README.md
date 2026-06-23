# BEACON Protocol 🚨

**BEACON** (Breakpoint Execution And Contextual Oversight Network) is an enterprise-grade safety protocol designed to prevent autonomous AI agents from executing dangerous, ambiguous, or highly impactful actions without human oversight.

When an AI Agent detects it is about to violate a policy or take an irreversible action, the BEACON Protocol pauses the agent's execution, captures its entire context (memory, plan, targeted data), and pages a human operator via the real-time BEACON Dashboard. The human can review the exact context and decide whether to **Approve**, **Abort**, or **Modify** the action.

---

## 🏗️ System Architecture

The protocol is split into 4 resilient components:
1. **The Backend (`/beacon-backend`)**: A robust Node.js + Express API backed by PostgreSQL and Prisma. Handles real-time WebSocket broadcasting and uses Redis Bull queues to enforce strict SLAs (e.g., automatically aborting an action if a human doesn't respond in 5 minutes).
2. **The Dashboard (`/beacon-dashboard`)**: A beautiful, real-time React + Vite UI styled with a custom Matrix-themed Tailwind system. Allows human operators to monitor live anomalies and resolve them instantly.
3. **Python SDK (`/beacon-sdk-python`)**: A pip-installable SDK leveraging Pydantic and `requests` to securely pause Python agents (like CrewAI or LangChain).
4. **Node SDK (`/beacon-sdk`)**: An npm-installable SDK for TypeScript/JavaScript agents.

---

### 🏗️ 2. Core Architecture
- **Backend**: Node.js, Express, Prisma (PostgreSQL), Redis.
- **Frontend**: React (Vite), Framer Motion, TailwindCSS, Clerk Auth.
- **Communication**: REST API + WebSockets for real-time SOS broadcasting.
- **Security**: 
  - **Identity**: @clerk/clerk-sdk-node validates cryptographically signed JWTs via remote JWKS.
  - **Multitenancy**: JIT (Just-In-Time) provisioning automatically isolates new users into distinct Organizations with unique `API Keys`.

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
REDIS_URL="redis://localhost:6379"
CLERK_SECRET_KEY=sk_test_... # Get this from Clerk Dashboard
CORS_ORIGIN="http://localhost:5173"
```

### 3. Start the Infrastructure (Database & Cache)
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

## 🔌 How to integrate BEACON into your AI Projects

BEACON was designed to be deeply integrated into the "Toolkit" of your existing AI agents.

### Python Agents (LangChain, CrewAI, AutoGen)
1. In your Python project, install the BEACON SDK:
   ```bash
   # If installing from local path:
   pip install -e /path/to/Beacon_Protocol/beacon-sdk-python[langchain]
   ```
2. Inject the BEACON Tool into your Agent's prompt:
   ```python
   from beacon_sdk.client import BeaconClient, BeaconClientConfig
   from beacon_sdk.adapters.langchain import BeaconLangChainTool
   
   # Initialize connection to your BEACON Server
   client = BeaconClient(BeaconClientConfig(
       api_key="your_api_key",
       api_url="http://localhost:3001/api/v1",
       agent_id="my_finance_agent",
       agent_name="FinanceGPT",
       agent_framework="langchain",
       tenant_id="default"
   ))
   
   # Provide the tool to the LLM
   ask_human_tool = BeaconLangChainTool(client=client)
   tools = [ask_human_tool, search_tool, database_tool]
   
   # The LLM will now autonomously call `ask_human_for_help` when it gets stuck!
   ```

### Node.js / TypeScript Agents
1. In your Node project, install the SDK:
   ```bash
   npm install /path/to/Beacon_Protocol/beacon-sdk
   ```
2. Initialize and bind to your agent:
   ```typescript
   import { BeaconClient, BeaconLangChainTool } from 'beacon-protocol-sdk';

   const client = new BeaconClient({
     apiUrl: 'http://localhost:3001/api/v1',
     apiKey: 'your_api_key',
     agentId: 'node_agent_1',
     agentName: 'NodeGPT',
     agentFramework: 'langchain',
     tenantId: 'default'
   });

   const askHumanTool = new BeaconLangChainTool(client);
   const tools = [askHumanTool];
   ```

---

## 🛡️ Default Safety Failsafes
If the BEACON Server crashes, or if the human operator does not respond within the defined SLA Timeout (e.g., 5 minutes), the SDK will automatically force the agent to **ABORT** the critical action. Fail-closed safety is guaranteed.
