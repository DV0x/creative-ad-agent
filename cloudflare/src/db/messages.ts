import { generateId } from './utils.js';

export interface Message {
  id: string;
  campaign_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_refs: string | null;
  file_refs: string | null;
  blocks: string | null;
  created_at: string;
}

export interface TextBlockData {
  type: 'text';
  id: string;
  content: string;
}

export interface ThinkingChild {
  id: string;
  kind: 'phase' | 'tool' | 'result' | 'progress' | 'error' | 'text' | 'status';
  text: string;
  timestamp: string;
  variant?: 'info' | 'success' | 'error';
}

export interface ThinkingBlockData {
  type: 'thinking';
  id: string;
  label: string;
  status: 'active' | 'complete' | 'error';
  expanded: boolean;
  children: ThinkingChild[];
  completedImages: number;
  expectedImages: number;
}

export interface StatusBlockData {
  type: 'status';
  id: string;
  text: string;
  variant: 'info' | 'success' | 'error';
}

export type MessageBlock = TextBlockData | ThinkingBlockData | StatusBlockData;

export interface AddMessageInput {
  campaignId: string;
  role: 'user' | 'assistant';
  content: string;
  imageRefs?: string[];
  fileRefs?: string[];
  blocks?: MessageBlock[];
}

export async function getMessages(db: D1Database, campaignId: string): Promise<Message[]> {
  const result = await db.prepare(`
    SELECT * FROM messages
    WHERE campaign_id = ?
    ORDER BY created_at ASC
  `).bind(campaignId).all<Message>();
  return result.results;
}

export async function getMessage(db: D1Database, id: string): Promise<Message | null> {
  return await db.prepare(`
    SELECT * FROM messages WHERE id = ?
  `).bind(id).first<Message>();
}

export async function addMessage(db: D1Database, input: AddMessageInput): Promise<Message> {
  const { campaignId, role, content, imageRefs, fileRefs, blocks } = input;
  const id = generateId('msg');

  await db.prepare(`
    INSERT INTO messages (id, campaign_id, role, content, image_refs, file_refs, blocks)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    campaignId,
    role,
    content,
    imageRefs ? JSON.stringify(imageRefs) : null,
    fileRefs ? JSON.stringify(fileRefs) : null,
    blocks ? JSON.stringify(blocks) : null
  ).run();

  return (await getMessage(db, id))!;
}

export async function updateMessageContent(db: D1Database, id: string, content: string): Promise<void> {
  await db.prepare(`
    UPDATE messages SET content = ? WHERE id = ?
  `).bind(content, id).run();
}

export async function deleteMessage(db: D1Database, id: string): Promise<void> {
  await db.prepare(`
    DELETE FROM messages WHERE id = ?
  `).bind(id).run();
}

export async function getLastAssistantMessage(db: D1Database, campaignId: string): Promise<Message | null> {
  return await db.prepare(`
    SELECT * FROM messages
    WHERE campaign_id = ? AND role = 'assistant'
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(campaignId).first<Message>();
}
