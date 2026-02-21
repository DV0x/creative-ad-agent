import { create } from 'zustand'
import type { WSConnectionState } from '../types/websocket'
import type {
  AppState,
  CampaignStatus,
  FilesReadyState,
  HookType,
  GeneratedImage,
  ChatMessage,
  MessageBlock,
  ThinkingBlockData,
  TextBlockData,
  StatusBlockData,
  ThinkingChild,
} from '../types/chat'
import { campaignsApi, assetsApi } from '../lib/api'

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
  replaceCampaignId: (oldId: string, newId: string) => void

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
  pendingGeneration: boolean
  setPendingGeneration: (pending: boolean) => void

  // WebSocket state
  sessionId: string | null
  connectionState: WSConnectionState
  isRecovering: boolean
  error: string | null
  generationExpectedImages: number

  // WebSocket actions
  setSessionId: (id: string | null) => void
  setConnectionState: (state: WSConnectionState) => void
  setIsRecovering: (recovering: boolean) => void
  setError: (error: string | null) => void
  setGenerationExpectedImages: (count: number) => void

  // Generation flow
  startGeneration: (sessionId: string, campaignName: string, prompt: string) => { campaignId: string; messageId: string }
  resumeGeneration: (sessionId: string, campaignId: string) => { messageId: string }
  reconstructForRecovery: (sessionId: string, prompt: string, campaignId: string) => { messageId: string }
  cleanupFailedRecovery: () => void
  completeGeneration: (campaignId: string, messageId: string, summary: string) => void
  cancelGeneration: (campaignId: string, messageId: string) => void
  failGeneration: (campaignId: string, messageId: string, error: string) => void
  isFollowUp: boolean
  startFollowUp: (campaignId: string, prompt: string) => { campaignId: string; messageId: string }

  // Chat (per-campaign)
  chatMessages: Record<string, ChatMessage[]>
  chatExpanded: boolean
  currentGeneratingMessageId: string | null
  getActiveChatMessages: () => ChatMessage[]
  addChatMessage: (campaignId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'campaignId'>) => string
  clearChatMessages: (campaignId?: string) => void
  setChatExpanded: (expanded: boolean) => void

  // Chat message updates (campaignId is explicit to avoid stale reads from generatingCampaignId)
  setMessageContent: (campaignId: string, messageId: string, content: string) => void
  appendMessageContent: (campaignId: string, messageId: string, text: string) => void

  // Block actions
  appendTextBlock: (campaignId: string, messageId: string, text: string) => void
  openThinkingBlock: (campaignId: string, messageId: string, label: string, expectedImages?: number) => void
  addThinkingChild: (campaignId: string, messageId: string, child: { kind: ThinkingChild['kind']; text: string; variant?: ThinkingChild['variant'] }) => void
  closeThinkingBlock: (campaignId: string, messageId: string, status: 'complete' | 'error') => void
  updateThinkingImages: (campaignId: string, messageId: string, completedImages: number) => void
  toggleBlockExpanded: (campaignId: string, messageId: string, blockId: string) => void

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

  // Async API-synced actions
  deleteCampaignAsync: (id: string) => Promise<void>
  renameCampaignAsync: (id: string, name: string) => Promise<void>
  saveFileAsync: (campaignId: string, fileType: CampaignFileType, content: string) => Promise<void>
  createFolderAsync: (name: string) => Promise<string>
  deleteFolderAsync: (id: string) => Promise<void>
  renameFolderAsync: (id: string, name: string) => Promise<void>
  deleteFileAsync: (fileId: string) => Promise<void>

  // Data Loading
  dataLoading: boolean
  setDataLoading: (loading: boolean) => void

  // Bulk setters for API sync
  setCampaigns: (campaigns: Campaign[]) => void
  setAssetFolders: (folders: AssetFolder[]) => void
  setChatMessages: (messages: Record<string, ChatMessage[]>) => void

  // Reset
  reset: () => void
}


// ============================================
// Helper
// ============================================

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function generateBlockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
}

function parseExpectedImageCount(prompt: string): number {
  const wordToNum: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
    single: 1, couple: 2, few: 3, a: 1, an: 1,
  }
  // Check for explicit count like "3 ads" or "two images"
  const digitMatch = prompt.match(/(\d+)\s*(?:ads?|images?|creatives?|concepts?|visuals?)/i)
  if (digitMatch) {
    return Math.min(Math.max(parseInt(digitMatch[1], 10), 1), 6)
  }
  const wordMatch = prompt.match(/\b(one|two|three|four|five|six|single|couple|few|an?)\b\s*(?:ads?|images?|creatives?|concepts?|visuals?)/i)
  if (wordMatch) {
    return wordToNum[wordMatch[1].toLowerCase()] || 6
  }
  // Check if this looks like an image generation request (has URL or generation keywords)
  const hasUrl = /https?:\/\/|www\.|\.com|\.org|\.net|\.io/i.test(prompt)
  const hasGenerationKeywords = /\b(generate|create|make|build|design|campaign|brand|website|business)\b/i.test(prompt)
  if (hasUrl || hasGenerationKeywords) {
    return 6  // Default to 6 for generation requests
  }
  // Simple chat message - no images expected
  return 0
}

