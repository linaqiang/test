export interface WordItem {
  id: string;
  word: string;
  phonetic: string;
  imageUrl: string; // The generated sticker URL
  originalImageUrl: string; // The captured photo (optional, for reference)
  timestamp: number;
  themeColor: string; // The extracted dominant color for the card background
}

export interface AnalysisResult {
  word: string;
  phonetic: string;
  visualDescription: string;
  themeColor: string;
}