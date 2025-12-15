from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
import math
import httpx
from datetime import datetime, timedelta

# -------------------------------
# Pydantic Models for Request and Response
# -------------------------------
class PredictionRequest(BaseModel):
    city: str
    depth: float

    @field_validator('depth')
    def depth_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Depth must be a positive number')
        return v


class PredictionResponse(BaseModel):
    city: str
    latitude: float
    longitude: float
    predicted_magnitude: float
    predicted_risk: str


# -------------------------------
# FastAPI App Initialization
# -------------------------------
app = FastAPI(
    title="DisasterLink Earthquake Prediction API",
    description="API to predict earthquake magnitude and risk based on city and depth using USGS data and rule-based model.",
    version="5.1.0"  # Updated stable version
)

# -------------------------------
# Constants
# -------------------------------
USGS_API_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"

# Major seismic hotspots globally
SEISMIC_HOTSPOTS = [
    ("Japan Trench", 38.0, 143.0),
    ("San Andreas Fault, USA", 34.05, -118.24),
    ("Ring of Fire, Chile", -30.5, -71.5),
    ("Himalayan Belt, Nepal", 28.0, 84.0),
    ("Sunda Arc, Indonesia", -6.2, 106.8),
]

# -------------------------------
# Helper Functions
# -------------------------------
def calculate_risk(magnitude: float) -> str:
    if magnitude >= 7.0:
        return "Severe"     # Strong global earthquakes
    elif magnitude >= 6.0:
        return "High"       # Strong regional quakes
    elif magnitude >= 5.0:
        return "Moderate"   # Mid-range activity
    else:
        return "Low"        # Very weak activity



async def get_coordinates(city: str) -> tuple[float, float]:
    """
    Fetch latitude and longitude for a given city using OpenStreetMap (Nominatim).
    """
    nominatim_url = f"https://nominatim.openstreetmap.org/search?city={city}&format=json&limit=1"
    headers = {'User-Agent': 'DisasterLink/1.0'}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(nominatim_url, headers=headers)
            response.raise_for_status()
            data = response.json()
            if not data:
                raise HTTPException(status_code=404, detail=f"City '{city}' not found.")
            return float(data[0]['lat']), float(data[0]['lon'])
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Error connecting to geolocation service: {exc}")
        except (KeyError, IndexError):
            raise HTTPException(status_code=404, detail=f"Could not parse coordinates for city: '{city}'.")


async def get_recent_seismic_activity(latitude: float, longitude: float) -> float:
    """
    Fetch recent earthquake activity within 30 days for the given location.
    Returns an activity score between 0.0 and 3.0
    """
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%dT%H:%M:%S')
    params = {
        'format': 'geojson',
        'starttime': thirty_days_ago,
        'latitude': latitude,
        'longitude': longitude,
        'maxradiuskm': 250,  # Search within 250 km
    }
    activity_score = 0.0

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(USGS_API_URL, params=params)
        if response.status_code == 200:
            events = response.json().get('features', [])
            if events:
                total_magnitude = sum(
                    event['properties']['mag'] for event in events if event['properties']['mag'] is not None
                )
                # Normalized activity score
                activity_score = total_magnitude / (len(events) * 2.0)
    except Exception:
        pass  # Fail gracefully if USGS API request fails

    return min(activity_score, 3.0)  # Cap to prevent extreme spikes


# -------------------------------
# Root Endpoint
# -------------------------------
@app.get("/")
def read_root():
    return {"message": "Welcome to the DisasterLink Earthquake Prediction API (v5.1 - Stable Formula)!"}


# -------------------------------
# Prediction Endpoint
# -------------------------------
@app.post("/predict", response_model=PredictionResponse)
async def predict_earthquake(request: PredictionRequest):
    """
    Predict earthquake magnitude and risk for a given city and depth.
    """
    try:
        # Step 1: Fetch city coordinates
        latitude, longitude = await get_coordinates(request.city)

        # Step 2: Base score (reduced to avoid overestimation for non-risky areas)
        base_score = 2.0

        # Step 3: Depth impact (up to +2.0)
        depth_factor = min(request.depth, 300) / 300
        depth_impact = 2.0 * depth_factor

        # Step 4: Proximity to seismic hotspots (max +2.5)
        min_distance = float('inf')
        for _, h_lat, h_lon in SEISMIC_HOTSPOTS:
            distance = math.sqrt((latitude - h_lat) ** 2 + (longitude - h_lon) ** 2)
            if distance < min_distance:
                min_distance = distance
        proximity_impact = max(0, 2.5 - (min_distance / 500.0))

        # Step 5: Recent seismic activity
        activity_impact = await get_recent_seismic_activity(latitude, longitude)

        # Step 6: Final magnitude
        final_magnitude = base_score + depth_impact + proximity_impact + (activity_impact * 0.5)
        final_magnitude = min(round(final_magnitude, 2), 9.5)

        # Step 7: Determine risk category
        final_risk = calculate_risk(final_magnitude)

        # Debugging logs (for development)
        print("---- DEBUG INFO ----")
        print(f"City: {request.city}")
        print(f"Base Score: {base_score}")
        print(f"Depth Impact: {depth_impact}")
        print(f"Proximity Impact: {proximity_impact}")
        print(f"Activity Impact: {activity_impact}")
        print(f"Final Magnitude: {final_magnitude}")
        print("--------------------")

        return PredictionResponse(
            city=request.city,
            latitude=latitude,
            longitude=longitude,
            predicted_magnitude=final_magnitude,
            predicted_risk=final_risk
        )

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")


"""
How to Run
----------
1. Install dependencies:
   pip install fastapi uvicorn httpx

2. Run the app:
   uvicorn main:app --reload

3. Test Endpoint:
   POST http://127.0.0.1:8000/predict
   JSON Body Example:
   {
       "city": "Delhi",
       "depth": 50
   }
"""

