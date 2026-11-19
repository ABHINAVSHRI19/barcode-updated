import streamlit as st
import pandas as pd
import joblib
from pathlib import Path
from utils.risk_levels import get_risk_level


def render(model):
    st.subheader("🛰️ Landslide Risk Assessment")
    # Sliders
    rainfall = st.slider("Rainfall (mm)", 0, 250, 100, step=5)
    soil = st.slider("Soil Moisture (%)", 0, 100, 50, step=5)
    slope = st.slider("Slope (°)", 0, 60, 25, step=1)
    elevation = st.slider("Elevation (m)", 50, 2500, 800, step=50)

    if st.button("🔍 ASSESS LANDSLIDE RISK"):
        # Prepare data row
        input_df = pd.DataFrame({
            "Rainfall": [rainfall],
            "Soil_Moisture": [soil],
            "Slope": [slope],
            "Elevation": [elevation]
        })
        prob = model.predict_proba(input_df)[0, 1]
        score = round(prob * 100, 1)
        risk = get_risk_level(score)
        # Display results
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Score", f"{score}%")
            st.metric("Level", f"{risk['emoji']} {risk['level']}")
        with col2:
            st.metric("Recommended Action", risk['action'])
        # Plotly gauge
        import plotly.graph_objects as go
        gauge = go.Figure(go.Indicator(
            mode="gauge+number",
            value=score,
            title={'text': "Risk Score"},
            gauge={
                'axis': {'range': [0, 100]},
                'bar': {'color': risk['color']},
                'steps': [
                    {'range': [0, 25], 'color': "#00ff00"},
                    {'range': [25, 50], 'color': "#ffff00"},
                    {'range': [50, 75], 'color': "#ff8000"},
                    {'range': [75, 100], 'color': "#ff0000"},
                ],
                'threshold': {
                    'line': {'color': risk['color'], 'width': 4},
                    'thickness': 0.75,
                    'value': score
                }
            }
        ))
        st.plotly_chart(gauge, use_container_width=True)
        st.warning(risk['warning'])
