import { create } from 'zustand'
import type { WSConnectionState } from '../types/websocket'
import type {
  AppState,
  CampaignStatus,
  FilesReadyState,
  HookType,
  GeneratedImage,
  ChatMessage,
  ThinkingLine,
  GenerationState,
} from '../types/chat'
import {
  createEmptyGenerationState,
  createThinkingLine,
} from '../types/chat'

// ============================================
// Types
// ============================================

export type { AppState, GeneratedImage, ChatMessage, HookType }

export type CampaignFileType = 'research' | 'hooks' | 'prompts'

export interface CampaignFile {
  type: CampaignFileType
  name: string
  content: string
  lastModified: Date
}

export interface Campaign {
  id: string
  name: string
  createdAt: Date
  files: CampaignFile[]
  images: GeneratedImage[]
  status: CampaignStatus
  filesReady: FilesReadyState
}

export interface AssetFile {
  id: string
  name: string
  url: string
  type: 'image' | 'document' | 'other'
  folderId: string
  thumbnailUrl?: string
  size?: number
  createdAt: Date
}

export interface AssetFolder {
  id: string
  name: string
  files: AssetFile[]
  createdAt: Date
}

export type EditorSaveStatus = 'saved' | 'saving' | 'unsaved'

// ============================================
// Store Interface
// ============================================

interface Store {
  // App State
  appState: AppState
  setAppState: (state: AppState) => void

  // Campaigns
  campaigns: Campaign[]
  activeCampaignId: string | null
  isCreatingCampaign: boolean
  generatingCampaignId: string | null
  setActiveCampaignId: (id: string | null) => void
  setIsCreatingCampaign: (creating: boolean) => void
  getActiveCampaign: () => Campaign | null
  getGeneratingCampaign: () => Campaign | null

  // Campaign CRUD
  addCampaign: (name: string, status?: CampaignStatus) => string
  removeCampaign: (id: string) => void
  renameCampaign: (id: string, name: string) => void

  // Campaign Updates
  updateCampaignStatus: (campaignId: string, status: CampaignStatus) => void
  updateCampaignFile: (campaignId: string, fileType: CampaignFileType, content: string) => void
  setFileReady: (campaignId: string, fileType: CampaignFileType, ready: boolean) => void
  addImageToCampaign: (campaignId: string, image: GeneratedImage) => void
  replaceImage: (campaignId: string, imageId: number, newImage: GeneratedImage) => void

  // Active File Editor
  activeFileType: CampaignFileType | null
  setActiveFileType: (type: CampaignFileType | null) => void
  getActiveFileContent: () => string
  updateFileContent: (type: CampaignFileType, content: string) => void

  // Image Selection
  selectedImageIds: number[]
  toggleImageSelection: (imageId: number) => void
  clearImageSelection: () => void
  selectImages: (imageIds: number[]) => void
  getSelectedImages: () => GeneratedImage[]

  // Generation
  prompt: string
  setPrompt: (prompt: string) => void

  // WebSocket state
  sessionId: string | null
  connectionState: WSConnectionState
  isRecovering: boolean
  error: string | null

  // WebSocket actions
  setSessionId: (id: string | null) => void
  setConnectionState: (state: WSConnectionState) => void
  setIsRecovering: (recovering: boolean) => void
  setError: (error: string | null) => void

  // Generation flow
  startGeneration: (sessionId: string, campaignName: string) => { campaignId: string; messageId: string }
  completeGeneration: (campaignId: string, messageId: string, summary: string) => void
  cancelGeneration: (campaignId: string, messageId: string) => void
  failGeneration: (campaignId: string, messageId: string, error: string) => void

  // Chat
  chatMessages: ChatMessage[]
  chatExpanded: boolean
  currentGeneratingMessageId: string | null
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string
  clearChatMessages: () => void
  setChatExpanded: (expanded: boolean) => void

  // Chat message updates
  addThinkingLine: (messageId: string, line: Omit<ThinkingLine, 'id' | 'timestamp'>) => void
  updateMessageGeneration: (messageId: string, update: Partial<GenerationState>) => void
  collapseThinking: (messageId: string) => void
  toggleThinking: (messageId: string) => void
  setMessageContent: (messageId: string, content: string) => void
  incrementCompletedImages: (messageId: string) => void

