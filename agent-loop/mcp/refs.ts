/**
 * refs MCP — exposes user-uploaded product/reference images to the cell, ported
 * from server/lib/refs-mcp.ts for the standalone agent-loop.
 *
 * Factory reads <runDir>/refs.json per call (so a future upload step can drop
 * one in mid-run). File shape: { references: [{ falUrl, localPath, fileId }] }.
 * For a URL-only Phase-1 run there is no upload, so this returns { references: [] }
 * and the cell renders text-to-image — which is the correct behavior.
 */
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'node:fs';
import * as path from 'node:path';

export function createRefsServer(runDir: string) {
  const refsFile = path.join(runDir, 'refs.json');
  return createSdkMcpServer({
    name: 'refs',
    version: '1.0.0-agentloop',
    tools: [
      tool(
        'get_reference_images',
        'Returns the user-uploaded reference images active for this campaign. Each has a falUrl ' +
          '(pass to generate_ad_images as referenceImageUrls to bind the product), a localPath (Read() to view it), ' +
          'and a fileId. If none are active, returns { references: [] } — proceed in text-to-image mode.',
        {},
        async () => {
          let payload: string;
          try {
            payload = fs.existsSync(refsFile) ? fs.readFileSync(refsFile, 'utf-8') : JSON.stringify({ references: [] });
          } catch (err: any) {
            payload = JSON.stringify({ references: [], error: err?.message });
          }
          return { content: [{ type: 'text' as const, text: payload }] };
        },
      ),
    ],
  });
}
