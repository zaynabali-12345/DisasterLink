import pandas as pd
import requests
import math
import joblib
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.metrics import classification_report, accuracy_score

# --- Configuration ---
# Fetches significant earthquakes (M4.5+) from the last year
USGS_API_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"
START_TIME = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%dT%H:%M:%S')
END_TIME = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')

MODEL_FILENAME = "earthquake_risk_model.pkl"
SCALER_FILENAME = "data_scaler.pkl"

# Define a major seismic hotspot (e.g., Japan Trench) for feature engineering
HOTSPOT_LAT = 38.0
HOTSPOT_LON = 143.0

# --- Helper Functions ---
def fetch_usgs_data():
    """Fetches the last 12 months of earthquake data from the USGS API."""
    print("Fetching 12 months of earthquake data from USGS...")
    params = {
        'format': 'geojson',
        'starttime': START_TIME,
        'endtime': END_TIME,
        'minmagnitude': 4.5,  # Focus on significant earthquakes for better patterns
    }
    try:
        response = requests.get(USGS_API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        print(f"Successfully fetched {len(data['features'])} earthquake events.")
        return data['features']
    except requests.RequestException as e:
        print(f"Error fetching USGS data: {e}")
        return None

def create_dataframe(features):
    """Converts the GeoJSON features into a clean pandas DataFrame."""
    if not features:
        return pd.DataFrame()
        
    properties = [event['properties'] for event in features]
    geometries = [event['geometry']['coordinates'] for event in features]
    
    df = pd.DataFrame(properties)
    
    # Extract coordinates and depth
    df['longitude'] = [coords[0] for coords in geometries]
    df['latitude'] = [coords[1] for coords in geometries]
    df['depth'] = [coords[2] for coords in geometries]
    
    # Select relevant columns and drop rows with missing values
    df = df[['mag', 'latitude', 'longitude', 'depth']]
    df.dropna(inplace=True)
    
    # Remove duplicates
    df.drop_duplicates(inplace=True)
    
    print(f"DataFrame created with {len(df)} cleaned records.")
    return df

def classify_risk(magnitude):
    """Classifies risk based on magnitude, creating our target variable."""
    if magnitude >= 7.0:
        return "Severe"
    elif magnitude >= 6.0:
        return "High"
    elif magnitude >= 5.0:
        return "Moderate"
    else:
        return "Low"

def add_engineered_features(df):
    """Adds new, more meaningful features to the DataFrame."""
    print("Engineering new features...")
    # Calculate distance from a known seismic hotspot
    df['distance_to_hotspot'] = df.apply(
        lambda row: math.sqrt((row['latitude'] - HOTSPOT_LAT)**2 + (row['longitude'] - HOTSPOT_LON)**2), axis=1
    )
    return df

def train_and_save_model(df):
    """Trains a classifier, scales the data, and saves the model and scaler."""
    if df.empty:
        print("DataFrame is empty. Cannot train model.")
        return

    # Create target variable
    df['risk_category'] = df['mag'].apply(classify_risk)

    # Add our new engineered feature
    df = add_engineered_features(df)
    
    # Define features (X) and target (y)
    features = ['latitude', 'longitude', 'depth', 'distance_to_hotspot']
    target = 'risk_category'
    
    X = df[features]
    y = df[target]
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # We will now use a pipeline to combine SMOTE and the classifier
    # This prevents data leakage from the validation set into the training set
    print("Training model with SMOTE to handle class imbalance...")
    pipeline = ImbPipeline([
        ('scaler', StandardScaler()),
        ('smote', SMOTE(random_state=42)),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced'))
    ])
    
    # Train the pipeline
    pipeline.fit(X_train, y_train)
    
    # We need to save the scaler and model separately for the prediction API
    scaler = pipeline.named_steps['scaler']
    model = pipeline.named_steps['classifier']

    # Evaluate the model
    X_test_scaled = scaler.transform(X_test) # Scale test data for prediction
    y_pred = model.predict(X_test_scaled) 
    print("\nModel Evaluation Report:")
    print(classification_report(y_test, y_pred, zero_division=0))
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.2f}")
    
    # Save the trained model and the scaler
    joblib.dump(model, MODEL_FILENAME)
    joblib.dump(scaler, SCALER_FILENAME)
    print(f"\nModel saved as '{MODEL_FILENAME}'")
    print(f"Scaler saved as '{SCALER_FILENAME}'")

# --- Main Execution ---
if __name__ == "__main__":
    usgs_features = fetch_usgs_data()
    if usgs_features:
        earthquake_df = create_dataframe(usgs_features)
        if not earthquake_df.empty:
            train_and_save_model(earthquake_df)
