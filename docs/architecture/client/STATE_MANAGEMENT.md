# State Management (Zustand Store)

> Part of [Architecture Documentation](../INDEX.md) | **File:** `client/src/store/index.ts` (1,054 lines)

---

## Store Shape

```typescript
interface Store {
  // === App State ===
  appState: 'landing' | 'workspace'

  // === Campaigns ===
  campaigns: Campaign[]
  activeCampaignId: string | null
  generatingCampaignId: string | null
  isCreatingCampaign: boolean
  isFollowUp: boolean                  // true during follow-up generation

  // === "New from Existing" ===
  sourceCampaignId: string | null         // Source campaign to copy research from
  sourceCampaignName: string | null       // Display name of source campaign

  // === Chat Messages ===
  chatMessages: Record<string, ChatMessage[]>
  chatExpanded: boolean
  currentGeneratingMessageId: string | null

  // === WebSocket / Generation ===
  sessionId: string | null
  connectionState: WSConnectionState
  isRecovering: boolean
  error: string | null
  generationExpectedImages: number     // e.g. 6
  prompt: string                       // current input value
  pendingGeneration: boolean           // true after auth redirect

  // === Files (Editor) ===
  activeFileType: 'research' | 'hooks' | 'prompts' | null
  editTab: CampaignFileType            // active editor tab

  // === Images ===
  selectedImageIds: number[]           // image IDs (numbers, not strings)

  // === Assets ===
  assetFolders: AssetFolder[]
  selectedFolderId: string | null

  // === Data Loading ===
  dataLoading: boolean

  // === Internal Buffers ===
  _pendingImages: Record<string, GeneratedImage[]>   // plain objects, not Map
  _pendingFiles: Record<string, Array<{ fileType: CampaignFileType; content: string }>>
}
```

---

## Actions by Category

### App & Navigation

| Action | What it does |
|---|---|
| `setAppState(state)` | Sets `appState` to `'landing'` or `'workspace'` |
| `setActiveCampaignId(id)` | Sets active campaign; clears `activeFileType`, `isCreatingCampaign`, `selectedImageIds` |
| `setIsCreatingCampaign(creating)` | Sets `isCreatingCampaign`; clears `activeCampaignId` when `true` |
| `setSourceCampaign(id, name)` | Sets `sourceCampaignId` + `sourceCampaignName`; enters creating mode. Pass `(null, null)` to clear |
| `setDataLoading(loading)` | Sets `dataLoading` flag |

### Selectors (synchronous getters via `get()`)

| Selector | Returns |
|---|---|
| `getActiveCampaign()` | `Campaign \| null` — finds campaign matching `activeCampaignId` |
| `getGeneratingCampaign()` | `Campaign \| null` — finds campaign matching `generatingCampaignId` |
| `getActiveFileContent()` | `string` — content of the active file type in the active campaign |
| `getSelectedImages()` | `GeneratedImage[]` — images from active campaign matching `selectedImageIds` |
| `getActiveChatMessages()` | `ChatMessage[]` — messages for `activeCampaignId`, or `[]` if none |

### Campaign CRUD

| Action | What it does |
|---|---|
| `addCampaign(name, status, sessionId)` | Creates campaign with generated ID, returns ID |
| `removeCampaign(id)` | Removes from array, clears chatMessages, selects next |
| `renameCampaign(id, name)` | Local rename |
| `replaceCampaignId(oldId, newId)` | Atomic ID swap (campaigns + chatMessages keys) |
| `updateCampaignStatus(id, status)` | Updates campaign status |
| `replaceImage(campaignId, imageId, newImage)` | Replaces image by ID |
| `setFileReady(campaignId, fileType, ready)` | Marks a file type as ready |
| `setCampaigns(campaigns[])` | Bulk set from API, flushes `_pendingImages` and `_pendingFiles` |

### Generation Flow

| Action | What it does |
|---|---|
| `startGeneration(sessionId, name, prompt)` | Creates campaign + user msg + assistant msg. Returns `{ campaignId, messageId }`. Sets `generatingCampaignId`, `appState='workspace'`, `isFollowUp=false` |
| `resumeGeneration(sessionId, campaignId)` | For incomplete campaigns — sets generating state without creating new messages. Returns `{ messageId }` |
| `reconstructForRecovery(sessionId, prompt, campaignId)` | Rebuilds full UI state for mid-generation recovery. Returns `{ messageId }` |
| `cleanupFailedRecovery()` | Clears recovery state when session expired |
| `completeGeneration(campaignId, messageId, summary)` | Clears generating state, sets campaign complete |
| `cancelGeneration(campaignId, messageId)` | Sets campaign cancelled, clears generating state |
| `failGeneration(campaignId, messageId, error)` | Sets campaign error, clears generating state |
| `startFollowUp(campaignId, prompt)` | Adds user msg + assistant msg. Returns `{ campaignId, messageId }`. Sets `isFollowUp=true` |

