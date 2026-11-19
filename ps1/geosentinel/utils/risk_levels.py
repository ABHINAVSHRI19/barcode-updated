RISK_BANDS = [
    (25, "LOW", "🟢", "Continue routine monitoring.", "✅ No immediate critical warning."),
    (50, "MODERATE", "🟡", "Increase monitoring and inspect vulnerable areas.", "⚠️ Moderate risk detected."),
    (75, "HIGH", "🟠", "Prepare preventive measures and field inspection.", "⚠️ Elevated landslide risk detected."),
    (100, "CRITICAL", "🔴", "Immediate inspection and emergency preparedness recommended.", "🚨 CRITICAL RISK — EARLY WARNING TRIGGERED.")
]

COLORS = {
    "LOW": "green",
    "MODERATE": "orange",
    "HIGH": "red",
    "CRITICAL": "darkred",
}

def get_risk_level(score):
    """Return a dict with level, emoji, message, warning, color for a given score (0-100)."""
    for thresh, level, emoji, action, warning in RISK_BANDS:
        if score <= thresh:
            return {
                "level": level,
                "emoji": emoji,
                "action": action,
                "warning": warning,
                "color": COLORS[level]
            }
    # fallback (should not happen)
    return {
        "level": "UNKNOWN",
        "emoji": "❓",
        "action": "",
        "warning": "",
        "color": "gray",
    }

