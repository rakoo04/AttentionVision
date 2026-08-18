import React, { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { FoldResult } from './components/FoldResult';
import { sliceImageIntoFolds, stripBase64Prefix } from './utils/imageProcessing';
import { ensureApiKey, generateHeatmapForFold } from './services/geminiService';
import { Fold, ProcessingState } from './types';
import { RefreshCw, LayoutTemplate } from 'lucide-react';

const App: React.FC = () => {
  const [folds, setFolds] = useState<Fold[]>([]);
  const [status, setStatus] = useState<ProcessingState>({
    isSlicing: false,
    isGenerating: false,
    progress: 0,
    error: null
  });

  const handleFileSelect = async (file: File) => {
    setStatus({ isSlicing: true, isGenerating: false, progress: 0, error: null });
    setFolds([]);

    try {
      // 1. Check API Key first
      await ensureApiKey();

      // 2. Slice Image
      const slicedFolds = await sliceImageIntoFolds(file, 1000); // 1000px height per fold
      setFolds(slicedFolds);
      setStatus(prev => ({ ...prev, isSlicing: false, isGenerating: true }));

      // 3. Process each fold sequentially to avoid rate limits and ensure order
      await processFolds(slicedFolds);

    } catch (err: any) {
      console.error("Setup Error", err);
      setStatus(prev => ({ 
        ...prev, 
        isSlicing: false, 
        isGenerating: false, 
        error: err.message || "Something went wrong during setup." 
      }));
    }
  };

  const processFolds = async (initialFolds: Fold[]) => {
    const newFolds = [...initialFolds];
    let completedCount = 0;

    for (let i = 0; i < newFolds.length; i++) {
        // Update status to processing for this fold
        newFolds[i].status = 'processing';
        setFolds([...newFolds]);

        try {
            const rawBase64 = stripBase64Prefix(newFolds[i].originalUrl);
            const heatmapBase64 = await generateHeatmapForFold(rawBase64);
            
            newFolds[i].heatmapUrl = heatmapBase64;
            newFolds[i].status = 'completed';
        } catch (error) {
            console.error(`Error processing fold ${i}`, error);
            newFolds[i].status = 'error';
        }

        completedCount++;
        setStatus(prev => ({
            ...prev,
            progress: Math.round((completedCount / newFolds.length) * 100)
        }));
        setFolds([...newFolds]);
    }

    setStatus(prev => ({ ...prev, isGenerating: false }));
  };

  const handleReset = () => {
    setFolds([]);
    setStatus({ isSlicing: false, isGenerating: false, progress: 0, error: null });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-indigo-500" />
            <span className="font-bold text-lg tracking-tight">AttentionVision</span>
          </div>
          {folds.length > 0 && !status.isGenerating && !status.isSlicing && (
             <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
             >
                <RefreshCw className="w-4 h-4" />
                Analyze New
             </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {status.error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 flex items-center gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                {status.error}
                <button 
                    onClick={() => setStatus(p => ({...p, error: null}))}
                    className="ml-auto text-sm underline opacity-80 hover:opacity-100"
                >
                    Dismiss
                </button>
            </div>
        )}

        {folds.length === 0 ? (
          <Hero 
            onFileSelect={handleFileSelect} 
            isProcessing={status.isSlicing || status.isGenerating} 
          />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Analysis Results</h2>
                    <p className="text-slate-400">
                        {status.isGenerating 
                            ? `Generating heatmaps with Gemini 3 Pro... (${status.progress}%)` 
                            : "Predictive visual attention analysis complete."}
                    </p>
                </div>
                {status.isGenerating && (
                    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300 ease-out"
                            style={{ width: `${status.progress}%` }}
                        />
                    </div>
                )}
             </div>

             <div className="space-y-12">
                {folds.map((fold) => (
                    <FoldResult key={fold.id} fold={fold} />
                ))}
             </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-12">
         <div className="max-w-6xl mx-auto px-6 text-center text-slate-500 text-sm">
            <p>Powered by Google Gemini 3 Pro (Nano Banana Pro) & React</p>
         </div>
      </footer>
    </div>
  );
};

export default App;
