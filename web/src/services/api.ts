const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown Error')
    throw new Error(`HTTP Error ${response.status}: ${errorText}`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return response.text() as unknown as T
}

export async function fetchWithFallback<T>(endpoint: string, fallback: T, options?: RequestInit): Promise<T> {
  try {
    return await request<T>(endpoint, options)
  } catch (error) {
    console.warn(`[API Client] Failed fetching ${endpoint}, using fallback context.`, error)
    return fallback
  }
}

export interface HealthResponse {
  ok: boolean
  service: string
  apiVersion: string
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    return fetchWithFallback<HealthResponse>('/health', {
      ok: false,
      service: 'infrasight',
      apiVersion: 'v1',
    })
  },

  async getSnapshot<T = any>(fallback: T): Promise<T> {
    return fetchWithFallback<T>('/snapshot', fallback)
  },

  async getPricing<T = any>(): Promise<T> {
    return fetchWithFallback<T>('/pricing', {} as T)
  },

  async getActions<T = any[]>(): Promise<T> {
    return fetchWithFallback<T>('/actions', [] as unknown as T)
  },

  async saveAction<T = any>(action: T): Promise<T> {
    return request<T>('/actions', {
      method: 'POST',
      body: JSON.stringify(action),
    })
  },

  async updateActionState(id: string, state: string): Promise<{ ok: boolean; state: string }> {
    return request<{ ok: boolean; state: string }>(`/actions/${id}/state`, {
      method: 'PATCH',
      body: JSON.stringify({ state }),
    })
  },

  async getObservability<T = any[]>(): Promise<T> {
    return fetchWithFallback<T>('/observability', [] as unknown as T)
  },

  async getPolicies<T = any[]>(): Promise<T> {
    return fetchWithFallback<T>('/policies', [] as unknown as T)
  },

  async savePolicy(payload: Record<string, any>): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/policies', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async getScore<T = any>(): Promise<T> {
    return fetchWithFallback<T>('/score', {} as T)
  },

  async getDrift<T = any>(): Promise<T> {
    return fetchWithFallback<T>('/drift', {} as T)
  },

  async getPlans<T = any[]>(): Promise<T> {
    return fetchWithFallback<T>('/plans', [] as unknown as T)
  },

  async savePlan<T = any>(plan: T): Promise<T> {
    return request<T>('/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    })
  },

  async getRunbooks<T = any[]>(): Promise<T> {
    return fetchWithFallback<T>('/runbooks', [] as unknown as T)
  },

  async saveRunbook<T = any>(runbook: T): Promise<T> {
    return request<T>('/runbooks', {
      method: 'POST',
      body: JSON.stringify(runbook),
    })
  },

  async getTopologyLayout<T = any>(id: string): Promise<T> {
    return fetchWithFallback<T>(`/topology/layout/${id}`, { id, positions: {} } as unknown as T)
  },

  async saveTopologyLayout<T = any>(id: string, layout: T): Promise<T> {
    return request<T>(`/topology/layout/${id}`, {
      method: 'POST',
      body: JSON.stringify(layout),
    })
  },

  getReportUrl(): string {
    return `${API_BASE_URL}/report.md`
  },
}