  // Edit Panel
  editTab: CampaignFileType
  setEditTab: (tab: CampaignFileType) => void

  // Assets
  assetFolders: AssetFolder[]
  selectedFolderId: string | null
  setSelectedFolderId: (id: string | null) => void
  addFolder: (name: string) => void
  removeFolder: (id: string) => void
  renameFolder: (id: string, name: string) => void
  addFileToFolder: (folderId: string, file: Omit<AssetFile, 'id' | 'folderId' | 'createdAt'>) => void
  removeFile: (fileId: string) => void

  // Reset
  reset: () => void
}

// ============================================
// Demo Data
// ============================================

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 'campaign-nike',
    name: 'Nike',
    createdAt: new Date('2025-01-26'),
    status: 'complete',
    filesReady: { research: true, hooks: true, prompts: true },
    files: [
      {
        type: 'research',
        name: 'research.md',
        content: `# Brand Research

**Brand Name:** Nike

**Tagline:** Just Do It

**Tone:** Bold, athletic, aspirational

## Color Palette
- Primary: \`#111111\`
- Secondary: \`#ffffff\`
- Accent: \`#ff6b00\`

## Target Audience
Athletes, fitness enthusiasts, people who aspire to be more active.
`,
        lastModified: new Date('2025-01-26')
      },
      {
        type: 'hooks',
        name: 'hooks.md',
        content: `# Ad Hooks for Nike

## 1. Stat Hook
847 athletes switched to Nike Air in Q4

## 2. Story Hook
How Maria went from couch to marathon in 6 months

## 3. FOMO Hook
Limited drop: Air Max 2024 sells out in 3 hours

## 4. Curiosity Hook
The secret Nike doesn't advertise

## 5. Call-out Hook
For runners tired of "good enough"

## 6. Contrast Hook
While other brands add cushion, Nike engineered flight
`,
        lastModified: new Date('2025-01-26')
      },
      {
        type: 'prompts',
        name: 'prompts.md',
        content: `# Image Prompts for Nike

## Image 1 - Stat Visual
Soft brutalism clay render, athletic scene with statistics overlay

## Image 2 - Story Visual
Runner crossing finish line, emotional moment

## Image 3 - FOMO Visual
Limited edition sneakers on pedestal, dramatic lighting

## Image 4 - Curiosity Visual
Mysterious athletic silhouette

## Image 5 - Call-out Visual
Confident athlete in action pose

## Image 6 - Contrast Visual
Side by side shoe comparison
`,
        lastModified: new Date('2025-01-26')
      }
    ],
    images: [
      { id: 1, url: 'https://picsum.photos/seed/nike1/400/400', prompt: 'Athletic scene with statistics', hookType: 'stat', version: 1 },
      { id: 2, url: 'https://picsum.photos/seed/nike2/400/400', prompt: 'Runner crossing finish line', hookType: 'story', version: 1 },
      { id: 3, url: 'https://picsum.photos/seed/nike3/400/400', prompt: 'Limited edition sneakers', hookType: 'fomo', version: 1 },
      { id: 4, url: 'https://picsum.photos/seed/nike4/400/400', prompt: 'Mysterious silhouette', hookType: 'curiosity', version: 1 },
      { id: 5, url: 'https://picsum.photos/seed/nike5/400/400', prompt: 'Athlete in action', hookType: 'callout', version: 1 },
      { id: 6, url: 'https://picsum.photos/seed/nike6/400/400', prompt: 'Shoe comparison', hookType: 'contrast', version: 1 },
    ]
  }
]

const DEMO_FOLDERS: AssetFolder[] = [
  {
    id: 'folder-1',
    name: 'Brand Kit',
    createdAt: new Date('2025-01-20'),
    files: [
      { id: 'file-1', name: 'logo.png', url: 'https://picsum.photos/seed/logo/200', type: 'image', folderId: 'folder-1', createdAt: new Date('2025-01-20') },
    ]
  }
]

