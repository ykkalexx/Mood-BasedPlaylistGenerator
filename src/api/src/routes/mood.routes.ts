import { Router } from "express";
import { MoodController } from "../controllers/mood.controller";

const router = Router();
const moodController = new MoodController();

router.post("/analyze", moodController.analyze);
router.get("/history", moodController.getHistory);
router.get("/test-spotify", moodController.testSpotify);

export default router;
