import axios from "axios";
import SpotifyWebApi from "spotify-web-api-node";
import { logger } from "../utils/logger";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5000";

export class MoodAnalysisService {
  private spotifyApi: SpotifyWebApi;

  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    this.initSpotifyToken();
  }

  private async initSpotifyToken() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body["access_token"]);
    } catch (error) {
      logger.error("Error while getting Spotify token", error);
    }
  }

  public async analyzeMood(text: string): Promise<any> {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/analyze`, { text });
      return response.data;
    } catch (error) {
      logger.error("Error analyzing mood:", error);
      throw error;
    }
  }

  public async generatePlaylist(emotions: any): Promise<any> {
    try {
      // Get music features from ML service
      const response = await axios.post(
        `${ML_SERVICE_URL}/generate-playlist`,
        emotions
      );
      const { features } = response.data;

      // Use features to search for tracks on Spotify
      const recommendations = await this.spotifyApi.getRecommendations({
        target_valence: features.valence,
        target_energy: features.energy,
        target_danceability: features.danceability,
        limit: 10,
      });

      return {
        tracks: recommendations.body.tracks,
        mood: emotions.primary,
        features,
      };
    } catch (error) {
      logger.error("Error generating playlist:", error);
      throw error;
    }
  }
}