const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Create ads for nike.com',
    timestamp: new Date('2025-01-26T10:00:00'),
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: "I created 6 ad concepts for Nike:\n• Stat Hook\n• Story Hook\n• FOMO Hook\n• Curiosity Hook\n• Call-out Hook\n• Contrast Hook",
    timestamp: new Date('2025-01-26T10:00:30'),
  }
]

// ============================================
// Helper
// ============================================

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============================================
// Store Implementation
// ============================================

export const useStore = create<Store>((set, get) => ({
  // App State
  appState: 'landing',
  setAppState: (appState) => set({ appState }),

  // Campaigns
  campaigns: DEMO_CAMPAIGNS,
  activeCampaignId: null,
  isCreatingCampaign: false,
  generatingCampaignId: null,

  setActiveCampaignId: (activeCampaignId) => set({
    activeCampaignId,
    activeFileType: null,
    isCreatingCampaign: false,
    selectedImageIds: [],
  }),

  setIsCreatingCampaign: (isCreatingCampaign) => set({
    isCreatingCampaign,
    activeCampaignId: isCreatingCampaign ? null : get().activeCampaignId
  }),

  getActiveCampaign: () => {
    const state = get()
    return state.campaigns.find(c => c.id === state.activeCampaignId) || null
  },

  getGeneratingCampaign: () => {
    const state = get()
    return state.campaigns.find(c => c.id === state.generatingCampaignId) || null
  },

  // Campaign CRUD
  addCampaign: (name, status = 'generating') => {
    const id = generateId('campaign')
    set((state) => ({
      campaigns: [...state.campaigns, {
        id,
        name,
        createdAt: new Date(),
        status,
        filesReady: { research: false, hooks: false, prompts: false },
        files: [
          { type: 'research', name: 'research.md', content: '', lastModified: new Date() },
          { type: 'hooks', name: 'hooks.md', content: '', lastModified: new Date() },
          { type: 'prompts', name: 'prompts.md', content: '', lastModified: new Date() },
        ],
        images: []
      }],
      activeCampaignId: id,
      generatingCampaignId: status === 'generating' ? id : state.generatingCampaignId,
      isCreatingCampaign: false,
      appState: 'workspace'
    }))
    return id
  },

  removeCampaign: (id) => set((state) => ({
    campaigns: state.campaigns.filter(c => c.id !== id),
    activeCampaignId: state.activeCampaignId === id ? null : state.activeCampaignId,
    generatingCampaignId: state.generatingCampaignId === id ? null : state.generatingCampaignId,
  })),

  renameCampaign: (id, name) => set((state) => ({
    campaigns: state.campaigns.map(c => c.id === id ? { ...c, name } : c)
  })),

  // Campaign Updates
  updateCampaignStatus: (campaignId, status) => set((state) => ({
    campaigns: state.campaigns.map(c => c.id === campaignId ? { ...c, status } : c),
    generatingCampaignId: status !== 'generating' && state.generatingCampaignId === campaignId
      ? null : state.generatingCampaignId,
  })),

  updateCampaignFile: (campaignId, fileType, content) => set((state) => ({
    campaigns: state.campaigns.map(campaign =>
      campaign.id === campaignId
        ? {
            ...campaign,
            files: campaign.files.map(file =>
              file.type === fileType ? { ...file, content, lastModified: new Date() } : file
            ),
            filesReady: { ...campaign.filesReady, [fileType]: true }
          }
        : campaign
    )
  })),

  setFileReady: (campaignId, fileType, ready) => set((state) => ({
    campaigns: state.campaigns.map(campaign =>
      campaign.id === campaignId
        ? { ...campaign, filesReady: { ...campaign.filesReady, [fileType]: ready } }
        : campaign
    )
  })),

  addImageToCampaign: (campaignId, image) => set((state) => ({
    campaigns: state.campaigns.map(campaign =>
      campaign.id === campaignId
        ? {
            ...campaign,
            images: [...campaign.images.filter(i => i.id !== image.id), image].sort((a, b) => a.id - b.id)
          }
        : campaign
    )
  })),

  replaceImage: (campaignId, imageId, newImage) => set((state) => ({
    campaigns: state.campaigns.map(campaign =>
      campaign.id === campaignId
        ? {
            ...campaign,
            images: campaign.images.map(img =>
              img.id === imageId ? { ...newImage, version: img.version + 1 } : img
            )
          }
        : campaign
    )
  })),

  // Active File Editor
  activeFileType: null,
  setActiveFileType: (activeFileType) => set({ activeFileType }),

  getActiveFileContent: () => {
    const state = get()
    const campaign = state.campaigns.find(c => c.id === state.activeCampaignId)
    if (!campaign || !state.activeFileType) return ''
    return campaign.files.find(f => f.type === state.activeFileType)?.content || ''
  },

  updateFileContent: (type, content) => set((state) => ({
    campaigns: state.campaigns.map(campaign =>
      campaign.id === state.activeCampaignId
        ? {
            ...campaign,
            files: campaign.files.map(file =>
              file.type === type ? { ...file, content, lastModified: new Date() } : file
            )
          }
        : campaign
    )
  })),

  // Image Selection
  selectedImageIds: [],
  toggleImageSelection: (imageId) => set((state) => ({
    selectedImageIds: state.selectedImageIds.includes(imageId)
      ? state.selectedImageIds.filter(id => id !== imageId)
      : [...state.selectedImageIds, imageId]
  })),
  clearImageSelection: () => set({ selectedImageIds: [] }),
  selectImages: (imageIds) => set({ selectedImageIds: imageIds }),
  getSelectedImages: () => {
    const state = get()
    const campaign = state.getActiveCampaign()
    if (!campaign) return []
    return campaign.images.filter(img => state.selectedImageIds.includes(img.id))
  },

  // Generation
  prompt: '',
  setPrompt: (prompt) => set({ prompt }),

  // WebSocket state
  sessionId: null,
  connectionState: 'disconnected',
  isRecovering: false,
  error: null,

  setSessionId: (sessionId) => set({ sessionId }),
  setConnectionState: (connectionState) => set({ connectionState }),
  setIsRecovering: (isRecovering) => set({ isRecovering }),
  setError: (error) => set({ error }),

  // Generation flow
  startGeneration: (sessionId, campaignName) => {
    const campaignId = get().addCampaign(campaignName, 'generating')
    const userMessageId = generateId('msg')
    const assistantMessageId = generateId('msg')

    set((state) => ({
      sessionId,
      error: null,
      currentGeneratingMessageId: assistantMessageId,
      chatMessages: [
        ...state.chatMessages,
        { id: userMessageId, role: 'user', content: state.prompt, timestamp: new Date() },
        { id: assistantMessageId, role: 'assistant', content: '', timestamp: new Date(), generation: createEmptyGenerationState(6) }
      ]
    }))

    return { campaignId, messageId: assistantMessageId }
  },

  completeGeneration: (campaignId, messageId, summary) => {
    set((state) => ({
      campaigns: state.campaigns.map(c =>
        c.id === campaignId ? { ...c, status: 'complete' as CampaignStatus } : c
      ),
      generatingCampaignId: null,
      sessionId: null,
      currentGeneratingMessageId: null,
      chatMessages: state.chatMessages.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              content: summary,
              generation: msg.generation
                ? { ...msg.generation, status: 'complete' as const, thinkingExpanded: false }
                : undefined
            }
          : msg
      )
    }))
  },

  cancelGeneration: (campaignId, messageId) => {
    set((state) => ({
      campaigns: state.campaigns.map(c =>
        c.id === campaignId ? { ...c, status: 'cancelled' as CampaignStatus } : c
      ),
      generatingCampaignId: null,
      sessionId: null,
      currentGeneratingMessageId: null,
      chatMessages: state.chatMessages.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              content: 'Generation was cancelled.',
              generation: msg.generation
                ? { ...msg.generation, status: 'cancelled' as const, thinkingExpanded: false }
                : undefined
            }
          : msg
      )
    }))
  },

  failGeneration: (campaignId, messageId, error) => {
    set((state) => ({
      campaigns: state.campaigns.map(c =>
        c.id === campaignId ? { ...c, status: 'error' as CampaignStatus } : c
      ),
      generatingCampaignId: null,
      sessionId: null,
      currentGeneratingMessageId: null,
      error,
      chatMessages: state.chatMessages.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              content: `Error: ${error}`,
              generation: msg.generation
                ? { ...msg.generation, status: 'error' as const, thinkingExpanded: true }
                : undefined
            }
          : msg
      )
    }))
  },

  // Chat
  chatMessages: DEMO_MESSAGES,
  chatExpanded: false,
  currentGeneratingMessageId: null,

  addChatMessage: (message) => {
    const id = generateId('msg')
    set((state) => ({
      chatMessages: [...state.chatMessages, { ...message, id, timestamp: new Date() }]
    }))
    return id
  },

  clearChatMessages: () => set({ chatMessages: [] }),
  setChatExpanded: (chatExpanded) => set({ chatExpanded }),

  // Chat message updates
  addThinkingLine: (messageId, line) => set((state) => ({
    chatMessages: state.chatMessages.map(msg =>
      msg.id === messageId && msg.generation
        ? {
            ...msg,
            generation: {
              ...msg.generation,
              thinkingLines: [...msg.generation.thinkingLines, createThinkingLine(line.type, line.text, line.indent)]
            }
          }
        : msg
    )
  })),

  updateMessageGeneration: (messageId, update) => set((state) => ({
    chatMessages: state.chatMessages.map(msg =>
      msg.id === messageId && msg.generation
        ? { ...msg, generation: { ...msg.generation, ...update } }
        : msg
    )
  })),

  collapseThinking: (messageId) => set((state) => ({
    chatMessages: state.chatMessages.map(msg =>
      msg.id === messageId && msg.generation
        ? { ...msg, generation: { ...msg.generation, thinkingExpanded: false } }
        : msg
    )
  })),

  toggleThinking: (messageId) => set((state) => ({
    chatMessages: state.chatMessages.map(msg =>
      msg.id === messageId && msg.generation
        ? { ...msg, generation: { ...msg.generation, thinkingExpanded: !msg.generation.thinkingExpanded } }
        : msg
    )
  })),

  setMessageContent: (messageId, content) => set((state) => ({
    chatMessages: state.chatMessages.map(msg => msg.id === messageId ? { ...msg, content } : msg)
  })),

  incrementCompletedImages: (messageId) => set((state) => ({
    chatMessages: state.chatMessages.map(msg =>
      msg.id === messageId && msg.generation
        ? { ...msg, generation: { ...msg.generation, completedImages: msg.generation.completedImages + 1 } }
        : msg
    )
  })),

  // Edit Panel
  editTab: 'research',
  setEditTab: (editTab) => set({ editTab }),

  // Assets
  assetFolders: DEMO_FOLDERS,
  selectedFolderId: null,
  setSelectedFolderId: (selectedFolderId) => set({ selectedFolderId }),

  addFolder: (name) => set((state) => ({
    assetFolders: [...state.assetFolders, { id: generateId('folder'), name, files: [], createdAt: new Date() }]
  })),

  removeFolder: (id) => set((state) => ({
    assetFolders: state.assetFolders.filter(f => f.id !== id),
    selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId
  })),

  renameFolder: (id, name) => set((state) => ({
    assetFolders: state.assetFolders.map(f => f.id === id ? { ...f, name } : f)
  })),

  addFileToFolder: (folderId, file) => set((state) => ({
    assetFolders: state.assetFolders.map(folder =>
      folder.id === folderId
        ? { ...folder, files: [...folder.files, { ...file, id: generateId('file'), folderId, createdAt: new Date() }] }
        : folder
    )
  })),

  removeFile: (fileId) => set((state) => ({
    assetFolders: state.assetFolders.map(folder => ({
      ...folder,
      files: folder.files.filter(f => f.id !== fileId)
    }))
  })),

  // Reset
  reset: () => set({
    appState: 'landing',
    prompt: '',
    activeCampaignId: null,
    activeFileType: null,
    chatMessages: [],
    selectedFolderId: null,
    sessionId: null,
    error: null,
    selectedImageIds: [],
    generatingCampaignId: null,
    currentGeneratingMessageId: null,
  })
}))
