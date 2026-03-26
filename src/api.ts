export const API_BASE_URL = 'http://localhost:8000';

export interface OnboardRequest {
  company_name: string;
  description: string;
  age_years?: number;
  company_type?: string;
  website?: string;
  linkedin_url?: string;
  twitter_handle?: string;
}

export interface TaskLog {
  log_id: string;
  task_id: string;
  company_id: string;
  event: string;
  old_status?: string;
  new_status?: string;
  agent?: string;
  message?: string;
  timestamp: string;
}

export class ApiService {
  static async onboardCompany(payload: OnboardRequest): Promise<{company_id: string; message: string}> {
    const res = await fetch(`${API_BASE_URL}/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  static async getCampaigns(companyId: string) {
    const res = await fetch(`${API_BASE_URL}/campaigns/${companyId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  static async triggerCampaign(companyId: string, notes: string = "") {
    const res = await fetch(`${API_BASE_URL}/campaigns/${companyId}/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  static async getContent(companyId: string) {
    const res = await fetch(`${API_BASE_URL}/content/${companyId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  static async getTaskLogs(companyId: string): Promise<{company_id: string, logs: TaskLog[], total: number}> {
    const res = await fetch(`${API_BASE_URL}/tasks/${companyId}/logs`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  static async getCompanies() {
    const res = await fetch(`${API_BASE_URL}/onboard/companies`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}
