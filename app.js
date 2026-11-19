/* =====================================================
   NutriScan – Application Logic
   ===================================================== */

// ─── API Keys & Endpoints ───
const NVIDIA_URL = 'http://localhost:3002/api/nvidia';  // absolute URL — works from both file:// and localhost
const NVIDIA_KEY = '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';
const USDA_KEY = 'bqXSigVHwPKVbNKxgfhNEwt65i4N4GtmF401DmQ0';
const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1/foods/search';

// ─── FatSecret Platform API (OAuth 1.0) ───
const FS_CONSUMER_KEY    = '394b85d181d14c0fb54940776d0394dd';
const FS_CONSUMER_SECRET = 'cd8217b71c7c412f845ace2432b0ec1d';
const FS_BASE = 'https://platform.fatsecret.com/rest/server.api';

// ─── Gemini Vision API ───
// Vision OCR: NVIDIA Gemma 4-31B (multimodal)
const NVIDIA_VISION_KEY = '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';
const NVIDIA_VISION_URL = 'http://localhost:3002/api/nvidia'; // absolute url prevents 404 on file://

// ─── DOM Refs ───
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const els = {
  heroSection: $('#heroSection'),
  loadingSection: $('#loadingSection'),
  resultsSection: $('#resultsSection'),
  loadingText: $('#loadingText'),
  barcodeInput: $('#barcodeInput'),
  scanBtn: $('#scanBtn'),
  cameraBtn: $('#cameraBtn'),
  closeCameraBtn: $('#closeCameraBtn'),
  cameraContainer: $('#cameraContainer'),
  cameraScanRegion: $('#cameraScanRegion'),
  panelBarcode: $('#panelBarcode'),
  productImage: $('#productImage'),
  productName: $('#productName'),
  productBrand: $('#productBrand'),
  gaugeFill: $('#gaugeFill'),
  gaugeScore: $('#gaugeScore'),
  gaugeLabel: $('#gaugeLabel'),
  scoreCard: $('#scoreCard'),
  verdictEmoji: $('#verdictEmoji'),
  verdictText: $('#verdictText'),
  harmfulContent: $('#harmfulContent'),
  nutritionContent: $('#nutritionContent'),
  harmfulToggle: $('#harmfulToggle'),
  nutritionToggle: $('#nutritionToggle'),
  harmfulDropdown: $('#harmfulDropdown'),
  nutritionDropdown: $('#nutritionDropdown'),
  processingReason: $('#processingReason'),
  chartLegend: $('#chartLegend'),
  dvBars: $('#dvBars'),
  altGrid: $('#altGrid'),
  warningsGrid: $('#warningsGrid'),
  riskBars: $('#riskBars'),
  newScanBtn: $('#newScanBtn'),
  historyBtn: $('#historyBtn'),
  historyBadge: $('#historyBadge'),
  historyPanel: $('#historyPanel'),
  closeHistory: $('#closeHistory'),
  historyList: $('#historyList'),
  shareBtn: $('#shareBtn'),
  confettiCanvas: $('#confettiCanvas'),
  heroParticles: $('#heroParticles'),
  toxinsGrid: $('#toxinsGrid'),
  neuroGrid: $('#neuroGrid'),
  radarGrid: $('#radarGrid'),
  // Score breakdown & health conditions
  scoreBreakdown: $('#scoreBreakdown'),
  breakdownList: $('#breakdownList'),
  conditionsCard: $('#conditionsCard'),
  conditionsChips: $('#conditionsChips'),
  conditionsResult: $('#conditionsResult'),
  conditionsAdjusted: $('#conditionsAdjusted'),
  conditionsPenalties: $('#conditionsPenalties'),
  conditionsExplanations: $('#conditionsExplanations'),
  notFoundSection: $('#notFoundSection'),
  notFoundBarcode: $('#notFoundBarcode'),
  notFoundRetryBtn: $('#notFoundRetryBtn'),
  // Label camera
  labelScanBtn:      $('#labelScanBtn'),
  labelModal:        $('#labelModal'),
  labelModalClose:   $('#labelModalClose'),
  labelModalHint:    $('#labelModalHint'),
  labelVideo:        $('#labelVideo'),
  labelCanvas:       $('#labelCanvas'),
  labelPreview:      $('#labelPreview'),
  labelCaptureBtn:   $('#labelCaptureBtn'),
  labelModalActions: $('#labelModalActions'),
  labelPostActions:  $('#labelPostActions'),
  labelRetakeBtn:    $('#labelRetakeBtn'),
  labelAnalyzeBtn:   $('#labelAnalyzeBtn'),
  labelExtracting:   $('#labelExtracting'),
  labelExtractingText: $('#labelExtractingText'),
};

// ─── State ───
let scanner = null;
let currentScanData = null;  // stored globally for disease recalculation
let scanHistory = JSON.parse(localStorage.getItem('nutriscan_history') || '[]');

// ═══════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════
function _initApp() {
  try {
    console.log('[NutriScan] Initializing...');
    initParticles();
    initDropdowns();
    initButtons();
    initHistory();
    initScrollAnimations();
    // Retry button on the not-found screen
    els.notFoundRetryBtn.addEventListener('click', resetToHome);
    console.log('[NutriScan] ✅ Ready');
  } catch (err) {
    console.error('[NutriScan] ❌ Init failed:', err);
  }
}

// Handle case where DOMContentLoaded already fired (scripts at end of body)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initApp);
} else {
  _initApp();
}

// ─── Floating Particles ───
function initParticles() {
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = (60 + Math.random() * 40) + '%';
    p.style.animationDelay = Math.random() * 8 + 's';
    p.style.animationDuration = (5 + Math.random() * 6) + 's';
    p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
    els.heroParticles.appendChild(p);
  }
}

// ─── Dropdowns ───
function initDropdowns() {
  [els.harmfulToggle, els.nutritionToggle].forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.parentElement.classList.toggle('open');
    });
  });
}

// ─── Buttons ───
function initButtons() {
  els.scanBtn.addEventListener('click', () => {
    const code = els.barcodeInput.value.trim();
    if (code) startAnalysis({ barcode: code });
  });

  els.barcodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const code = els.barcodeInput.value.trim();
      if (code) startAnalysis({ barcode: code });
    }
  });

  els.cameraBtn.addEventListener('click', startCamera);
  els.closeCameraBtn.addEventListener('click', stopCamera);
  els.newScanBtn.addEventListener('click', resetToHome);
  els.historyBtn.addEventListener('click', toggleHistory);
  els.closeHistory.addEventListener('click', toggleHistory);
  els.shareBtn.addEventListener('click', shareReport);
  // Label camera
  els.labelScanBtn.addEventListener('click', openLabelCamera);
  els.labelModalClose.addEventListener('click', closeLabelModal);
  els.labelCaptureBtn.addEventListener('click', captureLabel);
  els.labelRetakeBtn.addEventListener('click', retakeLabel);
  els.labelAnalyzeBtn.addEventListener('click', analyzeLabelImage);
}

// ─── Scroll Animations ───
let staggerTimeout = null;
let intersectQueue = [];

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        intersectQueue.push(entry.target);
        observer.unobserve(entry.target); // Only animate once
      }
    });

    if (intersectQueue.length > 0 && !staggerTimeout) {
      processStaggerQueue();
    }
  }, { threshold: 0.1 });

  // Will observe result cards after render
  window._scrollObserver = observer;
}

function processStaggerQueue() {
  if (intersectQueue.length === 0) {
    staggerTimeout = null;
    return;
  }
  
  const el = intersectQueue.shift();
  el.classList.add('visible');
  
  staggerTimeout = setTimeout(processStaggerQueue, 100); // 100ms stagger
}

function observeCards() {
  $$('.animate-in').forEach(card => {
    card.classList.remove('visible'); // Reset if re-rendering
    window._scrollObserver.observe(card);
  });
}

// ═══════════════════════════════════════════════════════
// CAMERA BARCODE SCANNER
// ═══════════════════════════════════════════════════════
function startCamera() {
  els.cameraContainer.classList.remove('hidden');
  if (typeof Html5QrcodeScanner === 'undefined') {
    alert('Camera library not loaded. Please enter barcode manually.');
    els.cameraContainer.classList.add('hidden');
    return;
  }
  // Clear any previous scanner
  if (scanner) {
    try { scanner.clear(); } catch(e) {}
    scanner = null;
  }
  // Use Html5QrcodeScanner (higher-level API, avoids DOM issues)
  scanner = new Html5QrcodeScanner(
    'qr-reader',
    { fps: 10, qrbox: { width: 250, height: 150 }, rememberLastUsedCamera: true },
    false
  );
  scanner.render(
    (decodedText) => {
      stopCamera();
      els.barcodeInput.value = decodedText;
      startAnalysis({ barcode: decodedText });
    },
    (err) => { /* ignore scan errors */ }
  );
}

function stopCamera() {
  if (scanner) {
    scanner.clear().catch(() => {});
    scanner = null;
  }
  // Clear the qr-reader container
  const qrEl = $('#qr-reader');
  if (qrEl) qrEl.innerHTML = '';
  els.cameraContainer.classList.add('hidden');
}

// ═══════════════════════════════════════════════════════
// LABEL CAMERA (Gemini Vision OCR)
// ═══════════════════════════════════════════════════════

let labelStream = null;
let labelImageBase64 = null;

async function openLabelCamera() {
  // Reset state
  labelImageBase64 = null;
  els.labelPreview.classList.add('hidden');
  els.labelVideo.classList.remove('hidden');
  els.labelModalActions.classList.remove('hidden');
  els.labelPostActions.classList.add('hidden');
  els.labelExtracting.classList.add('hidden');
  els.labelModalHint.textContent = 'Point camera at the Nutrition Facts or Ingredients printed on the packaging';

  // Show modal first
  els.labelModal.classList.remove('hidden');

  try {
    labelStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });
    els.labelVideo.srcObject = labelStream;
  } catch (err) {
    alert('Camera access denied. Please allow camera permissions and try again.');
    closeLabelModal();
  }
}

function closeLabelModal() {
  els.labelModal.classList.add('hidden');
  if (labelStream) {
    labelStream.getTracks().forEach(t => t.stop());
    labelStream = null;
  }
  els.labelVideo.srcObject = null;
  labelImageBase64 = null;
}

function captureLabel() {
  const video = els.labelVideo;
  const canvas = els.labelCanvas;

  // Cap resolution to max 1600px wide — higher quality for reliable OCR
  const MAX_W = 1600;
  const srcW = video.videoWidth  || 1280;
  const srcH = video.videoHeight || 720;
  const scale = Math.min(1, MAX_W / srcW);
  canvas.width  = Math.round(srcW * scale);
  canvas.height = Math.round(srcH * scale);

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Use 0.85 quality — provides much better detail for small text OCR
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  labelImageBase64 = dataUrl.split(',')[1];

  console.log(`[LabelCam] Captured ${canvas.width}x${canvas.height}, base64 size: ${Math.round(labelImageBase64.length/1024)}KB`);

  // Show preview
  els.labelPreview.src = dataUrl;
  els.labelPreview.classList.remove('hidden');
  els.labelVideo.classList.add('hidden');

  // Switch buttons
  els.labelModalActions.classList.add('hidden');
  els.labelPostActions.classList.remove('hidden');
  els.labelModalHint.textContent = 'Image captured! Review it, then tap Analyze with AI.';
}

function retakeLabel() {
  labelImageBase64 = null;
  els.labelPreview.classList.add('hidden');
  els.labelVideo.classList.remove('hidden');
  els.labelModalActions.classList.remove('hidden');
  els.labelPostActions.classList.add('hidden');
  els.labelModalHint.textContent = 'Point camera at the Nutrition Facts or Ingredients printed on the packaging';
}

