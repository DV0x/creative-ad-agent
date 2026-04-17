// Utilities
export { generateId } from './utils.js';

// Campaigns
export {
  getCampaignsByUser,
  getCampaignById,
  getCampaignBySessionId,
  createCampaign,
  updateCampaignStatus,
  updateCampaignSessionId,
  updateCampaignName,
  updateCampaignBrand,
  deleteCampaign,
  updateSdkSessionId,
  getSdkSessionId,
  getRecentCampaigns,
  type Campaign,
} from './campaigns.js';

// Campaign Files
export {
  getCampaignFiles,
  getCampaignFile,
  updateCampaignFile,
  markFileReady,
  areAllFilesReady,
  type CampaignFile,
  type FileType,
} from './files.js';

// Campaign Images
export {
  getCampaignImages,
  getLatestCampaignImages,
  addCampaignImage,
  getImageCount,
  getMaxImageIndex,
  deleteImage,
  type CampaignImage,
  type HookType,
  type AddImageInput,
} from './images.js';

// Messages
export {
  getMessages,
  getMessage,
  addMessage,
  updateMessageContent,
  deleteMessage,
  getLastAssistantMessage,
  type Message,
  type AddMessageInput,
  type MessageBlock,
  type TextBlockData,
  type ThinkingBlockData,
  type ThinkingChild,
  type StatusBlockData,
} from './messages.js';

// Credits
export {
  getOrCreateCredits,
  getBalance,
  recordUsage,
  addPlanCredits,
  addTopupCredits,
  setPlanBalance,
  refundCredits,
  getPaymentCredit,
  getUsageLog,
  type UserCredits,
  type UsageLogEntry,
  type RecordUsageInput,
} from './credits.js';

// Events
export {
  trackEvent,
  getEvents,
  type UserEvent,
} from './events.js';

// Assets
export {
  getFoldersByUser,
  getFolder,
  createFolder,
  renameFolder,
  deleteFolder,
  getFilesByFolder,
  getFile,
  addFile,
  deleteFile as deleteAssetFile,
  getFilesCount,
  type AssetFolder,
  type AssetFile,
} from './assets.js';
