import { fal } from '@fal-ai/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Test prompts using updated soft-brutalism-clay workflow
const prompts = [
  {
    name: "self-employed-rejection",
    concept: 2,
    hook: "Your business pays your bills. Why can't it buy you a home?",
    prompt: `Create a 1:1 social media ad image.

SCENE:
A confident self-employed professional — a man in his early 40s wearing a
casual blazer over a henley, sleeves slightly rolled. He has warm eyes,
a slight frown of frustration, salt-and-pepper stubble. He's standing
outside a closed bank door, holding a glowing briefcase that radiates
warm orange light — clearly valuable, clearly real.

The bank door is heavy, gray, institutional — closed and indifferent.
A small sign on the door shows a checkbox form (symbolic of bureaucracy).
The contrast is clear: he's obviously capable, his work glows with value,
but the door won't open. Behind him, faint suggestion of a warm home
glowing in the distance — what he's being kept from.

Rendered in clay with finger-pressed texture — he's a real person with
expression and personality, not a mannequin. The briefcase glows; he
doesn't belong outside.

STYLE:
Clay/ceramic aesthetic. All elements handcrafted with finger-pressed texture,
matte finish. Soft directional lighting emphasizing the glow from briefcase.

COLOR PALETTE:
- Primary #00707F (teal) for: 10px border frame, bank door accents
- Secondary #C3E1E2 (light cyan) for: subtle background, sky tint
- Accent warm orange for: glowing briefcase, distant home warmth
- Clay base: terracotta for figure, gray/charcoal for bank door

Neo-brutalist framing with 10px #00707F teal border.

COMPOSITION:
Figure center-left, facing the closed door on the right. Glowing briefcase
at his side is focal point. Distant home suggestion upper-right.
Top third clear for headline text.

TEXT OVERLAY:
Headline: "Your business pays your bills. Why can't it buy you a home?" —
bold white, top third.
CTA: "Get the approval you've earned" — warm orange, bottom-center.

MOOD:
Frustrated but dignified. He's not begging — he's calling out the absurdity.

DO NOT: Make him look defeated or small. He should look capable and
confident — the closed door is the problem, not him. Don't make the
figure a featureless mannequin — he needs a face, expression, real clothing.`
  },
  {
    name: "salaried-advisors",
    concept: 3,
    hook: "Our brokers don't make more when you pay more.",
    prompt: `Create a 1:1 social media ad image.

SCENE:
Split composition showing contrast. On the left: a shadowy broker figure
reaching toward a pile of coins/money between them and a small homebuyer
figure — the money is the focus, creating a barrier. On the right: a
warm, teal-tinted advisor figure sitting at eye level with a homebuyer,
nothing between them — just direct connection.

The right-side advisor is a woman in her 30s with a genuine smile,
professional but approachable in a simple blouse, leaning forward with
interest. The homebuyer across from her looks relieved, mid-conversation.
The left side is intentionally colder, grayer — the right side glows
with warmth.

Both rendered in clay with finger-pressed texture. The figures on the
right are clearly people with faces, expressions, clothing — not mannequins.

STYLE:
Clay/ceramic aesthetic. All elements handcrafted with finger-pressed texture,
matte finish. Split lighting — cooler/gray on left, warmer on right.

COLOR PALETTE:
- Primary #00707F (teal) for: 10px border, right-side advisor's clothing accent
- Secondary #C3E1E2 (light cyan) for: right-side background warmth
- Accent warm orange for: glow around right-side connection, warmth
- Clay base: gray/charcoal for left side, warm terracotta for right side

Neo-brutalist framing with 10px #00707F teal border.

COMPOSITION:
Vertical split — left third shows commission-focused broker (smaller, darker),
right two-thirds shows direct advisor-client connection (larger, warmer, focal).
Bottom third clear for text overlay.

TEXT OVERLAY:
Headline: "Our brokers don't make more when you pay more." —
bold white, top of frame.
CTA: "Talk to someone with nothing to sell you" — #00707F teal, bottom-right.

MOOD:
Clarity and relief. The difference is obvious once you see it.

DO NOT: Make both sides equal — the right side (honest connection) should
dominate and feel inviting. Don't make figures faceless — especially the
advisor on the right needs warmth in her expression.`
  }
];

async function generateImage(promptData: typeof prompts[0], index: number) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎨 Generating Concept ${promptData.concept}: ${promptData.name}`);
  console.log(`📝 Hook: "${promptData.hook}"`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    const result = await fal.subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt: promptData.prompt,
        num_images: 1,
        aspect_ratio: '1:1',
        resolution: '2K',
        output_format: 'png',
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_QUEUE") {
          console.log('   ⏳ Waiting in queue...');
        } else if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.map((log) => log.message).forEach((msg) => {
            console.log(`   📝 ${msg}`);
          });
        }
      },
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Response received in ${(duration / 1000).toFixed(1)}s`);

    const data = result.data as { images: Array<{ url: string; file_name: string; content_type: string }>; description?: string };

    if (!data.images || data.images.length === 0) {
      throw new Error('No images in response');
    }

    const image = data.images[0];

    // Download image
    const response = await fetch(image.url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure output directory exists
    const outputDir = path.join(__dirname, '..', 'generated-images', 'test-prompts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `concept${promptData.concept}_${promptData.name}_${Date.now()}.png`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, buffer);

    console.log(`\n✅ Image saved!`);
    console.log(`   📁 ${filepath}`);
    console.log(`   📊 Size: ${Math.round(buffer.length / 1024)} KB`);

    return { success: true, filepath, duration };

  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🎨 Soft Brutalism Clay - Visual Prompt Test');
  console.log('   Testing updated workflow with brand colors + human characters');
  console.log('   Brand: True North Mortgage');
  console.log('   Colors: #00707F (Teal), #C3E1E2 (Light Cyan), warm orange');

  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    console.error('\n❌ FAL_KEY not found in .env');
    process.exit(1);
  }
  console.log('\n✅ API key loaded');

  fal.config({ credentials: apiKey });

  const results = [];

  for (let i = 0; i < prompts.length; i++) {
    const result = await generateImage(prompts[i], i);
    results.push({ ...prompts[i], ...result });
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  for (const r of results) {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} Concept ${r.concept} (${r.name}): ${r.success ? `${(r.duration! / 1000).toFixed(1)}s` : r.error}`);
    if (r.filepath) {
      console.log(`   → ${r.filepath}`);
    }
  }
}

main();
