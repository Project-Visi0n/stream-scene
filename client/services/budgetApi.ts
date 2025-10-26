// client/services/budgetApi.ts
const API_BASE = '/api/budget';

export interface BudgetEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  project_id?: string;
  receipt_title?: string;
  ocr_scanned?: boolean;
  ocr_confidence?: number;
  tags?: string[];
  user_id: number;
  created_at?: string;
  updated_at?: string;
  project?: BudgetProject;
}

export interface BudgetProject {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  tags?: string[];
  user_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBudgetEntry {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  project_id?: string;
  receipt_title?: string;
  ocr_scanned?: boolean;
  ocr_confidence?: number;
  tags?: string[];
}

export interface CreateBudgetProject {
  name: string;
  description?: string;
  color?: string;
  is_active?: boolean;
  tags?: string[];
}

class BudgetApiService {
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  // Entries
  async getEntries(): Promise<BudgetEntry[]> {
    const response = await this.fetchWithAuth(`${API_BASE}/entries`);
    return response.json();
  }

  async createEntry(entry: CreateBudgetEntry): Promise<BudgetEntry> {
    const response = await this.fetchWithAuth(`${API_BASE}/entries`, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
    return response.json();
  }

  async updateEntry(id: string, entry: Partial<CreateBudgetEntry>): Promise<BudgetEntry> {
    const response = await this.fetchWithAuth(`${API_BASE}/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
    return response.json();
  }

  async deleteEntry(id: string): Promise<void> {
    await this.fetchWithAuth(`${API_BASE}/entries/${id}`, {
      method: 'DELETE',
    });
  }

  // Projects
  async getProjects(): Promise<BudgetProject[]> {
    const response = await this.fetchWithAuth(`${API_BASE}/projects`);
    return response.json();
  }

  async createProject(project: CreateBudgetProject): Promise<BudgetProject> {
    const response = await this.fetchWithAuth(`${API_BASE}/projects`, {
      method: 'POST',
      body: JSON.stringify(project),
    });
    return response.json();
  }

  async updateProject(id: string, project: Partial<CreateBudgetProject>): Promise<BudgetProject> {
    const response = await this.fetchWithAuth(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
    return response.json();
  }

  async deleteProject(id: string): Promise<void> {
    await this.fetchWithAuth(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Legacy compatibility methods
  async getIncome(): Promise<BudgetEntry[]> {
    const response = await this.fetchWithAuth(`${API_BASE}/income`);
    return response.json();
  }

  async getExpenses(): Promise<BudgetEntry[]> {
    const response = await this.fetchWithAuth(`${API_BASE}/expense`);
    return response.json();
  }
}

export const budgetApi = new BudgetApiService();