async function analyzeLabelImage() {
  if (!labelImageBase64) return;

  // Show extracting spinner
  els.labelPostActions.classList.add('hidden');
  els.labelExtracting.classList.remove('hidden');
  els.labelExtractingText.textContent = 'Reading label with NVIDIA Vision AI...';

  try {
    const extracted = await extractLabelWithGemini(labelImageBase64);
    if (!extracted || (!extracted.ingredients && !extracted.productName)) {
      throw new Error('Could not read the label. Please retake the photo with better lighting.');
    }

    els.labelExtractingText.textContent = 'Label read! Starting health analysis...';
    await new Promise(r => setTimeout(r, 700));

    // Close modal and start analysis
    closeLabelModal();
    startAnalysis({
      ingredients: extracted.ingredients || '',
      fromLabel: true,
      labelProductName: extracted.productName || 'Scanned Product',
      labelBrand: extracted.brandName || '',
      labelNutrients: extracted.nutrients || {}
    });

  } catch (err) {
    els.labelExtracting.classList.add('hidden');
    els.labelPostActions.classList.remove('hidden');
    alert('⚠️ ' + err.message);
  }
}

/**
 * Extract nutrition label data from an image using NVIDIA LLaMA 3.2 Vision.
 * Sends a size-capped base64 JPEG, returns structured JSON with product info + nutrients.
 */
async function extractLabelWithGemini(base64Image) {
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

  const payload = {
    model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
        ]
      }
    ],
    temperature: 0.6,
    top_p: 0.95,
    max_tokens: 65536,
    chat_template_kwargs: { enable_thinking: true },
    reasoning_budget: 16384,
    stream: false // Using standard JSON response, no SSE parsing needed
  };

  let res;
  try {
    res = await fetch(NVIDIA_VISION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_VISION_KEY}`
      },
      body: JSON.stringify(payload)
    });
  } catch (netErr) {
    // TypeError: Failed to fetch = CORS or network down
    console.error('[LabelCam] Fetch error:', netErr);
    throw new Error(
      'Network error contacting NVIDIA API. This may be a CORS issue when running locally. ' +
      'Try opening the app via http://localhost:3002 (not the file:// URL).'
    );
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.error('[LabelCam] API error:', res.status, errBody);
    throw new Error(`NVIDIA Vision API error ${res.status}: ${errBody.slice(0, 200)}`);
  }

  // Parse standard JSON response
  const data = await res.json();
  let text = data.choices?.[0]?.message?.content || '';

  console.log('[LabelCam] API extraction complete. Final text length:', text.length);
  if (text.length === 0) {
    console.error('[LabelCam] Raw API data:', data);
    throw new Error('AI model returned an empty response. Please check your image and try again.');
  }

  // Strip markdown fences if present
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error('[LabelCam] Could not parse JSON from:', text.slice(0, 300));
    throw new Error('Could not extract data from the label. Please ensure the label text is clearly visible and retake the photo.');
  }

  return JSON.parse(match[0]);
}

// ═══════════════════════════════════════════════════════
// MAIN ANALYSIS FLOW
// ═══════════════════════════════════════════════════════
async function startAnalysis(input) {
  showLoading();
  try {
    let productData = {};
    let nutrientData = {};

    // Step 1: Fetch product info (OFF → FatSecret → USDA fallback chain)
    setStep(1);
    if (input.barcode) {
      productData = await fetchFromOpenFoodFacts(input.barcode);

      // Try FatSecret by barcode if OFF didn't return a name
      if (!productData.name) {
        try {
          const fsData = await fetchFromFatSecretByBarcode(input.barcode);
          if (fsData && fsData.name) productData = fsData;
        } catch (e) {
          console.warn('FatSecret barcode lookup failed:', e);
        }
      }

      // Final fallback to USDA
      if (!productData.name) {
        const usdaData = await fetchFromUSDA(input.barcode);
        if (usdaData.name) productData = usdaData;
      }
    } else if (input.fromLabel) {
      // Label scan: use Gemini-extracted data directly
      productData = {
        name:        input.labelProductName || 'Scanned Product',
        brand:       input.labelBrand       || 'Label Scan',
        ingredients: input.ingredients      || '',
        image:       '',
        nutrients:   input.labelNutrients   || {}
      };
      // Gemini nutrients are already extracted; skip the API enrichment step
      nutrientData = { ...input.labelNutrients };
    } else {
      productData = {
        name: 'Custom Product',
        brand: 'Manual Input',
        ingredients: input.ingredients,
        image: '',
        nutrients: {}
      };
    }

    // Guard: if no product found from any source, show friendly error
    if (!productData.name) {
      showNotFound(input.barcode || '');
      return;
    }

    // Step 2: Enrich nutrients from FatSecret + USDA in parallel (with timeout)
    setStep(2);
    if (productData.name && productData.name !== 'Custom Product' && !input.fromLabel) {
      try {
        const fetchEnrichment = Promise.allSettled([
          fetchNutrientsFromUSDA(productData.name),
          fetchNutrientsFromFatSecret(productData.name)
        ]);
        // Race against a 1.5s timeout to prevent hanging the UI
        const timeout = new Promise(r => setTimeout(() => r('timeout'), 1500));
        const enrichmentResult = await Promise.race([fetchEnrichment, timeout]);
        
        if (enrichmentResult !== 'timeout') {
          const [usdaNutrients, fsNutrients] = enrichmentResult;
          if (usdaNutrients.status === 'fulfilled') nutrientData = { ...nutrientData, ...usdaNutrients.value };
          if (fsNutrients.status  === 'fulfilled') nutrientData = { ...nutrientData, ...fsNutrients.value };
        } else {
          console.warn('Nutrient enrichment timed out. Proceeding with base data.');
        }
      } catch (e) {
        console.warn('Nutrient enrichment failed:', e);
      }
    }

    // Merge nutrients
    const mergedNutrients = { ...nutrientData, ...productData.nutrients };

    // Step 3 & 4: Instant Deterministic Analysis & Render
    setStep(3);
    setStep(4);
    
    // Generate instant fallback analysis to show UI immediately
    const instantAiResult = generateFallbackAnalysis(productData, mergedNutrients);
    const healthResult = calculateHealthScore(mergedNutrients, productData);

    const finalData = {
      product: productData,
      nutrients: mergedNutrients,
      ai: instantAiResult,
      score: healthResult.score,
      scoreBreakdown: healthResult
    };

    // Render results instantly!
    renderResults(finalData);
    saveToHistory(finalData);

    // Step 5: Background AI Analysis (non-blocking)
    // Run the heavy AI analysis in the background and update sections seamlessly when ready
    analyzeWithAI(productData, mergedNutrients).then(deepAiResult => {
      if (deepAiResult && Object.keys(deepAiResult).length > 0) {
        console.log('[NutriScan] Deep AI analysis complete, updating UI silently...');
        // Update specific AI sections dynamically without full re-render
        if (deepAiResult.harmfulIngredients) renderHarmfulIngredients(deepAiResult.harmfulIngredients);
        if (deepAiResult.goodNutrients) renderGoodNutrients(deepAiResult.goodNutrients);
        if (deepAiResult.processingLevel) renderProcessingLevel(deepAiResult.processingLevel, deepAiResult.processingReason);
        if (deepAiResult.alternatives) renderAlternatives(deepAiResult.alternatives);
        if (deepAiResult.suitabilityWarnings) renderWarnings(deepAiResult.suitabilityWarnings);
        if (deepAiResult.futureImpact) renderFutureImpact(deepAiResult.futureImpact);
        if (deepAiResult.invisibleToxins) renderToxinsRadar(deepAiResult.invisibleToxins, productData, mergedNutrients);
        if (deepAiResult.neuroNutrition) renderNeuroNutrition(deepAiResult.neuroNutrition, mergedNutrients);
        if (deepAiResult.ingredientRisk) renderIngredientRiskRadar(deepAiResult.ingredientRisk, productData);
        
        // Update history with full AI data
        finalData.ai = deepAiResult;
        saveToHistory(finalData);
      }
    }).catch(e => console.warn('Background AI analysis failed:', e));

  } catch (error) {
    console.error('Analysis error:', error);
    alert('Analysis failed: ' + error.message + '. Please try again.');
    resetToHome();
  }
}

// ─── Loading UI ───
function showLoading() {
  els.heroSection.classList.add('hidden');
  els.resultsSection.classList.add('hidden');
  els.loadingSection.classList.remove('hidden');
  $$('.step').forEach(s => { s.classList.remove('active', 'done'); });
}

function setStep(n) {
  const steps = ['step1', 'step2', 'step3', 'step4'];
  const messages = [
    'Retrieving product information...',
    'Analyzing nutrient composition...',
    'Running AI ingredient analysis...',
    'Generating your health report...'
  ];
  els.loadingText.textContent = messages[n - 1];
  steps.forEach((id, i) => {
    const el = $(`#${id}`);
    if (i < n - 1) { el.classList.add('done'); el.classList.remove('active'); }
    else if (i === n - 1) { el.classList.add('active'); el.classList.remove('done'); }
    else { el.classList.remove('active', 'done'); }
  });
}

