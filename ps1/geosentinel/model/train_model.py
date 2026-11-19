import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import pathlib

def generate_dataset(n=1000, seed=42):
    np.random.seed(seed)
    rainfall = np.random.uniform(10, 250, n)
    soil_moisture = np.random.uniform(10, 100, n)
    slope = np.random.uniform(2, 60, n)
    elevation = np.random.uniform(50, 2500, n)
    # weighted risk formula
    risk_score = (
        0.40 * (rainfall / 250) +
        0.30 * (soil_moisture / 100) +
        0.25 * (slope / 60) +
        0.05 * (elevation / 2500)
    )
    landslide = (risk_score > 0.55).astype(int)
    df = pd.DataFrame({
        "Rainfall": rainfall,
        "Soil_Moisture": soil_moisture,
        "Slope": slope,
        "Elevation": elevation,
        "Landslide": landslide,
    })
    return df

def train_and_save():
    df = generate_dataset()
    X = df[["Rainfall", "Soil_Moisture", "Slope", "Elevation"]]
    y = df["Landslide"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    acc = clf.score(X_test, y_test)
    print(f"Test accuracy: {acc:.4f}")
    model_path = pathlib.Path(__file__).parent / "geosentinel_model.pkl"
    joblib.dump(clf, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save()
