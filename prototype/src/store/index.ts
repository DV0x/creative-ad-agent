import { create } from 'zustand'

// ============================================
// Types
// ============================================

export type AppState = 'empty' | 'generating' | 'results'
export type GeneratingPhase = 'research' | 'hooks' | 'visuals' | 'images'

// Campaign File Types
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
}

export interface GeneratedImage {
  id: number
  url: string
  prompt: string
}

// Asset Types
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

// Chat Types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  fileRefs?: CampaignFileType[] // referenced campaign files
  assetRefs?: string[] // referenced asset folder IDs
}

// Editor State
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
  setActiveCampaignId: (id: string | null) => void
  setIsCreatingCampaign: (creating: boolean) => void
  getActiveCampaign: () => Campaign | null
  addCampaign: (name: string) => string // returns new campaign ID
  removeCampaign: (id: string) => void
  renameCampaign: (id: string, name: string) => void

  // Active File Editor
  activeFileType: CampaignFileType | null
  setActiveFileType: (type: CampaignFileType | null) => void
  getActiveFileContent: () => string
  updateFileContent: (type: CampaignFileType, content: string) => void

  // Generation
  generatingPhase: GeneratingPhase
  setGeneratingPhase: (phase: GeneratingPhase) => void
  prompt: string
  setPrompt: (prompt: string) => void
  startGeneration: () => void

  // Chat
  chatMessages: ChatMessage[]
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearChatMessages: () => void

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
// Default Content Templates
// ============================================

const createDefaultResearchContent = (brandName: string) => `# Brand Research

**Brand Name:** ${brandName}

**Tagline:** [Add tagline]

**Tone:** [Describe brand tone]

## Color Palette
- Primary: \`#000000\`
- Secondary: \`#ffffff\`
- Accent: \`#ff6b00\`

## Target Audience
[Describe target audience]

## Notes
[Add research notes here...]
`

const createDefaultHooksContent = (brandName: string) => `# Ad Hooks for ${brandName}

## 1. Stat/Data Hook
**Headline:** [Add compelling statistic]

[Supporting copy that builds on the data point]

*CTA: [Call to action]*

---

## 2. Story/Result Hook
**Headline:** [Add transformation story]

[Supporting copy with emotional appeal]

*CTA: [Call to action]*

---

## 3. FOMO/Urgency Hook
**Headline:** [Add urgency-driven headline]

[Supporting copy that creates urgency]

*CTA: [Call to action]*

---

## 4. Curiosity Hook
**Headline:** [Add curiosity-driven headline]

[Supporting copy that teases value]

*CTA: [Call to action]*

---

## 5. Call-out Hook
**Headline:** [Call out your target audience]

[Supporting copy that resonates with them]

*CTA: [Call to action]*

---

## 6. Contrast Hook
**Headline:** [Compare against competition]

[Supporting copy showing differentiation]

*CTA: [Call to action]*
`

const createDefaultPromptsContent = (brandName: string) => `# Image Prompts for ${brandName}

## Image 1 - Stat/Data Visual
\`\`\`
Soft brutalism clay render, athletic scene with statistics overlay, warm lighting, pastel tones, 3D illustration, professional advertising style
\`\`\`

## Image 2 - Story/Result Visual
\`\`\`
Soft brutalism clay render, emotional victory moment, runner crossing finish line, warm lighting, pastel tones, 3D illustration
\`\`\`

## Image 3 - FOMO/Urgency Visual
\`\`\`
Soft brutalism clay render, limited edition product on pedestal, dramatic lighting, exclusive feel, 3D illustration
\`\`\`

## Image 4 - Curiosity Visual
\`\`\`
Soft brutalism clay render, mysterious athletic silhouette, intriguing composition, warm lighting, 3D illustration
\`\`\`

## Image 5 - Call-out Visual
\`\`\`
Soft brutalism clay render, confident athlete in action pose, empowering mood, warm lighting, 3D illustration
\`\`\`

## Image 6 - Contrast Visual
\`\`\`
Soft brutalism clay render, side by side product comparison, clear differentiation, professional style, 3D illustration
\`\`\`
`

// ============================================
// Demo Data
// ============================================

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 'campaign-nike',
    name: 'Nike',
    createdAt: new Date('2025-01-26'),
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
Athletes, fitness enthusiasts, people who aspire to be more active. Ages 18-45, both genders, middle to upper income.

