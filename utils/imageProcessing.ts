import { Fold } from '../types';

/**
 * Slices a large image into vertical "folds" (sections).
 * Each fold tries to be around `foldHeight` pixels tall.
 */
export const sliceImageIntoFolds = async (file: File, foldHeight: number = 1000): Promise<Fold[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const folds: Fold[] = [];
      const totalHeight = img.height;
      const width = img.width;
      
      // Calculate number of folds
      const numFolds = Math.ceil(totalHeight / foldHeight);
      
      for (let i = 0; i < numFolds; i++) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) continue;

        // Determine height for this chunk (last one might be shorter)
        const currentY = i * foldHeight;
        const currentHeight = Math.min(foldHeight, totalHeight - currentY);

        canvas.width = width;
        canvas.height = currentHeight;
        
        // Draw the slice
        ctx.drawImage(img, 0, currentY, width, currentHeight, 0, 0, width, currentHeight);
        
        // Convert to base64
        const dataUrl = canvas.toDataURL('image/png');
        
        // Remove the data prefix for API usage if needed, but for display we keep full URL
        // We'll strip the prefix when sending to API in the service
        
        folds.push({
          id: `fold-${Date.now()}-${i}`,
          index: i,
          originalUrl: dataUrl,
          heatmapUrl: null,
          status: 'pending'
        });
      }
      
      URL.revokeObjectURL(url);
      resolve(folds);
    };
    
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    
    img.src = url;
  });
};

export const stripBase64Prefix = (dataUrl: string): string => {
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
};
