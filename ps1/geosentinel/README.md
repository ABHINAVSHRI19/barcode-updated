# GeoSentinel

**AI‑Based Landslide Risk Monitoring & Early Warning System**

This prototype demonstrates a Streamlit dashboard that predicts landslide risk for monitoring points in the North‑Eastern region of India using a synthetic dataset and a `RandomForestClassifier`.

## Project Structure
```
geosentinel/
├─ app.py                # Streamlit entry point
├─ requirements.txt      # Python dependencies
├─ README.md             # This file
├─ data/
│   └─ ner_locations.py # Monitoring point data
├─ model/
│   ├─ train_model.py   # Synthetic data generation & model training
│   └─ geosentinel_model.pkl (generated)
├─ utils/
│   └─ risk_levels.py   # Risk band definitions & helper
└─ components/
    ├─ risk_form.py     # Input sliders & prediction UI
    ├─ risk_map.py      # Folium map rendering
    └─ report.py        # Risk report formatting
```

## Setup
```bash
python -m venv venv
source venv/bin/activate  # macOS / Linux
pip install -r requirements.txt
```

## Train the Model
```bash
python model/train_model.py
```
This will generate `model/geosentinel_model.pkl`.

## Run the Dashboard
```bash
streamlit run app.py
```
Open the URL shown by Streamlit (usually `http://localhost:8501`).

## Disclaimer
This is a **prototype** using **simulated** data. It is **not** a production‑grade early‑warning system and should not be used for real‑world decision making.
