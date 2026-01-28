import { db, generateId } from '../database.js';

export interface Message {
  id: string;
  campaign_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_refs: string | null;
  file_refs: string | null;
  created_at: string;
}

export interface AddMessageInput {
  campaignId: string;
  role: 'user' | 'assistant';
  content: string;
  imageRefs?: string[];
  fileRefs?: string[];
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
  const { campaignId, role, content, imageRefs, fileRefs } = input;
  const id = generateId('msg');

  db.prepare(`
    INSERT INTO messages (id, campaign_id, role, content, image_refs, file_refs)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    campaignId,
    role,
    content,
    imageRefs ? JSON.stringify(imageRefs) : null,
    fileRefs ? JSON.stringify(fileRefs) : null
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
