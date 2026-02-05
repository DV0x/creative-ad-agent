// Database initialization
export { db, initDatabase, closeDatabase, generateId } from '../database.js';

// Campaigns
export {
  getCampaignsByUser,
  getCampaignById,
  getCampaignBySessionId,
  createCampaign,
  updateCampaignStatus,
  updateCampaignSessionId,
  updateCampaignName,
  deleteCampaign,
  getRecentCampaigns,
  updateSdkSessionId,
  getSdkSessionId,
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
