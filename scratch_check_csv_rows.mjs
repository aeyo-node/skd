import fs from 'fs';
import path from 'path';

const dataDir = "c:\\Users\\chris\\Documents\\public acc platform\\data";
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));

for (const file of files) {
  const filePath = path.join(dataDir, file);
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  console.log(`${file}: ${lines.length} lines`);
}
