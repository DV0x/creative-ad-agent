import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'fs';

/**
 * refs MCP server (LOCAL DEV) — exposes campaign-level reference images to the agent.
 *
 * Mirrors cloudflare/sandbox/refs-mcp.ts but reads from a local tmp file since
 * there's no sandbox container. The websocket handler writes this file before
 * each generation; the MCP reads it per-call so mid-session updates are picked up.
 *
 * File shape: { references: [{ falUrl, sandboxPath, fileId }, ...] }
 *   - falUrl: fal.ai public URL (pass to generate_ad_images as referenceImageUrls)
 *   - sandboxPath: absolute local path the agent can Read() to analyze visually
 *   - fileId: original asset_files.id
 */

export const REFS_FILE = '/tmp/creative-agent-refs.json';

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
      },
    ),
  ],
});

console.log('refs MCP server created (LOCAL DEV — reads', REFS_FILE, 'per call)');
