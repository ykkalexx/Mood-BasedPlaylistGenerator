from flask import Flask, request, jsonify
from transformers import pipeline
import numpy as np
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

# init the emotiona classifier globally
classifier = pipeline("text-classification", 
                     model="j-hartmann/emotion-english-distilroberta-base", 
                     return_all_scores=True)

class PlaylistGenerator:
    def __init__(self):
        self.emotion_to_features = {
            "joy": {"valence": 0.8, "energy": 0.7, "danceability": 0.7},
            "sadness": {"valence": 0.3, "energy": 0.4, "danceability": 0.4},
            "anger": {"valence": 0.4, "energy": 0.8, "danceability": 0.6},
            "fear": {"valence": 0.3, "energy": 0.6, "danceability": 0.4},
            "surprise": {"valence": 0.6, "energy": 0.7, "danceability": 0.6},
            "love": {"valence": 0.7, "energy": 0.5, "danceability": 0.5}
        }

    def generate_features(self, emotion_data):
        primary_emotion = emotion_data["primary"]
        intensity = emotion_data["intensity"]

        # get the features for the primary emotion
        features = self.emotion_to_features(primary_emotion, self.emotion_to_features["joy"])

        # adjust the features based on the intensity
        return {k: v * intensity for k, v in features.items()}
    
playlist_generator = PlaylistGenerator()

@app.route('/analyze', methods=['POST'])
def analyze_emotion():
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({"error": "Invalid request"}), 400
        
        text = data["text"]
        emotion = classifier(text)[0]
        emotions_sorter = sorted(emotion, key = lambda x: x['score'], reverse=True)

        primary_emotion = emotions_sorter[0]
        secondary_emotion = emotions_sorter[1] 

        result = {
            "primary": primary_emotion['label'],
            'secondary': secondary_emotion['label'],
            'intensity': float(primary_emotion['score'])
        }

        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500  

@app.route('/generate-playlist', methods=['POST'])
def generate_playlist():
    pass

if __name__ == '__main__':
    app.run(port=5000, debug=True)