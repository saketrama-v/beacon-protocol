#!/usr/bin/env node
/// <reference types="node" />

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from "@modelcontextprotocol/sdk/types.js";
import { BeaconClient } from "beacon-protocol-sdk";

// MCP uses stdout for JSON-RPC. Any console.log from the SDK will break the protocol.
// We must redirect all console.log output to stderr.
const originalLog = console.log;
console.log = (...args) => console.error(...args);

const API_KEY = process.env.BEACON_API_KEY;
const API_URL = process.env.BEACON_API_URL || "https://beacon-backend-3qio.onrender.com/api/v1";

if (!API_KEY) {
  console.error("Error: BEACON_API_KEY environment variable is required.");
  process.exit(1);
}

const beaconClient = new BeaconClient({
  apiKey: API_KEY,
  apiUrl: API_URL,
  agentId: "claude-desktop-mcp",
  agentName: "Claude Desktop",
  agentFramework: "custom",
  tenantId: "local-user"
});

const server = new Server(
  {
    name: "beacon-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const ASK_HUMAN_TOOL: Tool = {
  name: "ask_human_for_help",
  description: "Use this tool whenever you encounter a dangerous action, an ambiguous request, or an irreversible operation (like deleting files, sending emails, or executing arbitrary code). This tool will physically pause your execution, page a human operator on their dashboard, and wait for their explicit decision on how you should proceed. DO NOT guess if you are unsure; always ask the human.",
  inputSchema: {
    type: "object",
    properties: {
      reason: {
        type: "string",
        description: "A clear explanation of why you are pausing and asking for human help."
      },
      current_state: {
        type: "string",
        description: "What you were just about to do before pausing."
      },
      options: {
        type: "array",
        description: "A list of options for the human to choose from. ALWAYS include an 'Abort' option.",
        items: {
          type: "object",
          properties: {
            option_id: { type: "string" },
            label: { type: "string" },
            consequence: { type: "string" }
          },
          required: ["option_id", "label", "consequence"]
        }
      }
    },
    required: ["reason", "current_state", "options"]
  }
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [ASK_HUMAN_TOOL]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "ask_human_for_help") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const { reason, current_state, options } = request.params.arguments as any;

  try {
    const resolution = await beaconClient.emitSOS({
      trigger_type: "LOW_CONFIDENCE",
      context_snapshot: {
        task_description: reason,
        current_state: current_state
      },
      decision_needed: {
        question: `Agent is blocked: ${reason}`,
        options: options,
        default_if_timeout: options && options.length > 0 ? options[0].option_id : "abort" // Usually abort
      },
      timeout_seconds: 300 // 5 minutes
    });

    return {
      content: [
        {
          type: "text",
          text: `The human operator has reviewed your request. \nChosen Option: ${resolution.chosenOptionId} (${resolution.resolution})`
        }
      ]
    };

  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `BEACON Protocol SOS Emission Failed: ${error instanceof Error ? error.stack : JSON.stringify(error)}. YOU MUST ABORT YOUR CURRENT ACTION.`
        }
      ]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BEACON MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error running BEACON MCP Server:", error);
  process.exit(1);
});
