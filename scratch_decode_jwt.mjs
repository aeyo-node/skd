import fs from 'fs';

const envPath = "c:\\Users\\chris\\Documents\\public acc platform\\.env.local";
const envText = fs.readFileSync(envPath, 'utf-8');
const anonMatch = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*([^\n\r]+)/);
const serviceMatch = envText.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*([^\n\r]+)/);

const anonKey = anonMatch[1].trim();
const serviceKey = serviceMatch[1].trim();

function decode(jwt) {
  const parts = jwt.split('.');
  if (parts.length !== 3) return "Invalid JWT";
  const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
  return JSON.parse(payload);
}

console.log("Decoded Anon Key:");
console.log(decode(anonKey));

console.log("\nDecoded Service Role Key:");
console.log(decode(serviceKey));
