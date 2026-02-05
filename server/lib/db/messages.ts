import { db, generateId } from '../database.js';

export interface Message {
  id: string;
  campaign_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_refs: string | null;
  file_refs: string | null;
  blocks: string | null;  // JSON array of MessageBlock
  created_at: string;
}

// Block types for structured message content (mirrors client types)
export interface TextBlockData {
  type: 'text';
  id: string;
  content: string;
}

export interface ThinkingChild {
  id: string;
  kind: 'phase' | 'tool' | 'result' | 'progress' | 'error' | 'text' | 'status';
  text: string;
  timestamp: string; // ISO string for JSON serialization
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

export function getMessages(campaignId: string): Message[] {
  return db.prepare(`
    SELECT * FROM messages
    WHERE campaign_id = ?
    ORDER BY created_at ASC
  `).all(campaignId) as Message[];
}

export function getMessage(id: string): Message | undefined {
  return db.prepare(`
    SELECT * FROM messages
    WHERE id = ?
  `).get(id) as Message | undefined;
}

export function addMessage(input: AddMessageInput): Message {
  const { campaignId, role, content, imageRefs, fileRefs, blocks } = input;
  const id = generateId('msg');

  db.prepare(`
    INSERT INTO messages (id, campaign_id, role, content, image_refs, file_refs, blocks)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    campaignId,
    role,
    content,
    imageRefs ? JSON.stringify(imageRefs) : null,
    fileRefs ? JSON.stringify(fileRefs) : null,
    blocks ? JSON.stringify(blocks) : null
  );

  return getMessage(id)!;
}

export function updateMessageContent(id: string, content: string): void {
  db.prepare(`
    UPDATE messages
    SET content = ?
    WHERE id = ?
  `).run(content, id);
}

export function deleteMessage(id: string): void {
  db.prepare(`
    DELETE FROM messages
    WHERE id = ?
  `).run(id);
}

export function getLastAssistantMessage(campaignId: string): Message | undefined {
  return db.prepare(`
    SELECT * FROM messages
    WHERE campaign_id = ? AND role = 'assistant'
    ORDER BY created_at DESC
    LIMIT 1
  `).get(campaignId) as Message | undefined;
}
