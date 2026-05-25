import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// Read .env.local to get GEMINI_API_KEY
const envText = fs.readFileSync("c:\\Users\\chris\\Documents\\public acc platform\\.env.local", 'utf-8');
const match = envText.match(/GEMINI_API_KEY\s*=\s*([^\n\r]+)/);
if (!match) {
  console.error("No GEMINI_API_KEY found in .env.local");
  process.exit(1);
}
const apiKey = match[1].trim();
console.log("Using API key starting with:", apiKey.substring(0, 8));

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  tools: [{ googleSearch: {} }]
});

try {
  const result = await model.generateContent("Who is Sweta Mohanty IAS?");
  console.log("Response text:", result.response.text());
  console.log("Candidates:", JSON.stringify(result.response.candidates, null, 2));
} catch (err) {
  console.error("Error during generation:", err);
}
