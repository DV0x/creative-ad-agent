/**
 * SDKInstrumentor - Simple instrumentation matching proven sdk_plan.md pattern
 * Tracks events, costs, and metrics from SDK messages
 */

export class SDKInstrumentor {
  private events: any[] = [];
  private agentCalls: any[] = [];
  private toolCalls: any[] = [];
  private campaignId: string;
  private startTime: number;
  private totalCost: number = 0;
  private processedMessageIds = new Set<string>();

  constructor(campaignId: string, url?: string, platform?: string) {
    this.campaignId = campaignId;
    this.startTime = Date.now();
    console.log(`📊 [SDK-INIT] Campaign started: ${campaignId}`);
  }

  /**
   * Simple event logging - matches sdk_plan.md pattern
   */
  logEvent(type: string, data: any): void {
    const event = {
      timestamp: Date.now(),
      type,
      data
    };
    this.events.push(event);
    console.log(`[SDK-${type}]`, data);
  }

  /**
   * Process SDK messages - extract SDK-provided costs automatically
   */
  processMessage(message: any): void {
    // Avoid double-processing parallel messages with same ID
    if (message.id && this.processedMessageIds.has(message.id)) {
      return;
    }

    // Track different message types
    switch (message.type) {
      case 'system':
        if (message.subtype === 'init') {
          this.logEvent('INIT', { sessionId: message.session_id });
        }
        if ('tool_name' in message && message.tool_name) {
          this.toolCalls.push({
            timestamp: Date.now(),
            tool: message.tool_name,
            details: message
          });
          this.logEvent('TOOL', message.tool_name);
        }
        break;

      case 'assistant':
        if (message.usage) {
          this.logEvent('USAGE', {
            tokens: {
              input: message.usage.input_tokens || 0,
              output: message.usage.output_tokens || 0,
              cache_read: message.usage.cache_read_input_tokens || 0,
              cache_write: message.usage.cache_creation_input_tokens || 0
            },
            messageId: message.id
          });
        }
        break;

      case 'result':
        if (message.subtype === 'success') {
          // Extract SDK-provided cost - this is authoritative
          this.totalCost = message.total_cost_usd || 0;

          this.logEvent('COMPLETE', {
            duration: `${message.duration_ms}ms`,
            cost: `$${this.totalCost.toFixed(4)}`,
            turns: message.num_turns || 0,
            usage: message.usage
          });
        }
        break;
    }

    if (message.id) {
      this.processedMessageIds.add(message.id);
    }
  }

  /**
   * Get simple report - matches sdk_plan.md pattern
   */
  getReport(): any {
    const duration = Date.now() - this.startTime;

    return {
      campaignId: this.campaignId,
      totalEvents: this.events.length,
      agentCalls: this.agentCalls.length,
      toolCalls: this.toolCalls.length,
      totalCost: `$${this.totalCost.toFixed(4)}`,
      duration: `${duration}ms`,
      timeline: this.events
    };
  }

  /**
   * Get cost breakdown
   */
  getCostBreakdown(): any {
    return {
      total: this.totalCost,
      totalFormatted: `$${this.totalCost.toFixed(4)}`,
      events: this.events.length,
      tools: this.toolCalls.length,
      agents: this.agentCalls.length
    };
  }

  /**
   * Get detailed metrics
   */
  getCampaignReport(): any {
    const duration = Date.now() - this.startTime;

    return {
      campaignId: this.campaignId,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      totalDuration_ms: duration,
      totalCost_usd: this.totalCost,
      summary: {
        totalEvents: this.events.length,
        totalTools: this.toolCalls.length,
        totalAgents: this.agentCalls.length,
        avgResponseTime_ms: duration / Math.max(1, this.events.length)
      }
    };
  }

  /**
   * Get events timeline
   */
  getEventsTimeline(): any[] {
    return [...this.events];
  }
}