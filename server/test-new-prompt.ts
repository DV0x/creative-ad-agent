import { fal } from '@fal-ai/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Testing Soft Brutalism + Clay prompts with proper TEXT RENDERING
// Using hooks from truenorthmortgage-2025-01-24.md
const prompts = [
  {
    name: "concept_3_salaried_advisors_metaphor",
    prompt: `Create a 1:1 social media ad image.

SCENE:
Two clay scales side by side. Left scale: a suited broker figure with dollar
signs for eyes, weighing down one side while stacks of gold coins weigh down
the customer side — unbalanced, tilted against the customer. Right scale: a
friendly advisor figure in casual clothes, perfectly balanced with a small
house on the other side — fair, equal, harmonious. The left scale is gray
and cold. The right scale glows with warm amber light.

STYLE:
Clay/ceramic aesthetic. Finger-pressed texture, matte finish. Soft directional
lighting highlighting the balanced scale. Warm terracotta figures, gray tones
for the unfair scale, amber glow for the fair one.

COLOR PALETTE:
- Primary #00707F (teal) for: 10px border
- Secondary #C3E1E2 (light cyan) for: background gradient
- Accent #E8846B (coral) for: warm glow on balanced scale
- Clay base: terracotta figures, gray for unfair scale

Neo-brutalist framing with 10px #00707F border.

COMPOSITION:
Two scales side by side, filling center of frame. Unfair scale left, fair
scale right. Clear space in top third for headline text.

TEXT RENDERING:
Render the following text directly in the image:

HEADLINE: "Our brokers don't make more when you pay more."
- Position: Top third, centered horizontally
- Style: Bold, condensed sans-serif, high-impact
- Color: White with strong contrast against light cyan background
- Size: Large, dominant

CTA: "Talk to someone with nothing to sell you"
- Position: Bottom-center, above the border
- Style: Medium-bold, clean sans-serif
- Color: #00707F (teal)
- Size: Smaller than headline, clearly legible

Ensure text is sharp, legible, and integrated with the scene.

MOOD:
Honest contrast. The difference is visible. Fairness has a shape.

DO NOT:
- Mannequin figures (give them personality)
- Both scales looking the same
- Text too small or illegible
- Floating objects without shadows`
  },
  {
    name: "concept_4_rate_guarantee_symbolic",
    prompt: `Create a 1:1 social media ad image.

SCENE:
Oversized clay hand entering from bottom-left, palm up, confident, offering.
In the palm: five crisp $100 bills fanned out, rendered in clay but clearly
reading as money with visible denominations. The hand is warm terracotta,
substantial, real. Behind it, soft-focus generic bank buildings receding
into the background, diminished, less important. The money is the hero —
tangible, available, yours for the taking. A subtle warm glow surrounds
the bills.

STYLE:
Clay/ceramic aesthetic. Finger-pressed texture on hand and money, but bills
have enough definition to read as currency. Matte finish. Depth of field:
sharp foreground, soft background.

COLOR PALETTE:
- Primary #00707F (teal) for: 10px border, subtle tint on background
- Secondary #C3E1E2 (light cyan) for: background gradient, receding banks
- Accent #E8846B (coral) for: warm glow around the money
- Clay base: terracotta hand, cream/green bills with texture

Neo-brutalist framing with 10px #00707F border.

COMPOSITION:
Hand and money fill center-bottom, entering from left. Banks faded in
upper-right background, small and distant. Top third clear for headline.

TEXT RENDERING:
Render the following text directly in the image:

HEADLINE: "Find a lower rate. Anywhere. We'll pay you $500."
- Position: Top third, centered horizontally
- Style: Bold, condensed sans-serif, confident and direct
- Color: #2D2D2D (charcoal) with strong contrast against light background
- Size: Large, impactful — the challenge is clear

CTA: "Test us"
- Position: Bottom-right, above the border
- Style: Bold sans-serif, punchy
- Color: #00707F (teal)
- Size: Medium, confident — short and direct

Ensure text is sharp and bold — this is a challenge, text should match.

MOOD:
Bold confidence. Put your money where your mouth is. We already have.

DO NOT:
- Money looking fake or cartoonish
- Hand looking stiff
- Text rendered weakly or small
- Losing the bank buildings entirely (they provide context)`
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
