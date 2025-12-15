import pandas as pd
import numpy as np
import requests
import joblib
from datetime import datetime
from sklearn.preprocessing import MinMaxScaler
import xgboost as xgb
import os

print("--- Starting Specialized, Multi-Model Training Pipeline ---")

def fetch_usgs_data(start_time, end_time, min_magnitude):
    """Fetches earthquake data from the USGS API."""
    usgs_api_url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    params = {"format": "geojson", "starttime": start_time, "endtime": end_time, "minmagnitude": min_magnitude, "limit": 20000}
    try:
        print(f"Downloading data from {start_time} to {end_time}...")
        response = requests.get(usgs_api_url, params=params)
        response.raise_for_status()
        print("Download complete.")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: Failed to download data. {e}")
        return None

def process_geojson_to_dataframe(data):
    """Converts GeoJSON data to a pandas DataFrame."""
    records = []
    if not data or 'features' not in data: return pd.DataFrame()
    for feature in data["features"]:
        props, coords = feature["properties"], feature["geometry"]["coordinates"]
        records.append({
            "time": pd.to_datetime(props["time"], unit='ms', errors='coerce'),
            "latitude": coords[1], "longitude": coords[0], "depth": coords[2],
            "magnitude": props["mag"]
        })
    return pd.DataFrame(records)

# --- 1. Data Fetching and Cleaning ---
start_date, end_date, min_mag = "1990-01-01", datetime.now().strftime("%Y-%m-%d"), 2.5
geojson_data = fetch_usgs_data(start_date, end_date, min_mag)

if not geojson_data:
    print("Could not fetch data. Exiting.")
    exit()

df = process_geojson_to_dataframe(geojson_data)
df.dropna(subset=['time', 'magnitude', 'latitude', 'longitude', 'depth'], inplace=True)
df.drop_duplicates(subset=['time', 'latitude', 'longitude', 'magnitude'], inplace=True)
df.columns = [col.lower() for col in df.columns] # Standardize to lowercase
print(f"\n✅ Dataset shape: {df.shape}")

# --- 2. Feature Engineering ---
print("\n🚀 Starting Feature Engineering...")
def get_risk_zone(lat, lon):
    if 28 <= lat <= 36 and 73 <= lon <= 88: return 'himalayan_belt'
    if 6 <= lat <= 14 and 92 <= lon <= 94: return 'andaman_nicobar'
    if 22 <= lat <= 24 and 68 <= lon <= 72: return 'kutch_region'
    if 24 <= lat <= 30 and 75 <= lon <= 88: return 'indo_gangetic_plain'
    if 8 <= lat <= 22 and 72 <= lon <= 85: return 'peninsular_india'
    return 'other'

df['zone'] = df.apply(lambda row: get_risk_zone(row['latitude'], row['longitude']), axis=1)

df['year'] = df['time'].dt.year
df['month_sin'] = np.sin(2 * np.pi * df['time'].dt.month/12)
df['month_cos'] = np.cos(2 * np.pi * df['time'].dt.month/12)
df['day'] = df['time'].dt.day
df['hour'] = df['time'].dt.hour
print("✅ Feature engineering complete.")

# --- 3. Train and Save a Model for Each Zone ---
print("\n🎯 Training specialized models for each geographic zone...")

features = ['depth', 'year', 'month_sin', 'month_cos', 'day', 'hour']
zones = df['zone'].unique()
# Ensure all possible zones are considered, even if not in the current dataset
all_possible_zones = ['himalayan_belt', 'andaman_nicobar', 'kutch_region', 'indo_gangetic_plain', 'peninsular_india', 'other']

# Create a 'models' directory if it doesn't exist to keep things clean
output_dir = "models"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

for zone in all_possible_zones:
    print(f"\n--- Training model for zone: {zone} ---")
    
    # If a zone has no data, train on the 'other' category as a fallback
    if zone not in zones or len(df[df['zone'] == zone]) < 50:
        if zone in zones:
            print(f"⚠️ Insufficient data for zone '{zone}' ({len(df[df['zone'] == zone])} samples). Using 'other' data as a fallback.")
        else:
            print(f"⚠️ No data for zone '{zone}'. Using 'other' data as a fallback.")
        zone_df = df[df['zone'] == 'other']
    else:
        zone_df = df[df['zone'] == zone]

    X = zone_df[features]
    y = zone_df['magnitude']

    # Each model gets its own scaler
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    model = xgb.XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=8,
        random_state=42,
        n_jobs=-1,
        reg_alpha=0.1 # Add a small regularization term
    )
    model.fit(X_scaled, y)

    # Save the model and its corresponding scaler
    joblib.dump(model, os.path.join(output_dir, f"model_{zone}.pkl"))
    joblib.dump(scaler, os.path.join(output_dir, f"scaler_{zone}.pkl"))
    print(f"✅ Saved model and scaler for zone: {zone}")

# Save the list of features for the API to use
joblib.dump(features, os.path.join(output_dir, "features.pkl"))

print("\n🎉 --- All specialized models trained and saved successfully! --- 🎉")
