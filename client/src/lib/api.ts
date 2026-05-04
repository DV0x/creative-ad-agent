// API client with authentication support
import { IS_AUTH_ENABLED } from './auth';
import type { Campaign, CampaignFile, CampaignFileType, AssetFolder, AssetFile } from '@/store';
import type { ChatMessage, CampaignStatus, FilesReadyState, HookType } from '@/types/chat';

// Token getter that can be set by the ClerkProvider wrapper
let tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

export async function getAuthToken(): Promise<string | null> {
  if (!IS_AUTH_ENABLED || !tokenGetter) return null;
  return tokenGetter();
}

// Base fetch function with auth
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (IS_AUTH_ENABLED && tokenGetter) {
    const token = await tokenGetter();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// Type Transformers (API snake_case -> store camelCase)
// ============================================

interface ApiCampaign {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  status: CampaignStatus;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiCampaignFile {
  id: string;
  campaign_id: string;
  file_type: CampaignFileType;
  content: string;
  created_at: string;
  updated_at: string;
}

interface ApiImage {
  id: number;
  campaign_id: string;
  image_index: number;
  hook_type: HookType;
  prompt: string;
  file_path: string;
  version: number;
  created_at: string;
}

interface ApiMessage {
  id: string;
  campaign_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_refs: string | null;
  file_refs: string | null;
  blocks: string | null;  // JSON array of MessageBlock
  created_at: string;
}

interface ApiFolder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  fileCount?: number;
}

interface ApiAssetFile {
  id: string;
  folder_id: string;
  name: string;
  file_path: string;
  file_type: 'image' | 'document' | 'other';
  size: number | null;
  created_at: string;
}

function transformCampaign(
  api: ApiCampaign,
  files: ApiCampaignFile[],
  images: ApiImage[],
  _messages: ApiMessage[]
): Campaign {
  // Build filesReady state from which files have content
  const filesReady: FilesReadyState = {
    research: false,
    hooks: false,
    prompts: false,
  };

  const campaignFiles: CampaignFile[] = (['research', 'hooks', 'prompts'] as CampaignFileType[]).map(type => {
    const file = files.find(f => f.file_type === type);
    const content = file?.content || '';
    if (content.trim()) {
      filesReady[type] = true;
    }
    return {
      type,
      name: `${type}.md`,
      content,
      lastModified: file ? new Date(file.updated_at) : new Date(api.created_at),
    };
  });

  return {
    id: api.id,
    name: api.name,
    brand: api.brand ?? null,
    createdAt: new Date(api.created_at),
    status: api.status,
    filesReady,
    files: campaignFiles,
    images: images.map(img => ({
      id: img.image_index,
      url: img.file_path,
      prompt: img.prompt,
      hookType: img.hook_type,
      version: img.version,
    })),
    sessionId: api.session_id ?? undefined,
  };
}

function transformFolder(api: ApiFolder, files: ApiAssetFile[] = []): AssetFolder {
  return {
    id: api.id,
    name: api.name,
    createdAt: new Date(api.created_at),
    files: files.map(f => ({
      id: f.id,
      name: f.name,
      url: `/api/assets/files/${f.id}`,
      type: f.file_type,
      folderId: f.folder_id,
      size: f.size || undefined,
      createdAt: new Date(f.created_at),
    })),
  };
}

function transformMessage(api: ApiMessage): ChatMessage {
  // Parse blocks if present
  let blocks: ChatMessage['blocks'];
  if (api.blocks) {
    try {
      const parsed = JSON.parse(api.blocks);
      // Transform timestamps in thinking children from ISO strings to Date objects
      blocks = parsed.map((block: any) => {
        if (block.type === 'thinking' && block.children) {
          return {
            ...block,
            // Ensure thinking blocks are collapsed when loaded from DB
            expanded: false,
            children: block.children.map((child: any) => ({
              ...child,
              timestamp: new Date(child.timestamp),
            })),
          };
        }
        return block;
      });
    } catch {
      // Invalid JSON, ignore blocks
    }
  }

  return {
    id: api.id,
    campaignId: api.campaign_id,
    role: api.role,
    content: api.content,
    timestamp: new Date(api.created_at),
    blocks,
  };
}

// Authenticated blob fetch (for images behind auth)
export async function authFetchBlob(url: string): Promise<string> {
  const headers: HeadersInit = {};
  if (IS_AUTH_ENABLED && tokenGetter) {
    const token = await tokenGetter();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

// ============================================
// Campaigns API
// ============================================

export const campaignsApi = {
  async list(): Promise<Campaign[]> {
    const response = await apiFetch<{ success: boolean; campaigns: ApiCampaign[] }>('/campaigns');
    // Return minimal campaign data (full data loaded on select)
    return response.campaigns.map(c => transformCampaign(c, [], [], []));
  },

  async get(id: string): Promise<{
    campaign: Campaign;
    messages: ChatMessage[];
  }> {
    const response = await apiFetch<{
      success: boolean;
      campaign: ApiCampaign;
      files: ApiCampaignFile[];
      images: ApiImage[];
      messages: ApiMessage[];
    }>(`/campaigns/${id}`);

    return {
      campaign: transformCampaign(
        response.campaign,
        response.files,
        response.images,
        response.messages
      ),
      messages: response.messages.map(transformMessage),
    };
  },

  async create(name: string, sessionId?: string): Promise<Campaign> {
    const response = await apiFetch<{ success: boolean; campaign: ApiCampaign }>('/campaigns', {
      method: 'POST',
      body: JSON.stringify({ name, sessionId }),
    });
    return transformCampaign(response.campaign, [], [], []);
  },

  async update(id: string, data: { name?: string; status?: CampaignStatus; brand?: string }): Promise<Campaign> {
    const response = await apiFetch<{ success: boolean; campaign: ApiCampaign }>(`/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return transformCampaign(response.campaign, [], [], []);
  },

  async delete(id: string): Promise<void> {
    await apiFetch<{ success: boolean }>(`/campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  async updateFile(id: string, fileType: CampaignFileType, content: string): Promise<void> {
    await apiFetch<{ success: boolean }>(`/campaigns/${id}/files/${fileType}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  async recover(id: string): Promise<{
    recovered: boolean;
    reason?: string;
    campaign?: Campaign;
    messages?: ChatMessage[];
    imagesAdded?: number;
    filesUpdated?: number;
  }> {
    const response = await apiFetch<{
      success: boolean;
      recovered: boolean;
      reason?: string;
      imagesAdded?: number;
      filesUpdated?: number;
      campaign?: ApiCampaign;
      files?: ApiCampaignFile[];
      images?: ApiImage[];
      messages?: ApiMessage[];
    }>(`/campaigns/${id}/recover`, { method: 'POST' });

    if (!response.recovered || !response.campaign) {
      return { recovered: false, reason: response.reason };
    }

    return {
      recovered: true,
      imagesAdded: response.imagesAdded,
      filesUpdated: response.filesUpdated,
      campaign: transformCampaign(
        response.campaign,
        response.files || [],
        response.images || [],
        response.messages || [],
      ),
      messages: (response.messages || []).map(transformMessage),
    };
  },

  async getStatus(id: string): Promise<{
    status: CampaignStatus;
    sessionId: string | null;
    isAgentRunning: boolean;
    hasEventBuffer: boolean;
  }> {
    const response = await apiFetch<{
      success: boolean;
      status: CampaignStatus;
      sessionId: string | null;
      isAgentRunning: boolean;
      hasEventBuffer: boolean;
    }>(`/campaigns/${id}/status`);

    return {
      status: response.status,
      sessionId: response.sessionId,
      isAgentRunning: response.isAgentRunning,
      hasEventBuffer: response.hasEventBuffer,
    };
  },
};

// ============================================
// Assets API
// ============================================

export const assetsApi = {
  async listFolders(): Promise<AssetFolder[]> {
    const response = await apiFetch<{ success: boolean; folders: ApiFolder[] }>('/assets/folders');
    return response.folders.map(f => transformFolder(f));
  },

  async createFolder(name: string): Promise<AssetFolder> {
    const response = await apiFetch<{ success: boolean; folder: ApiFolder }>('/assets/folders', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return transformFolder(response.folder);
  },

  async renameFolder(id: string, name: string): Promise<AssetFolder> {
    const response = await apiFetch<{ success: boolean; folder: ApiFolder }>(`/assets/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
    return transformFolder(response.folder);
  },

  async deleteFolder(id: string): Promise<void> {
    await apiFetch<{ success: boolean }>(`/assets/folders/${id}`, {
      method: 'DELETE',
    });
  },

  async getFiles(folderId: string): Promise<AssetFile[]> {
    const response = await apiFetch<{ success: boolean; files: ApiAssetFile[] }>(`/assets/folders/${folderId}/files`);
    return response.files.map(f => ({
      id: f.id,
      name: f.name,
      url: `/api/assets/files/${f.id}`,
      type: f.file_type,
      folderId: f.folder_id,
      size: f.size || undefined,
      createdAt: new Date(f.created_at),
    }));
  },

  async deleteFile(id: string): Promise<void> {
    await apiFetch<{ success: boolean }>(`/assets/files/${id}`, {
      method: 'DELETE',
    });
  },

  async uploadFile(file: File, folderId: string): Promise<AssetFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId);

    const headers: HeadersInit = {};
    if (IS_AUTH_ENABLED && tokenGetter) {
      const token = await tokenGetter();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch('/api/assets/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const f = data.file as ApiAssetFile;

    return {
      id: f.id,
      name: f.name,
      url: `/api/assets/files/${f.id}`,
      type: f.file_type,
      folderId: f.folder_id,
      size: f.size || undefined,
      createdAt: new Date(f.created_at),
    };
  },
};

// ============================================
// Credits API
// ============================================

export interface ApiCredits {
  balance: number;
  plan_balance: number;
  topup_balance: number;
  total_spent: number;
  total_generations: number;
}

export interface ApiUsageEntry {
  id: string;
  campaign_id: string;
  campaign_name: string | null;  // null when the campaign was deleted
  event_type: string;
  image_count: number;
  credits_charged: number;
  created_at: string;
}

export interface ApiUsageSummary {
  totalCredits: number;
  campaignCount: number;
  entryCount: number;
  since: string;
}

// ============================================
// Events API (analytics)
// ============================================

export const eventsApi = {
  track(eventType: string, campaignId?: string, metadata?: Record<string, unknown>): void {
    apiFetch('/events', {
      method: 'POST',
      body: JSON.stringify({ eventType, campaignId, metadata }),
    }).catch(() => {}); // fire and forget
  },
};

// ============================================
// Credits API
// ============================================

export const creditsApi = {
  async get(): Promise<ApiCredits> {
    return apiFetch<ApiCredits>('/credits');
  },

  async getUsage(limit = 20, offset = 0): Promise<{ usage: ApiUsageEntry[] }> {
    return apiFetch<{ usage: ApiUsageEntry[] }>(`/credits/usage?limit=${limit}&offset=${offset}`);
  },

  async getUsageSummary(sinceISODate: string): Promise<ApiUsageSummary> {
    return apiFetch<ApiUsageSummary>(`/credits/usage/summary?since=${encodeURIComponent(sinceISODate)}`);
  },
};

// ============================================
// Payments API
// ============================================

export interface Subscription {
  plan: 'free' | 'starter' | 'pro';
  status: string;
  billing_interval?: string | null;
  current_period_end?: string | null;
}

export const paymentsApi = {
  getSubscription: () =>
    apiFetch<Subscription>('/payments/subscription'),

  checkout: (plan: string, email: string, name?: string) =>
    apiFetch<{ success: boolean; checkout_url: string }>('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan, email, name }),
    }),

  topup: (amount: number, email: string, name?: string) =>
    apiFetch<{ success: boolean; checkout_url: string }>('/payments/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, email, name }),
    }),

  portal: () =>
    apiFetch<{ success: boolean; portal_url: string }>('/payments/portal', {
      method: 'POST',
    }),
};
