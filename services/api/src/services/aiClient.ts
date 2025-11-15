import axios from 'axios';
import { config } from '../config';

export class AIClient {
  async explainFunnel(workflowId: string, data: Record<string, unknown>) {
    return axios.post(`${config.aiAgent.url}/explain-funnel`, {
      workflowId,
      ...data,
    });
  }

  async getAnomalies(workflowId: string, data: Record<string, unknown>) {
    return axios.post(`${config.aiAgent.url}/anomalies`, {
      workflowId,
      ...data,
    });
  }
}

export const aiClient = new AIClient();
