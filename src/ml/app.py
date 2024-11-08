from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import numpy as np
import torch
from scipy.special import softmax
import logging
import json
from typing import Dict, List, Any
from dataclasses import dataclass
from sklearn.preprocessing import MinMaxScaler

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@dataclass
class EmotionAnalysis:
    primary: str
    secondary: str
    emotions: Dict[str, float]
    intensity: float
    valence: float
    arousal: float

@dataclass
class MusicFeatures:
    valence: float
    energy: float
    danceability: float
    tempo_preference: float
    instrumentalness: float
    acousticness: float
    popularity_target: int
    genres: List[str]

class EmotionAnalyzer:
    def __init__(self):
        # loaading multiple models for better analysis
        self.emotion_classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            return_all_scores=True
        )

        # using vader for sentiment analysis
        self.sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="nlptown/bert-base-multilingual-uncased-sentiment"
        )

        # Emotion to valence-arousal mapping
        self.emotion_va_mapping = {
            'joy': {'valence': 0.8, 'arousal': 0.7},
            'sadness': {'valence': 0.2, 'arousal': 0.3},
            'anger': {'valence': 0.2, 'arousal': 0.8},
            'fear': {'valence': 0.3, 'arousal': 0.7},
            'surprise': {'valence': 0.6, 'arousal': 0.8},
            'love': {'valence': 0.8, 'arousal': 0.5},
            'neutral': {'valence': 0.5, 'arousal': 0.5}
        }

    def analyze_text(self, text:str) -> EmotionAnalysis:
        # getting emotion scores
        emotion_scores = self.emotion_classifier(text)[0]
        
        # getting sentiment for intensity
        sentiment = self.sentiment_analyzer(text)[0]
        sentiment_score = float(sentiment['label'].split()[0]) / 5.0

        # storing emotions by score
        sorted_emotions = sorted(emotion_scores, key=lambda x: x['score'], reverse=True)
        
        primary_emotion = sorted_emotions[0]['label']
        secondary_emotion = sorted_emotions[1]['label']
        
        # getting  emotion probabilities
        emotions = {score['label']: score['score'] for score in emotion_scores}
        
        # getting  valence and arousal based on weighted emotions
        valence = sum(emotions[e] * self.emotion_va_mapping[e]['valence'] 
                     for e in emotions if e in self.emotion_va_mapping)
        arousal = sum(emotions[e] * self.emotion_va_mapping[e]['arousal'] 
                     for e in emotions if e in self.emotion_va_mapping)

        return EmotionAnalysis(
            primary=primary_emotion,
            secondary=secondary_emotion,
            emotions=emotions,
            intensity=sentiment_score,
            valence=valence,
            arousal=arousal
        )

class PlaylistGenerator:
    def __init__(self):
        self.scaler = MinMaxScaler()
        
        #  emotion to music feature mapping
        self.base_features = {
            'joy': {
                'valence': 0.8, 'energy': 0.7, 'danceability': 0.7,
                'tempo_preference': 0.7, 'instrumentalness': 0.3,
                'acousticness': 0.3, 'popularity_target': 70
            },
            'sadness': {
                'valence': 0.3, 'energy': 0.4, 'danceability': 0.4,
                'tempo_preference': 0.4, 'instrumentalness': 0.4,
                'acousticness': 0.7, 'popularity_target': 60
            },
            'anger': {
                'valence': 0.4, 'energy': 0.8, 'danceability': 0.6,
                'tempo_preference': 0.8, 'instrumentalness': 0.5,
                'acousticness': 0.3, 'popularity_target': 65
            },
            'fear': {
                'valence': 0.3, 'energy': 0.6, 'danceability': 0.4,
                'tempo_preference': 0.6, 'instrumentalness': 0.6,
                'acousticness': 0.5, 'popularity_target': 60
            }
        }

        # genre recommendations based on emotions
        self.emotion_genres = {
            'joy': ['pop', 'dance', 'happy', 'party'],
            'sadness': ['acoustic', 'sad', 'indie', 'songwriter'],
            'anger': ['rock', 'metal', 'intense', 'aggressive'],
            'fear': ['ambient', 'dark', 'atmospheric'],
            'surprise': ['electronic', 'experimental', 'alternative'],
            'love': ['r-n-b', 'soul', 'romance']
        }

    def generate_features(self, emotion_analysis: EmotionAnalysis) -> MusicFeatures:
        primary_features = self.base_features.get[emotion_analysis.primary, self.base_features['joy']]
        secondary_features = self.base_features.get[emotion_analysis.secondary, self.base_features['joy']]

        # weighted average of primary and secondary features
        weight_primary = emotion_analysis.emotions[emotion_analysis.primary]
        weight_secondary = emotion_analysis.emotions[emotion_analysis.secondary]
        total_weight = weight_primary + weight_secondary

        # normalizing weights
        weight_primary /= total_weight
        weight_secondary /= total_weight

        # combining features
        features = {}
        for key in primary_features:
            features[key] = (primary_features[key] * weight_primary + secondary_features[key] * weight_secondary)

        features['valence'] = (features['valence'] * 0.7 + emotion_analysis.valence * 0.3)
        features['energy'] = (features['energy'] * 0.7 + emotion_analysis.arousal * 0.3)

        # getting genres based on emotions
        primary_genres = self.emotion_genres(emotion_analysis.primary, [])
        secondary_genres = self.emotion_genres.get(emotion_analysis.secondary, [])

        # combining and deduplicate genres
        genres = list(set(primary_genres[:2] + secondary_genres[:1]))

        return MusicFeatures(
            valence=features['valence'],
            energy=features['energy'],
            danceability=features['danceability'],
            tempo_preference=features['tempo_preference'],
            instrumentalness=features['instrumentalness'],
            acousticness=features['acousticness'],
            popularity_target=features['popularity_target'],
            genres=genres
        )

# Initialize analyzers
emotion_analyzer = EmotionAnalyzer()
playlist_generator = PlaylistGenerator()

@app.route('/analyze', methods=['POST'])
def analyze_emotion():
    try:
        pass

    except Exception as e:
        logger.error(f"Error in analyze_emotion: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'classifier_loaded': classifier is not None,
        'supported_emotions': list(playlist_generator.emotion_to_features.keys())
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)