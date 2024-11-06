import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { MoodEntry } from "../models/mood.model";
import { MoodAnalysisService } from "../services/moodAnalysis.service";
import { logger } from "../utils/logger";

export class MoodController {
  private moodAnalysisService: MoodAnalysisService;

  constructor() {
    this.moodAnalysisService = new MoodAnalysisService();
  }

  public analyze = async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        res.status(400).json({ error: "Text is required" });
        return;
      }

      const emotions = await this.moodAnalysisService.analyzeMood(text);
      const playlist = await this.moodAnalysisService.generatePlaylist(
        emotions
      );

      const moodRepo = getRepository(MoodEntry);

      const moodEntry = moodRepo.create({
        inputText: text,
        emotions: emotions,
        generatedPlaylist: {
          spotifyPlaylistUrl: playlist.tracks[0].external_urls.spotify,
          trackIds: playlist.tracks.map((track: any) => track.id),
          mood: playlist.mood,
        },
      });

      await moodRepo.save(moodEntry);

      res.json({
        emotions,
        playlist: playlist.tracks,
        moodEntryId: moodEntry.id,
      });
    } catch (error) {
      logger.error("Error in mood analysis:", error);
      res
        .status(500)
        .json({ error: "Failed to analyze mood and generate playlist" });
    }
  };

  public getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const moodEntryRepo = getRepository(MoodEntry);
      const entries = await moodEntryRepo.find({
        order: { timestamp: "DESC" },
        take: 10,
      });

      res.json(entries);
    } catch (error) {
      logger.error("Error fetching history:", error);
      res.status(500).json({ error: "Failed to fetch mood history" });
    }
  };
}
