import { fal } from '@fal-ai/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// New VISUAL-FIRST prompts from the updated workflow
const prompts = [
  {
    name: "concept_2_self_employed_symbolic",
    prompt: `Create a 1:1 social media ad image.

SCENE:
A clay briefcase sits open on the ground, overflowing with glowing golden
coins and bills — clearly valuable, clearly real. The briefcase is warm
terracotta, the money radiates soft amber light. Behind it, a large gray
clay bank door with a "CLOSED" sign, imposing and cold. The contrast is
stark: the wealth is right there, tangible, but the door won't open.
A small clay house key lies just outside the briefcase, waiting.

STYLE:
Clay/ceramic aesthetic. All elements handcrafted with finger-pressed
texture, matte finish. Soft directional lighting from the briefcase's
glow. Color palette: terracotta briefcase, amber money glow, cold gray
door, teal (#00707F) accents on key. Neo-brutalist framing with 10px
teal border.

COMPOSITION:
Briefcase front-center, angled open toward viewer. Bank door looms in
background, upper half of frame. Key in foreground bottom-right.
Top third has clear space against the gray door for headline.

TEXT OVERLAY:
Headline: "Your business pays your bills. Why can't it buy you a home?" —
bold white, top third, against the gray door.
CTA: "Get the approval you've earned" — teal, bottom-left.

MOOD:
Frustration meeting vindication. The value is obvious. The rejection is absurd.

DO NOT: Make the briefcase look empty or the money look fake. The wealth
should feel undeniable — that's the whole point.`
  },
  {
    name: "concept_6_renewal_transformation",
    prompt: `Create a 1:1 social media ad image.

SCENE:
A clay envelope caught mid-metamorphosis. The left side is heavy, gray,
crumpled — stamped with an urgent red "RENEW NOW" seal, looking like a
burden. The right side is transforming: the paper lifts and unfolds into
golden wings, edges curling upward like a butterfly emerging. Where gray
meets gold, there's a visible gradient — the moment of transformation.
Soft amber light emanates from the golden side, casting warmth across
the scene.

STYLE:
Clay/ceramic aesthetic. Heavy finger-pressed texture on the gray burden
side. Smoother, lighter texture on the golden wing side. Matte finish
throughout. Cream (#F5F0E8) background. Dramatic but soft lighting from
right side. 10px coral (#E8846B) border.

COMPOSITION:
Envelope large and centered, filling 60% of frame horizontally.
Transformation gradient runs left to right — burden to power.
Wings extend slightly beyond envelope edges on the right.
Clear space in top third for headline.

TEXT OVERLAY:
Headline: "That renewal letter? It's not a deadline. It's your leverage." —
bold white, top third.
CTA: "See your real options" — coral, bottom-center.

MOOD:
Reframe. Power shift. The thing you feared is actually your weapon.

DO NOT: Make both halves look similar. The contrast between heavy/gray/burden
and light/gold/freedom must be dramatic and immediate.`
  }
];

async function generateImages() {
  console.log('🎨 Testing Visual-First Prompts with Nano Banana Pro');
  console.log('='.repeat(60));

  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    console.error('❌ FAL_KEY not found in .env');
    process.exit(1);
  }
  console.log('✅ API key loaded\n');

  fal.config({ credentials: apiKey });

  // Ensure output directory exists
  const outputDir = path.join(__dirname, '..', 'generated-images', 'test-new-prompts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const { name, prompt } of prompts) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Generating: ${name}`);
    console.log(`${'='.repeat(60)}`);
    console.log('\nPrompt:');
    console.log(prompt);
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
      console.log(`✅ Generated in ${duration}ms`);

      const data = result.data as { images: Array<{ url: string }> };

      if (!data.images || data.images.length === 0) {
        throw new Error('No images in response');
      }

      const image = data.images[0];

      // Download image
      const response = await fetch(image.url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const filename = `${name}_${Date.now()}.png`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, buffer);

      console.log(`✅ Saved: ${filepath}`);
      console.log(`   Size: ${Math.round(buffer.length / 1024)} KB`);

    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Done! Check generated-images/test-new-prompts/');
}

generateImages();
