import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { SOSPacket, BeaconClientConfig } from './types';

export class BeaconClient {
  private config: BeaconClientConfig;
  private api: AxiosInstance;

  constructor(config: BeaconClientConfig) {
    this.config = {
      apiUrl: 'http://localhost:3001/api/v1',
      ...config
    };

    this.api = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  public async emitSOS(
    packetData: Omit<SOSPacket, 'protocol_version' | 'signal' | 'signal_id' | 'agent_id' | 'agent_name' | 'agent_framework' | 'tenant_id' | 'timestamp'>
  ): Promise<{ status: string, resolution?: string, chosenOptionId?: string }> {
    const signalId = uuidv4();
    
    const packet: SOSPacket = {
      protocol_version: '1.0',
      signal: 'SOS_INTERVENTION_REQUIRED',
      signal_id: signalId,
      agent_id: this.config.agentId,
      agent_name: this.config.agentName,
      agent_framework: this.config.agentFramework,
      tenant_id: this.config.tenantId,
      timestamp: new Date().toISOString(),
      ...packetData
    };

    try {
      // 1. Ingest Signal
      const res = await this.api.post('/signals', packet);
      console.log(`[BEACON] SOS Emitted successfully. Signal ID: ${signalId}`);

      // 2. Start Long-polling to wait for resolution
      return await this.pollForResolution(signalId, packet.timeout_seconds);

    } catch (error: any) {
      console.error('[BEACON] Failed to emit SOS:', error.response?.data || error.message);
      throw new Error('BEACON Protocol SOS Emission Failed');
    }
  }

  private async pollForResolution(signalId: string, timeoutSeconds: number): Promise<{ status: string, resolution?: string, chosenOptionId?: string }> {
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    console.log(`[BEACON] Waiting for human intervention... (Timeout: ${timeoutSeconds}s)`);

    while (Date.now() - startTime < timeoutMs) {
      try {
        const res = await this.api.get(`/signals/${signalId}/status?wait=5`);
        const { status, resolution } = res.data;

        if (status !== 'PENDING') {
          console.log(`[BEACON] Intervention received! Status: ${status}`);
          return {
            status,
            resolution: resolution?.resolution,
            chosenOptionId: resolution?.chosenOptionId
          };
        }
      } catch (error) {
        // Log warning and keep polling
        console.warn(`[BEACON] Polling error for signal ${signalId}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`[BEACON] SOS Timeout reached.`);
    return { status: 'TIMED_OUT' };
  }
}
