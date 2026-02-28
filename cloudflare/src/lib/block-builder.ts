// BlockBuilder: Builds the blocks array during streaming for DB persistence.
// Mirrors the client-side block structure so it can be rendered after refresh.
// Verbatim port from server/lib/websocket-handler.ts:254-356.

import type { MessageBlock, ThinkingBlockData, ThinkingChild } from '../db/messages.js';

export class BlockBuilder {
  private blocks: MessageBlock[] = [];
  private currentThinkingBlock: ThinkingBlockData | null = null;
  private idCounter = 0;

  private generateId(): string {
    return `block_${Date.now()}_${++this.idCounter}`;
  }

  /** Open a new thinking block (e.g., when a phase starts) */
  openThinkingBlock(label: string, expectedImages: number = 0): void {
    if (this.currentThinkingBlock) {
      this.closeThinkingBlock('complete');
    }

    this.currentThinkingBlock = {
      type: 'thinking',
      id: this.generateId(),
      label,
      status: 'active',
      expanded: false,
      children: [],
      completedImages: 0,
      expectedImages,
    };
    this.blocks.push(this.currentThinkingBlock);
  }

  /** Add a child to the current thinking block */
  addThinkingChild(kind: ThinkingChild['kind'], text: string, variant?: 'info' | 'success' | 'error'): void {
    if (!this.currentThinkingBlock) {
      this.openThinkingBlock('Processing');
    }

    this.currentThinkingBlock!.children.push({
      id: this.generateId(),
      kind,
      text,
      timestamp: new Date().toISOString(),
      variant,
    });
  }

  /** Update expected images count */
  setExpectedImages(count: number): void {
    if (this.currentThinkingBlock) {
      this.currentThinkingBlock.expectedImages = count;
    }
  }

  /** Increment completed images count */
  incrementCompletedImages(): void {
    if (this.currentThinkingBlock) {
      this.currentThinkingBlock.completedImages++;
    }
  }

  /** Close the current thinking block */
  closeThinkingBlock(status: 'complete' | 'error'): void {
    if (this.currentThinkingBlock) {
      this.currentThinkingBlock.status = status;
      this.currentThinkingBlock = null;
    }
  }

  /** Add a text block (for the final summary) */
  addTextBlock(content: string): void {
    if (content.trim()) {
      this.blocks.push({
        type: 'text',
        id: this.generateId(),
        content,
      });
    }
  }

  /** Add a status block */
  addStatusBlock(text: string, variant: 'info' | 'success' | 'error'): void {
    this.blocks.push({
      type: 'status',
      id: this.generateId(),
      text,
      variant,
    });
  }

  /** Get the final blocks array for persistence */
  getBlocks(): MessageBlock[] {
    if (this.currentThinkingBlock) {
      this.closeThinkingBlock('complete');
    }
    return this.blocks.filter(block => {
      if (block.type === 'thinking') {
        return block.children.length > 0 || block.completedImages > 0;
      }
      return true;
    });
  }
}
