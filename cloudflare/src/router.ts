import type { Env } from './env.js';
import { authenticateRequest } from './auth.js';
import { handleHealthRequest } from './routes/health.js';
import { handleImageRequest } from './routes/images.js';
import * as campaigns from './routes/campaigns.js';
import * as recovery from './routes/recovery.js';
import * as assets from './routes/assets.js';

/**
 * Route dispatcher for REST API and image serving.
 * Handles CORS, auth, and path matching.
 */
export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return corsResponse(new Response(null, { status: 204 }));
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // --- Unauthenticated routes ---

  if (path === '/health') {
    return corsResponse(await handleHealthRequest(env));
  }

  // --- Authenticated routes ---

  const authResult = await authenticateRequest(request, env);
  if (authResult instanceof Response) {
    return corsResponse(authResult);
  }
  const userId = authResult;

  // --- Image serving ---
  if (path.startsWith('/images/')) {
    return corsResponse(await handleImageRequest(request, env, userId));
  }

  // --- Campaign routes: /api/campaigns/* ---
  if (path.startsWith('/api/campaigns')) {
    return corsResponse(await routeCampaigns(request, env, userId, path, method));
  }

  // --- Asset routes: /api/assets/* ---
  if (path.startsWith('/api/assets')) {
    return corsResponse(await routeAssets(request, env, userId, path, method));
  }

  return corsResponse(new Response('Not Found', { status: 404 }));
}

// ============================================
// Campaign sub-router
// ============================================

async function routeCampaigns(
  request: Request,
  env: Env,
  userId: string,
  path: string,
  method: string,
): Promise<Response> {
  // Strip prefix: /api/campaigns → ""
  const sub = path.replace('/api/campaigns', '');

  // GET /api/campaigns
  if (sub === '' && method === 'GET') {
    return campaigns.listCampaigns(env, userId);
  }

  // POST /api/campaigns
  if (sub === '' && method === 'POST') {
    return campaigns.createCampaign(request, env, userId);
  }

  // Match /:id patterns
  const idMatch = sub.match(/^\/([^/]+)$/);
  if (idMatch) {
    const campaignId = idMatch[1];
    if (method === 'GET') return campaigns.getCampaign(env, userId, campaignId);
    if (method === 'PATCH') return campaigns.updateCampaign(request, env, userId, campaignId);
    if (method === 'DELETE') return campaigns.deleteCampaign(env, userId, campaignId);
  }

  // Match /:id/files/:type
  const filesMatch = sub.match(/^\/([^/]+)\/files\/([^/]+)$/);
  if (filesMatch) {
    const [, campaignId, fileType] = filesMatch;
    if (method === 'GET') return campaigns.getCampaignFile(env, userId, campaignId, fileType);
    if (method === 'PUT')
      return campaigns.updateCampaignFile(request, env, userId, campaignId, fileType);
  }

  // Match /:id/images
  const imagesMatch = sub.match(/^\/([^/]+)\/images$/);
  if (imagesMatch) {
    const campaignId = imagesMatch[1];
    if (method === 'GET') return campaigns.getCampaignImages(env, userId, campaignId);
  }

  // Match /:id/messages
  const messagesMatch = sub.match(/^\/([^/]+)\/messages$/);
  if (messagesMatch) {
    const campaignId = messagesMatch[1];
    if (method === 'GET') return campaigns.getCampaignMessages(env, userId, campaignId);
    if (method === 'POST')
      return campaigns.addCampaignMessage(request, env, userId, campaignId);
  }

  // Match /:id/status
  const statusMatch = sub.match(/^\/([^/]+)\/status$/);
  if (statusMatch) {
    const campaignId = statusMatch[1];
    if (method === 'GET') return campaigns.getCampaignStatus(env, userId, campaignId);
  }

  // Match /:id/recover
  const recoverMatch = sub.match(/^\/([^/]+)\/recover$/);
  if (recoverMatch) {
    if (method === 'POST') return recovery.recoverCampaign(env, userId, recoverMatch[1]);
  }

  return new Response('Not Found', { status: 404 });
}

// ============================================
// Asset sub-router
// ============================================

async function routeAssets(
  request: Request,
  env: Env,
  userId: string,
  path: string,
  method: string,
): Promise<Response> {
  const sub = path.replace('/api/assets', '');

  // GET /api/assets/folders
  if (sub === '/folders' && method === 'GET') {
    return assets.listFolders(env, userId);
  }

  // POST /api/assets/folders
  if (sub === '/folders' && method === 'POST') {
    return assets.createFolder(request, env, userId);
  }

  // POST /api/assets/upload
  if (sub === '/upload' && method === 'POST') {
    return assets.uploadFile(request, env, userId);
  }

  // Match /folders/:id
  const folderIdMatch = sub.match(/^\/folders\/([^/]+)$/);
  if (folderIdMatch) {
    const folderId = folderIdMatch[1];
    if (method === 'PATCH') return assets.renameFolder(request, env, userId, folderId);
    if (method === 'DELETE') return assets.deleteFolder(env, userId, folderId);
  }

  // Match /folders/:id/files
  const folderFilesMatch = sub.match(/^\/folders\/([^/]+)\/files$/);
  if (folderFilesMatch) {
    const folderId = folderFilesMatch[1];
    if (method === 'GET') return assets.listFolderFiles(env, userId, folderId);
  }

  // Match /files/:id
  const fileIdMatch = sub.match(/^\/files\/([^/]+)$/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[1];
    if (method === 'GET') return assets.serveFile(env, userId, fileId);
    if (method === 'DELETE') return assets.deleteFile(env, userId, fileId);
  }

  return new Response('Not Found', { status: 404 });
}

// ============================================
// CORS
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function corsResponse(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
