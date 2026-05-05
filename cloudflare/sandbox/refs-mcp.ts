import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'fs';

/**
 * refs MCP server — exposes campaign-level reference images to the agent.
 *
 * Reads /app/refs.json on every call (not closure-bound), so mid-session updates
 * to the campaign's active reference set are picked up automatically (D3).
 *
 * /app/refs.json shape: { references: [{ falUrl, sandboxPath, fileId }, ...] }
 * Written by the DO inside setupSandbox (cold path) and runFollowUpFast (warm path)
 * before the agent processes the next turn.
 */

const REFS_FILE = '/app/refs.json';

export const refsMcpServer = createSdkMcpServer({
  name: 'refs',
  version: '1.0.0',
  tools: [
    tool(
      'get_reference_images',
      'Returns the user-uploaded reference images currently active for this campaign. ' +
      'Each reference includes a falUrl (pass to generate_ad_images as referenceImageUrls), ' +
      'a sandboxPath (use Read() to analyze the image visually), and a fileId. ' +
      'If no references are active, returns { references: [] } and the agent should proceed in text-to-image mode.',
      {},
      async () => {
        let payload: string;
        try {
          if (fs.existsSync(REFS_FILE)) {
            payload = fs.readFileSync(REFS_FILE, 'utf-8');
          } else {
            payload = JSON.stringify({ references: [] });
          }
        } catch (err: any) {
          payload = JSON.stringify({ references: [], error: err?.message });
        }
        return { content: [{ type: 'text', text: payload }] };
      }
    ),
  ],
});

console.log('refs MCP server created (v1.0.0 — disk-backed, reads /app/refs.json per call)');
