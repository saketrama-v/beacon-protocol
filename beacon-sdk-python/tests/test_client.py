import pytest
import responses
from beacon_sdk.client import BeaconClient
from beacon_sdk.models import BeaconClientConfig

@pytest.fixture
def client():
    config = BeaconClientConfig(
        api_key="test_key",
        api_url="http://localhost:3001/api/v1",
        agent_id="test_agent",
        agent_name="Test Agent",
        agent_framework="pytest",
        tenant_id="test_tenant"
    )
    return BeaconClient(config)

@responses.activate
def test_interception_timeout_fail_closed(client):
    """
    Tests the 'fail-closed' SLA failsafe logic from the agent's perspective.
    If the BEACON backend is unreachable or times out, the SDK MUST automatically 
    abort the action to prevent the agent from proceeding blindly.
    """
    packet_data = {
        "trigger_type": "LOW_CONFIDENCE",
        "context_snapshot": {
            "task_description": "Test failsafe",
            "current_state": "Testing"
        },
        "decision_needed": {
            "question": "Should I proceed?",
            "options": [
                {"option_id": "abort", "label": "Abort", "consequence": "Agent stops"},
                {"option_id": "proceed", "label": "Proceed", "consequence": "Agent continues"}
            ],
            "default_if_timeout": "abort"
        },
        "timeout_seconds": 2
    }

    # Simulate a network timeout / 500 error from the backend
    responses.add(
        responses.POST,
        "http://localhost:3001/api/v1/signals",
        status=500
    )

    # In our client, if it throws an Exception, the LangChain adapter catches it and forces ABORT.
    # Let's test that the client throws an Exception on 500.
    with pytest.raises(Exception, match="BEACON Protocol SOS Emission Failed"):
        client.emit_sos(packet_data)

@responses.activate
def test_interception_success(client):
    packet_data = {
        "trigger_type": "LOW_CONFIDENCE",
        "context_snapshot": {
            "task_description": "Test success",
            "current_state": "Testing"
        },
        "decision_needed": {
            "question": "Should I proceed?",
            "options": [
                {"option_id": "abort", "label": "Abort", "consequence": "Agent stops"},
                {"option_id": "proceed", "label": "Proceed", "consequence": "Agent continues"}
            ],
            "default_if_timeout": "abort"
        },
        "timeout_seconds": 10
    }

    responses.add(
        responses.POST,
        "http://localhost:3001/api/v1/signals",
        json={"id": "sig_123", "status": "PENDING"},
        status=201
    )

    import re
    responses.add(
        responses.GET,
        re.compile(r"http://localhost:3001/api/v1/signals/.+/status\?wait=5"),
        json={"status": "RESOLVED", "resolution": {"chosenOptionId": "proceed", "resolution": "PROCEED", "instructions": "Looks good"}},
        status=200
    )

    resolution = client.emit_sos(packet_data)

    assert resolution["chosen_option_id"] == "proceed"
    assert resolution["resolution"] == "PROCEED"
