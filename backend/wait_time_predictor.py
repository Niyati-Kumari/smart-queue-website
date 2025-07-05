from flask import Flask, request, jsonify
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MODEL_PATH = 'model.pkl'
CSV_PATH = 'wait_times.csv'

# Train and save model if not already present
if not os.path.exists(MODEL_PATH):
    df = pd.read_csv(CSV_PATH)

    # Convert day to numeric
    df['day'] = df['day'].astype('category').cat.codes

    features = ['hour', 'day', 'weekend', 'queue_length']
    X = df[features]
    y = df['wait_time']

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)

@app.route('/')
def home():
    return "✅ Smart Queue API running. Use /predict?hour=14&day=Monday&weekend=0&queue=5"

@app.route('/predict')
def predict():
    try:
        # Collect query parameters
        hour = int(request.args.get('hour', 14))
        day = request.args.get('day', 'Monday')
        weekend = int(request.args.get('weekend', 0))
        queue_length = int(request.args.get('queue', 5))

        # Convert day to numeric code
        day_mapping = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
                       'Friday': 4, 'Saturday': 5, 'Sunday': 6}
        day_code = day_mapping.get(day, 0)

        # Load model and predict
        model = joblib.load(MODEL_PATH)
        input_data = pd.DataFrame([{
            'hour': hour,
            'day': day_code,
            'weekend': weekend,
            'queue_length': queue_length
        }])

        prediction = model.predict(input_data)
        return jsonify({'predicted_wait_time': round(prediction[0], 2)})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    
    port = int(os.environ.get("PORT", 5000))  # fallback for local
    app.run(host="0.0.0.0", port=port)

