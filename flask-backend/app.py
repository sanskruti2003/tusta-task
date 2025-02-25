from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for frontend-backend communication
CORS(app)

# Route to receive trendline coordinates
@app.route('/trendline', methods=['POST'])
def receive_trendline():
    try:
        data = request.json
        start = data.get("start")
        end = data.get("end")

        if not start or not end:
            return jsonify({"error": "Invalid data"}), 400

        print(f"Received trendline coordinates: Start - {start}, End - {end}")

        # Placeholder for further processing — e.g., saving to DB or further logic
        return jsonify({"message": "Coordinates received successfully"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True, port=5000)