## Notes
- Focus on empowerment and achievement
- Use real athlete stories when possible
- Emphasize innovation and technology
`,
        lastModified: new Date('2025-01-26')
      },
      {
        type: 'hooks',
        name: 'hooks.md',
        content: `# Ad Hooks for Nike

## 1. Stat/Data Hook
**Headline:** 847 athletes switched to Nike Air in Q4

The numbers speak for themselves. Professional runners are making the switch.

*CTA: See the stats*

---

## 2. Story/Result Hook
**Headline:** How Maria went from couch to marathon in 6 months

She started with zero running experience. Nike Air Max changed everything.

*CTA: Read her story*

---

## 3. FOMO/Urgency Hook
**Headline:** Limited drop: Air Max 2024 sells out in 3 hours

Last release? Gone before lunch. Don't miss the next one.

*CTA: Get notified*

---

## 4. Curiosity Hook
**Headline:** The secret Nike doesn't advertise

Why do Olympic sprinters choose Air over everything else?

*CTA: Discover why*

---

## 5. Call-out Hook
**Headline:** For runners tired of "good enough"

You've tried the rest. Now try what the pros actually wear.

*CTA: Make the switch*

---

## 6. Contrast Hook
**Headline:** While other brands add cushion, Nike engineered flight

More foam isn't innovation. Lighter, faster, better is.

*CTA: Feel the difference*
`,
        lastModified: new Date('2025-01-26')
      },
      {
        type: 'prompts',
        name: 'prompts.md',
        content: `# Image Prompts for Nike

## Image 1 - Stat/Data Visual
\`\`\`
Soft brutalism clay render, athletic scene with statistics overlay, Nike branding, warm lighting, pastel tones, 3D illustration
\`\`\`

## Image 2 - Story/Result Visual
\`\`\`
Soft brutalism clay render, runner crossing finish line emotional moment, Nike shoes featured, warm lighting, 3D illustration
\`\`\`

## Image 3 - FOMO/Urgency Visual
\`\`\`
Soft brutalism clay render, limited edition Nike sneakers on pedestal, dramatic lighting, exclusive feel, 3D illustration
\`\`\`

## Image 4 - Curiosity Visual
\`\`\`
Soft brutalism clay render, mysterious athletic silhouette, Nike swoosh subtle, intriguing composition, 3D illustration
\`\`\`

## Image 5 - Call-out Visual
\`\`\`
Soft brutalism clay render, confident athlete in action pose, Nike gear, empowering mood, warm lighting, 3D illustration
\`\`\`

## Image 6 - Contrast Visual
\`\`\`
Soft brutalism clay render, Nike shoe vs generic shoe comparison, clear quality difference, professional style, 3D illustration
\`\`\`
`,
        lastModified: new Date('2025-01-26')
      }
    ],
    images: [
      { id: 1, url: 'https://picsum.photos/seed/nike1/400/400', prompt: 'Athletic scene with statistics overlay' },
      { id: 2, url: 'https://picsum.photos/seed/nike2/400/400', prompt: 'Runner crossing finish line, emotional moment' },
      { id: 3, url: 'https://picsum.photos/seed/nike3/400/400', prompt: 'Limited edition sneakers on pedestal' },
      { id: 4, url: 'https://picsum.photos/seed/nike4/400/400', prompt: 'Mysterious athletic silhouette' },
      { id: 5, url: 'https://picsum.photos/seed/nike5/400/400', prompt: 'Confident athlete in action pose' },
      { id: 6, url: 'https://picsum.photos/seed/nike6/400/400', prompt: 'Side by side shoe comparison' },
    ]
  },
  {
    id: 'campaign-adidas',
    name: 'Adidas',
    createdAt: new Date('2025-01-24'),
    files: [
      { type: 'research', name: 'research.md', content: createDefaultResearchContent('Adidas'), lastModified: new Date('2025-01-24') },
      { type: 'hooks', name: 'hooks.md', content: createDefaultHooksContent('Adidas'), lastModified: new Date('2025-01-24') },
      { type: 'prompts', name: 'prompts.md', content: createDefaultPromptsContent('Adidas'), lastModified: new Date('2025-01-24') },
    ],
    images: [
      { id: 1, url: 'https://picsum.photos/seed/adidas1/400/400', prompt: 'Adidas athletic visual' },
      { id: 2, url: 'https://picsum.photos/seed/adidas2/400/400', prompt: 'Adidas lifestyle shot' },
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
      { id: 'file-2', name: 'logo-dark.png', url: 'https://picsum.photos/seed/logodark/200', type: 'image', folderId: 'folder-1', createdAt: new Date('2025-01-20') },
    ]
  },
  {
    id: 'folder-2',
    name: 'Products',
    createdAt: new Date('2025-01-22'),
    files: [
      { id: 'file-3', name: 'shoe-1.jpg', url: 'https://picsum.photos/seed/shoe1/200', type: 'image', folderId: 'folder-2', createdAt: new Date('2025-01-22') },
      { id: 'file-4', name: 'shoe-2.jpg', url: 'https://picsum.photos/seed/shoe2/200', type: 'image', folderId: 'folder-2', createdAt: new Date('2025-01-22') },
      { id: 'file-5', name: 'shoe-3.jpg', url: 'https://picsum.photos/seed/shoe3/200', type: 'image', folderId: 'folder-2', createdAt: new Date('2025-01-22') },
    ]
  },
  {
    id: 'folder-3',
    name: 'Lifestyle',
    createdAt: new Date('2025-01-24'),
    files: [
      { id: 'file-6', name: 'runner.jpg', url: 'https://picsum.photos/seed/runner/200', type: 'image', folderId: 'folder-3', createdAt: new Date('2025-01-24') },
    ]
  }
]