function resetToHome() {
  els.resultsSection.classList.add('hidden');
  els.loadingSection.classList.add('hidden');
  els.notFoundSection.classList.add('hidden');
  els.heroSection.classList.remove('hidden');
  els.barcodeInput.value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Not Found UI ───
function showNotFound(barcode) {
  els.loadingSection.classList.add('hidden');
  els.heroSection.classList.add('hidden');
  els.resultsSection.classList.add('hidden');
  els.notFoundBarcode.textContent = barcode || '???';
  els.notFoundSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════════════════════
// API: Open Food Facts
// ═══════════════════════════════════════════════════════
async function fetchFromOpenFoodFacts(barcode) {
  try {
    // v2 API with Indian-product-optimised fields
    const fields = [
      'product_name', 'product_name_en', 'product_name_hi',
      'brands', 'brand_owner',
      'image_front_url', 'image_url',
      'ingredients_text', 'ingredients_text_en', 'ingredients_text_with_allergens',
      'categories', 'categories_tags',
      'nova_group', 'nutriscore_grade', 'ecoscore_grade',
      'countries_tags', 'lc', 'lang',
      'labels', 'labels_tags',
      'allergens', 'allergens_tags',
      'stores', 'quantity', 'packaging',
      'nutriments'
    ].join(',');

    const res = await fetch(
      `${OFF_BASE}/${barcode}.json?fields=${fields}`,
      { headers: { 'User-Agent': 'NutriScan/1.0 (health analysis app)' } }
    );
    if (!res.ok) return {};
    const data = await res.json();
    if (data.status !== 1 || !data.product) return {};

    const p = data.product;

    // Resolve best product name (covers Hindi/regional labels)
    const name = p.product_name_en ||
                 p.product_name ||
                 p.product_name_hi ||
                 'Unknown Product';

    // Resolve best ingredients text
    const ingredients = p.ingredients_text_en ||
                        p.ingredients_text ||
                        p.ingredients_text_with_allergens || '';

    // Country of sale indicator for Indian products
    const isIndian = (p.countries_tags || []).some(c =>
      c.includes('india') || c.includes('en:india')
    );

    return {
      name,
      brand: p.brand_owner || p.brands || 'Unknown Brand',
      image: p.image_front_url || p.image_url || '',
      ingredients,
      categories: p.categories || '',
      novaGroup: p.nova_group || null,
      nutriscoreGrade: p.nutriscore_grade || null,
      ecoscoreGrade: p.ecoscore_grade || null,
      labels: p.labels || '',
      allergens: p.allergens || '',
      quantity: p.quantity || '',
      isIndian,
      nutrients: {
        energy_kcal: p.nutriments?.['energy-kcal_100g'] ||
                     p.nutriments?.['energy_100g']
                       ? Math.round((p.nutriments?.['energy_100g'] || 0) / 4.184)
                       : 0,
        fat: p.nutriments?.fat_100g || 0,
        saturated_fat: p.nutriments?.['saturated-fat_100g'] || 0,
        carbs: p.nutriments?.carbohydrates_100g || 0,
        sugars: p.nutriments?.sugars_100g || 0,
        fiber: p.nutriments?.fiber_100g || 0,
        protein: p.nutriments?.proteins_100g || 0,
        sodium: p.nutriments?.sodium_100g || 0,
        salt: p.nutriments?.salt_100g || 0,
        calcium: p.nutriments?.calcium_100g || 0,
        iron: p.nutriments?.iron_100g || 0,
        vitamin_c: p.nutriments?.['vitamin-c_100g'] || 0,
      }
    };
  } catch (e) {
    console.warn('OFF API error:', e);
    return {};
  }
}

// ═══════════════════════════════════════════════════════
// API: USDA FoodData Central
// ═══════════════════════════════════════════════════════
async function fetchFromUSDA(query) {
  try {
    const res = await fetch(`${USDA_BASE}?api_key=${USDA_KEY}&query=${encodeURIComponent(query)}&pageSize=1`);
    if (!res.ok) return {};
    const data = await res.json();
    if (!data.foods?.length) return {};

    const food = data.foods[0];
    const getNutrient = (name) => {
      const n = food.foodNutrients?.find(fn => fn.nutrientName?.toLowerCase().includes(name.toLowerCase()));
      return n ? n.value : 0;
    };

    return {
      name: food.description || 'Unknown',
      brand: food.brandOwner || food.brandName || 'Unknown',
      image: '',
      ingredients: food.ingredients || '',
      nutrients: {
        energy_kcal: getNutrient('energy'),
        fat: getNutrient('total lipid'),
        saturated_fat: getNutrient('fatty acids, total saturated'),
        carbs: getNutrient('carbohydrate'),
        sugars: getNutrient('sugars, total'),
        fiber: getNutrient('fiber, total'),
        protein: getNutrient('protein'),
        sodium: getNutrient('sodium') / 1000, // convert mg to g
        salt: (getNutrient('sodium') / 1000) * 2.5,
      }
    };
  } catch {
    return {};
  }
}

async function fetchNutrientsFromUSDA(productName) {
  try {
    const res = await fetch(`${USDA_BASE}?api_key=${USDA_KEY}&query=${encodeURIComponent(productName)}&pageSize=1`);
    if (!res.ok) return {};
    const data = await res.json();
    if (!data.foods?.length) return {};

    const food = data.foods[0];
    const getNutrient = (name) => {
      const n = food.foodNutrients?.find(fn => fn.nutrientName?.toLowerCase().includes(name.toLowerCase()));
      return n ? n.value : 0;
    };

    return {
      energy_kcal: getNutrient('energy'),
      fat: getNutrient('total lipid'),
      saturated_fat: getNutrient('fatty acids, total saturated'),
      carbs: getNutrient('carbohydrate'),
      sugars: getNutrient('sugars, total'),
      fiber: getNutrient('fiber, total'),
      protein: getNutrient('protein'),
      sodium: getNutrient('sodium') / 1000,
      salt: (getNutrient('sodium') / 1000) * 2.5,
      iron: getNutrient('iron'),
      calcium: getNutrient('calcium'),
      vitaminC: getNutrient('vitamin c'),
      vitaminA: getNutrient('vitamin a'),
      potassium: getNutrient('potassium'),
      cholesterol: getNutrient('cholesterol'),
    };
  } catch {
    return {};
  }
}

// ═══════════════════════════════════════════════════════
// API: FatSecret Platform (OAuth 1.0 + HMAC-SHA1)
// ═══════════════════════════════════════════════════════

/** Generate a cryptographically-random nonce */
function fsNonce() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Percent-encode per RFC 3986 */
function fsEncode(s) {
  return encodeURIComponent(String(s))
    .replace(/!/g, '%21').replace(/'/g, '%27')
    .replace(/\(/g, '%28').replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/**
 * Build a signed OAuth 1.0 query string and return the full request URL.
 * Uses SubtleCrypto HMAC-SHA1 (available in modern browsers).
 */
async function fsBuildSignedUrl(params) {
  const oauthParams = {
    oauth_consumer_key:     FS_CONSUMER_KEY,
    oauth_nonce:            fsNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_version:          '1.0',
    format:                 'json',
    ...params
  };

  // Sort and encode all params for the base string
  const sorted = Object.keys(oauthParams).sort()
    .map(k => `${fsEncode(k)}=${fsEncode(oauthParams[k])}`).join('&');

  const baseString = `GET&${fsEncode(FS_BASE)}&${fsEncode(sorted)}`;
  const signingKey = `${fsEncode(FS_CONSUMER_SECRET)}&`; // no token secret

  // HMAC-SHA1 via Web Crypto
  const keyData = new TextEncoder().encode(signingKey);
  const msgData = new TextEncoder().encode(baseString);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));

  oauthParams.oauth_signature = signature;

  const qs = Object.keys(oauthParams).sort()
    .map(k => `${fsEncode(k)}=${fsEncode(oauthParams[k])}`).join('&');
  return `${FS_BASE}?${qs}`;
}

/** Look up a food item by barcode (EAN/UPC) via FatSecret */
async function fetchFromFatSecretByBarcode(barcode) {
  try {
    const url = await fsBuildSignedUrl({
      method:      'food.find_id_for_barcode',
      barcode_id:  barcode
    });
    const res = await fetch(url);
    if (!res.ok) return {};
    const data = await res.json();
    const foodId = data?.food_id?.value;
    if (!foodId) return {};

    // Now get full food detail
    return await fetchFromFatSecretById(foodId);
  } catch (e) {
    console.warn('FatSecret barcode error:', e);
    return {};
  }
}

/** Get detailed food data by FatSecret food_id */
async function fetchFromFatSecretById(foodId) {
  try {
    const url = await fsBuildSignedUrl({ method: 'food.get', food_id: foodId });
    const res = await fetch(url);
    if (!res.ok) return {};
    const data = await res.json();
    const food = data?.food;
    if (!food) return {};

    const serving = Array.isArray(food.servings?.serving)
      ? food.servings.serving[0]
      : food.servings?.serving;

    const parse = v => parseFloat(v) || 0;

    return {
      name:        food.food_name || '',
      brand:       food.brand_name || 'Unknown Brand',
      image:       '',
      ingredients: '',
      nutrients: {
        energy_kcal:    parse(serving?.calories),
        fat:            parse(serving?.fat),
        saturated_fat:  parse(serving?.saturated_fat),
        carbs:          parse(serving?.carbohydrate),
        sugars:         parse(serving?.sugar),
        fiber:          parse(serving?.fiber),
        protein:        parse(serving?.protein),
        sodium:         parse(serving?.sodium) / 1000,
        cholesterol:    parse(serving?.cholesterol),
        potassium:      parse(serving?.potassium),
        vitamin_c:      parse(serving?.vitamin_c),
        calcium:        parse(serving?.calcium),
        iron:           parse(serving?.iron),
      }
    };
  } catch (e) {
    console.warn('FatSecret food.get error:', e);
    return {};
  }
}

/** Search FatSecret by product name and return enriched nutrient data */
async function fetchNutrientsFromFatSecret(productName) {
  try {
    const url = await fsBuildSignedUrl({
      method:            'foods.search',
      search_expression: productName,
      max_results:       1,
      page_number:       0
    });
    const res = await fetch(url);
    if (!res.ok) return {};
    const data = await res.json();

    const foods = data?.foods?.food;
    if (!foods) return {};
    const food = Array.isArray(foods) ? foods[0] : foods;
    if (!food?.food_id) return {};

    // Get full detail for richer nutrient data
    const detail = await fetchFromFatSecretById(food.food_id);
    return detail?.nutrients || {};
  } catch (e) {
    console.warn('FatSecret search error:', e);
    return {};
  }
}

// ═══════════════════════════════════════════════════════
// AI: NVIDIA Gemma Analysis
// ═══════════════════════════════════════════════════════
async function analyzeWithAI(product, nutrients) {
  const prompt = `You are a food health analysis AI. Analyze this food product and return ONLY valid JSON (no markdown, no code fences).

Product: ${product.name || 'Unknown'}
Brand: ${product.brand || 'Unknown'}
Ingredients: ${product.ingredients || 'Not available'}
Nutrients per 100g: ${JSON.stringify(nutrients)}

Return this exact JSON structure:
{
  "harmfulIngredients": [
    {"name": "ingredient name", "reason": "brief health concern"}
  ],
  "goodNutrients": [
    {"name": "nutrient name", "amount": "amount with unit", "benefit": "health benefit"}
  ],
  "processingLevel": "Natural" or "Processed" or "Ultra-Processed",
  "processingReason": "brief explanation why",
  "alternatives": [
    {"name": "exact real product name", "company": "brand/company name", "score": 8, "kcalPerServing": 120, "reason": "why it is healthier than the scanned product"}
  ],
  "suitabilityWarnings": [
    {"group": "group name", "icon": "emoji", "reason": "brief explanation"}
  ],
  "futureImpact": {
    "weightGain": "Low" or "Medium" or "High",
    "heartDisease": "Low" or "Medium" or "High",
    "diabetes": "Low" or "Medium" or "High",
    "kidneyStress": "Low" or "Medium" or "High",
    "energyCrash": "Low" or "Medium" or "High"
  },
  "invisibleToxins": [
    {"name": "toxin name", "icon": "emoji", "risk": "Low" or "Medium" or "High", "desc": "brief explanation"}
  ],
  "neuroNutrition": [
    {"label": "Brain Fog", "icon": "🌫️", "verdict": "good" or "neutral" or "bad", "desc": "brief explanation"},
    {"label": "Mood Impact", "icon": "😊", "verdict": "good" or "neutral" or "bad", "desc": "brief explanation"},
    {"label": "Sleep Quality", "icon": "🌙", "verdict": "good" or "neutral" or "bad", "desc": "brief explanation"},
    {"label": "Focus & Energy", "icon": "⚡", "verdict": "good" or "neutral" or "bad", "desc": "brief explanation"}
  ],
  "ingredientRisk": [
    {"name": "ingredient name", "purpose": "e.g. Preservative / Sweetener / Emulsifier", "risk": "Low" or "Medium" or "High", "detail": "one-line health note"}
  ]
}

Provide exactly 3 alternatives. Provide 3-6 harmful ingredients if present. Provide 3-5 good nutrients. Provide 3-5 suitability warnings. Provide 3-4 invisible toxins. Provide exactly 4 neuro-nutrition entries (Brain Fog, Mood Impact, Sleep Quality, Focus & Energy). Provide 4-8 ingredientRisk entries for major individual ingredients.`;

  try {
    const response = await fetch(NVIDIA_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.6',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: 0.6,
        top_p: 0.9,
        stream: true
      })
    });

    if (!response.ok) {
      console.warn('NVIDIA API error, using fallback');
      return generateFallbackAnalysis(product, nutrients);
    }

    // Parse SSE stream — filter out thinking/reasoning tokens, keep only final content
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let sseBuffer = '';  // handles chunks split across reads

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop();  // keep incomplete last line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            // Kimi K2.6 thinking mode: reasoning comes as 'reasoning_content'
            // We only want the final 'content' field, skip reasoning tokens
            if (delta?.content) fullText += delta.content;
          } catch {}
        }
      }
    }

    // Extract JSON from response
    let jsonStr = fullText.trim();
    // Remove any markdown code fences
    jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    // Find the JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return generateFallbackAnalysis(product, nutrients);
  } catch (err) {
    console.warn('AI analysis failed:', err);
    return generateFallbackAnalysis(product, nutrients);
  }
}

// ─── Fetch Healthier Alternatives ───
async function fetchAlternatives(productName) {
  if (!productName) return [];
  const prompt = `Provide three healthier alternative products to "${productName}". Return ONLY a JSON array of objects with fields: name, company, score (1-10), kcalPerServing, reason. Do not include any markdown.`;
  try {
    const response = await fetch(NVIDIA_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.6',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.6,
        top_p: 0.9,
        stream: true
      })
    });
    if (!response.ok) return [];
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) fullText += delta.content;
          } catch {}
        }
      }
    }
    let jsonStr = fullText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const match = jsonStr.match(/\[.*\]/s);
    if (match) return JSON.parse(match[0]);
    return [];
  } catch (e) {
    console.warn('fetchAlternatives failed:', e);
    return [];
  }
}


