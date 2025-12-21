/**
 * Quick test script for Gemini image generation
 * Run: GEMINI_API_KEY=xxx npx tsx test-gemini.ts
 */

import { GoogleGenAI } from '@google/genai';

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set');
    console.log('Run: GEMINI_API_KEY=your-key npx tsx test-gemini.ts');
    process.exit(1);
  }

  console.log('🔑 API Key found, testing Gemini...');

  const ai = new GoogleGenAI({ apiKey });

  const prompt = "A simple red circle on white background";
  console.log(`📝 Prompt: ${prompt}`);

  const startTime = Date.now();

  try {
    console.log('⏳ Calling Gemini API...');

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [{ text: prompt }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '1K', // Use 1K for faster test
        },
      },
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Response received in ${duration}ms`);

    if (response.candidates?.[0]?.content?.parts) {
      const parts = response.candidates[0].content.parts;
      console.log(`📦 Parts received: ${parts.length}`);

      for (const part of parts) {
        if (part.inlineData) {
          const sizeKB = Math.round(part.inlineData.data.length * 0.75 / 1024);
          console.log(`🖼️  Image data: ${sizeKB}KB, mime: ${part.inlineData.mimeType}`);
        }
        if (part.text) {
          console.log(`📄 Text: ${part.text.substring(0, 100)}`);
        }
      }
    } else {
      console.log('⚠️  No candidates in response');
      console.log(JSON.stringify(response, null, 2));
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed after ${duration}ms`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  }
}

testGemini();
