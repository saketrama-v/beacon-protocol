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

## 🚀 Getting Started (Production & Local)

The entire infrastructure has been containerized for a flawless 1-click boot sequence.

### Prerequisites
- Docker & Docker Compose

### 1-Click Spin Up
1. Navigate to the root directory.
2. Run the following command to spin up PostgreSQL, Redis, the Node API, and the React Dashboard:
   ```bash
   docker-compose up --build -d
   ```
3. Open your browser and navigate to the dashboard (default port `8080` if using docker, or `5173` if running locally via Vite).
4. **Login:** `neo@matrix.com` / `password123`

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
