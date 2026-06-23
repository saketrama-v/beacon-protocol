import time
import uuid
import requests
from datetime import datetime
from typing import Dict, Any, Optional

from .models import BeaconClientConfig, SOSPacket

class BeaconClient:
    def __init__(self, config: BeaconClientConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            "x-api-key": self.config.api_key,
            "Content-Type": "application/json"
        })

    def emit_sos(self, packet_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Emits an SOS signal to the BEACON protocol and blocks execution while
        waiting for human intervention.
        """
        signal_id = str(uuid.uuid4())
        
        # Merge the user packet data with the auto-injected fields
        full_packet_data = {
            "signal_id": signal_id,
            "agent_id": self.config.agent_id,
            "agent_name": self.config.agent_name,
            "agent_framework": self.config.agent_framework,
            "tenant_id": self.config.tenant_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            **packet_data
        }
        
        # Validate and serialize using Pydantic
        packet = SOSPacket(**full_packet_data)
        
        try:
            # 1. Ingest Signal
            url = f"{self.config.api_url}/signals"
            response = self.session.post(url, data=packet.model_dump_json(exclude_none=True))
            response.raise_for_status()
            
            print(f"[BEACON] SOS Emitted successfully. Signal ID: {signal_id}")

            # 2. Start Long-polling to wait for resolution
            return self._poll_for_resolution(signal_id, packet.timeout_seconds)

        except requests.RequestException as e:
            error_details = e.response.text if e.response else str(e)
            print(f"[BEACON] Failed to emit SOS: {error_details}")
            raise Exception("BEACON Protocol SOS Emission Failed")

    def _poll_for_resolution(self, signal_id: str, timeout_seconds: int) -> Dict[str, Any]:
        start_time = time.time()
        
        print(f"[BEACON] Waiting for human intervention... (Timeout: {timeout_seconds}s)")

        while (time.time() - start_time) < timeout_seconds:
            try:
                # Use the wait query param to utilize backend's polling efficiency
                url = f"{self.config.api_url}/signals/{signal_id}/status?wait=5"
                response = self.session.get(url, timeout=10) # 10s request timeout
                response.raise_for_status()
                
                data = response.json()
                status = data.get("status")
                resolution_data = data.get("resolution")

                if status != "PENDING":
                    print(f"[BEACON] Intervention received! Status: {status}")
                    return {
                        "status": status,
                        "resolution": resolution_data.get("resolution") if resolution_data else None,
                        "chosen_option_id": resolution_data.get("chosenOptionId") if resolution_data else None
                    }
            except requests.RequestException:
                print(f"[BEACON] Polling error for signal {signal_id}. Retrying...")
                time.sleep(2)
                
        print("[BEACON] SOS Timeout reached.")
        return {"status": "TIMED_OUT"}
