import { fal } from '@fal-ai/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Balanced prompts: Text primary + visual support
const prompts = [
  {
    name: "concept_1_balanced",
    prompt: `Create a 1:1 social media ad for a mortgage broker.

HEADLINE TEXT:
"Your bank is betting you won't read this." — render in bold white sans-serif, upper third of composition, centered, large and confrontational.

CTA TEXT:
"See what they're not showing you" — render in coral (#E8846B), bottom-center, medium weight.

VISUAL ELEMENTS:
A 3D clay hand making a "stop" gesture, palm facing viewer, in muted gray clay. Positioned center-right, slightly below the headline. The hand represents the bank blocking information.

COMPOSITION:
- Headline dominates upper third
- Clay hand in center as visual anchor
- CTA at bottom
- Deep teal (#00707F) background
- 10px coral border framing composition

STYLE:
Soft brutalism. Clay hand has finger-pressed texture, matte finish, soft shadow. The gray hand contrasts with the warm teal background.

The mood is confrontational but empowering — exposing what's hidden.`
  },
  {
    name: "concept_2_balanced",
    prompt: `Create a 1:1 social media ad for a mortgage broker serving self-employed Canadians.

HEADLINE TEXT:
"Your business pays your bills. Why can't it buy you a home?" — render in bold charcoal (#2D2D2D) sans-serif, upper portion, left-aligned, two lines.

CTA TEXT:
"Get the approval you've earned" — render in teal (#00707F), bottom-left, confident weight.

VISUAL ELEMENTS:
A small 3D clay storefront or shop building in terracotta, with a tiny "OPEN" sign. Next to it, a clay house key. Both objects positioned in the lower-right quadrant, showing the connection between business and home ownership.

COMPOSITION:
- Headline in upper-left, taking 40% of space
- Clay objects clustered lower-right
- Light cyan (#C3E1E2) background
- 10px teal border
- 40% negative space

STYLE:
Soft brutalism. Clay objects have warm terracotta color, handmade texture with visible fingerprints. Soft shadows grounding them.

The mood is validation — your business success SHOULD translate to home ownership.`
  },
  {
    name: "concept_4_balanced",
    prompt: `Create a 1:1 social media ad for a mortgage broker with a rate guarantee.

HEADLINE TEXT:
"Find a lower rate. Anywhere. We'll pay you $500." — render in bold charcoal (#2D2D2D) sans-serif, top portion, centered, three punchy lines stacked.

CTA TEXT:
"Test us" — render in bold teal (#00707F), bottom-right corner, daring.

VISUAL ELEMENTS:
A large 3D clay "$500" in terracotta, finger-pressed texture, positioned center. Below it, a small clay magnifying glass examining the number — representing the challenge to find a better rate.

COMPOSITION:
- Headline at top (30% of space)
- Clay $500 and magnifying glass as centerpiece (40%)
- CTA bottom-right
- Cream (#F5F0E8) background
- 10px teal border

STYLE:
Soft brutalism. The $500 is the hero visual — bold, tangible, real. Clay has depth, soft shadows, matte finish.

The mood is bold confidence — we're so sure we're daring you to try.`
  },
  {
    name: "concept_5_balanced",
    prompt: `Create a 1:1 social media ad for first-time homebuyers.

HEADLINE TEXT:
"First home? You're allowed to not know what you're doing." — render in bold white sans-serif, upper third, left-aligned, warm and reassuring tone.

CTA TEXT:
"Ask anything. Seriously." — render in sage green (#87A087), bottom-left, friendly weight.

VISUAL ELEMENTS:
A simple 3D clay doorway in terracotta, slightly open with warm amber glow coming through. A small clay question mark floats near the door. Positioned in the lower-right area.

COMPOSITION:
- Headline upper-left (40% of width)
- Clay doorway and question mark lower-right
- Soft cream (#F5F0E8) background
- 8px terracotta border
- Generous negative space (50%)

STYLE:
Soft brutalism with gentle touch. Clay is rounded, approachable, handmade. The amber glow through the door suggests warmth and welcome.

The mood is permission and comfort — it's okay to have questions.`
  }
];

async function generateImages() {
  console.log('🎨 Testing Balanced Prompts: Text + Visuals');
  console.log('='.repeat(60));

  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    console.error('❌ FAL_KEY not found in .env');
    process.exit(1);
  }
  console.log('✅ API key loaded\n');

  fal.config({ credentials: apiKey });

  const outputDir = path.join(__dirname, '..', 'generated-images', 'test-balanced');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const { name, prompt } of prompts) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Generating: ${name}`);
    console.log(`${'='.repeat(60)}`);
    console.log('\n⏳ Generating...');

    const startTime = Date.now();

    try {
      const result = await fal.subscribe("fal-ai/nano-banana-pro", {
        input: {
          prompt: prompt,
          num_images: 1,
          aspect_ratio: '1:1',
          resolution: '2K',
          output_format: 'png',
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS" && update.logs) {
            update.logs.map((log) => log.message).forEach((msg) => {
              console.log(`   📝 ${msg}`);
            });
          }
        },
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Generated in ${(duration/1000).toFixed(1)}s`);

      const data = result.data as { images: Array<{ url: string }> };

      if (!data.images || data.images.length === 0) {
        throw new Error('No images in response');
      }

      const response = await fetch(data.images[0].url);
      const buffer = Buffer.from(await response.arrayBuffer());

      const filename = `${name}_${Date.now()}.png`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, buffer);

      console.log(`✅ Saved: ${filename}`);

    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Done! Check generated-images/test-balanced/');
}

generateImages();