### Thinking Block Actions

| Action | What it does |
|---|---|
| `openThinkingBlock(campaignId, messageId, label, expectedImages)` | Creates a ThinkingBlockData in the message's blocks |
| `addThinkingChild(campaignId, messageId, child)` | Appends `{ kind, text, variant }` to thinking block children |
| `closeThinkingBlock(campaignId, messageId, status)` | Sets thinking block `status` to `'complete'` or `'error'` |
| `updateThinkingImages(campaignId, messageId, completedImages)` | Updates image counter in thinking block |
| `toggleBlockExpanded(campaignId, messageId, blockId)` | Toggle expand/collapse on any block |

### File Editor

| Action | What it does |
|---|---|
| `setActiveFileType(type)` | Sets which file tab is open (`'research'`, `'hooks'`, `'prompts'`, or `null`) |
| `updateFileContent(type, content)` | Updates file content for the **active campaign** (uses `activeCampaignId`) |
| `setEditTab(tab)` | Sets the active editor tab (`'research'`, `'hooks'`, or `'prompts'`) |

### Image Selection

| Action | What it does |
|---|---|
| `toggleImageSelection(imageId)` | Toggles a single image ID in `selectedImageIds` |
| `clearImageSelection()` | Clears `selectedImageIds` to `[]` |
| `selectImages(imageIds)` | Replaces `selectedImageIds` with the given array |

### Content Updates

| Action | What it does |
|---|---|
| `addImageToCampaign(campaignId, image)` | Adds/replaces image. Buffers to `_pendingImages` if campaign not loaded |
| `updateCampaignFile(campaignId, fileType, content)` | Updates research/hooks/prompts. Buffers to `_pendingFiles` if not loaded |
| `appendMessageContent(campaignId, messageId, text)` | Appends text to message content |
| `appendTextBlock(campaignId, messageId, text)` | Appends text to last TextBlock in message blocks |
| `setMessageContent(campaignId, messageId, content)` | Replaces full message content (not append) |

### Chat Actions

| Action | What it does |
|---|---|
| `addChatMessage(campaignId, message)` | Adds a message (auto-generates `id` and `timestamp`), returns the message ID |
| `clearChatMessages(campaignId?)` | Clears messages for one campaign, or all messages if no argument |
| `setChatExpanded(expanded)` | Sets `chatExpanded` boolean |

### WebSocket / Generation Setters

| Action | What it does |
|---|---|
| `setPrompt(prompt)` | Sets the current prompt input value |
| `setPendingGeneration(pending)` | Sets `pendingGeneration` flag (used after auth redirect) |
| `setSessionId(id)` | Sets `sessionId` |
| `setConnectionState(state)` | Sets `connectionState` (`'connecting'`, `'connected'`, `'disconnected'`) |
| `setIsRecovering(recovering)` | Sets `isRecovering` flag |
| `setError(error)` | Sets `error` string or clears it with `null` |
| `setGenerationExpectedImages(count)` | Sets expected image count for progress tracking |

### Asset Local Actions

| Action | What it does |
|---|---|
| `setSelectedFolderId(id)` | Sets `selectedFolderId` or clears with `null` |
| `addFolder(name)` | Creates a local folder with generated ID |
| `removeFolder(id)` | Removes folder locally; clears `selectedFolderId` if it matched |
| `renameFolder(id, name)` | Renames folder locally |
| `addFileToFolder(folderId, file)` | Adds file to a folder's `files` array |
| `removeFile(fileId)` | Removes file by ID from all folders |

### Reset

| Action | What it does |
|---|---|
| `reset()` | Resets all store state to initial values (landing page, no campaigns, no sessions) |

### Async API Actions

These update store optimistically, then call the REST API:

| Action | API Call |
|---|---|
| `deleteCampaignAsync(id)` | `campaignsApi.delete(id)` |
| `renameCampaignAsync(id, name)` | `campaignsApi.update(id, { name })` |
| `saveFileAsync(campaignId, fileType, content)` | `campaignsApi.updateFile(id, fileType, content)` |
| `createFolderAsync(name)` | `assetsApi.createFolder(name)` |
| `deleteFolderAsync(id)` | `assetsApi.deleteFolder(id)` |
| `renameFolderAsync(id, name)` | `assetsApi.renameFolder(id, name)` |
| `deleteFileAsync(id)` | `assetsApi.deleteFile(id)` |

### Bulk Setters (from API load)

| Action | Notes |
|---|---|
| `setCampaigns(campaigns[])` | Flushes `_pendingImages` and `_pendingFiles` buffers. Preserves active campaign if still exists |
| `setChatMessages(record)` | Skips overwriting if `generatingCampaignId` has existing messages (protects live recovery) |
| `setChatMessagesForCampaign(id, msgs)` | Single campaign message set (used by recovery to merge history + live) |
| `setAssetFolders(folders[])` | Full replace |

