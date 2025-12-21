import { fal } from '@fal-ai/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Clay Typography: The text itself IS the clay sculpture
const prompts = [
  {
    name: "clay_typography_1",
    prompt: `Create a 1:1 social media ad.

The entire composition is the headline text "YOUR BANK IS BETTING YOU WON'T READ THIS" rendered as 3D clay letters.

TYPOGRAPHY AS SCULPTURE:
The words are crafted from warm terracotta clay with visible finger-pressed texture. Each letter has depth, soft shadows, and a handmade quality. The letters are bold, chunky, and fill most of the frame.

LAYOUT:
Text stacked in 3-4 lines, centered. The clay letters have slight imperfections — some lean slightly, some have thumbprints visible. This is intentional and human.

BACKGROUND:
Deep teal (#00707F) solid background. The warm terracotta clay letters pop against the cool teal.

BORDER:
Thick 12px coral (#E8846B) border framing the composition. Brutalist, confident.

CTA:
At the bottom, smaller text "See what they're not showing you" in clean white sans-serif — NOT clay, just clean text for contrast.

STYLE:
Soft brutalism. The clay letters feel warm, tactile, real. Like someone crafted this message by hand just for you.

The mood is confrontational but warm — "we made this just to tell you the truth."`
  },
  {
    name: "clay_typography_2",
    prompt: `Create a 1:1 social media ad.

The headline "FIND A LOWER RATE. ANYWHERE. WE'LL PAY YOU $500." is rendered entirely as 3D clay typography.

TYPOGRAPHY AS SCULPTURE:
Bold, chunky terracotta clay letters. The "$500" is extra large and prominent — the hero of the composition. Each letter has soft rounded edges, finger-pressed texture, matte finish with subtle highlights.

LAYOUT:
- "FIND A LOWER RATE." on line 1
- "ANYWHERE." on line 2
- "WE'LL PAY YOU" on line 3
- "$500" massive on line 4, taking up 40% of the space

BACKGROUND:
Cream (#F5F0E8) background. Warm and clean.

BORDER:
10px teal (#00707F) border. Bold, intentional.

CTA:
"Test us" in small bold teal text, bottom right corner. Clean, not clay.

STYLE:
Soft brutalism. The clay typography feels tangible — like you could reach in and touch it. The $500 especially feels REAL, not just a number.

The mood is bold confidence — this is a dare, rendered in clay.`
  },
  {
    name: "clay_typography_3",
    prompt: `Create a 1:1 social media ad.

The headline "FIRST HOME? YOU'RE ALLOWED TO NOT KNOW WHAT YOU'RE DOING." rendered as 3D clay typography.

TYPOGRAPHY AS SCULPTURE:
Soft, warm terracotta clay letters. These letters are gentler than bold — rounded, approachable, slightly irregular. The clay has a comforting, handmade quality with visible fingerprint impressions.

LAYOUT:
- "FIRST HOME?" on line 1 (larger)
- "YOU'RE ALLOWED TO" on line 2
- "NOT KNOW WHAT" on line 3
- "YOU'RE DOING." on line 4

The text takes up 70% of the frame. Generous spacing between lines.

BACKGROUND:
Soft sage green (#87A087) background. Calming, reassuring.

BORDER:
8px terracotta border matching the clay letters. Warm, not aggressive.

CTA:
"Ask anything. Seriously." in cream text at the bottom. Friendly, inviting.

STYLE:
Soft brutalism with gentle energy. The clay letters feel like a warm hug — permission granted, not judgment.

The mood is reassurance — "it's okay, we've got you."`
  }
];

async function generateImages() {
  console.log('🎨 Testing Clay Typography: Text AS the Sculpture');
  console.log('='.repeat(60));

  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    console.error('❌ FAL_KEY not found');
    process.exit(1);
  }

  fal.config({ credentials: apiKey });

  const outputDir = path.join(__dirname, '..', 'generated-images', 'test-clay-typography');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const { name, prompt } of prompts) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Generating: ${name}`);
    console.log('='.repeat(60));

    const startTime = Date.now();

    try {
      const result = await fal.subscribe("fal-ai/nano-banana-pro", {
        input: {
          prompt,
          num_images: 1,
          aspect_ratio: '1:1',
          resolution: '2K',
          output_format: 'png',
        },
        logs: true,
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Generated in ${(duration/1000).toFixed(1)}s`);

      const data = result.data as { images: Array<{ url: string }> };
      if (!data.images?.length) throw new Error('No images');

      const response = await fetch(data.images[0].url);
      const buffer = Buffer.from(await response.arrayBuffer());

      const filename = `${name}_${Date.now()}.png`;
      fs.writeFileSync(path.join(outputDir, filename), buffer);
      console.log(`✅ Saved: ${filename}`);

    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Done! Check generated-images/test-clay-typography/');
}

generateImages();
