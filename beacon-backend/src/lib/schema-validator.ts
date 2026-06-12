import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const sosSchema = {
  type: 'object',
  properties: {
    protocol_version: { type: 'string' },
    signal: { type: 'string', const: 'SOS_INTERVENTION_REQUIRED' },
    signal_id: { type: 'string', format: 'uuid' },
    agent_id: { type: 'string' },
    agent_name: { type: 'string' },
    agent_framework: { 
      type: 'string', 
      enum: ['langchain', 'crewai', 'autogen', 'openai_assistants', 'custom'] 
    },
    tenant_id: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    urgency: { 
      type: 'string', 
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] 
    },
    confidence_score: { type: 'number', minimum: 0, maximum: 1 },
    trigger_type: { 
      type: 'string',
      enum: ['LOW_CONFIDENCE', 'IRREVERSIBLE_ACTION', 'POLICY_BOUNDARY', 'AMBIGUOUS_INPUT', 'TIMEOUT', 'MANUAL']
    },
    context_snapshot: {
      type: 'object',
      properties: {
        task_description: { type: 'string' },
        steps_taken: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step_number: { type: 'number' },
              action: { type: 'string' },
              result: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' }
            },
            required: ['step_number', 'action', 'result']
          }
        },
        current_state: { type: 'string' },
        data_in_scope: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['task_description', 'current_state']
    },
    decision_needed: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option_id: { type: 'string' },
              label: { type: 'string' },
              consequence: { type: 'string' }
            },
            required: ['option_id', 'label', 'consequence']
          },
          minItems: 1
        },
        default_if_timeout: { type: 'string' }
      },
      required: ['question', 'options', 'default_if_timeout']
    },
    timeout_seconds: { type: 'number', minimum: 0 },
    metadata: {
      type: 'object',
      properties: {
        estimated_value_at_risk: { type: 'number' },
        affected_user_id: { type: 'string' },
        tags: {
          type: 'array',
          items: { type: 'string' }
        },
        custom: { type: 'object' }
      }
    }
  },
  required: [
    'protocol_version',
    'signal',
    'signal_id',
    'agent_id',
    'agent_name',
    'agent_framework',
    'timestamp',
    'trigger_type',
    'context_snapshot',
    'decision_needed',
    'timeout_seconds'
  ]
};

export const validateSosPacket = ajv.compile(sosSchema);
