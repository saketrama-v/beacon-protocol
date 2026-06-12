export interface SOSPacket {
  protocol_version: string;
  signal: 'SOS_INTERVENTION_REQUIRED';
  signal_id: string;
  agent_id: string;
  agent_name: string;
  agent_framework: string;
  tenant_id: string;
  timestamp: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence_score?: number;
  trigger_type: 'LOW_CONFIDENCE' | 'IRREVERSIBLE_ACTION' | 'POLICY_BOUNDARY' | 'AMBIGUOUS_INPUT' | 'TIMEOUT' | 'MANUAL';
  context_snapshot: {
    task_description: string;
    steps_taken?: {
      step_number: number;
      action: string;
      result: string;
      timestamp: string;
    }[];
    current_state: string;
    data_in_scope?: string[];
  };
  decision_needed: {
    question: string;
    options: {
      option_id: string;
      label: string;
      consequence: string;
    }[];
    default_if_timeout: string;
  };
  timeout_seconds: number;
  metadata?: {
    estimated_value_at_risk?: number;
    affected_user_id?: string;
    tags?: string[];
    custom?: Record<string, any>;
  };
}

export interface BeaconClientConfig {
  apiKey: string;
  apiUrl?: string;
  agentId: string;
  agentName: string;
  agentFramework: string;
  tenantId: string;
}
