import streamlit as st
import folium
from streamlit_folium import st_folium
from data.ner_locations import NER_LOCATIONS
from utils.risk_levels import COLORS


def render():
    st.subheader("🗺️ North‑Eastern Region Monitoring Map")
    m = folium.Map(location=[25.5, 93.0], zoom_start=6)
    for loc in NER_LOCATIONS:
        color = COLORS.get(loc["level"], "gray")
        popup_html = (
            f"<b>{loc['region']}</b><br>"
            f"Score: {loc['score']}<br>"
            f"Level: {loc['level']}<br>"
            "Prototype demonstration"
        )
        folium.CircleMarker(
            location=[loc["lat"], loc["lon"]],
            radius=8,
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.7,
            popup=popup_html,
        ).add_to(m)
    st_folium(m, width=800, height=600)