---

## Pending Buffer Pattern

Problem: WebSocket events arrive before `setCampaigns()` finishes loading from API.

```
Timeline:
  1. WS connects, generation starts
  2. Server sends image event (campaignId=X)
  3. addImageToCampaign(X, img) — campaign X not in store yet!
  4. setCampaigns([...]) loads from API
  5. Image is lost
```

Solution:

```typescript
addImageToCampaign(campaignId, image) {
  const campaign = state.campaigns.find(c => c.id === campaignId)
  if (!campaign) {
    // Buffer it (plain object, not Map)
    const pending = state._pendingImages[campaignId] || []
    state._pendingImages = { ...state._pendingImages, [campaignId]: [...pending, image] }
    return
  }
  // Apply normally — replace existing image with same id, or append
  campaign.images = [...campaign.images.filter(i => i.id !== image.id), image]
}

setCampaigns(campaigns) {
  // Apply buffered events
  for (const campaign of campaigns) {
    const pendingImgs = state._pendingImages[campaign.id]
    if (pendingImgs) campaign.images.push(...pendingImgs)
    const pendingFiles = state._pendingFiles[campaign.id]
    if (pendingFiles) {
      for (const f of pendingFiles) {
        // Update the matching CampaignFile in campaign.files[]
        const file = campaign.files.find(cf => cf.type === f.fileType)
        if (file) file.content = f.content
      }
    }
  }
  state._pendingImages = {}
  state._pendingFiles = {}
}
```

---

## Campaign ID Remapping

On `startGeneration`, client creates a local ID (e.g., `campaign-1710000000-abc`). When the server ACK arrives with the real server ID, `replaceCampaignId` performs an atomic swap:

```typescript
replaceCampaignId(oldId, newId) {
  // Update campaigns array
  campaign.id = newId

  // Update chatMessages map
  chatMessages[newId] = chatMessages[oldId]
  delete chatMessages[oldId]

  // Update active/generating references
  if (activeCampaignId === oldId) activeCampaignId = newId
  if (generatingCampaignId === oldId) generatingCampaignId = newId
}
```

---

## Helper Functions

```typescript
generateId(prefix: string): string
  → `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

generateBlockId(prefix: string): string
  → `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`

parseExpectedImageCount(prompt: string): number
  → Extracts "X ads" or "N images" from prompt text
  → Supports digit ("3 ads") and word ("two images") patterns
  → Returns 6 for generation requests (has URL or generation keywords)
  → Returns 0 for plain chat messages
```

---

## Types

```typescript
// client/src/store/index.ts
Campaign {
  id: string
  name: string
  createdAt: Date                // Date object, not string
  files: CampaignFile[]          // { type, name, content, lastModified }
  images: GeneratedImage[]
  status: CampaignStatus         // 'generating' | 'complete' | 'incomplete' | 'error' | 'cancelled'
  filesReady: FilesReadyState    // { research: boolean, hooks: boolean, prompts: boolean }
  sessionId?: string             // optional — set on creation
}

// client/src/types/chat.ts
ChatMessage {
  id: string
  campaignId?: string            // optional — links message to its campaign
  role: 'user' | 'assistant'
  content: string
  timestamp: Date                // Date object, not string
  blocks?: MessageBlock[]
  imageRefs?: ImageReference[]   // { imageId: number, hookType?: HookType }
  fileRefs?: FileReference[]     // { fileType: 'research' | 'hooks' | 'prompts' }
  assetRefs?: string[]           // Asset folder IDs
}

MessageBlock = TextBlockData | ThinkingBlockData | StatusBlockData

ThinkingBlockData {
  id: string
  type: 'thinking'
  label: string
  status: 'active' | 'complete' | 'error'   // NO 'running' or 'cancelled'
  expanded: boolean                           // NOT 'isExpanded'
  children: ThinkingChild[]
  expectedImages: number
  completedImages: number
}

ThinkingChild {
  id: string
  kind: 'phase' | 'tool' | 'result' | 'progress' | 'error' | 'text' | 'status'
  text: string
  timestamp: Date
  variant?: 'info' | 'success' | 'error'    // for 'status' kind
}

GeneratedImage {
  id: number           // 1-6 (image index)
  url: string
  prompt: string
  hookType: HookType
  version: number
}

HookType = 'stat' | 'story' | 'fomo' | 'curiosity' | 'callout' | 'contrast'
```

---

## See Also

- [Client Architecture](./CLIENT_ARCHITECTURE.md) — Component tree, app flow
- [WebSocket Client](./WEBSOCKET_CLIENT.md) — How events populate the store
