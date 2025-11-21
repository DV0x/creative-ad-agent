import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * SessionManager - Handles SDK session lifecycle and persistence
 * Based on Claude SDK session management patterns
 */

export interface SessionInfo {
  id: string;
  sdkSessionId?: string;  // The actual SDK session ID
  createdAt: Date;
  lastAccessedAt: Date;
  metadata: {
    url?: string;
    campaignName?: string;
    status: 'active' | 'completed' | 'error';
    messageCount: number;
    context?: any;
    // Fork-related metadata
    forkedFrom?: string;  // Base session ID if this is a fork
    forkTimestamp?: string;  // When this fork was created
    forkPurpose?: string;  // Why this fork was created (e.g., "emotional-angle-variant")
  };
  messages: any[];  // Store message history
  turnCount: number;
}

export class SessionManager {
  private sessions = new Map<string, SessionInfo>();
  private sessionDirectory: string;
  private maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
  private maxInactiveTime = 60 * 60 * 1000; // 1 hour
  private autoSave: boolean;

  constructor(options: {
    sessionDirectory?: string;
    autoSave?: boolean;
    maxSessionAge?: number;
  } = {}) {
    this.sessionDirectory = options.sessionDirectory || path.join(process.cwd(), 'sessions');
    this.autoSave = options.autoSave ?? true;
    this.maxSessionAge = options.maxSessionAge || this.maxSessionAge;

    // Initialize session directory
    this.initializeStorage();

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Create a new session
   */
  async createSession(metadata: Partial<SessionInfo['metadata']> = {}): Promise<SessionInfo> {
    const sessionId = `session_${randomUUID()}`;

    const session: SessionInfo = {
      id: sessionId,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      metadata: {
        status: 'active',
        messageCount: 0,
        ...metadata
      },
      messages: [],
      turnCount: 0
    };

    this.sessions.set(sessionId, session);

    if (this.autoSave) {
      await this.saveSession(sessionId);
    }

    console.log(`📁 Created new session: ${sessionId}`);
    return session;
  }

  /**
   * Get or create a session
   */
  async getOrCreateSession(sessionId?: string, metadata?: Partial<SessionInfo['metadata']>): Promise<SessionInfo> {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.lastAccessedAt = new Date();
      return session;
    }

    // Try to load from disk if not in memory
    if (sessionId) {
      const loaded = await this.loadSession(sessionId);
      if (loaded) {
        return loaded;
      }
    }

    // Create new session
    return this.createSession(metadata);
  }

  /**
   * Update session with SDK session ID
   * Called when we receive the system.init message
   */
  async updateSdkSessionId(sessionId: string, sdkSessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.sdkSessionId = sdkSessionId;
    session.lastAccessedAt = new Date();

    console.log(`🔗 Linked SDK session: ${sessionId} -> ${sdkSessionId}`);

    if (this.autoSave) {
      await this.saveSession(sessionId);
    }
  }

  /**
   * Add a message to session history
   */
  async addMessage(sessionId: string, message: any): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.messages.push(message);
    session.metadata.messageCount = session.messages.length;
    session.lastAccessedAt = new Date();

    // Track turn count for assistant messages
    if (message.type === 'assistant') {
      session.turnCount++;
    }

    // Update metadata based on message type
    if (message.type === 'system' && message.subtype === 'init') {
      if (message.session_id) {
        session.sdkSessionId = message.session_id;
      }
    }

    if (this.autoSave && session.messages.length % 10 === 0) {
      // Auto-save every 10 messages
      await this.saveSession(sessionId);
    }
  }

  /**
   * Get resume options for SDK query
   */
  getResumeOptions(sessionId: string): { resume?: string } {
    const session = this.sessions.get(sessionId);
    if (!session || !session.sdkSessionId) {
      return {};
    }

    return { resume: session.sdkSessionId };
  }

  /**
   * Save session to disk
   */
  private async saveSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      const filePath = path.join(this.sessionDirectory, `${sessionId}.json`);
      await fs.writeFile(filePath, JSON.stringify(session, null, 2));
      console.log(`💾 Saved session: ${sessionId}`);
    } catch (error) {
      console.error(`Failed to save session ${sessionId}:`, error);
    }
  }

  /**
   * Load session from disk
   */
  private async loadSession(sessionId: string): Promise<SessionInfo | null> {
    try {
      const filePath = path.join(this.sessionDirectory, `${sessionId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const session = JSON.parse(data) as SessionInfo;

      // Convert date strings back to Date objects
      session.createdAt = new Date(session.createdAt);
      session.lastAccessedAt = new Date(session.lastAccessedAt);

      this.sessions.set(sessionId, session);
      console.log(`📂 Loaded session: ${sessionId}`);

      return session;
    } catch (error) {
      return null;
    }
  }

  /**
   * Initialize storage directory
   */
  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.sessionDirectory, { recursive: true });
      console.log(`📁 Session directory ready: ${this.sessionDirectory}`);
    } catch (error) {
      console.error('Failed to create session directory:', error);
    }
  }

  /**
   * Clean up old sessions
   */
  private async cleanupSessions(): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, session] of this.sessions.entries()) {
      const age = now - session.createdAt.getTime();
      const inactiveTime = now - session.lastAccessedAt.getTime();

      if (age > this.maxSessionAge ||
          (inactiveTime > this.maxInactiveTime && session.metadata.status !== 'active')) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.sessions.delete(id);
      try {
        const filePath = path.join(this.sessionDirectory, `${id}.json`);
        await fs.unlink(filePath);
        console.log(`🗑️ Cleaned up session: ${id}`);
      } catch (error) {
        // File might not exist, ignore
      }
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupSessions();
    }, 60 * 60 * 1000);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): SessionInfo[] {
    return Array.from(this.sessions.values())
      .filter(s => s.metadata.status === 'active')
      .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime());
  }

  /**
   * Complete a session
   */
  async completeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.metadata.status = 'completed';
    session.lastAccessedAt = new Date();

    if (this.autoSave) {
      await this.saveSession(sessionId);
    }

    console.log(`✅ Session completed: ${sessionId}`);
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      sdkSessionId: session.sdkSessionId,
      duration: Date.now() - session.createdAt.getTime(),
      messageCount: session.messages.length,
      turnCount: session.turnCount,
      status: session.metadata.status,
      lastActive: session.lastAccessedAt,
      // Fork information
      isFork: !!session.metadata.forkedFrom,
      forkedFrom: session.metadata.forkedFrom,
      forkTimestamp: session.metadata.forkTimestamp,
      forkPurpose: session.metadata.forkPurpose
    };
  }

  /**
   * Get all forks of a session
   * Useful for comparing different creative variants
   */
  getSessionForks(baseSessionId: string): SessionInfo[] {
    return Array.from(this.sessions.values())
      .filter(s => s.metadata.forkedFrom === baseSessionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Get session family tree
   * Returns base session + all forks for comparison
   */
  getSessionFamily(sessionId: string): {
    baseSession: SessionInfo | null;
    forks: SessionInfo[];
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { baseSession: null, forks: [] };
    }

    // If this is a fork, get the base session
    const baseSessionId = session.metadata.forkedFrom || sessionId;
    const baseSession = this.sessions.get(baseSessionId);

    // Get all forks of the base session
    const forks = this.getSessionForks(baseSessionId);

    return {
      baseSession: baseSession || null,
      forks
    };
  }
}

// Export singleton instance for convenience
export const sessionManager = new SessionManager();