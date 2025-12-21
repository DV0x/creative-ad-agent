#!/usr/bin/env npx tsx
/**
 * Art Style Skill - Image Generation Script
 *
 * Generates images using Gemini 3 Pro Image Preview API.
 * Called by the art-style skill after prompt generation.
 *
 * Note: Run via run-generate.sh which sets up the correct NODE_PATH.
 * IDE type errors can be ignored - the script runs from server/ directory.
 *
 * Usage:
 *   tsx agent/.claude/skills/art-style/tools/generate-images.ts \
 *     --input prompts.json \
 *     --output ./generated-images \
 *     --session my-session-id
 *
 * Or with inline prompts:
 *   tsx agent/.claude/skills/art-style/tools/generate-images.ts \
 *     --prompt "prompt text here" \
 *     --aspect "1:1" \
 *     --size "2K"
 *
 * Rate Limits:
 *   - 1 second delay between image generations
 *   - Max 6 images per run (for 6 ad concepts)
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limit: 1 second between requests
const RATE_LIMIT_MS = 1000;

// Supported aspect ratios
const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'] as const;
type AspectRatio = typeof ASPECT_RATIOS[number];

// Supported image sizes
const IMAGE_SIZES = ['1K', '2K', '4K'] as const;
type ImageSize = typeof IMAGE_SIZES[number];

interface PromptConfig {
  prompt: string;
  filename?: string;  // Readable filename derived from hook concept
  aspectRatio?: AspectRatio;
  size?: ImageSize;
  style?: string;
}

interface GenerationResult {
  success: boolean;
  index: number;
  filename?: string;
  filepath?: string;
  url?: string;
  prompt: string;
  aspectRatio: string;
  size: string;
  sizeKB?: number;
  error?: string;
  duration?: number;
}

/**
 * Sanitize filename to remove unsafe characters
 */
function sanitizeFilename(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}

/**
 * Parse command line arguments
 */
function parseArgs(): {
  input?: string;
  output: string;
  session?: string;
  prompt?: string;
  aspect: AspectRatio;
  size: ImageSize;
  style?: string;
} {
  const args = process.argv.slice(2);
  const result: any = {
    output: path.resolve(process.cwd(), 'generated-images'),
    aspect: '1:1',
    size: '2K'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--input':
      case '-i':
        result.input = next;
        i++;
        break;
      case '--output':
      case '-o':
        result.output = path.resolve(process.cwd(), next);
        i++;
        break;
      case '--session':
      case '-s':
        result.session = next;
        i++;
        break;
      case '--prompt':
      case '-p':
        result.prompt = next;
        i++;
        break;
      case '--aspect':
      case '-a':
        if (ASPECT_RATIOS.includes(next as AspectRatio)) {
          result.aspect = next;
        }
        i++;
        break;
      case '--size':
        if (IMAGE_SIZES.includes(next as ImageSize)) {
          result.size = next;
        }
        i++;
        break;
      case '--style':
        result.style = next;
        i++;
        break;
      case '--help':
      case '-h':
        console.log(`
Art Style Image Generator

Usage:
  tsx generate-images.ts [options]

Options:
  --input, -i     Path to JSON file with prompts array
  --output, -o    Output directory (default: ./generated-images)
  --session, -s   Session ID for organizing images
  --prompt, -p    Single prompt (alternative to --input)
  --aspect, -a    Aspect ratio: 1:1, 9:16, 16:9, etc. (default: 1:1)
  --size          Image size: 1K, 2K, 4K (default: 2K)
  --style         Style to apply to all prompts
  --help, -h      Show this help

Examples:
  # From JSON file
  tsx generate-images.ts --input prompts.json --session campaign-123

  # Single prompt
  tsx generate-images.ts --prompt "A clay house..." --aspect 1:1 --size 2K
`);
        process.exit(0);
    }
  }

  return result;
}

/**
 * Load prompts from JSON file
 */
