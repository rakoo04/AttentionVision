import React, { useCallback } from 'react';
import { Upload, Zap } from 'lucide-react';

interface HeroProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onFileSelect, isProcessing }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isProcessing) return;
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect, isProcessing]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-6 p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20">
        <Zap className="w-8 h-8 text-indigo-400" />
      </div>
      <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-6">
        Predictive Attention Heatmaps
      </h1>
      <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
        Upload your website screenshot. We'll use 
        <span className="text-white font-semibold mx-1">Nano Banana Pro</span> 
        (Gemini 3 Pro) to simulate user eye-tracking and generate visual attention data.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`
          w-full max-w-xl p-10 rounded-3xl border-2 border-dashed transition-all duration-300
          ${isProcessing 
            ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-wait' 
            : 'border-slate-600 bg-slate-800/30 hover:border-indigo-400 hover:bg-slate-800/80 cursor-pointer group'
          }
        `}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="file-upload"
          onChange={handleChange}
          disabled={isProcessing}
        />
        <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
          <Upload className={`w-12 h-12 mb-4 text-slate-500 transition-colors ${!isProcessing && 'group-hover:text-indigo-400'}`} />
          <span className="text-lg font-medium text-slate-300 mb-2">
            Click to upload or drag & drop
          </span>
          <span className="text-sm text-slate-500">
            PNG, JPG up to 10MB
          </span>
        </label>
      </div>
    </div>
  );
};
