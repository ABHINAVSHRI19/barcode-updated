import streamlit as st
import joblib
from pathlib import Path

# Load utilities and components
from utils.risk_levels import get_risk_level
from components.risk_form import render as render_risk_form
from components.risk_map import render as render_risk_map

# ---------------------------------------------------------------------------
# Load or train the model
model_path = Path(__file__).parent / "model" / "geosentinel_model.pkl"
if not model_path.is_file():
    # If model missing, train it on the fly
    from model.train_model import train_and_save
    train_and_save()
model = joblib.load(model_path)

# ---------------------------------------------------------------------------
# Streamlit page configuration
st.set_page_config(page_title="GeoSentinel", page_icon="🌍", layout="wide")

# Header
st.title("🌍 GeoSentinel")
st.subheader("AI‑Based Landslide Risk Monitoring & Early Warning System")
st.markdown("**Region:** North‑Eastern Region of India")

# Main layout – two tabs for clarity
tab_assessment, tab_map = st.tabs(["Risk Assessment", "Risk Map"])

with tab_assessment:
    # Render the risk assessment UI (sliders, prediction, gauge, etc.)
    render_risk_form(model)

with tab_map:
    # Render the folium map of monitoring points
    render_risk_map()

# Footer / disclaimer
st.caption("GeoSentinel Prototype | AI‑assisted landslide risk assessment")
st.caption("⚠️ Prototype demonstration using simulated monitoring values.")