const DEMO_MESSAGES: ChatMessage[] = [
  { id: 'msg-1', role: 'user', content: 'Create ads for nike.com', timestamp: new Date('2025-01-26T10:00:00'), fileRefs: [], assetRefs: [] },
  { id: 'msg-2', role: 'assistant', content: "I researched Nike and created 6 ad concepts:\n• 2 stat-based (social proof)\n• 2 story-based (emotional)\n• 2 urgency-based (FOMO)\n\nYou can edit the hooks and prompts in the left sidebar.", timestamp: new Date('2025-01-26T10:00:30'), fileRefs: [], assetRefs: [] }
]

// ============================================
// Store Implementation
// ============================================

export const useStore = create<Store>((set, get) => ({
  // App State
  appState: 'empty',
  setAppState: (appState) => set({ appState }),

  // Campaigns
  campaigns: DEMO_CAMPAIGNS,
  activeCampaignId: null,
  isCreatingCampaign: false,
  setActiveCampaignId: (activeCampaignId) => set({ activeCampaignId, activeFileType: null, isCreatingCampaign: false }),
  setIsCreatingCampaign: (isCreatingCampaign) => set({ isCreatingCampaign, activeCampaignId: isCreatingCampaign ? null : get().activeCampaignId }),

  getActiveCampaign: () => {
    const state = get()
    return state.campaigns.find(c => c.id === state.activeCampaignId) || null
  },

  addCampaign: (name) => {
    const id = `campaign-${Date.now()}`
    set((state) => ({
      campaigns: [...state.campaigns, {
        id,
        name,
        createdAt: new Date(),
        files: [
          { type: 'research', name: 'research.md', content: createDefaultResearchContent(name), lastModified: new Date() },
          { type: 'hooks', name: 'hooks.md', content: createDefaultHooksContent(name), lastModified: new Date() },
          { type: 'prompts', name: 'prompts.md', content: createDefaultPromptsContent(name), lastModified: new Date() },
        ],
        images: []
      }],
      activeCampaignId: id,
      isCreatingCampaign: false,
      appState: 'results'
    }))
    return id
  },

  removeCampaign: (id) => set((state) => ({
    campaigns: state.campaigns.filter(c => c.id !== id),
    activeCampaignId: state.activeCampaignId === id ? null : state.activeCampaignId
  })),

  renameCampaign: (id, name) => set((state) => ({
    campaigns: state.campaigns.map(c =>
      c.id === id ? { ...c, name } : c
    )
  })),

  // Active File Editor
  activeFileType: null,
  setActiveFileType: (activeFileType) => set({ activeFileType }),

  getActiveFileContent: () => {
    const state = get()
    const campaign = state.campaigns.find(c => c.id === state.activeCampaignId)
    if (!campaign || !state.activeFileType) return ''
    const file = campaign.files.find(f => f.type === state.activeFileType)
    return file?.content || ''
  },

  updateFileContent: (type, content) => set((state) => ({
    campaigns: state.campaigns.map(campaign =>
      campaign.id === state.activeCampaignId
        ? {
            ...campaign,
            files: campaign.files.map(file =>
              file.type === type
                ? { ...file, content, lastModified: new Date() }
                : file
            )
          }
        : campaign
    )
  })),

  // Generation
  generatingPhase: 'research',
  setGeneratingPhase: (generatingPhase) => set({ generatingPhase }),
  prompt: '',
  setPrompt: (prompt) => set({ prompt }),

  startGeneration: () => {
    const state = get()
    const campaignName = state.prompt.split(' ')[0] || 'New Campaign'

    set({
      appState: 'generating',
      generatingPhase: 'research',
    })

    // Simulate generation phases
    setTimeout(() => set({ generatingPhase: 'hooks' }), 2000)
    setTimeout(() => set({ generatingPhase: 'visuals' }), 3500)
    setTimeout(() => set({ generatingPhase: 'images' }), 4500)

    setTimeout(() => {
      // Create new campaign with generated content
      const id = `campaign-${Date.now()}`
      set((state) => ({
        campaigns: [...state.campaigns, {
          id,
          name: campaignName,
          createdAt: new Date(),
          files: [
            { type: 'research', name: 'research.md', content: createDefaultResearchContent(campaignName), lastModified: new Date() },
            { type: 'hooks', name: 'hooks.md', content: createDefaultHooksContent(campaignName), lastModified: new Date() },
            { type: 'prompts', name: 'prompts.md', content: createDefaultPromptsContent(campaignName), lastModified: new Date() },
          ],
          images: [
            { id: 1, url: `https://picsum.photos/seed/${campaignName}1/400/400`, prompt: 'Generated image 1' },
            { id: 2, url: `https://picsum.photos/seed/${campaignName}2/400/400`, prompt: 'Generated image 2' },
            { id: 3, url: `https://picsum.photos/seed/${campaignName}3/400/400`, prompt: 'Generated image 3' },
            { id: 4, url: `https://picsum.photos/seed/${campaignName}4/400/400`, prompt: 'Generated image 4' },
            { id: 5, url: `https://picsum.photos/seed/${campaignName}5/400/400`, prompt: 'Generated image 5' },
            { id: 6, url: `https://picsum.photos/seed/${campaignName}6/400/400`, prompt: 'Generated image 6' },
          ]
        }],
        activeCampaignId: id,
        isCreatingCampaign: false,
        appState: 'results',
        chatMessages: [
          ...state.chatMessages,
          { id: `msg-${Date.now()}`, role: 'assistant' as const, content: `Created campaign "${campaignName}" with 6 ad concepts. Click on the files in the sidebar to edit research, hooks, or prompts.`, timestamp: new Date(), fileRefs: [], assetRefs: [] }
        ]
      }))
    }, 6000)
  },

  // Chat
  chatMessages: DEMO_MESSAGES,
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date()
    }]
  })),
  clearChatMessages: () => set({ chatMessages: [] }),

  // Assets
  assetFolders: DEMO_FOLDERS,
  selectedFolderId: null,
  setSelectedFolderId: (selectedFolderId) => set({ selectedFolderId }),

  addFolder: (name) => set((state) => ({
    assetFolders: [...state.assetFolders, {
      id: `folder-${Date.now()}`,
      name,
      files: [],
      createdAt: new Date()
    }]
  })),

  removeFolder: (id) => set((state) => ({
    assetFolders: state.assetFolders.filter(f => f.id !== id),
    selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId
  })),

  renameFolder: (id, name) => set((state) => ({
    assetFolders: state.assetFolders.map(f =>
      f.id === id ? { ...f, name } : f
    )
  })),

  addFileToFolder: (folderId, file) => set((state) => ({
    assetFolders: state.assetFolders.map(folder =>
      folder.id === folderId
        ? {
            ...folder,
            files: [...folder.files, {
              ...file,
              id: `file-${Date.now()}`,
              folderId,
              createdAt: new Date()
            }]
          }
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
    appState: 'empty',
    prompt: '',
    generatingPhase: 'research',
    activeCampaignId: null,
    activeFileType: null,
    chatMessages: [],
    selectedFolderId: null
  })
}))