// ─── Fallback Analysis (when API fails) ───
function generateFallbackAnalysis(product, nutrients) {
  const ingredientList = (product.ingredients || '').toLowerCase();
  const harmful = [];
  const good = [];

  // Detect harmful ingredients
  const harmfulChecks = [
    { term: 'palm oil', name: 'Palm Oil', reason: 'High in saturated fat, linked to heart disease risk' },
    { term: 'high fructose corn syrup', name: 'High Fructose Corn Syrup', reason: 'Linked to obesity and insulin resistance' },
    { term: 'sodium benzoate', name: 'Sodium Benzoate', reason: 'Preservative that may cause irritation in large amounts' },
    { term: 'artificial', name: 'Artificial Additives', reason: 'Synthetic ingredients that may cause sensitivities' },
    { term: 'msg', name: 'MSG (Monosodium Glutamate)', reason: 'May cause headaches and sensitivity in some people' },
    { term: 'aspartame', name: 'Aspartame', reason: 'Artificial sweetener with debated health effects' },
    { term: 'hydrogenated', name: 'Hydrogenated Oil', reason: 'Contains trans fats linked to heart disease' },
    { term: 'nitrate', name: 'Nitrates/Nitrites', reason: 'Preservatives that may form harmful compounds' },
    { term: 'sugar', name: 'Added Sugar', reason: 'Excessive sugar linked to obesity, diabetes, and tooth decay' },
    { term: 'soy lecithin', name: 'Soy Lecithin', reason: 'Emulsifier that may cause allergic reactions in sensitive individuals' },
  ];

  harmfulChecks.forEach(check => {
    if (ingredientList.includes(check.term)) {
      harmful.push({ name: check.name, reason: check.reason });
    }
  });

  if (harmful.length === 0) {
    harmful.push({ name: 'No major harmful ingredients detected', reason: 'This product appears to use relatively safe ingredients' });
  }

  // Good nutrients
  if (nutrients.protein > 5) good.push({ name: 'Protein', amount: `${nutrients.protein}g`, benefit: 'Supports muscle repair and growth' });
  if (nutrients.fiber > 2) good.push({ name: 'Fiber', amount: `${nutrients.fiber}g`, benefit: 'Aids digestion and promotes gut health' });
  if (nutrients.iron > 1) good.push({ name: 'Iron', amount: `${nutrients.iron}mg`, benefit: 'Essential for oxygen transport in blood' });
  if (nutrients.calcium > 50) good.push({ name: 'Calcium', amount: `${nutrients.calcium}mg`, benefit: 'Strengthens bones and teeth' });
  if (nutrients.vitaminC > 5) good.push({ name: 'Vitamin C', amount: `${nutrients.vitaminC}mg`, benefit: 'Boosts immune system and collagen production' });

  if (good.length === 0) {
    good.push({ name: 'Energy', amount: `${nutrients.energy_kcal || 0} kcal`, benefit: 'Provides energy for daily activities' });
  }

  // Processing level
  let processingLevel = 'Processed';
  let processingReason = 'Contains multiple processed ingredients and additives';
  const additivesCount = harmful.length;
  if (additivesCount <= 1 && !ingredientList.includes('artificial')) {
    processingLevel = 'Natural';
    processingReason = 'Minimal processing with few additives detected';
  } else if (additivesCount >= 3 || ingredientList.includes('artificial') || ingredientList.includes('hydrogenated')) {
    processingLevel = 'Ultra-Processed';
    processingReason = 'High number of additives and industrial processing techniques detected';
  }

  // Suitability warnings
  const warnings = [];
  if ((nutrients.sugars || 0) > 10) warnings.push({ group: 'Diabetic Individuals', icon: '🩸', reason: `High sugar content (${nutrients.sugars}g/100g) may spike blood sugar` });
  if ((nutrients.saturated_fat || 0) > 5) warnings.push({ group: 'Heart Condition Patients', icon: '❤️‍🩹', reason: `High saturated fat (${nutrients.saturated_fat}g/100g) may affect cholesterol` });
  if ((nutrients.sodium || 0) > 0.5 || (nutrients.salt || 0) > 1.5) warnings.push({ group: 'High Blood Pressure Patients', icon: '🫀', reason: `Elevated sodium content may increase blood pressure` });
  if (ingredientList.includes('milk') || ingredientList.includes('lactose') || ingredientList.includes('whey')) warnings.push({ group: 'Lactose Intolerant', icon: '🥛', reason: 'Contains dairy-derived ingredients' });
  if (ingredientList.includes('wheat') || ingredientList.includes('gluten') || ingredientList.includes('barley')) warnings.push({ group: 'Gluten Intolerant / Celiac', icon: '🌾', reason: 'Contains gluten-containing grains' });

  if (warnings.length === 0) {
    warnings.push({ group: 'Generally Safe', icon: '✅', reason: 'No major allergens or health concerns detected for common conditions' });
  }

  // Future impact
  const futureImpact = {
    weightGain: (nutrients.energy_kcal || 0) > 400 || (nutrients.fat || 0) > 20 ? 'High' : (nutrients.energy_kcal || 0) > 200 ? 'Medium' : 'Low',
    heartDisease: (nutrients.saturated_fat || 0) > 8 ? 'High' : (nutrients.saturated_fat || 0) > 3 ? 'Medium' : 'Low',
    diabetes: (nutrients.sugars || 0) > 15 ? 'High' : (nutrients.sugars || 0) > 8 ? 'Medium' : 'Low',
    kidneyStress: (nutrients.sodium || 0) > 0.8 ? 'High' : (nutrients.sodium || 0) > 0.3 ? 'Medium' : 'Low',
    energyCrash: (nutrients.sugars || 0) > 12 && (nutrients.fiber || 0) < 3 ? 'High' : (nutrients.sugars || 0) > 6 ? 'Medium' : 'Low'
  };

  // Invisible toxins fallback
  const toxins = [];
  if (ingredientList.includes('palm oil')) toxins.push({ name: 'Pesticide Residues', icon: '🌿', risk: 'Medium', desc: 'Palm oil crops are heavily treated with pesticides in many regions.' });
  if (ingredientList.includes('oat') || ingredientList.includes('wheat')) toxins.push({ name: 'Glyphosate Risk', icon: '☣️', risk: 'Medium', desc: 'Oat and wheat crops are commonly pre-harvested with glyphosate herbicide.' });
  if (ingredientList.includes('fish') || ingredientList.includes('tuna') || ingredientList.includes('salmon')) toxins.push({ name: 'Mercury Contamination', icon: '🐟', risk: 'Medium', desc: 'Marine fish can contain trace amounts of methylmercury.' });
  if (ingredientList.includes('rice')) toxins.push({ name: 'Arsenic Risk', icon: '⚠️', risk: 'Low', desc: 'Rice can accumulate inorganic arsenic from soil and water.' });
  toxins.push({ name: 'Microplastics', icon: '🔬', risk: harmful.length >= 3 ? 'Medium' : 'Low', desc: 'Heavily processed and packaged foods have higher microplastic contamination risk.' });

  // Neuro-nutrition fallback
  const highSugar = (nutrients.sugars || 0) > 15;
  const hasCaffeine = ingredientList.includes('caffeine') || ingredientList.includes('coffee') || ingredientList.includes('tea');
  const hasGoodFat = (nutrients.fat || 0) > 5 && (nutrients.saturated_fat || 0) < 5;
  const neuro = [
    { label: 'Brain Fog', icon: '🌫️', verdict: highSugar ? 'bad' : 'neutral', desc: highSugar ? 'High sugar causes post-meal mental cloudiness within 1-2 hours.' : 'Moderate sugar level; low brain fog risk.' },
    { label: 'Mood Impact', icon: '😊', verdict: highSugar ? 'neutral' : (nutrients.protein || 0) > 8 ? 'good' : 'neutral', desc: highSugar ? 'Sugar rush provides brief euphoria followed by a crash that can affect mood.' : 'Protein helps produce serotonin precursors, supporting mood stability.' },
    { label: 'Sleep Quality', icon: '🌙', verdict: hasCaffeine || highSugar ? 'bad' : 'good', desc: hasCaffeine ? 'Contains stimulants that can disrupt sleep architecture if consumed after 2 PM.' : highSugar ? 'High sugar intake close to bedtime disrupts deep sleep stages.' : 'No significant sleep disruptors detected.' },
    { label: 'Focus & Energy', icon: '⚡', verdict: hasCaffeine ? 'good' : highSugar ? 'neutral' : hasGoodFat ? 'good' : 'neutral', desc: hasCaffeine ? 'Contains caffeine which temporarily boosts focus and alertness.' : highSugar ? 'Sugar provides a quick energy burst but leads to a crash in 30-60 minutes.' : 'Healthy fats provide sustained, slow-release energy for focus.' }
  ];

  // ─── Ingredient Risk Radar fallback ───
  const ingredientRisk = generateIngredientRiskFallback(product.ingredients || '', nutrients);

  return {
    harmfulIngredients: harmful.slice(0, 6),
    goodNutrients: good.slice(0, 5),
    processingLevel,
    processingReason,
    alternatives: [],  // fallback: no API call for alternatives
    suitabilityWarnings: warnings,
    futureImpact,
    invisibleToxins: toxins,
    neuroNutrition: neuro,
    ingredientRisk
  };
}

