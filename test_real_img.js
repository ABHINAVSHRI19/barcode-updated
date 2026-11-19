const https = require('https');
const fs = require('fs');

const key = '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';

const prompt = `You are a food label OCR and extraction AI. Read this food packaging image carefully.

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences, no commentary):
{
  "productName": "product name if visible, or null",
  "brandName": "brand if visible, or null",
  "ingredients": "complete ingredient list as a single comma-separated string, exactly as printed",
  "nutrients": {
    "energy_kcal": number_or_null,
    "fat": number_or_null,
    "saturated_fat": number_or_null,
    "carbs": number_or_null,
    "sugars": number_or_null,
    "fiber": number_or_null,
    "protein": number_or_null,
    "sodium": number_or_null,
    "calcium": number_or_null,
    "iron": number_or_null
  }
}

Rules:
- Read ALL text visible in the image carefully
- Nutrient values per 100g preferred; per serving if 100g not shown
- Sodium in grams (divide mg by 1000)
- Use null for any value not visible
- Ingredients list must be verbatim from the label`;

// Dummy text so we don't have to download an image
// wait, we need a real image to see if it processes it or refuses it.
// Let's create a solid color image with some text
const { execSync } = require('child_process');
execSync('convert -size 400x400 xc:white -font Arial -pointsize 20 -fill black -draw "text 20,50 \\"Nutrition Facts\\nCalories 100\\nTotal Fat 5g\\nIngredients: Water, Sugar\\"" test_label.jpg');

const base64Image = fs.readFileSync('test_label.jpg', {encoding: 'base64'});

const body = JSON.stringify({
  model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
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
    console.log('Output:\n', text);
  });
});

req.write(body);
req.end();
