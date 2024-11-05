export interface MoodEntry {
  userId: string;
  text: string;
  timestamp: Date;
  emotions: {
    primary: string;
    secondary?: string;
    intensity: number;
  };
}
