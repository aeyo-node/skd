import http from 'http';

console.log("Fetching http://localhost:3050...");
http.get('http://localhost:3050', (res) => {
  const { statusCode } = res;
  console.log(`Response Status Code: ${statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Fetched ${data.length} bytes of HTML.`);
    if (data.includes('Sarkardada') || data.includes('Public Servant Ratings')) {
      console.log("✅ Verification Success: Homepage pre-renders Sarkardada branding correctly.");
    } else {
      console.log("❌ Warning: Branding keywords not found in response.");
    }
  });
}).on('error', (err) => {
  console.error("❌ Fetch failed:", err.message);
});
