const https = require('https');
const fs = require('fs');

const key = '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';

// We'll use a tiny transparent 1x1 base64 png just to test the API response structure
const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const prompt = `Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):
{ "productName": "test" }`;

const body = JSON.stringify({
  model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
    ]
  }],
  max_tokens: 4096,
  temperature: 0.6,
  top_p: 0.95,
  stream: true,
  chat_template_kwargs: { enable_thinking: true },
  reasoning_budget: 16384
});

const req = https.request({
  hostname: 'integrate.api.nvidia.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
  }
}, res => {
  console.log('Status:', res.statusCode);
  let text = '';
  res.on('data', chunk => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.choices?.[0]?.delta?.content) {
             text += parsed.choices[0].delta.content;
          }
        } catch(e) {}
      }
    }
  });
  res.on('end', () => {
    console.log('Final text length:', text.length);
    console.log('Final text preview:', text.substring(0, 100));
  });
});

req.write(body);
req.end();
