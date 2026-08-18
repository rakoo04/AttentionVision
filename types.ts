export interface Fold {
  id: string;
  originalUrl: string; // Base64 or Blob URL
  heatmapUrl: string | null; // Base64
  status: 'pending' | 'processing' | 'completed' | 'error';
  index: number;
}

export interface ProcessingState {
  isSlicing: boolean;
  isGenerating: boolean;
  progress: number; // 0-100
  error: string | null;
}