// ============================================
// Store Implementation
// ============================================

export const useStore = create<Store>((set, get) => ({
  // App State
  appState: 'landing',
  setAppState: (appState) => set({ appState }),

  // Campaigns
  campaigns: [],
  activeCampaignId: null,
  isCreatingCampaign: false,
  generatingCampaignId: null,
  isFollowUp: false,

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

  removeCampaign: (id) => set((state) => {
    const { [id]: _, ...remainingMessages } = state.chatMessages
    return {
      campaigns: state.campaigns.filter(c => c.id !== id),
      activeCampaignId: state.activeCampaignId === id ? null : state.activeCampaignId,
      generatingCampaignId: state.generatingCampaignId === id ? null : state.generatingCampaignId,
      chatMessages: remainingMessages,
    }
  }),

  renameCampaign: (id, name) => set((state) => ({
    campaigns: state.campaigns.map(c => c.id === id ? { ...c, name } : c)
  })),

  replaceCampaignId: (oldId, newId) => set((state) => {
    const { [oldId]: oldMessages, ...restMessages } = state.chatMessages
    return {
      campaigns: state.campaigns.map(c => c.id === oldId ? { ...c, id: newId } : c),
      activeCampaignId: state.activeCampaignId === oldId ? newId : state.activeCampaignId,
      generatingCampaignId: state.generatingCampaignId === oldId ? newId : state.generatingCampaignId,
      chatMessages: oldMessages
        ? { ...restMessages, [newId]: oldMessages.map(m => ({ ...m, campaignId: newId })) }
        : state.chatMessages,
    }
  }),

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
  pendingGeneration: false,
  setPendingGeneration: (pendingGeneration) => set({ pendingGeneration }),

  // WebSocket state
  sessionId: null,
  connectionState: 'disconnected',
  isRecovering: false,
  error: null,
  generationExpectedImages: 0,

  setSessionId: (sessionId) => set({ sessionId }),
  setConnectionState: (connectionState) => set({ connectionState }),
  setIsRecovering: (isRecovering) => set({ isRecovering }),
  setError: (error) => set({ error }),
  setGenerationExpectedImages: (count) => set({ generationExpectedImages: count }),

  // Generation flow
  startGeneration: (sessionId, campaignName, prompt) => {
    const campaignId = get().addCampaign(campaignName, 'generating')
    const userMessageId = generateId('msg')
    const assistantMessageId = generateId('msg')

    const expectedFromPrompt = parseExpectedImageCount(prompt)

    set((state) => ({
      sessionId,
      error: null,
      isFollowUp: false,
      generationExpectedImages: expectedFromPrompt,
      currentGeneratingMessageId: assistantMessageId,
      chatMessages: {
        ...state.chatMessages,
        [campaignId]: [
          { id: userMessageId, campaignId, role: 'user' as const, content: prompt, timestamp: new Date() },
          { id: assistantMessageId, campaignId, role: 'assistant' as const, content: '', timestamp: new Date() }
        ]
      }
    }))

    return { campaignId, messageId: assistantMessageId }
  },

  resumeGeneration: (sessionId, campaignId) => {
    const campaign = get().campaigns.find(c => c.id === campaignId)
    const existingImages = campaign?.images.length || 0

    // Derive expected count from prompts file if available
    let expectedTotal = get().generationExpectedImages
    const promptsFile = campaign?.files.find(f => f.type === 'prompts')
    if (promptsFile?.content) {
      try {
        const prompts = JSON.parse(promptsFile.content)
        if (Array.isArray(prompts) && prompts.length > 0) expectedTotal = prompts.length
      } catch { /* keep default */ }
    }
    const remainingImages = Math.max(0, expectedTotal - existingImages)

    const userMessageId = generateId('msg')
    const assistantMessageId = generateId('msg')

    set((state) => ({
      sessionId,
      error: null,
      currentGeneratingMessageId: assistantMessageId,
      generatingCampaignId: campaignId,
      activeCampaignId: campaignId,
      appState: 'workspace',
      generationExpectedImages: expectedTotal,
      campaigns: state.campaigns.map(c =>
        c.id === campaignId ? { ...c, status: 'generating' as CampaignStatus } : c
      ),
      chatMessages: {
        ...state.chatMessages,
        [campaignId]: [
          ...(state.chatMessages[campaignId] || []),
          { id: userMessageId, campaignId, role: 'user' as const, content: 'Resume generation', timestamp: new Date() },
          { id: assistantMessageId, campaignId, role: 'assistant' as const, content: '', timestamp: new Date() }
        ]
      }
    }))

    return { messageId: assistantMessageId }
  },

  reconstructForRecovery: (sessionId, prompt, campaignId) => {
    const campaign = get().campaigns.find(c => c.id === campaignId)
    const existingImages = campaign?.images.length || 0

    // Derive expected count: parse prompt first, then check prompts file
    let expectedTotal = parseExpectedImageCount(prompt)
    const promptsFile = campaign?.files.find(f => f.type === 'prompts')
    if (promptsFile?.content) {
      try {
        const prompts = JSON.parse(promptsFile.content)
        if (Array.isArray(prompts) && prompts.length > 0) expectedTotal = prompts.length
      } catch { /* keep default from prompt parse */ }
    }
    const expectedImages = Math.max(1, expectedTotal - existingImages)

    const userMessageId = generateId('msg')
    const assistantMessageId = generateId('msg')

    set((state) => ({
      sessionId,
      error: null,
      generatingCampaignId: campaignId,
      activeCampaignId: campaignId,
      currentGeneratingMessageId: assistantMessageId,
      appState: 'workspace',
      generationExpectedImages: expectedTotal,
      campaigns: state.campaigns.map(c =>
        c.id === campaignId ? { ...c, status: 'generating' as CampaignStatus } : c
      ),
      // Replace this campaign's messages only — previous are stale after refresh
      chatMessages: {
        ...state.chatMessages,
        [campaignId]: [
          { id: userMessageId, campaignId, role: 'user' as const, content: prompt, timestamp: new Date() },
          { id: assistantMessageId, campaignId, role: 'assistant' as const, content: '', timestamp: new Date() }
        ]
      }
    }))

    return { messageId: assistantMessageId }
  },

  cleanupFailedRecovery: () => {
    const cid = get().generatingCampaignId
    set((state) => {
      const updatedMessages = { ...state.chatMessages }
      if (cid) {
        delete updatedMessages[cid]
      }
      return {
        generatingCampaignId: null,
        isFollowUp: false,
        sessionId: null,
        currentGeneratingMessageId: null,
        isRecovering: false,
        error: null,
        generationExpectedImages: 0,
        chatMessages: updatedMessages,
      }
    })
  },

  completeGeneration: (campaignId, messageId, summary) => {
    set((state) => ({
      campaigns: state.campaigns.map(c =>
        c.id === campaignId ? { ...c, status: 'complete' as CampaignStatus } : c
      ),
      generatingCampaignId: null,
      isFollowUp: false,
      sessionId: null,
      currentGeneratingMessageId: null,
      generationExpectedImages: 0,
      chatMessages: {
        ...state.chatMessages,
        [campaignId]: (state.chatMessages[campaignId] || []).map(msg =>
          msg.id === messageId ? { ...msg, content: summary } : msg
        )
      }
    }))
  },

  cancelGeneration: (campaignId, messageId) => {
    set((state) => ({
      campaigns: state.campaigns.map(c =>
        c.id === campaignId ? { ...c, status: 'cancelled' as CampaignStatus } : c
      ),
      generatingCampaignId: null,
      isFollowUp: false,
      sessionId: null,
      currentGeneratingMessageId: null,
      generationExpectedImages: 0,
      chatMessages: {
        ...state.chatMessages,
        [campaignId]: (state.chatMessages[campaignId] || []).map(msg =>
          msg.id === messageId ? { ...msg, content: 'Generation was cancelled.' } : msg
        )
      }
    }))
  },

  failGeneration: (campaignId, messageId, error) => {
    set((state) => ({
      campaigns: state.campaigns.map(c =>
        c.id === campaignId ? { ...c, status: 'error' as CampaignStatus } : c
      ),
      generatingCampaignId: null,
      isFollowUp: false,
      sessionId: null,
      currentGeneratingMessageId: null,
      generationExpectedImages: 0,
      error,
      chatMessages: {
        ...state.chatMessages,
        [campaignId]: (state.chatMessages[campaignId] || []).map(msg =>
          msg.id === messageId ? { ...msg, content: `Error: ${error}` } : msg
        )
      }
    }))
  },

  startFollowUp: (campaignId, prompt) => {
    const userMessageId = generateId('msg')
    const assistantMessageId = generateId('msg')

    set((state) => ({
      generatingCampaignId: campaignId,
      isFollowUp: true,
      currentGeneratingMessageId: assistantMessageId,
      chatMessages: {
        ...state.chatMessages,
        [campaignId]: [
          ...(state.chatMessages[campaignId] || []),
          {
            id: userMessageId,
            campaignId,
            role: 'user' as const,
            content: prompt,
            timestamp: new Date(),
          },
          {
            id: assistantMessageId,
            campaignId,
            role: 'assistant' as const,
            content: '',
            timestamp: new Date(),
          },
        ],
      },
    }))

    return { campaignId, messageId: assistantMessageId }
  },

  // Chat (per-campaign)
  chatMessages: {},
  chatExpanded: false,
  currentGeneratingMessageId: null,

  getActiveChatMessages: () => {
    const state = get()
    if (!state.activeCampaignId) return []
    return state.chatMessages[state.activeCampaignId] || []
  },

  addChatMessage: (campaignId, message) => {
    const id = generateId('msg')
    set((state) => ({
      chatMessages: {
        ...state.chatMessages,
        [campaignId]: [...(state.chatMessages[campaignId] || []), { ...message, id, campaignId, timestamp: new Date() }]
      }
    }))
    return id
  },

  clearChatMessages: (campaignId) => {
    if (campaignId) {
      set((state) => {
        const updated = { ...state.chatMessages }
        delete updated[campaignId]
        return { chatMessages: updated }
      })
    } else {
      set({ chatMessages: {} })
    }
  },
  setChatExpanded: (chatExpanded) => set({ chatExpanded }),

  // Chat message updates (campaignId passed explicitly by caller)
  setMessageContent: (campaignId, messageId, content) => set((state) => ({
    chatMessages: {
      ...state.chatMessages,
      [campaignId]: (state.chatMessages[campaignId] || []).map(msg =>
        msg.id === messageId ? { ...msg, content } : msg
      )
    }
  })),

  appendMessageContent: (campaignId, messageId, text) => set((state) => ({
    chatMessages: {
      ...state.chatMessages,
      [campaignId]: (state.chatMessages[campaignId] || []).map(msg =>
        msg.id === messageId ? { ...msg, content: (msg.content || '') + text } : msg
      )
    }
  })),

  // Block actions

  appendTextBlock: (campaignId, messageId, text) => set((state) => ({
    chatMessages: {
      ...state.chatMessages,
      [campaignId]: (state.chatMessages[campaignId] || []).map(msg => {
        if (msg.id !== messageId) return msg
        const blocks = [...(msg.blocks || [])]
        const lastBlock = blocks[blocks.length - 1]
        if (lastBlock && lastBlock.type === 'text') {
          blocks[blocks.length - 1] = { ...lastBlock, content: lastBlock.content + text }
        } else {
          blocks.push({ type: 'text', id: generateBlockId('txt'), content: text })
        }
        return { ...msg, blocks }
      })
    }
  })),

  openThinkingBlock: (campaignId, messageId, label, expectedImages = 0) => set((state) => ({
    chatMessages: {
      ...state.chatMessages,
      [campaignId]: (state.chatMessages[campaignId] || []).map(msg => {
        if (msg.id !== messageId) return msg
        const blocks = (msg.blocks || []).map(b =>
          b.type === 'thinking' && b.status === 'active'
            ? { ...b, status: 'complete' as const, expanded: false }
            : b
        )
        blocks.push({
          type: 'thinking',
          id: generateBlockId('think'),
          label,
          status: 'active',
          expanded: true,
          children: [],
          completedImages: 0,
          expectedImages,
        } satisfies ThinkingBlockData)
        return { ...msg, blocks }
      })
    }
  })),

  addThinkingChild: (campaignId, messageId, child) => set((state) => ({
    chatMessages: {
      ...state.chatMessages,
      [campaignId]: (state.chatMessages[campaignId] || []).map(msg => {
        if (msg.id !== messageId) return msg
        const blocks = [...(msg.blocks || [])]
        // Find the last thinking block (should be the active one)
        for (let i = blocks.length - 1; i >= 0; i--) {
          if (blocks[i].type === 'thinking') {
            const tb = blocks[i] as ThinkingBlockData
            blocks[i] = {
              ...tb,
              children: [...tb.children, {
                id: generateBlockId('tc'),
                kind: child.kind,
                text: child.text,
                timestamp: new Date(),
                ...(child.variant ? { variant: child.variant } : {}),
              }]
            }
            break
          }
        }
        return { ...msg, blocks }
      })
    }
  })),

  closeThinkingBlock: (campaignId, messageId, status) => set((state) => ({
    chatMessages: {
      ...state.chatMessages,
      [campaignId]: (state.chatMessages[campaignId] || []).map(msg => {
        if (msg.id !== messageId) return msg
        const blocks = [...(msg.blocks || [])]
        for (let i = blocks.length - 1; i >= 0; i--) {
          if (blocks[i].type === 'thinking' && (blocks[i] as ThinkingBlockData).status === 'active') {
            blocks[i] = { ...(blocks[i] as ThinkingBlockData), status, expanded: false }
            break
          }
        }
        return { ...msg, blocks }
      })
    }
  })),

  updateThinkingImages: (campaignId, messageId, completedImages) => set((state) => ({
    chatMessages: {
      ...state.chatMessages,
      [campaignId]: (state.chatMessages[campaignId] || []).map(msg => {
        if (msg.id !== messageId) return msg
        const blocks = [...(msg.blocks || [])]
        for (let i = blocks.length - 1; i >= 0; i--) {
          if (blocks[i].type === 'thinking') {
            blocks[i] = { ...(blocks[i] as ThinkingBlockData), completedImages }
            break
          }
        }
        return { ...msg, blocks }
      })
    }
  })),

  toggleBlockExpanded: (campaignId, messageId, blockId) => set((state) => ({
    chatMessages: {
      ...state.chatMessages,
      [campaignId]: (state.chatMessages[campaignId] || []).map(msg => {
        if (msg.id !== messageId) return msg
        return {
          ...msg,
          blocks: (msg.blocks || []).map(b =>
            b.id === blockId && b.type === 'thinking'
              ? { ...b, expanded: !(b as ThinkingBlockData).expanded }
              : b
          )
        }
      })
    }
  })),

  // Edit Panel
  editTab: 'research',
  setEditTab: (editTab) => set({ editTab }),

  // Assets
  assetFolders: [],
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

  // Async API-synced actions
  deleteCampaignAsync: async (id) => {
    // Optimistic update
    get().removeCampaign(id)
    try {
      await campaignsApi.delete(id)
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      // Could revert here, but for now just log
    }
  },

  renameCampaignAsync: async (id, name) => {
    // Optimistic update
    get().renameCampaign(id, name)
    try {
      await campaignsApi.update(id, { name })
    } catch (error) {
      console.error('Failed to rename campaign:', error)
    }
  },

  saveFileAsync: async (campaignId, fileType, content) => {
    // Note: Local state is updated separately via updateFileContent
    // This just syncs to API
    try {
      await campaignsApi.updateFile(campaignId, fileType, content)
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  },

  createFolderAsync: async (name) => {
    try {
      const folder = await assetsApi.createFolder(name)
      set((state) => ({
        assetFolders: [...state.assetFolders, folder]
      }))
      return folder.id
    } catch (error) {
      console.error('Failed to create folder:', error)
      // Fallback to local-only
      const id = generateId('folder')
      get().addFolder(name)
      return id
    }
  },

  deleteFolderAsync: async (id) => {
    // Optimistic update
    get().removeFolder(id)
    try {
      await assetsApi.deleteFolder(id)
    } catch (error) {
      console.error('Failed to delete folder:', error)
    }
  },

  renameFolderAsync: async (id, name) => {
    // Optimistic update
    get().renameFolder(id, name)
    try {
      await assetsApi.renameFolder(id, name)
    } catch (error) {
      console.error('Failed to rename folder:', error)
    }
  },

  deleteFileAsync: async (fileId) => {
    // Optimistic update
    get().removeFile(fileId)
    try {
      await assetsApi.deleteFile(fileId)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  },

  // Data Loading
  dataLoading: false,
  setDataLoading: (dataLoading) => set({ dataLoading }),

  // Bulk setters for API sync
  setCampaigns: (campaigns) => set({ campaigns }),
  setAssetFolders: (assetFolders) => set({ assetFolders }),
  setChatMessages: (chatMessages: Record<string, ChatMessage[]>) => set({ chatMessages }),

  // Reset
  reset: () => set({
    appState: 'landing',
    prompt: '',
    pendingGeneration: false,
    activeCampaignId: null,
    activeFileType: null,
    chatMessages: {},
    selectedFolderId: null,
    sessionId: null,
    error: null,
    selectedImageIds: [],
    generatingCampaignId: null,
    isFollowUp: false,
    currentGeneratingMessageId: null,
    generationExpectedImages: 0,
    dataLoading: false,
  })
}))
