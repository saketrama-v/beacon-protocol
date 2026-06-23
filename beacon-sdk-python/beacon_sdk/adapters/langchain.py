from typing import Any, Optional, Type
from pydantic import BaseModel, Field

try:
    from langchain_core.tools import BaseTool
except ImportError:
    BaseTool = object  # Fallback if langchain isn't installed

from ..client import BeaconClient

class BeaconToolInput(BaseModel):
    query: str = Field(description="A description of what you are stuck on, or what permission you need.")
    context: str = Field(description="The current state or file/data you are looking at.")

class BeaconLangChainTool(BaseTool):
    name: str = "ask_human_for_help"
    description: str = (
        "Use this tool when you are stuck, confused, about to make a destructive action, "
        "or encounter a policy violation. It will pause your execution and ask a human for a decision."
    )
    args_schema: Type[BaseModel] = BeaconToolInput
    client: Any = None  # BeaconClient instance

    def __init__(self, client: BeaconClient, **kwargs):
        super().__init__(**kwargs)
        self.client = client

    def _run(self, query: str, context: str) -> str:
        try:
            result = self.client.emit_sos({
                "trigger_type": "MANUAL",
                "context_snapshot": {
                    "task_description": "Agent requested human help via LangChain tool",
                    "current_state": context
                },
                "decision_needed": {
                    "question": query,
                    "options": [
                        {"option_id": "approve", "label": "Approve / Proceed", "consequence": "Agent will proceed with the action"},
                        {"option_id": "abort", "label": "Abort / Stop", "consequence": "Agent will stop execution"}
                    ],
                    "default_if_timeout": "abort"
                },
                "timeout_seconds": 300
            })

            if result.get("status") == "TIMED_OUT":
                return "Human did not respond in time. Default action taken: abort. You should stop what you are doing."

            chosen = result.get("chosen_option_id")
            resolution = result.get("resolution", "")

            if chosen == "abort":
                return f"Human decided to abort. Do not proceed with the action. Instructions: {resolution}"

            return f"Human approved. Instructions: {resolution}"

        except Exception as e:
            return f"Failed to contact human. Error: {str(e)}"
