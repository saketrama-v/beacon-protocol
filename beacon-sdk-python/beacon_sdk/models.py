from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field

class ContextSnapshot(BaseModel):
    task_description: str
    steps_taken: Optional[List[Dict[str, Any]]] = None
    current_state: str
    data_in_scope: Optional[List[str]] = None

class DecisionOption(BaseModel):
    option_id: str
    label: str
    consequence: str

class DecisionNeeded(BaseModel):
    question: str
    options: List[DecisionOption]
    default_if_timeout: str

class Metadata(BaseModel):
    estimated_value_at_risk: Optional[float] = None
    affected_user_id: Optional[str] = None
    tags: Optional[List[str]] = None
    custom: Optional[Dict[str, Any]] = None

class SOSPacket(BaseModel):
    protocol_version: str = "1.0"
    signal: Literal["SOS_INTERVENTION_REQUIRED"] = "SOS_INTERVENTION_REQUIRED"
    signal_id: str
    agent_id: str
    agent_name: str
    agent_framework: str
    tenant_id: str
    timestamp: str
    urgency: Optional[Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]] = None
    confidence_score: Optional[float] = None
    trigger_type: Literal[
        "LOW_CONFIDENCE", "IRREVERSIBLE_ACTION", "POLICY_BOUNDARY", "AMBIGUOUS_INPUT", "TIMEOUT", "MANUAL"
    ]
    context_snapshot: ContextSnapshot
    decision_needed: DecisionNeeded
    timeout_seconds: int
    metadata: Optional[Metadata] = None

class BeaconClientConfig(BaseModel):
    api_key: str
    api_url: str = "http://localhost:3001/api/v1"
    agent_id: str
    agent_name: str
    agent_framework: str
    tenant_id: str
