import { BeaconClient } from '../client';

export class BeaconLangChainTool {
  private client: BeaconClient;
  public name = 'ask_human_for_help';
  public description = 'Use this tool when you are stuck, confused, about to make a destructive action, or encounter a policy violation. It will pause your execution and ask a human for a decision.';

  constructor(client: BeaconClient) {
    this.client = client;
  }

  public async call(input: string): Promise<string> {
    try {
      // In a real implementation, the input might be a JSON string parsed to get context and question.
      // For simplicity, we assume input is the question.
      const result = await this.client.emitSOS({
        trigger_type: 'MANUAL',
        context_snapshot: {
          task_description: 'Agent requested human help via LangChain tool',
          current_state: 'Paused waiting for human input'
        },
        decision_needed: {
          question: input,
          options: [
            { option_id: 'approve', label: 'Approve / Proceed', consequence: 'Agent will proceed with the action' },
            { option_id: 'abort', label: 'Abort / Stop', consequence: 'Agent will stop execution' }
          ],
          default_if_timeout: 'abort'
        },
        timeout_seconds: 300
      });

      if (result.status === 'TIMED_OUT') {
        return `Human did not respond in time. Default action taken: abort. You should stop what you are doing.`;
      }

      if (result.chosenOptionId === 'abort') {
        return `Human decided to abort. Do not proceed with the action. Instructions: ${result.resolution}`;
      }

      return `Human approved. Instructions: ${result.resolution}`;
    } catch (error: any) {
      return `Failed to contact human. Error: ${error.message}`;
    }
  }
}