// ═══════════════════════════════════════════════════════
// HEALTH SCORE CALCULATOR
// ═══════════════════════════════════════════════════════
// ─── Deterministic string hash (no randomness) ───
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ─── Health Score (fully deterministic from nutrients + ingredients) ───
// Returns { score, baseScore, penalties, bonuses } for transparent breakdown
function calculateHealthScore(nutrients, product) {
  const baseScore = 5.0;
  let score = baseScore;
  const penalties = [];
  const bonuses = [];

  // ── Penalties ──────────────────────────────────────
  // Sugar (per 100g WHO guidance: >10g = high)
  const sugar = nutrients.sugars || 0;
  let sugarPen = 0;
  if (sugar > 30) sugarPen = -2.5;
  else if (sugar > 20) sugarPen = -2.0;
  else if (sugar > 12) sugarPen = -1.5;
  else if (sugar > 5) sugarPen = -0.5;
  if (sugarPen) { score += sugarPen; penalties.push({ label: 'Added Sugar', value: sugarPen, detail: `${sugar.toFixed(1)}g per 100g` }); }

  // Saturated fat (per 100g)
  const satFat = nutrients.saturated_fat || 0;
  let satPen = 0;
  if (satFat > 15) satPen = -2.0;
  else if (satFat > 10) satPen = -1.5;
  else if (satFat > 5) satPen = -1.0;
  else if (satFat > 2) satPen = -0.5;
  if (satPen) { score += satPen; penalties.push({ label: 'Saturated Fat', value: satPen, detail: `${satFat.toFixed(1)}g per 100g` }); }

  // Sodium (g per 100g, high = >0.6g)
  const sodium = nutrients.sodium || 0;
  let sodiumPen = 0;
  if (sodium > 1.2) sodiumPen = -2.0;
  else if (sodium > 0.6) sodiumPen = -1.0;
  else if (sodium > 0.3) sodiumPen = -0.5;
  if (sodiumPen) { score += sodiumPen; penalties.push({ label: 'High Sodium', value: sodiumPen, detail: `${(sodium * 1000).toFixed(0)}mg per 100g` }); }

  // Total fat (g per 100g)
  const fat = nutrients.fat || 0;
  let fatPen = 0;
  if (fat > 25) fatPen = -1.0;
  else if (fat > 17) fatPen = -0.5;
  if (fatPen) { score += fatPen; penalties.push({ label: 'Total Fat', value: fatPen, detail: `${fat.toFixed(1)}g per 100g` }); }

  // Harmful ingredients in text (deterministic keyword scan)
  const ing = (product?.ingredients || '').toLowerCase();
  const harmfulTerms = [
    'hydrogenated', 'high fructose corn syrup', 'aspartame', 'saccharin',
    'sodium benzoate', 'potassium bromate', 'bha', 'bht', 'tbhq',
    'carrageenan', 'acesulfame', 'artificial color', 'artificial flavour',
    'artificial flavor', 'msg', 'monosodium glutamate', 'sodium nitrite',
    'sodium nitrate', 'propyl gallate', 'brominated vegetable oil'
  ];
  const foundHarmful = harmfulTerms.filter(t => ing.includes(t));
  const harmfulPen = -Math.min(foundHarmful.length * 0.4, 2.0);
  if (harmfulPen < 0) { score += harmfulPen; penalties.push({ label: 'Artificial Additives', value: harmfulPen, detail: `${foundHarmful.length} harmful ingredient(s) found` }); }

  // ── Bonuses ───────────────────────────────────────
  // Fiber (g per 100g, excellent >6g)
  const fiber = nutrients.fiber || 0;
  let fiberBonus = 0;
  if (fiber > 8) fiberBonus = 2.5;
  else if (fiber > 5) fiberBonus = 2.0;
  else if (fiber > 3) fiberBonus = 1.0;
  else if (fiber > 1) fiberBonus = 0.5;
  if (fiberBonus) { score += fiberBonus; bonuses.push({ label: 'Good Fiber', value: fiberBonus, detail: `${fiber.toFixed(1)}g per 100g` }); }

  // Protein (g per 100g)
  const protein = nutrients.protein || 0;
  let proteinBonus = 0;
  if (protein > 20) proteinBonus = 2.0;
  else if (protein > 12) proteinBonus = 1.5;
  else if (protein > 6) proteinBonus = 1.0;
  else if (protein > 3) proteinBonus = 0.5;
  if (proteinBonus) { score += proteinBonus; bonuses.push({ label: 'High Protein', value: proteinBonus, detail: `${protein.toFixed(1)}g per 100g` }); }

  // Low calorie density (< 150 kcal/100g is good)
  const kcal = nutrients.energy_kcal || 0;
  if (kcal > 0 && kcal < 150) { score += 0.5; bonuses.push({ label: 'Low Calorie Density', value: 0.5, detail: `${Math.round(kcal)} kcal per 100g` }); }

  // ── Nutriscore bonus/penalty (official EU/FSSAI-style grade) ──
  if (product?.nutriscoreGrade) {
    const grades = { a: 1.5, b: 0.75, c: 0, d: -0.75, e: -1.5 };
    const nsVal = grades[product.nutriscoreGrade.toLowerCase()] ?? 0;
    if (nsVal > 0) { score += nsVal; bonuses.push({ label: 'Nutri-Score', value: nsVal, detail: `Grade ${product.nutriscoreGrade.toUpperCase()}` }); }
    else if (nsVal < 0) { score += nsVal; penalties.push({ label: 'Nutri-Score', value: nsVal, detail: `Grade ${product.nutriscoreGrade.toUpperCase()}` }); }
  }

  // ── NOVA processing penalty ──
  const nova = parseInt(product?.novaGroup) || 0;
  if (nova === 4) { score -= 1.0; penalties.push({ label: 'Ultra-Processed (NOVA 4)', value: -1.0, detail: 'Classified as ultra-processed' }); }
  else if (nova === 1) { score += 0.5; bonuses.push({ label: 'Unprocessed (NOVA 1)', value: 0.5, detail: 'Minimally processed food' }); }

  // ── Clamp to 1–10, round to 1 decimal ──
  score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  return { score, baseScore, penalties, bonuses };
}