function loadPrompts(inputPath: string): PromptConfig[] {
  const fullPath = path.resolve(process.cwd(), inputPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Input file not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const data = JSON.parse(content);

  // Handle both array of strings and array of objects
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'string') {
        return { prompt: item };
      }
      return item as PromptConfig;
    });
  }

  // Handle single object with prompts array
  if (data.prompts && Array.isArray(data.prompts)) {
    return data.prompts.map((item: any) => {
      if (typeof item === 'string') {
        return { prompt: item };
      }
      return item as PromptConfig;
    });
  }

  throw new Error('Invalid input format. Expected array of prompts or { prompts: [...] }');
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(outputPath: string, sessionId?: string): string {
  const dir = sessionId ? path.join(outputPath, sessionId) : outputPath;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created output directory: ${dir}`);
  }

  return dir;
}

/**
 * Generate a single image
 */
async function generateImage(
  ai: GoogleGenAI,
  config: PromptConfig,
  outputDir: string,
  index: number,
  timestamp: number,
  defaultAspect: AspectRatio,
  defaultSize: ImageSize,
  globalStyle?: string
): Promise<GenerationResult> {
  const aspectRatio = config.aspectRatio || defaultAspect;
  const imageSize = config.size || defaultSize;
  const style = config.style || globalStyle;

  // Enhance prompt with style
  let enhancedPrompt = config.prompt;
  if (style) {
    enhancedPrompt = `${config.prompt}. Style: ${style}.`;
  }

  console.log(`\n🖼️  Generating image ${index + 1}...`);
  console.log(`   Aspect: ${aspectRatio} | Size: ${imageSize}`);
  console.log(`   Prompt: ${config.prompt.substring(0, 80)}...`);

  const startTime = Date.now();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [{ text: enhancedPrompt }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize,
        },
      },
    });

    const duration = Date.now() - startTime;

    // Extract image from response
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates in response');
    }

    const candidate = response.candidates[0];
    if (!candidate?.content?.parts) {
      throw new Error('Invalid response structure');
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const base64Data = part.inlineData.data;
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate filename - use provided filename or fall back to sanitized prompt
        const baseFilename = config.filename
          ? sanitizeFilename(config.filename)
          : sanitizeFilename(config.prompt);
        const filename = `${index + 1}_${baseFilename}.png`;
        const filepath = path.join(outputDir, filename);

        // Save image
        fs.writeFileSync(filepath, buffer);

        const sizeKB = Math.round(buffer.length / 1024);
        console.log(`   ✅ Saved: ${filename} (${sizeKB}KB, ${duration}ms)`);

        return {
          success: true,
          index: index + 1,
          filename,
          filepath,
          url: `http://localhost:3001/images/${path.basename(outputDir)}/${filename}`,
          prompt: config.prompt,
          aspectRatio,
          size: imageSize,
          sizeKB,
          duration
        };
      }
    }

    throw new Error('No image data in response');

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ Failed: ${error.message}`);

    return {
      success: false,
      index: index + 1,
      prompt: config.prompt,
      aspectRatio,
      size: imageSize,
      error: error.message,
      duration
    };
  }
}

/**
 * Main generation function
 */
async function main() {
  console.log('🎨 Art Style Image Generator');
  console.log('=' .repeat(50));

  // Parse arguments
  const args = parseArgs();

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    console.error('   Set it in .env file or export GEMINI_API_KEY=your-key');
    process.exit(1);
  }
  console.log('✅ API key loaded');

  // Load prompts
  let prompts: PromptConfig[];

  if (args.input) {
    console.log(`📄 Loading prompts from: ${args.input}`);
    prompts = loadPrompts(args.input);
  } else if (args.prompt) {
    prompts = [{ prompt: args.prompt }];
  } else {
    console.error('❌ No prompts provided. Use --input or --prompt');
    process.exit(1);
  }

  console.log(`📝 Loaded ${prompts.length} prompt(s)`);

  // Setup output directory
  const outputDir = ensureOutputDir(args.output, args.session);
  console.log(`📁 Output directory: ${outputDir}`);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey });
  const timestamp = Date.now();
  const results: GenerationResult[] = [];

  // Generate images with rate limiting
  console.log(`\n⏳ Generating ${prompts.length} images (1s delay between requests)...`);

  for (let i = 0; i < prompts.length; i++) {
    const result = await generateImage(
      ai,
      prompts[i],
      outputDir,
      i,
      timestamp,
      args.aspect,
      args.size,
      args.style
    );
    results.push(result);

    // Rate limit (skip delay after last image)
    if (i < prompts.length - 1) {
      console.log(`   ⏱️  Rate limit: waiting ${RATE_LIMIT_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }
  }

  // Summary
  const successCount = results.filter(r => r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

  console.log('\n' + '=' .repeat(50));
  console.log('📊 Generation Summary');
  console.log(`   Total: ${prompts.length} | Success: ${successCount} | Failed: ${prompts.length - successCount}`);
  console.log(`   Total time: ${totalDuration}ms`);

  // Output results as JSON (for skill to parse)
  const output = {
    success: successCount > 0,
    totalRequested: prompts.length,
    totalGenerated: successCount,
    outputDirectory: outputDir,
    images: results
  };

  // Write results to file
  const resultsPath = path.join(outputDir, `results_${timestamp}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(output, null, 2));
  console.log(`\n📄 Results saved to: ${resultsPath}`);

  // Print JSON for skill parsing
  console.log('\n--- JSON OUTPUT ---');
  console.log(JSON.stringify(output, null, 2));
  console.log('--- END OUTPUT ---');

  process.exit(successCount > 0 ? 0 : 1);
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
