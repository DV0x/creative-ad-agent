import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const prompt = `A standalone door frame made of smooth cream-colored clay, slightly ajar, positioned center-right. Through the open door, a warm golden-yellow glow emanates—not harsh, but inviting. The door represents the threshold between
  rejection and acceptance.

  The clay has beautiful imperfections—subtle fingerprint impressions, soft rounded edges where forms meet. Matte finish with gentle highlights catching the edges. The door casts a soft shadow on a sage green surface beneath it,
  grounding the object in space.

  Split composition—deep charcoal on the left (40%), transitioning to softer sage on the right where the door sits. Generous negative space. The door occupies roughly 50% of the frame. Thick terracotta border (10px) frames the
  entire composition.

  Left side, stacked vertically:
  - "REJECTED BY 3 BANKS." in muted gray, with a subtle strike-through
  - "APPROVED IN 48 HOURS." below in warm coral, bold and confident
  Small supporting text: "We see what banks won't" in cream.

  The mood is relief and hope. Not aggressive, but warm—"finally, someone who gets it." The partially open door is an invitation, not a demand. The handcrafted clay signals human touch in an industry that often feels cold.`;

async function generateImage() {
  console.log('🎨 Direct Gemini Image Generation Test');
  console.log('=' .repeat(50));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    process.exit(1);
  }
  console.log('✅ API key loaded');

  const ai = new GoogleGenAI({ apiKey });

  // Ensure output directory exists
  const outputDir = path.join(__dirname, '..', 'generated-images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('\n📝 Prompt:');
  console.log(prompt);
  console.log('\n⏳ Generating image...');

  const startTime = Date.now();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [{ text: prompt }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '2K',
        },
      },
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Response received in ${duration}ms`);

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

        const filename = `test-homeownership-${Date.now()}.png`;
        const filepath = path.join(outputDir, filename);

        fs.writeFileSync(filepath, buffer);

        console.log('\n✅ Image saved successfully!');
        console.log(`   📁 Path: ${filepath}`);
        console.log(`   📊 Size: ${Math.round(buffer.length / 1024)} KB`);
        console.log(`   🔗 URL: http://localhost:3001/images/${filename}`);
        return;
      }

      // Log any text response
      if (part.text) {
        console.log('\n📄 Text response:', part.text);
      }
    }

    console.error('❌ No image data found in response');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

generateImage();
