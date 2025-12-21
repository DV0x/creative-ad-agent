/**
 * Basic Gemini test - text only first, then image
 */

import { GoogleGenAI } from '@google/genai';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  // Test 1: Basic text generation (should work quickly)
  console.log('Test 1: Basic text with gemini-2.0-flash...');
  try {
    const start = Date.now();
    const textResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: 'Say hello in 5 words' }],
    });
    console.log(`✅ Text works (${Date.now() - start}ms)`);
    console.log(`   Response: ${textResponse.candidates?.[0]?.content?.parts?.[0]?.text}`);
  } catch (e: any) {
    console.log(`❌ Text failed: ${e.message}`);
  }

  // Test 2: Image generation with correct model
  console.log('\nTest 2: Image generation with gemini-3-pro-image-preview...');
  try {
    const start = Date.now();

    // Add 30 second timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout after 30s')), 30000)
    );

    const imgResponse = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: [{ text: 'A red circle on white background' }],
        config: {
          responseModalities: ['IMAGE'],
        },
      }),
      timeoutPromise
    ]) as any;
    console.log(`✅ Image works (${Date.now() - start}ms)`);
    const parts = imgResponse.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        const kb = Math.round(part.inlineData.data.length * 0.75 / 1024);
        console.log(`   Image: ${kb}KB, ${part.inlineData.mimeType}`);
      }
    }
  } catch (e: any) {
    console.log(`❌ Image failed: ${e.message}`);
    console.log(`   Name: ${e.name}`);
    console.log(`   Code: ${e.code}`);
    console.log(`   Status: ${e.status}`);
    console.log(`   StatusText: ${e.statusText}`);
    console.log(`   Cause: ${e.cause}`);
    console.log(`   Stack: ${e.stack?.substring(0, 500)}`);
    console.log(`   Full error: ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`);
  }
}

test();
