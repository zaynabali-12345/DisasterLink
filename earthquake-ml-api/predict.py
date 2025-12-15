import joblib
import pandas as pd
import numpy as np
import time

# 1. Load all the saved components
print("Loading model, scaler, and features...")
try:
    # Make sure these are the new models from the updated training script
    reg_model = joblib.load("final_reg_model.pkl")
    scaler = joblib.load("scaler.pkl")
    features = joblib.load("features.pkl") # Load the feature list
    print("✅ Components loaded successfully.")
except FileNotFoundError as e:
    print(f"❌ Error: A model, scaler, or encoder file is missing. {e}")
    print("Please ensure all .pkl files from the training script are in the same directory.")
    exit()

# --- Replicate the risk zone function from training ---
def get_risk_zone(lat, lon):
    # Zone 1: Himalayan Belt (High Risk)
    if 28 <= lat <= 36 and 73 <= lon <= 88:
        return 'himalayan_belt'
    # Zone 2: Andaman & Nicobar Islands (High Risk)
    if 6 <= lat <= 14 and 92 <= lon <= 94:
        return 'andaman_nicobar'
    # Zone 3: Kutch Region, Gujarat (High Risk)
    if 22 <= lat <= 24 and 68 <= lon <= 72:
        return 'kutch_region'
    # Zone 4: Indo-Gangetic Plain (Medium Risk)
    if 24 <= lat <= 30 and 75 <= lon <= 88:
        return 'indo_gangetic_plain'
    # Zone 5: Peninsular India (Low Risk)
    if 8 <= lat <= 22 and 72 <= lon <= 85:
        return 'peninsular_india'
    return 'other'

# --- Replicate the risk assignment function from training ---
def assign_risk(magnitude):
    if magnitude >= 6.0: return 'High'
    if magnitude >= 5.0: return 'Medium'
    return 'Low'

# 2. Create a function to make predictions
def predict_risk(latitude, longitude, depth):
    """
    Predicts earthquake risk from raw input data.
    """
    try:
        # --- Step A: Create a dictionary with the raw inputs ---
        # Using a dictionary first is cleaner for single predictions
        input_dict = {
            'latitude': float(latitude),
            'longitude': float(longitude),
            'depth': float(depth)
        }

        # --- Step B: Engineer all features to match training ---
        now = pd.to_datetime('now', utc=True)
        input_dict['year'] = now.year
        input_dict['day'] = now.day
        input_dict['hour'] = now.hour
        input_dict['month_sin'] = np.sin(2 * np.pi * now.month / 12)
        input_dict['month_cos'] = np.cos(2 * np.pi * now.month / 12)
        
        # --- Step C: Create and one-hot encode the risk zone ---
        # This is the corrected logic
        risk_zone = get_risk_zone(input_dict['latitude'], input_dict['longitude'])
        for col in features:
            if col.startswith('zone_'):
                # Set the correct zone to 1, others will be 0 by default
                if col == f'zone_{risk_zone}':
                    input_dict[col] = 1
                else:
                    input_dict[col] = 0
        
        # --- Step D: Create the final DataFrame in the correct order ---
        # This logic now perfectly matches the robust implementation in app.py
        final_df = pd.DataFrame([input_dict])[features]
        final_data = final_df # Keep variable name for consistency below

        # --- Step E: Scale the data ---
        scaled_data = scaler.transform(final_data)

        # --- Step F: Make predictions using the scaled data ---
        # 1. Predict the magnitude
        magnitude_pred = reg_model.predict(scaled_data)[0].item()

        # 2. Determine risk from the predicted magnitude
        risk_pred = assign_risk(magnitude_pred)

        return {
            "predicted_magnitude": round(magnitude_pred, 2),
            "predicted_risk_category": risk_pred,
            "input_features": final_data.to_dict('records')[0]
        }

    except Exception as e:
        return {"error": str(e)}

# 3. Example Usage
if __name__ == '__main__':
    print("\n--- Running Test Predictions ---")

    # Test Case 1: Low Risk (Peninsular India)
    print("\nTesting LOW risk case...")
    low_risk_pred = predict_risk(latitude=15.0, longitude=78.0, depth=10.0)
    print(low_risk_pred)

    # Test Case 2: Medium Risk (Indo-Gangetic Plain)
    print("\nTesting MEDIUM risk case...")
    medium_risk_pred = predict_risk(latitude=26.0, longitude=82.0, depth=25.0)
    print(medium_risk_pred)

    # Test Case 3: High Risk (Himalayan Belt)
    print("\nTesting HIGH risk case...")
    high_risk_pred = predict_risk(latitude=30.0, longitude=80.0, depth=15.0)
    print(high_risk_pred)
