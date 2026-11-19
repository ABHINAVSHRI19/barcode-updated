# 🍎 NutriScan – AI-Powered Food Health Analyzer

A smart web application that analyzes packaged food products by scanning barcodes or capturing nutrition labels. Uses multiple AI and food data APIs to provide comprehensive health scores, ingredient analysis, and nutritional insights.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [How It Works](#how-it-works)
4. [APIs & Integrations](#apis--integrations)
5. [Features](#features)
6. [Installation & Setup](#installation--setup)
7. [Running the Application](#running-the-application)
8. [API Endpoints](#api-endpoints)
9. [File Structure](#file-structure)
10. [Development Notes](#development-notes)

---

## 🎯 Project Overview

**NutriScan** is a full-stack food analysis application that helps users make healthier food choices by:

- **Scanning Barcodes**: Quickly retrieve product information using barcode numbers (EAN-13)
- **Capturing Nutrition Labels**: Use AI vision to extract text from packaged food labels
- **Analyzing Ingredients**: Get detailed ingredient breakdowns with health risk assessments
- **Health Scoring**: Receive AI-powered health scores based on nutritional content
- **Long-term Impact Predictions**: Understand the cumulative health effects of consuming a product

### Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js (HTTP server)
- **AI Models**: NVIDIA Nim API (for reasoning and vision OCR)
- **Food Databases**: 
  - Open Food Facts (barcode lookup)
  - USDA FoodData Central (nutritional data)
  - FatSecret (alternative nutrition data)
- **Vision**: NVIDIA Gemma 4-31B (multimodal, for label OCR)

---

## 🏗️ Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Frontend)                       │
│                                                                 │
│  ┌─────────────────┐        ┌──────────────────┐               │
│  │ Barcode Scanner │        │ Label Camera     │               │
│  │  (Html5Qrcode)  │        │ (Gemini Vision)  │               │
│  └────────┬────────┘        └────────┬─────────┘               │
│           │                          │                         │
│           └──────────┬───────────────┘                         │
│                      │                                         │
│                      ▼                                         │
│         ┌────────────────────────────┐                         │
│         │  NutriScan App Logic       │                         │
│         │  (app.js)                  │                         │
│         │  • Parse input             │                         │
│         │  • Call APIs               │                         │
│         │  • Format results          │                         │
│         └────────────┬───────────────┘                         │
└────────────────────────┼─────────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────────┐        ┌────────────────────┐
│  Local Dev Server   │        │ External APIs      │
│  (server.js)        │        │ (HTTPS)            │
│                     │        │                    │
│ • Static files      │◄──────►│ • NVIDIA Nim       │
│ • CORS proxy        │        │ • Open Food Facts  │
│ • Request routing   │        │ • USDA FDC         │
│ • Authorization     │        │ • FatSecret        │
│ • Error handling    │        │                    │
└─────────────────────┘        └────────────────────┘
```

### Server Architecture (server.js)

The backend is a **lightweight Node.js HTTP server** (no Express) that:

1. **Serves Static Files**: HTML, CSS, JavaScript, images
2. **Acts as CORS Proxy**: Forwards requests to NVIDIA API
3. **Manages Timeouts**: Handles long-running AI inference requests (300s)
4. **Handles Errors**: Graceful error responses for upstream failures

```
Request → server.js → Router → Handler
                       ├─ GET /* → Static files (index.html, style.css, app.js)
                       └─ POST /api/nvidia → NVIDIA Proxy
```

---

## 🔄 How It Works

### Workflow 1: Barcode Scanning & Analysis

```
User enters barcode (or scans with camera)
    ↓
app.js validates input
    ↓
Query Open Food Facts API → Get product info (name, brand, image)
    ↓
Query USDA FDC API → Get detailed nutritional facts
    ↓
NVIDIA Nim API (reasoning) → Analyze ingredients & health risks
    ↓
Compute health score (0-100)
    ↓
Generate verdict (🟢 Good / 🟡 Moderate / 🔴 Poor)
    ↓
Display results with visualizations
    ↓
Save to browser localStorage (scan history)
```

### Workflow 2: Nutrition Label OCR

```
User taps "Capture Nutrition Label"
    ↓
Camera opens (uses device camera)
    ↓
User captures image of nutrition label
    ↓
Image compressed & encoded to Base64
    ↓
Send to NVIDIA Nim API (Gemma 4-31B vision model)
    ↓
AI extracts text from label (OCR)
    ↓
Parse extracted ingredients & macros
    ↓
Same analysis pipeline as barcode workflow
    ↓
Display results
```

---

## 🔌 APIs & Integrations

### 1. **NVIDIA Nim API** (Main AI Engine)

**Purpose**: LLM reasoning for ingredient analysis and text extraction from images

- **Endpoint**: `https://integrate.api.nvidia.com/v1/chat/completions`
- **Models Used**:
  - **LLM**: General reasoning for ingredient analysis, health impact assessment
  - **Vision**: Gemma 4-31B (multimodal) for nutrition label OCR
- **Auth**: Bearer token (API key in `Authorization` header)
- **Type**: Server-Sent Events (SSE) streaming responses
- **Timeout**: 300 seconds (for complex reasoning tasks)
- **Local Proxy**: `http://localhost:3002/api/nvidia` (CORS proxy)

**Example Request** (ingredient analysis):
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Analyze these ingredients: Corn syrup, high fructose corn syrup, palm oil, artificial colors. What are the health risks?"
    }
  ],
  "model": "nvidia/llama-2-70b-chat",
  "temperature": 0.5,
  "stream": true
}
```

### 2. **Open Food Facts API** (Barcode Database)

**Purpose**: Retrieve product information by barcode

- **Endpoint**: `https://world.openfoodfacts.org/api/v2/product/{barcode}`
- **Response**: Product name, brand, image, ingredients list, nutritional info
- **No Auth**: Public API, no key required
- **Format**: REST (JSON)

**Example Response**:
```json
{
  "product": {
    "code": "3017620422003",
    "name": "Nutella",
    "brands": "Ferrero",
    "image_url": "...",
    "ingredients_text": "Sugar, Palm Oil, Hazelnuts...",
    "nutriments": {
      "energy_100g": 2280,
      "carbohydrates_100g": 63,
      "fat_100g": 30.5,
      "proteins_100g": 8.7
    }
  }
}
```

### 3. **USDA FoodData Central API** (Detailed Nutrition)

**Purpose**: Get precise nutritional facts for health scoring

- **Endpoint**: `https://api.nal.usda.gov/fdc/v1/foods/search`
- **Auth**: API key (`bqXSigVHwPKVbNKxgfhNEwt65i4N4GtmF401DmQ0`)
- **Query Params**: `query` (product name), `api_key`
- **Format**: REST (JSON)

**Example Request**:
```
GET https://api.nal.usda.gov/fdc/v1/foods/search?query=nutella&api_key=YOUR_KEY
```

**Response Fields Used**:
- Calories per 100g
- Total fat, saturated fat
- Carbohydrates, sugars
- Protein
- Fiber
- Sodium
- Micronutrients (Vitamin A, C, Iron, Calcium, etc.)

### 4. **FatSecret Platform API** (Alternative Nutrition)

**Purpose**: Backup nutrition source using OAuth 1.0

- **Base URL**: `https://platform.fatsecret.com/rest/server.api`
- **Auth**: OAuth 1.0a (Consumer Key & Secret)
- **Methods**:
  - `food.search` – Search foods by name
  - `food.get` – Get detailed nutrition
- **Format**: REST (XML/JSON)

---

## ✨ Features

### Core Features

| Feature | How It Works |
|---------|-------------|
| **Barcode Scanner** | Uses `Html5QrcodeScanner` library to read EAN-13 barcodes via device camera |
| **Manual Barcode Input** | Type barcode number directly for quick lookup |
| **Nutrition Label OCR** | Capture image → NVIDIA Gemma vision model extracts text → Parse ingredients |
| **Health Score (0-100)** | AI-calculated based on: sugar, saturated fat, sodium, fiber, protein |
| **Ingredient Analysis** | Lists each ingredient with health classification (green/yellow/red) |
| **Toxin Detection** | Flags harmful additives (artificial colors, preservatives, etc.) |
| **Macro Breakdown** | Visual charts for Carbs, Fat, Protein percentages |
| **Micronutrient Grid** | Shows Vitamins & Minerals % Daily Value |
| **Health Verdict** | Visual emoji + text (🟢 Healthy / 🟡 Moderate / 🔴 Unhealthy) |
| **Long-term Impact** | Predicts health effects of regular consumption |
| **Scan History** | Saves to browser localStorage; shows last 20 scans |
| **Share Report** | Generate shareable report of analysis |

### UI/UX Features

- Floating animated orbs & 3D shapes
- Smooth scroll animations
- Collapsible sections (Harmful Content, Nutrition Facts)
- Dark mode optimized
- Mobile-first responsive design
- Confetti animation on positive results

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** (v14+)
- **npm** (comes with Node.js)
- **Browser** with camera access (for barcode scanning & label capture)
- **API Keys**:
  - NVIDIA Nim API key (for AI reasoning & vision)
  - USDA FoodData Central key (for nutrition data)

### Step 1: Clone or Download

```bash
cd /path/to/Barcode-main-2
```

### Step 2: Obtain API Keys

1. **NVIDIA Nim API**:
   - Sign up at [NVIDIA API Catalog](https://build.nvidia.com)
   - Get your API key
   - Add to `app.js` line 9:
     ```javascript
     const NVIDIA_KEY = 'your-key-here';
     ```

2. **USDA FoodData Central**:
   - Register at [USDA FDC API](https://fdc.nal.usda.gov/api-guide.html)
   - Get your API key
   - Add to `app.js` line 11:
     ```javascript
     const USDA_KEY = 'your-key-here';
     ```

### Step 3: No npm dependencies!

This project uses **vanilla JavaScript** — no npm packages needed. The only external libraries are:
- `Html5QrcodeScanner` (loaded via CDN in index.html)
- Google Fonts (CDN)

### Step 4: Verify File Structure

```
Barcode-main-2/
├── server.js          ← Backend server
├── app.js             ← Frontend logic
├── index.html         ← Main page
├── style.css          ← Styling
├── favicon.svg        ← App icon
└── README.md          ← This file
```

---

## 🏃 Running the Application

### Start the Server

```bash
node server.js
```

You should see:
```
  ╔══════════════════════════════════════╗
  ║   NutriScan Dev Server running 🚀    ║
  ║   http://localhost:3002             ║
  ║                                      ║
  ║   /api/nvidia  → NVIDIA proxy        ║
  ╚══════════════════════════════════════╝
```

### Open in Browser

Navigate to: **http://localhost:3002**

### Test Features

1. **Manual Barcode Input**: 
   - Enter `3017620422003` (Nutella) → Click Scan
   
2. **Barcode Camera**: 
   - Click "Use Camera to Scan Barcode"
   - Point at any product barcode
   
3. **Label Capture**: 
   - Click "📷 Capture Nutrition Label"
   - Take photo of nutrition facts label
   - AI extracts ingredients & nutrients

---

## 📡 API Endpoints

### Backend Endpoints (server.js)

#### 1. Static Files
```
GET /                          → index.html
GET /app.js                    → app.js
GET /style.css                 → style.css
GET /favicon.svg               → favicon.svg
GET /[filename]                → Any file in project directory
```

**Response**: File content with appropriate MIME type

---

#### 2. NVIDIA API Proxy
```
POST /api/nvidia
```

**Purpose**: Forward requests to NVIDIA Nim API (solves CORS issue)

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer nvapi-xxxxx
```

**Request Body** (JSON):
```json
{
  "messages": [
    {
      "role": "user",
      "content": "..."
    }
  ],
  "model": "nvidia/llama-2-70b-chat",
  "temperature": 0.7,
  "stream": true
}
```

**Response**: 
- Status: 200 (success) or 4xx/5xx (error)
- Content-Type: `text/event-stream` (SSE streaming)
- Body: Server-Sent Events stream with AI response chunks

**Example SSE Stream**:
```
data: {"choices":[{"delta":{"content":"The"}}]}
data: {"choices":[{"delta":{"content":" product"}}]}
data: {"choices":[{"delta":{"content":" contains"}}]}
...
data: [DONE]
```

**Error Response** (if NVIDIA API fails):
```json
{
  "error": "NVIDIA API timed out after 300 seconds."
}
```

---

#### 3. CORS Preflight
```
OPTIONS /api/nvidia
```

**Response Headers**:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

### Frontend API Calls (app.js)

#### 1. Open Food Facts

```javascript
GET https://world.openfoodfacts.org/api/v2/product/{barcode}
```

Used to fetch:
- Product name
- Brand
- Image URL
- Ingredients list
- Basic nutritional info

---

#### 2. USDA FoodData Central

```javascript
GET https://api.nal.usda.gov/fdc/v1/foods/search?query={product_name}&api_key={key}
```

Used to fetch:
- Detailed nutritional data
- Calorie content
- Macronutrient breakdown
- Micronutrient data (vitamins, minerals)

---

#### 3. NVIDIA Nim API (via Local Proxy)

```javascript
POST http://localhost:3002/api/nvidia
```

**Call 1: Ingredient Analysis**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Analyze these ingredients for health: [ingredients]. Classify each as safe/caution/harmful."
    }
  ],
  "model": "nvidia/llama-2-70b-chat",
  "temperature": 0.5,
  "stream": true
}
```

**Call 2: Label OCR (Vision)**
```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Extract all text from this nutrition label image. Include ingredients and nutritional facts."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,{base64_image}"
          }
        }
      ]
    }
  ],
  "model": "nvidia/gemma-4-31b",
  "temperature": 0.3,
  "stream": true
}
```

---

## 📁 File Structure

### `server.js` (164 lines)
- HTTP server setup
- MIME type mapping
- Static file handler
- NVIDIA proxy handler
- CORS support
- Error handling

**Key Functions**:
- `handleStatic(req, res)` – Serve static files
- `handleNvidiaProxy(req, res)` – Forward requests to NVIDIA API
- `pipe(src, dest)` – Stream piping helper

---

### `app.js` (500+ lines)
- DOM element references
- API integration
- Scan history management
- Health score calculation
- UI rendering logic
- Event handlers

**Key Functions**:
- `startAnalysis(input)` – Main analysis pipeline
- `fetchProductInfo(barcode)` – Query Open Food Facts
- `fetchNutrition(product)` – Query USDA API
- `analyzeWithNvidia(ingredients)` – Call NVIDIA for analysis
- `computeHealthScore(nutrition)` – Calculate score (0-100)
- `renderResults(data)` – Render analysis UI
- `openLabelCamera()` / `captureLabel()` – Label OCR workflow

---

### `index.html` (200+ lines)
- Semantic HTML5 structure
- Hero section with input panel
- Loading state placeholder
- Results section (hidden until analysis)
- History panel (modal)
- Not-found error screen
- Label camera modal

**Sections**:
- Header with logo & history button
- Hero section with barcode input & camera buttons
- Results section with:
  - Score gauge
  - Verdict emoji
  - Ingredient breakdown
  - Nutrition charts
  - Toxin & risk assessment
  - Micronutrient grid
  - Long-term impact

---

### `style.css` (500+ lines)
- Modern gradient design
- Dark mode optimized
- Responsive grid layouts
- Animations (particles, confetti, scroll)
- Modal styles
- Chart & gauge styles
- Mobile-first breakpoints

**Key Classes**:
- `.hero-section` – Hero area
- `.results-section` – Analysis results
- `.score-card` – Health score display
- `.ingredient-card` – Ingredient list
- `.chart-*` – Nutrition charts
- `.loading-spinner` – Loading animation

---

## 🔧 Development Notes

### How Health Score is Calculated

```
Base: 100 points

Deductions:
- High Sugar: -5 to -15 points
- High Saturated Fat: -5 to -10 points
- High Sodium: -5 to -10 points
- Artificial Additives: -2 to -5 points per additive
- Low Fiber: -3 to -5 points

Bonuses:
- High Protein: +5 to +10 points
- High Fiber: +5 to +10 points
- Presence of Whole Grains: +5 points

Final Score: 0-100
  0-33   → 🔴 Poor
  34-66  → 🟡 Moderate
  67-100 → 🟢 Good
```

### Supported Barcode Formats

- **EAN-13** (most common in Europe & Asia)
- **UPC-A** (North America)
- **Code-128** (shipping labels)

### API Rate Limits

| API | Limit | Plan |
|-----|-------|------|
| Open Food Facts | Unlimited | Free |
| USDA FDC | 1000 req/hr | Free tier |
| NVIDIA Nim | Based on your plan | Paid |
| FatSecret | 100 req/day | Free |

### Timeout Configuration

- **Static files**: Default (fast)
- **NVIDIA Proxy**: **300 seconds** (for long reasoning tasks)
- **Database queries**: 10 seconds

---

## 🐛 Troubleshooting

### Port 3002 Already in Use

```bash
# Find process using port 3002
lsof -i :3002

# Kill process
kill -9 <PID>

# Then restart
node server.js
```

### CORS Errors in Browser Console

✅ **Expected** – The app uses a local proxy for NVIDIA API to avoid CORS
❌ **If still happening** – Ensure server is running at `http://localhost:3002`

### Camera Not Working

- Allow browser camera permissions
- Use HTTPS or localhost (browser security requirement)
- Ensure device has camera

### NVIDIA API Key Invalid

- Check API key in `app.js` line 9
- Verify key hasn't expired
- Test key at: https://build.nvidia.com

### Results Not Loading

- Check browser console for errors (F12)
- Verify barcode is valid (8 or 13 digits)
- Try a known barcode: `3017620422003` (Nutella)

---

## 📝 License

This project is open source. Modify and use as needed.

---

## 🤝 Contributing

Suggestions for improvements:
1. Add barcode history export (CSV)
2. Support more barcode formats
3. Add allergen database integration
4. Offline mode with cached products
5. Dark/Light mode toggle
6. Nutritionist AI consultation

---

**Happy scanning! 🍎✨**
