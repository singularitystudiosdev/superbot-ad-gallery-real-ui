// gen-image: one Nano Banana Pro (gemini-3-pro-image-preview) render via the Gemini API.
// node gen-image.7520a9ed.mjs <out.png> <aspect> <size 1K|2K> <prompt-file> [model]
import { readFileSync, writeFileSync } from 'node:fs';

const [out, aspectRatio, imageSize, promptFile, model = 'gemini-3-pro-image-preview'] = process.argv.slice(2);
const key = process.env.GEMINI_API_KEY;
const body = { contents: [{ parts: [{ text: readFileSync(promptFile, 'utf8') }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio, imageSize } } };
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body),
});
const j = await res.json();
if (!res.ok) { console.error(res.status, JSON.stringify(j).slice(0, 1500)); process.exit(1); }
const img = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
if (!img) { console.error('no image:', JSON.stringify(j).slice(0, 1500)); process.exit(1); }
writeFileSync(out, Buffer.from((img.inlineData || img.inline_data).data, 'base64'));
console.log('wrote', out, model);
