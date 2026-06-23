import os
import sys

# Ensure beacon_sdk can be imported even if not installed via pip yet
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "beacon-sdk-python")))

from beacon_sdk.client import BeaconClient
from beacon_sdk.models import BeaconClientConfig
from beacon_sdk.adapters.langchain import BeaconLangChainTool


def main():
    print("Initializing Python Data Agent...")
    
    # 1. Initialize BEACON Client
    config = BeaconClientConfig(
        api_url="http://localhost:3001/api/v1",
        api_key="0d0366d0-ada7-48cf-b63c-74ca2ab7ba25", # Seeded API key
        agent_id="py_agent_001",
        agent_name="Python-Data-Scraper",
        agent_framework="langchain",
        tenant_id="tenant_123"
    )
    beacon_client = BeaconClient(config)

    # 2. Initialize the LangChain Tool
    ask_human_tool = BeaconLangChainTool(client=beacon_client)

    # In a real LangChain setup, you would bind this tool to an LLM:
    # llm = ChatOpenAI(...)
    # agent = create_tool_calling_agent(llm, [ask_human_tool], prompt)
    
    print("Agent Task: Analyze user records in database.")
    print("Parsing tables... found table 'admin_passwords'.")
    print("Warning: Accessing this table might violate safety policies.")
    print("Tool Decision: Calling 'ask_human_for_help' tool...\n")

    # 3. Simulate the LLM invoking the tool
    tool_result = ask_human_tool.invoke({
        "query": "I found a table named 'admin_passwords'. Should I proceed to read and summarize it?",
        "context": "Database schema: [users, logs, admin_passwords]"
    })

    print(f"\nAgent received result from tool: {tool_result}")
    
    if "abort" in tool_result.lower():
        print("Agent safely aborting the task.")
    else:
        print("Agent proceeding to read the table...")

if __name__ == "__main__":
    main()