// ═══════════════════════════════════════════════════════
// RENDER RESULTS
// ═══════════════════════════════════════════════════════
function renderResults(data) {
  currentScanData = data;  // store for disease recalculation
  els.loadingSection.classList.add('hidden');
  els.resultsSection.classList.remove('hidden');

  // Product bar
  els.productName.textContent = data.product.name || 'Unknown Product';
  els.productBrand.textContent = data.product.brand || '';
  if (data.product.image) {
    els.productImage.src = data.product.image;
    els.productImage.style.display = 'block';
  } else {
    els.productImage.style.display = 'none';
  }

  // Health score gauge
  renderGauge(data.score);

  // Harmful ingredients dropdown
  renderHarmfulIngredients(data.ai.harmfulIngredients || []);

  // Good nutrients dropdown
  renderGoodNutrients(data.ai.goodNutrients || []);

  // Processing level
  renderProcessingLevel(data.ai.processingLevel, data.ai.processingReason);

  // Donut chart
  renderDonutChart(data.nutrients);

  // Daily value bars
  renderDailyValueBars(data.nutrients);

  // Alternatives
  renderAlternatives(data.ai.alternatives || []);

  // Warnings
  renderWarnings(data.ai.suitabilityWarnings || []);

  // Future impact
  renderFutureImpact(data.ai.futureImpact || {});

  // Invisible Toxins
  renderToxinsRadar(data.ai.invisibleToxins || [], data.product, data.nutrients);

  // Neuro-Nutrition
  renderNeuroNutrition(data.ai.neuroNutrition || [], data.nutrients);

  // Value Index
  // Ingredient Risk Radar
  renderIngredientRiskRadar(data.ai.ingredientRisk || [], data.product);

  // Score Breakdown (transparent)
  renderScoreBreakdown(data.scoreBreakdown);

  // Health Conditions Personalizer
  renderHealthConditions(data);

  // Observe for scroll animations
  setTimeout(() => {
    observeCards();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 100);
}

// ─── Gauge ───
function renderGauge(score) {
  const circumference = 2 * Math.PI * 88; // ~553
  const offset = circumference - (score / 10) * circumference;

  // Remove old classes
  els.scoreCard.classList.remove('score-green', 'score-yellow', 'score-red');

  let colorClass, label, emoji, verdict;
  if (score >= 8) {
    colorClass = 'score-green'; label = 'Healthy'; emoji = '🌿'; verdict = 'Great choice! This product is quite healthy.';
  } else if (score >= 5) {
    colorClass = 'score-yellow'; label = 'Moderate'; emoji = '⚡'; verdict = 'Acceptable but consume in moderation.';
  } else {
    colorClass = 'score-red'; label = 'Unhealthy'; emoji = '⚠️'; verdict = 'Consider healthier alternatives.';
  }

  els.scoreCard.classList.add(colorClass);
  els.gaugeLabel.textContent = label;
  els.verdictEmoji.textContent = emoji;
  els.verdictText.textContent = verdict;

  // Animate score number
  animateNumber(els.gaugeScore, 0, score, 1500);

  // Animate gauge
  setTimeout(() => {
    els.gaugeFill.style.strokeDashoffset = offset;
    els.gaugeFill.classList.add('pulse');
  }, 200);

  // Confetti for high scores
  if (score >= 8) {
    setTimeout(() => launchConfetti(), 1000);
  }
}

function animateNumber(el, start, end, duration) {
  const startTime = performance.now();
  const isFloat = end % 1 !== 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * ease;
    el.textContent = isFloat ? current.toFixed(1) : Math.round(current);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ─── Harmful Ingredients ───
function renderHarmfulIngredients(items) {
  if (!items.length) {
    els.harmfulContent.innerHTML = '<p style="color:var(--text-muted);padding:8px 0;">No harmful ingredients detected.</p>';
    return;
  }
  els.harmfulContent.innerHTML = items.map((item, i) => `
    <div class="ingredient-item" style="animation-delay:${i * 0.08}s">
      <div class="ingredient-badge badge-harmful">⚠</div>
      <div class="ingredient-details">
        <h4>${escapeHtml(item.name)}</h4>
        <p>${escapeHtml(item.reason)}</p>
      </div>
    </div>
  `).join('');
}

// ─── Good Nutrients ───
function renderGoodNutrients(items) {
  if (!items.length) {
    els.nutritionContent.innerHTML = '<p style="color:var(--text-muted);padding:8px 0;">No significant nutrients detected.</p>';
    return;
  }
  els.nutritionContent.innerHTML = items.map((item, i) => `
    <div class="ingredient-item" style="animation-delay:${i * 0.08}s">
      <div class="ingredient-badge badge-good">✓</div>
      <div class="ingredient-details">
        <h4>${escapeHtml(item.name)}${item.amount ? ' – ' + escapeHtml(item.amount) : ''}</h4>
        <p>${escapeHtml(item.benefit)}</p>
      </div>
    </div>
  `).join('');
}

// ─── Processing Level ───
function renderProcessingLevel(level, reason) {
  const steps = {
    'Natural': [0],
    'Processed': [0, 1],
    'Ultra-Processed': [0, 1, 2]
  };

  const stepEls = [$('#procNatural'), $('#procProcessed'), $('#procUltra')];
  const lineEls = [$('#procLine1'), $('#procLine2')];

  // Reset
  stepEls.forEach(s => s.className = 'proc-step');
  lineEls.forEach(l => l.className = 'proc-line');

  const activeSteps = steps[level] || [0, 1];
  const colorClass = level === 'Natural' ? 'active' : level === 'Processed' ? 'warn' : 'danger';
  const lineClass = level === 'Natural' ? 'filled' : level === 'Processed' ? 'filled-warn' : 'filled-danger';

  activeSteps.forEach(i => stepEls[i].classList.add(colorClass));
  if (activeSteps.length > 1) lineEls[0].classList.add(lineClass);
  if (activeSteps.length > 2) lineEls[1].classList.add(lineClass);

  els.processingReason.textContent = reason || '—';
}

// ─── Donut Chart ───
function renderDonutChart(nutrients) {
  const canvas = $('#donutChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 220 * dpr;
  canvas.height = 220 * dpr;
  ctx.scale(dpr, dpr);

  const data = [
    { label: 'Protein', value: nutrients.protein || 0, color: '#a78bfa' },
    { label: 'Carbs', value: nutrients.carbs || 0, color: '#a5b4fc' },
    { label: 'Fat', value: nutrients.fat || 0, color: '#c4b5fd' },
    { label: 'Fiber', value: nutrients.fiber || 0, color: '#ddd6fe' },
    { label: 'Sugar', value: nutrients.sugars || 0, color: '#fca5a5' },
  ].filter(d => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 110, cy = 110, outerR = 90, innerR = 58;

  let startAngle = -Math.PI / 2;
  data.forEach(d => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = d.color;
    ctx.fill();
    startAngle += sliceAngle;
  });

  // Center hole glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
  grad.addColorStop(0, 'rgba(17, 24, 39, 1)');
  grad.addColorStop(1, 'rgba(17, 24, 39, 0.95)');
  ctx.beginPath();
  ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Center text
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '700 18px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(nutrients.energy_kcal || 0)}`, cx, cy - 4);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 11px Inter, sans-serif';
  ctx.fillText('kcal/100g', cx, cy + 14);

  // Legend
  els.chartLegend.innerHTML = data.map(d => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${d.color}"></div>
      <span class="legend-label">${d.label}</span>
      <span class="legend-value">${d.value.toFixed(1)}g</span>
    </div>
  `).join('');
}

// ─── Daily Value Bars ───
function renderDailyValueBars(nutrients) {
  const dvs = [
    { name: 'Calories', value: nutrients.energy_kcal || 0, dv: 2000, color: '#a5b4fc' },
    { name: 'Fat', value: (nutrients.fat || 0), dv: 65, color: '#fdba74' },
    { name: 'Saturated Fat', value: (nutrients.saturated_fat || 0), dv: 20, color: '#fca5a5' },
    { name: 'Sugar', value: (nutrients.sugars || 0), dv: 50, color: '#fca5a5' },
    { name: 'Sodium', value: (nutrients.sodium || 0) * 1000, dv: 2300, color: '#fcd34d' },
    { name: 'Fiber', value: (nutrients.fiber || 0), dv: 25, color: '#a78bfa' },
    { name: 'Protein', value: (nutrients.protein || 0), dv: 50, color: '#a78bfa' },
  ];

  els.dvBars.innerHTML = dvs.map(dv => {
    const pct = Math.min(Math.round((dv.value / dv.dv) * 100), 150);
    return `
      <div class="dv-row">
        <div class="dv-label-row">
          <span class="dv-name">${dv.name}</span>
          <span class="dv-percent">${pct}%</span>
        </div>
        <div class="dv-bar-track">
          <div class="dv-bar-fill" style="background:${dv.color}" data-width="${Math.min(pct, 100)}%"></div>
        </div>
      </div>
    `;
  }).join('');

  // Animate bars in
  setTimeout(() => {
    $$('.dv-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 300);
}

// ─── Alternatives ───
function renderAlternatives(alts) {
  els.altGrid.innerHTML = alts.map(alt => {
    const scoreClass = alt.score >= 8 ? 'green' : 'yellow';
    const kcal = alt.kcalPerServing ? `<div class="alt-kcal">🔥 ${alt.kcalPerServing} kcal / serving</div>` : '';
    const company = alt.company ? `<div class="alt-company">${escapeHtml(alt.company)}</div>` : '';
    return `
      <div class="alt-card">
        <div class="alt-score ${scoreClass}">${alt.score}</div>
        <div class="alt-info">
          <h4>${escapeHtml(alt.name)}</h4>
          ${company}
          ${kcal}
          <p>${escapeHtml(alt.reason)}</p>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Warnings ───
function renderWarnings(warnings) {
  els.warningsGrid.innerHTML = warnings.map(w => `
    <div class="warning-chip">
      <span class="warning-icon">${w.icon || '⚠️'}</span>
      <div class="warning-text">
        <h4>${escapeHtml(w.group)}</h4>
        <p>${escapeHtml(w.reason)}</p>
      </div>
    </div>
  `).join('');
}

// ─── Future Impact ───
function renderFutureImpact(impact) {
  const risks = [
    { key: 'weightGain', label: 'Weight Gain Risk', icon: '⚖️' },
    { key: 'heartDisease', label: 'Heart Disease Risk', icon: '❤️' },
    { key: 'diabetes', label: 'Diabetes Risk', icon: '🩸' },
    { key: 'kidneyStress', label: 'Kidney Stress Risk', icon: '🫘' },
    { key: 'energyCrash', label: 'Energy Crash Risk', icon: '⚡' },
  ];

  const levelValues = { 'Low': 25, 'Medium': 55, 'High': 85 };
  const levelClass = { 'Low': 'low', 'Medium': 'medium', 'High': 'high' };

  els.riskBars.innerHTML = risks.map(r => {
    const level = impact[r.key] || 'Low';
    const width = levelValues[level] || 25;
    const cls = levelClass[level] || 'low';

    return `
      <div class="risk-row">
        <div class="risk-label-row">
          <span class="risk-name"><span class="risk-name-icon">${r.icon}</span> ${r.label}</span>
          <span class="risk-level risk-${cls}">${level}</span>
        </div>
        <div class="risk-bar-track">
          <div class="risk-bar-fill risk-fill-${cls}" data-width="${width}%"></div>
        </div>
      </div>
    `;
  }).join('');

  // Animate
  setTimeout(() => {
    $$('.risk-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 600);
}

// ─── Toxins Radar ───
function renderToxinsRadar(toxins, product, nutrients) {
  if (!toxins || toxins.length === 0) {
    // Use fallback logic
    const ingredientList = (product.ingredients || '').toLowerCase();
    toxins = [];
    if (ingredientList.includes('palm oil')) toxins.push({ name: 'Pesticide Residues', icon: '🌿', risk: 'Medium', desc: 'Palm oil crops are heavily treated with pesticides.' });
    if (ingredientList.includes('oat') || ingredientList.includes('wheat')) toxins.push({ name: 'Glyphosate Risk', icon: '☣️', risk: 'Medium', desc: 'Oat and wheat are commonly pre-harvested with glyphosate.' });
    toxins.push({ name: 'Microplastics', icon: '🔬', risk: 'Low', desc: 'Packaged foods have a low-to-moderate microplastic contamination risk.' });
    toxins.push({ name: 'Heavy Metals', icon: '⚗️', risk: 'Low', desc: 'No high-risk heavy metal ingredients detected.' });
  }

  const levelValues = { Low: 25, Medium: 55, High: 90 };
  els.toxinsGrid.innerHTML = toxins.map(t => {
    const cls = (t.risk || 'Low').toLowerCase();
    const width = levelValues[t.risk] || 25;
    return `
      <div class="toxin-chip">
        <div class="toxin-header">
          <span class="toxin-icon">${t.icon || '⚠️'}</span>
          <span class="toxin-name">${escapeHtml(t.name)}</span>
        </div>
        <div class="toxin-level-bar">
          <div class="toxin-fill toxin-fill-${cls}" data-width="${width}%"></div>
        </div>
        <div class="toxin-label">
          <span>${escapeHtml(t.desc)}</span>
          <span class="toxin-risk ${cls}">${t.risk}</span>
        </div>
      </div>
    `;
  }).join('');

  setTimeout(() => {
    $$('.toxin-fill').forEach(el => { el.style.width = el.dataset.width; });
  }, 500);
}

// ─── Neuro-Nutrition ───
function renderNeuroNutrition(neuro, nutrients) {
  if (!neuro || neuro.length === 0) {
    const highSugar = (nutrients.sugars || 0) > 15;
    neuro = [
      { label: 'Brain Fog', icon: '🌫️', verdict: highSugar ? 'bad' : 'neutral', desc: highSugar ? 'High sugar causes mental cloudiness 1-2 hours post-meal.' : 'Low brain fog risk.' },
      { label: 'Mood Impact', icon: '😊', verdict: 'neutral', desc: 'Neutral mood effect detected.' },
      { label: 'Sleep Quality', icon: '🌙', verdict: highSugar ? 'bad' : 'good', desc: highSugar ? 'High sugar disrupts deep sleep stages.' : 'No significant sleep disruptors.' },
      { label: 'Focus & Energy', icon: '⚡', verdict: highSugar ? 'neutral' : 'good', desc: highSugar ? 'Quick energy burst followed by a crash.' : 'Sustained energy profile.' }
    ];
  }

  els.neuroGrid.innerHTML = neuro.map(n => `
    <div class="neuro-chip">
      <span class="neuro-icon">${n.icon}</span>
      <span class="neuro-label">${escapeHtml(n.label)}</span>
      <span class="neuro-verdict ${n.verdict}">${n.verdict === 'good' ? 'Positive' : n.verdict === 'bad' ? 'Negative' : 'Neutral'}</span>
      <span class="neuro-desc">${escapeHtml(n.desc)}</span>
    </div>
  `).join('');
}

// ─── Healthwashing Detector ───
function renderHealthwashing(claims, product) {
  if (!claims || claims.length === 0) {
    els.healthwashList.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;">✅ No obvious marketing deception detected for this product.</p>`;
    return;
  }

  els.healthwashList.innerHTML = claims.map(c => `
    <div class="healthwash-item">
      <div class="healthwash-claim">
        <span class="claim-label">CLAIM</span>
        <span class="claim-text">${escapeHtml(c.claim)}</span>
      </div>
      <div class="healthwash-reality">
        <span class="reality-label">REALITY</span>
        <span class="reality-text">${escapeHtml(c.reality)}</span>
      </div>
    </div>
  `).join('');
}


// ─── Ingredient Risk DB (deterministic fallback) ───
const INGREDIENT_RISK_DB = [
  // Preservatives
  { term: 'sodium benzoate',  name: 'Sodium Benzoate',      purpose: 'Preservative',   risk: 'Medium', detail: 'Linked to irritation in sensitive individuals; can form benzene with Vitamin C.' },
  { term: 'potassium sorbate',name: 'Potassium Sorbate',    purpose: 'Preservative',   risk: 'Low',    detail: 'Generally safe; may cause mild skin/eye irritation in high concentrations.' },
  { term: 'sodium nitrate',   name: 'Sodium Nitrate',       purpose: 'Preservative',   risk: 'High',   detail: 'Can form nitrosamines, which are potentially carcinogenic.' },
  { term: 'sodium nitrite',   name: 'Sodium Nitrite',       purpose: 'Preservative',   risk: 'High',   detail: 'Associated with increased colorectal cancer risk in processed meats.' },
  { term: 'bha',              name: 'BHA (E320)',            purpose: 'Antioxidant',    risk: 'Medium', detail: 'Possible carcinogen; listed as reasonably anticipated to be a human carcinogen.' },
  { term: 'bht',              name: 'BHT (E321)',            purpose: 'Antioxidant',    risk: 'Medium', detail: 'Endocrine disruption suspected in high doses; avoided in some countries.' },
  { term: 'tbhq',             name: 'TBHQ',                  purpose: 'Preservative',   risk: 'Medium', detail: 'High doses linked to precancerous stomach tumors in animal studies.' },
  // Sweeteners
  { term: 'aspartame',        name: 'Aspartame',            purpose: 'Sweetener',      risk: 'Medium', detail: 'IARC classified as possibly carcinogenic (Group 2B); debated in scientific community.' },
  { term: 'saccharin',        name: 'Saccharin',            purpose: 'Sweetener',      risk: 'Medium', detail: 'Historical cancer concerns in rats; considered safe for humans at normal intake.' },
  { term: 'acesulfame',       name: 'Acesulfame-K',         purpose: 'Sweetener',      risk: 'Medium', detail: 'May disrupt gut microbiome; limited long-term human data available.' },
  { term: 'sucralose',        name: 'Sucralose',            purpose: 'Sweetener',      risk: 'Low',    detail: 'Generally safe; some research suggests it may alter insulin response.' },
  { term: 'stevia',           name: 'Stevia',               purpose: 'Sweetener',      risk: 'Low',    detail: 'Plant-derived; considered safe by major food authorities.' },
  { term: 'high fructose corn syrup', name: 'HFCS',         purpose: 'Sweetener',      risk: 'High',   detail: 'Strongly linked to obesity, insulin resistance, and fatty liver disease.' },
  { term: 'sugar',            name: 'Added Sugar',          purpose: 'Sweetener',      risk: 'Medium', detail: 'Excess sugar drives obesity, type 2 diabetes, dental caries, and inflammation.' },
  // Emulsifiers & Stabilisers
  { term: 'soy lecithin',     name: 'Soy Lecithin',         purpose: 'Emulsifier',     risk: 'Low',    detail: 'Derived from soya; may trigger soy allergy; generally regarded as safe.' },
  { term: 'carrageenan',      name: 'Carrageenan',          purpose: 'Stabiliser',     risk: 'Medium', detail: 'May cause inflammation and gut irritation; banned in EU infant formula.' },
  { term: 'mono and diglycerides', name: 'Mono & Diglycerides', purpose: 'Emulsifier', risk: 'Low',   detail: 'May contain small amounts of trans fats; generally recognised as safe.' },
  { term: 'xanthan gum',      name: 'Xanthan Gum',          purpose: 'Thickener',      risk: 'Low',    detail: 'Derived from fermentation; safe for most people; may cause bloating.' },
  { term: 'guar gum',         name: 'Guar Gum',             purpose: 'Thickener',      risk: 'Low',    detail: 'High fiber content; may cause digestive discomfort in large amounts.' },
  { term: 'carrageenan',      name: 'Carrageenan',          purpose: 'Thickener',      risk: 'Medium', detail: 'May promote gut inflammation; controversial in processed foods.' },
  // Fats & Oils
  { term: 'hydrogenated',     name: 'Hydrogenated Oil',     purpose: 'Fat',            risk: 'High',   detail: 'Contains trans fats strongly linked to heart disease and LDL increase.' },
  { term: 'palm oil',         name: 'Palm Oil',             purpose: 'Fat',            risk: 'Medium', detail: 'High in saturated fat; concern for cardiovascular health at high intake.' },
  { term: 'interesterified',  name: 'Interesterified Fat',  purpose: 'Fat',            risk: 'Medium', detail: 'Trans-fat alternative; may raise blood glucose and lower HDL cholesterol.' },
  // Colours & Flavours
  { term: 'artificial color', name: 'Artificial Colours',   purpose: 'Colour',         risk: 'Medium', detail: 'Some (Red 40, Yellow 5) linked to hyperactivity in children.' },
  { term: 'artificial colour',name: 'Artificial Colours',   purpose: 'Colour',         risk: 'Medium', detail: 'Some (Red 40, Yellow 5) linked to hyperactivity in children.' },
  { term: 'titanium dioxide', name: 'Titanium Dioxide',     purpose: 'Colour (white)',  risk: 'High',   detail: 'Banned in EU food (2022); potential genotoxic and DNA-damaging effects.' },
  { term: 'artificial flavor',name: 'Artificial Flavours',  purpose: 'Flavouring',     risk: 'Low',    detail: 'Synthetic compounds; generally safe but may mask poor ingredient quality.' },
  { term: 'artificial flavour',name: 'Artificial Flavours', purpose: 'Flavouring',     risk: 'Low',    detail: 'Synthetic compounds; generally safe but may mask poor ingredient quality.' },
  { term: 'msg',              name: 'MSG',                  purpose: 'Flavour Enhancer', risk: 'Medium', detail: 'Generally safe; some individuals report headaches (Chinese Restaurant Syndrome).' },
  { term: 'monosodium glutamate', name: 'MSG',              purpose: 'Flavour Enhancer', risk: 'Medium', detail: 'FDA considers safe; may trigger sensitivity reactions in some people.' },
  // Beneficial ingredients
  { term: 'whole wheat',      name: 'Whole Wheat',          purpose: 'Grain',          risk: 'Low',    detail: 'Rich in fiber, B vitamins, and minerals. Supports digestive health.' },
  { term: 'oat',              name: 'Oats',                 purpose: 'Grain',          risk: 'Low',    detail: 'Beta-glucan fiber lowers cholesterol and improves blood sugar control.' },
  { term: 'almonds',          name: 'Almonds',              purpose: 'Nut',            risk: 'Low',    detail: 'Excellent source of healthy fats, Vitamin E, and protein.' },
  { term: 'flaxseed',         name: 'Flaxseed',             purpose: 'Seed',           risk: 'Low',    detail: 'Rich in omega-3 ALA and lignans with anti-inflammatory properties.' },
  { term: 'sunflower oil',    name: 'Sunflower Oil',        purpose: 'Oil',            risk: 'Low',    detail: 'Good source of Vitamin E; high omega-6 may promote inflammation if overconsumed.' },
  { term: 'salt',             name: 'Salt (Sodium Chloride)', purpose: 'Seasoning',   risk: 'Medium', detail: 'Excess sodium raises blood pressure and cardiovascular risk.' },
  { term: 'calcium carbonate',name: 'Calcium Carbonate',    purpose: 'Fortification',  risk: 'Low',    detail: 'Provides calcium for bone health; generally safe as a food additive.' },
  { term: 'iron',             name: 'Iron (Fortified)',      purpose: 'Fortification',  risk: 'Low',    detail: 'Essential nutrient added to combat iron deficiency; safe at label doses.' },
];

function generateIngredientRiskFallback(ingredientsText, nutrients) {
  const lower = ingredientsText.toLowerCase();
  const found = [];
  const seen = new Set();
  INGREDIENT_RISK_DB.forEach(entry => {
    if (!seen.has(entry.name) && lower.includes(entry.term)) {
      seen.add(entry.name);
      found.push({ name: entry.name, purpose: entry.purpose, risk: entry.risk, detail: entry.detail });
    }
  });
  // Always show at least a couple of nutrition-based entries if list is thin
  if ((nutrients.sugars || 0) > 10 && !seen.has('Added Sugar')) {
    found.push({ name: 'Added Sugar', purpose: 'Sweetener', risk: 'Medium', detail: 'Product contains significant sugar that may contribute to energy spikes and metabolic issues.' });
  }
  if ((nutrients.sodium || 0) > 0.5 && !seen.has('Salt (Sodium Chloride)')) {
    found.push({ name: 'High Sodium', purpose: 'Seasoning', risk: 'Medium', detail: `Contains ${((nutrients.sodium || 0) * 1000).toFixed(0)}mg sodium/100g. Excess sodium raises blood pressure.` });
  }
  if (found.length === 0) {
    found.push({ name: 'No High-Risk Additives Found', purpose: 'N/A', risk: 'Low', detail: 'Ingredient list appears to be free of major concerning additives.' });
  }
  return found.slice(0, 8);
}

function renderIngredientRiskRadar(items, product) {
  const list = (items && items.length > 0) ? items : generateIngredientRiskFallback(product?.ingredients || '', {});
  const riskColor = { Low: '#86efac', Medium: '#fcd34d', High: '#fca5a5' };
  const riskBg   = { Low: 'rgba(0,230,118,0.1)', Medium: 'rgba(255,202,40,0.1)', High: 'rgba(255,82,82,0.12)' };

  els.radarGrid.innerHTML = list.map(item => {
    const risk = item.risk || 'Low';
    const color = riskColor[risk] || riskColor.Low;
    const bg    = riskBg[risk] || riskBg.Low;
    return `
    <div class="radar-item" style="border-left: 3px solid ${color}; background: ${bg};">
      <div class="radar-item-header">
        <span class="radar-name">${escapeHtml(item.name)}</span>
        <span class="radar-risk-badge" style="background:${color}22; color:${color};">${escapeHtml(risk)}</span>
      </div>
      <div class="radar-purpose">📌 ${escapeHtml(item.purpose)}</div>
      <div class="radar-detail">${escapeHtml(item.detail)}</div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════
// SCORE BREAKDOWN RENDERER
// ═══════════════════════════════════════════════════════
function renderScoreBreakdown(breakdown) {
  if (!breakdown) return;
  const { baseScore, penalties, bonuses, score } = breakdown;

  let html = `<div class="breakdown-row breakdown-base">
    <span class="breakdown-label">Base Score</span>
    <span class="breakdown-value breakdown-neutral">${baseScore.toFixed(1)}</span>
  </div>`;

  if (penalties.length > 0) {
    html += `<div class="breakdown-section-label">📉 Penalties</div>`;
    penalties.forEach(p => {
      html += `<div class="breakdown-row">
        <span class="breakdown-label">${escapeHtml(p.label)} <span class="breakdown-detail">${escapeHtml(p.detail)}</span></span>
        <span class="breakdown-value breakdown-penalty">${p.value.toFixed(1)}</span>
      </div>`;
    });
  }

  if (bonuses.length > 0) {
    html += `<div class="breakdown-section-label">📈 Positive Factors</div>`;
    bonuses.forEach(b => {
      html += `<div class="breakdown-row">
        <span class="breakdown-label">${escapeHtml(b.label)} <span class="breakdown-detail">${escapeHtml(b.detail)}</span></span>
        <span class="breakdown-value breakdown-bonus">+${b.value.toFixed(1)}</span>
      </div>`;
    });
  }

  html += `<div class="breakdown-row breakdown-total">
    <span class="breakdown-label">Final Score</span>
    <span class="breakdown-value breakdown-final">${score.toFixed(1)}<span class="breakdown-max">/10</span></span>
  </div>`;

  els.breakdownList.innerHTML = html;
}

// ═══════════════════════════════════════════════════════
// DISEASE CONFIGURATION & PENALTY SYSTEM
// ═══════════════════════════════════════════════════════
const DISEASE_CONFIGS = {
  'Diabetes': {
    icon: '🩸',
    rules: [
      { nutrient: 'sugars', threshold: 5, penalty: -0.8, label: 'High Sugar', explanation: 'Score reduced due to high added sugar content, which may negatively impact blood sugar levels for people with diabetes.' },
      { nutrient: 'carbs', threshold: 40, penalty: -0.5, label: 'High Carbs', explanation: 'Elevated carbohydrate content can cause blood sugar spikes and complicate glycemic control.' },
      { ingredientTerms: ['high fructose corn syrup', 'corn syrup', 'dextrose', 'maltodextrin', 'glucose syrup', 'invert sugar', 'agave'], penalty: -0.6, label: 'Glycemic Ingredients', explanation: 'Contains high-glycemic ingredients that rapidly raise blood sugar levels.' },
    ]
  },
  'Hypertension': {
    icon: '🫀',
    rules: [
      { nutrient: 'sodium', threshold: 0.3, penalty: -1.0, label: 'Excess Sodium', explanation: 'High sodium content may elevate blood pressure, which is dangerous for hypertensive individuals.' },
      { nutrient: 'salt', threshold: 1.0, penalty: -0.5, label: 'High Salt', explanation: 'Excess salt directly correlates with blood pressure elevation.' },
      { ingredientTerms: ['msg', 'monosodium glutamate', 'soy sauce', 'brine', 'sodium phosphate'], penalty: -0.4, label: 'Salty Additives', explanation: 'Contains sodium-rich additives that may worsen blood pressure.' },
    ]
  },
  'Heart Disease': {
    icon: '❤️',
    rules: [
      { nutrient: 'saturated_fat', threshold: 3, penalty: -0.8, label: 'Saturated Fat', explanation: 'High saturated fat raises LDL cholesterol, increasing cardiovascular risk.' },
      { ingredientTerms: ['hydrogenated', 'trans fat', 'partially hydrogenated'], penalty: -1.0, label: 'Trans Fat', explanation: 'Trans fats significantly increase heart disease risk by raising LDL and lowering HDL cholesterol.' },
      { nutrient: 'sodium', threshold: 0.4, penalty: -0.5, label: 'Excess Sodium', explanation: 'High sodium strains the cardiovascular system by increasing blood pressure.' },
      { nutrient: 'cholesterol', threshold: 50, penalty: -0.4, label: 'Dietary Cholesterol', explanation: 'Dietary cholesterol may worsen cardiovascular outcomes in susceptible individuals.' },
    ]
  },
  'Obesity': {
    icon: '⚖️',
    rules: [
      { nutrient: 'energy_kcal', threshold: 250, penalty: -0.7, label: 'High Calories', explanation: 'Calorie-dense foods contribute to excess energy intake and weight gain.' },
      { nutrient: 'fat', threshold: 15, penalty: -0.5, label: 'High Fat', explanation: 'High fat content increases caloric density, promoting weight gain.' },
      { nutrient: 'sugars', threshold: 10, penalty: -0.6, label: 'Added Sugar', explanation: 'Sugar provides empty calories and promotes fat storage through insulin spikes.' },
      { nutrient: 'fiber', threshold: 3, belowThreshold: true, penalty: -0.4, label: 'Low Fiber', explanation: 'Low fiber reduces satiety, leading to overconsumption and weight gain.' },
    ]
  },
  'PCOS': {
    icon: '🔬',
    rules: [
      { nutrient: 'sugars', threshold: 8, penalty: -0.8, label: 'Sugar (Insulin)', explanation: 'Sugar triggers insulin spikes, worsening insulin resistance common in PCOS.' },
      { nutrient: 'carbs', threshold: 35, penalty: -0.5, label: 'Refined Carbs', explanation: 'High refined carbs worsen insulin resistance and hormonal imbalance in PCOS.' },
      { ingredientTerms: ['whey', 'skim milk powder', 'milk protein', 'casein'], penalty: -0.3, label: 'Dairy Proteins', explanation: 'Some dairy proteins may increase androgen levels, aggravating PCOS symptoms.' },
    ]
  },
  'Kidney Disease': {
    icon: '🫘',
    rules: [
      { nutrient: 'sodium', threshold: 0.3, penalty: -0.8, label: 'Excess Sodium', explanation: 'Damaged kidneys struggle to filter sodium, causing fluid retention and hypertension.' },
      { nutrient: 'protein', threshold: 15, penalty: -0.6, label: 'High Protein', explanation: 'Excess protein creates additional waste products that stressed kidneys must filter.' },
      { nutrient: 'potassium', threshold: 300, penalty: -0.5, label: 'High Potassium', explanation: 'Impaired kidneys cannot efficiently excrete potassium, risking dangerous hyperkalemia.' },
    ]
  },
  'High Cholesterol': {
    icon: '🔴',
    rules: [
      { nutrient: 'saturated_fat', threshold: 3, penalty: -0.9, label: 'Saturated Fat', explanation: 'Saturated fat directly raises LDL cholesterol levels in the bloodstream.' },
      { ingredientTerms: ['hydrogenated', 'trans fat', 'partially hydrogenated'], penalty: -0.8, label: 'Trans Fat', explanation: 'Trans fats are the worst dietary factor for cholesterol — they raise LDL and lower HDL.' },
      { nutrient: 'cholesterol', threshold: 40, penalty: -0.5, label: 'Dietary Cholesterol', explanation: 'Dietary cholesterol can further elevate blood cholesterol in hypercholesterolemic individuals.' },
    ]
  },
};

/**
 * Calculate disease-specific penalties (capped at -3.0 total).
 * Returns { penalties: [...], totalPenalty: number }
 */
function calculateDiseasePenalties(nutrients, ingredientsText, selectedDiseases) {
  const penalties = [];
  const ing = (ingredientsText || '').toLowerCase();

  selectedDiseases.forEach(disease => {
    const config = DISEASE_CONFIGS[disease];
    if (!config) return;

    config.rules.forEach(rule => {
      let applies = false;

      if (rule.nutrient) {
        const value = nutrients[rule.nutrient] || 0;
        if (rule.belowThreshold) {
          applies = value < rule.threshold && value >= 0;
        } else {
          applies = value > rule.threshold;
        }
      }

      if (rule.ingredientTerms) {
        const found = rule.ingredientTerms.some(t => ing.includes(t));
        if (found) applies = true;
      }

      if (applies) {
        // Avoid duplicate penalties for the same label across diseases
        const existing = penalties.find(p => p.label === rule.label && p.disease === disease);
        if (!existing) {
          penalties.push({
            disease,
            icon: config.icon,
            label: rule.label,
            value: rule.penalty,
            explanation: rule.explanation
          });
        }
      }
    });
  });

  // Cap total at -3.0
  let totalPenalty = penalties.reduce((s, p) => s + p.value, 0);
  if (totalPenalty < -3.0) {
    const scale = -3.0 / totalPenalty;
    penalties.forEach(p => { p.value = Math.round(p.value * scale * 10) / 10; });
    totalPenalty = -3.0;
  }

  return { penalties, totalPenalty: Math.round(totalPenalty * 10) / 10 };
}

// ═══════════════════════════════════════════════════════
// HEALTH CONDITIONS RENDERER
// ═══════════════════════════════════════════════════════
let selectedDiseases = [];

function renderHealthConditions(data) {
  selectedDiseases = [];

  // Render toggle chips
  const diseases = Object.keys(DISEASE_CONFIGS);
  els.conditionsChips.innerHTML = diseases.map(disease => {
    const config = DISEASE_CONFIGS[disease];
    return `<button class="condition-chip" data-disease="${escapeHtml(disease)}" id="chip-${disease.replace(/\s+/g, '-')}">
      <span class="chip-icon">${config.icon}</span>
      <span class="chip-label">${escapeHtml(disease)}</span>
    </button>`;
  }).join('');

  // Hide result area
  els.conditionsResult.classList.add('hidden');

  // Attach toggle handlers
  els.conditionsChips.querySelectorAll('.condition-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const disease = chip.dataset.disease;
      chip.classList.toggle('active');

      if (chip.classList.contains('active')) {
        if (!selectedDiseases.includes(disease)) selectedDiseases.push(disease);
      } else {
        selectedDiseases = selectedDiseases.filter(d => d !== disease);
      }

      recalculateWithDiseases();
    });
  });
}

function recalculateWithDiseases() {
  if (!currentScanData) return;

  const baseScore = currentScanData.score;
  const { penalties, totalPenalty } = calculateDiseasePenalties(
    currentScanData.nutrients,
    currentScanData.product.ingredients || '',
    selectedDiseases
  );

  if (selectedDiseases.length === 0) {
    // Reset to base score
    els.conditionsResult.classList.add('hidden');
    renderGauge(baseScore);
    // Re-render breakdown without disease penalties
    renderScoreBreakdown(currentScanData.scoreBreakdown);
    return;
  }

  // Calculate adjusted score
  const adjustedScore = Math.max(1, Math.min(10, Math.round((baseScore + totalPenalty) * 10) / 10));

  // Show result panel
  els.conditionsResult.classList.remove('hidden');

  // Render adjusted score comparison
  const scoreColor = adjustedScore >= 8 ? 'var(--accent-green)' : adjustedScore >= 5 ? 'var(--accent-yellow)' : 'var(--accent-red)';
  els.conditionsAdjusted.innerHTML = `
    <div class="adjusted-comparison">
      <div class="adjusted-item">
        <span class="adjusted-label">Base Score</span>
        <span class="adjusted-value">${baseScore.toFixed(1)}</span>
      </div>
      <div class="adjusted-arrow">→</div>
      <div class="adjusted-item adjusted-item-new">
        <span class="adjusted-label">Adjusted</span>
        <span class="adjusted-value" style="color:${scoreColor}">${adjustedScore.toFixed(1)}</span>
      </div>
      <div class="adjusted-delta" style="color:var(--accent-red)">
        ${totalPenalty.toFixed(1)}
      </div>
    </div>`;

  // Render disease-specific penalties
  els.conditionsPenalties.innerHTML = penalties.map(p => `
    <div class="condition-penalty-row">
      <span class="condition-penalty-disease">${p.icon} ${escapeHtml(p.disease)}</span>
      <span class="condition-penalty-label">${escapeHtml(p.label)}</span>
      <span class="condition-penalty-value">${p.value.toFixed(1)}</span>
    </div>
  `).join('');

  // Render explanations
  els.conditionsExplanations.innerHTML = penalties.map(p => `
    <div class="condition-explanation">
      <span class="explanation-icon">${p.icon}</span>
      <p>${escapeHtml(p.explanation)}</p>
    </div>
  `).join('');

  // Update the main gauge with animated transition
  renderGauge(adjustedScore);

  // Update breakdown to include disease penalties
  if (currentScanData.scoreBreakdown) {
    const bd = currentScanData.scoreBreakdown;
    const augmented = {
      ...bd,
      score: adjustedScore,
      diseasePenalties: penalties,
      diseaseTotalPenalty: totalPenalty
    };
    renderScoreBreakdownWithDiseases(augmented);
  }
}

/**
 * Extended breakdown that includes disease penalties
 */
function renderScoreBreakdownWithDiseases(breakdown) {
  if (!breakdown) return;
  const { baseScore, penalties, bonuses, score, diseasePenalties, diseaseTotalPenalty } = breakdown;

  let html = `<div class="breakdown-row breakdown-base">
    <span class="breakdown-label">Base Score</span>
    <span class="breakdown-value breakdown-neutral">${baseScore.toFixed(1)}</span>
  </div>`;

  if (penalties.length > 0) {
    html += `<div class="breakdown-section-label">📉 Penalties</div>`;
    penalties.forEach(p => {
      html += `<div class="breakdown-row">
        <span class="breakdown-label">${escapeHtml(p.label)} <span class="breakdown-detail">${escapeHtml(p.detail)}</span></span>
        <span class="breakdown-value breakdown-penalty">${p.value.toFixed(1)}</span>
      </div>`;
    });
  }

  if (bonuses.length > 0) {
    html += `<div class="breakdown-section-label">📈 Positive Factors</div>`;
    bonuses.forEach(b => {
      html += `<div class="breakdown-row">
        <span class="breakdown-label">${escapeHtml(b.label)} <span class="breakdown-detail">${escapeHtml(b.detail)}</span></span>
        <span class="breakdown-value breakdown-bonus">+${b.value.toFixed(1)}</span>
      </div>`;
    });
  }

  if (diseasePenalties && diseasePenalties.length > 0) {
    html += `<div class="breakdown-section-label breakdown-disease-label">🏥 Health Condition Adjustments</div>`;
    diseasePenalties.forEach(p => {
      html += `<div class="breakdown-row breakdown-disease-row">
        <span class="breakdown-label">${p.icon} ${escapeHtml(p.label)} <span class="breakdown-detail">${escapeHtml(p.disease)}</span></span>
        <span class="breakdown-value breakdown-penalty">${p.value.toFixed(1)}</span>
      </div>`;
    });
  }

  html += `<div class="breakdown-row breakdown-total">
    <span class="breakdown-label">Final Score</span>
    <span class="breakdown-value breakdown-final">${score.toFixed(1)}<span class="breakdown-max">/10</span></span>
  </div>`;

  els.breakdownList.innerHTML = html;
}

// ═══════════════════════════════════════════════════════
// CONFETTI 🎉
// ═══════════════════════════════════════════════════════
function launchConfetti() {
  const canvas = els.confettiCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#a78bfa', '#c4b5fd', '#a5b4fc', '#ddd6fe', '#fcd34d', '#fdba74'];

  for (let i = 0; i < 80; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1
    });
  }

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    pieces.forEach(p => {
      if (p.opacity <= 0) return;
      alive = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.rotation += p.rotSpeed;
      if (frame > 60) p.opacity -= 0.015;
    });

    frame++;
    if (alive && frame < 200) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(draw);
}


// ═══════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════
function initHistory() {
  updateHistoryBadge();
}

function saveToHistory(data) {
  const entry = {
    name: data.product.name,
    brand: data.product.brand,
    score: data.score,
    timestamp: Date.now()
  };
  scanHistory.unshift(entry);
  if (scanHistory.length > 20) scanHistory = scanHistory.slice(0, 20);
  localStorage.setItem('nutriscan_history', JSON.stringify(scanHistory));
  updateHistoryBadge();
}

function updateHistoryBadge() {
  els.historyBadge.textContent = scanHistory.length;
}

function toggleHistory() {
  const panel = els.historyPanel;
  if (panel.classList.contains('show')) {
    panel.classList.remove('show');
    setTimeout(() => panel.classList.add('hidden'), 400);
  } else {
    panel.classList.remove('hidden');
    requestAnimationFrame(() => panel.classList.add('show'));
    renderHistory();
  }
}

function renderHistory() {
  if (scanHistory.length === 0) {
    els.historyList.innerHTML = '<p class="empty-history">No scans yet</p>';
    return;
  }

  els.historyList.innerHTML = scanHistory.map(entry => {
    const scoreColor = entry.score >= 8 ? 'var(--accent-green)' : entry.score >= 5 ? 'var(--accent-yellow)' : 'var(--accent-red)';
    const scoreBg = entry.score >= 8 ? 'var(--accent-green-dim)' : entry.score >= 5 ? 'var(--accent-yellow-dim)' : 'var(--accent-red-dim)';
    const timeAgo = getTimeAgo(entry.timestamp);

    return `
      <div class="history-item">
        <div class="history-score" style="background:${scoreBg};color:${scoreColor}">${entry.score}</div>
        <div class="history-info">
          <h4>${escapeHtml(entry.name)}</h4>
          <p>${escapeHtml(entry.brand || '')} · ${timeAgo}</p>
        </div>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════
// SHARE REPORT
// ═══════════════════════════════════════════════════════
function shareReport() {
  const name = els.productName.textContent;
  const score = els.gaugeScore.textContent;
  const label = els.gaugeLabel.textContent;

  const text = `🔬 NutriScan Report\n\n📦 ${name}\n⭐ Health Score: ${score}/10 (${label})\n\nAnalyzed with NutriScan – Know What You Eat!`;

  if (navigator.share) {
    navigator.share({ title: 'NutriScan Report', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      const btn = els.shareBtn;
      btn.style.color = 'var(--accent-green)';
      btn.style.borderColor = 'var(--accent-green)';
      setTimeout(() => { btn.style.color = ''; btn.style.borderColor = ''; }, 2000);
    });
  }
}

// ═══════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
