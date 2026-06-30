import os
import sys
import time
sys.path.append(os.path.join(os.path.dirname(__file__), 'beacon-sdk-python'))
from beacon_sdk.client import BeaconClient
from beacon_sdk.models import ContextSnapshot, DecisionNeeded, DecisionOption, BeaconClientConfig

# Setup the config
# Make sure to replace api_url with your actual Render URL and api_key with your key!
config = BeaconClientConfig(
    api_key="bd244238-21a8-4e79-a7a8-ca175a80c9e4",
    api_url="https://beacon-backend-qloq.onrender.com/api/v1",
    agent_id="agent_007",
    agent_name="DevOps Automator",
    agent_framework="custom",
    tenant_id="tenant_123"
)

client = BeaconClient(config)

def run():
    print("🤖 Agent execution paused. Ambiguous intent detected.")
    print("🚨 Emitting SOS Signal to BEACON Protocol...")
    
    try:
        # emit_sos inherently blocks and polls for resolution
        resolution = client.emit_sos({
            "trigger_type": "IRREVERSIBLE_ACTION",
            "context_snapshot": ContextSnapshot(
                task_description="User asked to clear system logs.",
                current_state="Prepared command: rm -rf /var/lib/postgresql/data",
                data_in_scope=["/var/lib/postgresql/data"]
            ).model_dump(),
            "decision_needed": DecisionNeeded(
                question="Should I proceed with executing this deletion command?",
                options=[
                    DecisionOption(option_id="approve", label="Approve (Safe)", consequence="Will delete the database volume!"),
                    DecisionOption(option_id="abort", label="Abort Action", consequence="Command will not be executed.")
                ],
                default_if_timeout="abort"
            ).model_dump(),
            "timeout_seconds": 300,
            "confidence_score": 0.15
        })
        
        print("\n🧑‍💻 Human responded!")
        print(f"Resolution Status: {resolution['status']}")
        if resolution.get('resolution'):
            print(f"Resolution Action: {resolution['resolution']}")
            
            if resolution['resolution'] == 'abort':
                print("🛑 Aborting action as instructed by human oversight.")
            else:
                print("✅ Proceeding with execution...")
                
    except Exception as e:
        print(f"❌ Error emitting SOS: {e}")

if __name__ == "__main__":
    run()
