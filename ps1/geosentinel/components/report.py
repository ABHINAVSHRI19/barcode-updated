import streamlit as st

def render(score, level_info):
    """Render a concise risk report panel.
    Args:
        score (float): Risk score 0-100.
        level_info (dict): Output of utils.risk_levels.get_risk_level.
    """
    st.markdown("---")
    st.subheader("📊 Risk Report")
    st.markdown(f"**Score:** {score}%")
    st.markdown(f"**Level:** {level_info['emoji']} {level_info['level']}")
    st.markdown(f"**Recommended Action:** {level_info['action']}")
    st.warning(level_info['warning'])
