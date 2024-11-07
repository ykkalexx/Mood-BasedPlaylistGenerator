from flask import Flask, request, jsonify
from transformers import pipeline
import numpy as np
from flask_cors import CORS
import logging
import traceback

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize the emotion classifier globally
try:
    classifier = pipeline("text-classification", 
                        model="j-hartmann/emotion-english-distilroberta-base", 
                        return_all_scores=True)
    logger.info("Classifier initialized successfully")
except Exception as e:
    logger.error(f"Error initializing classifier: {str(e)}")
    classifier = None

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
        try:
            logger.debug(f"Generating features for emotion data: {emotion_data}")
            
            # Ensure we have the required fields
            if not isinstance(emotion_data, dict):
                raise ValueError("Emotion data must be a dictionary")
            
            if 'primary' not in emotion_data:
                raise ValueError("Missing 'primary' emotion")
            
            if 'intensity' not in emotion_data:
                # Default intensity if not provided
                emotion_data['intensity'] = 1.0
            
            primary_emotion = emotion_data["primary"].lower()  # Convert to lowercase
            intensity = float(emotion_data["intensity"])
            
            # Get base features for the emotion or default to 'joy'
            features = self.emotion_to_features.get(primary_emotion, 
                                                  self.emotion_to_features["joy"])
            
            # Ensure intensity is between 0 and 1
            intensity = max(0.0, min(1.0, intensity))
            
            # Calculate features
            adjusted_features = {k: v * intensity for k, v in features.items()}
            
            logger.debug(f"Generated features: {adjusted_features}")
            return adjusted_features
            
        except Exception as e:
            logger.error(f"Error in generate_features: {str(e)}")
            logger.error(traceback.format_exc())
            raise

playlist_generator = PlaylistGenerator()

@app.route('/analyze', methods=['POST'])
def analyze_emotion():
    try:
        logger.info("Received analyze request")
        data = request.get_json()
        logger.debug(f"Request data: {data}")

        if not data or 'text' not in data:
            logger.error("No text provided in request")
            return jsonify({'error': 'No text provided'}), 400

        text = data['text']
        logger.info(f"Analyzing text: {text}")

        if classifier is None:
            logger.error("Classifier not initialized")
            return jsonify({'error': 'Classifier not initialized'}), 500
        
        # Get emotion scores
        emotions = classifier(text)[0]
        emotions_sorted = sorted(emotions, key=lambda x: x['score'], reverse=True)
        
        # Get primary and secondary emotions
        primary_emotion = emotions_sorted[0]
        secondary_emotion = emotions_sorted[1]
        
        result = {
            "primary": primary_emotion['label'],
            "secondary": secondary_emotion['label'],
            "intensity": float(primary_emotion['score'])
        }

        logger.info(f"Analysis result: {result}")
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in analyze_emotion: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/generate-playlist', methods=['POST'])
def generate_playlist():
    try:
        logger.info("Received generate-playlist request")
        emotion_data = request.get_json()
        logger.debug(f"Emotion data received: {emotion_data}")

        if not emotion_data:
            logger.error("No emotion data provided")
            return jsonify({'error': 'No emotion data provided'}), 400

        # Generate music features
        features = playlist_generator.generate_features(emotion_data)
        
        response_data = {
            'features': features,
            'emotion': emotion_data
        }
        
        logger.info(f"Sending response: {response_data}")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error in generate_playlist: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': str(e),
            'details': traceback.format_exc()
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'classifier_loaded': classifier is not None,
        'supported_emotions': list(playlist_generator.emotion_to_features.keys())
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)