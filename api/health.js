export default function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Return API status and environment variable availability (without revealing the actual values)
  res.status(200).json({
    status: 'ok',
    message: 'API is working',
    environment: {
      openai_key_available: !!process.env.OPENAI_API_KEY,
      anthropic_key_available: !!process.env.ANTHROPIC_API_KEY,
      gemini_key_available: !!process.env.GEMINI_API_KEY
    }
  });
}
