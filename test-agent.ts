import { BeaconClient } from './beacon-sdk/src';

async function run() {
  // Initialize the SDK with dummy Agent details
  const client = new BeaconClient({
    apiUrl: 'http://localhost:3001/api/v1',
    apiKey: 'beac_test_key_123', // Automatically generated in seed
    agentId: 'agent_007',
    agentName: 'DataScraper-GPT',
    agentFramework: 'langchain',
    tenantId: 'tenant_123'
  });

  console.log('🤖 Agent running...');
  console.log('🤖 Encountered an ambiguous situation. Pausing execution and asking human for help...');

  try {
    // Fire the SOS to the BEACON protocol
    const result = await client.emitSOS({
      trigger_type: 'AMBIGUOUS_INPUT',
      context_snapshot: {
        task_description: 'Scraping financial records for user ABC',
        current_state: 'Found a file named "confidential_passwords.txt". Unsure if I should read it.'
      },
      decision_needed: {
        question: 'Should I process this confidential file?',
        options: [
          { option_id: 'ignore', label: 'Ignore File', consequence: 'Agent skips the file and continues normal operations.' },
          { option_id: 'process', label: 'Process File', consequence: 'Agent parses the file (HIGH RISK).' },
          { option_id: 'abort', label: 'Abort Task', consequence: 'Agent completely stops the scraping job.' }
        ],
        default_if_timeout: 'ignore'
      },
      timeout_seconds: 120 // 2 minutes before it defaults to 'ignore'
    });

    console.log('✅ Received resolution from human/dashboard:', result);
    
    if (result.status === 'TIMED_OUT') {
      console.log('⏰ Human took too long. Proceeding with default action: ignore.');
    } else {
      console.log(`🚀 Resuming execution based on human decision: ${result.chosenOptionId}`);
    }

  } catch (error) {
    console.error('Failed to communicate with BEACON:', error);
  }
}

run();
