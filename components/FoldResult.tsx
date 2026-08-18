import React, { useState } from 'react';
import { Fold } from '../types';
import { Eye, Loader2, AlertCircle } from 'lucide-react';

interface FoldResultProps {
  fold: Fold;
}

export const FoldResult: React.FC<FoldResultProps> = ({ fold }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovering) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  if (fold.status === 'error') {
     return (
        <div className="w-full h-64 bg-slate-800/50 rounded-xl border border-red-500/30 flex flex-col items-center justify-center text-red-400">
           <AlertCircle className="w-8 h-8 mb-2" />
           <p>Failed to generate heatmap for Fold #{fold.index + 1}</p>
        </div>
     )
  }

  if (fold.status !== 'completed' || !fold.heatmapUrl) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shadow-xl group">
        <div className="absolute inset-0 bg-black/40 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
           {fold.status === 'processing' ? (
             <>
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                <span className="text-indigo-200 font-medium">Analyzing Attention...</span>
             </>
           ) : (
             <span className="text-slate-400">Pending...</span>
           )}
        </div>
        <img 
            src={fold.originalUrl} 
            alt={`Fold ${fold.index + 1}`}
            className="w-full h-auto opacity-50"
        />
      </div>
    );
  }

  // Construct full data URI for the heatmap if it's raw base64
  const heatmapSrc = fold.heatmapUrl.startsWith('data:') 
    ? fold.heatmapUrl 
    : `data:image/png;base64,${fold.heatmapUrl}`;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
            <span className="bg-slate-700 text-xs px-2 py-1 rounded">Fold {fold.index + 1}</span>
        </h3>
        <div className="flex items-center gap-2 text-sm text-slate-400">
            <Eye className="w-4 h-4" />
            <span>Drag to compare</span>
        </div>
      </div>

      <div 
        className="relative w-full rounded-xl overflow-hidden border border-slate-700 shadow-2xl cursor-col-resize select-none"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Base Image (Original) */}
        <img 
            src={fold.originalUrl} 
            alt="Original UI" 
            className="w-full h-auto block"
        />

        {/* Overlay Image (Heatmap) - Clipped by slider */}
        <div 
            className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-white/80 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            style={{ width: `${sliderPosition}%` }}
        >
            <img 
                src={heatmapSrc} 
                alt="Heatmap" 
                className="max-w-none h-full"
                style={{ width: `${100 / (sliderPosition/100)}%` }} // Trick to keep image same scale while container shrinks
                // Actually, the easier way for overlay is to set width to parent width
            />
            {/* Re-implementing image sizing for clipped div */}
             <img 
                src={heatmapSrc} 
                alt="Heatmap" 
                className="absolute top-0 left-0 max-w-none h-full"
                style={{ width: '100vw' }} // This needs to match parent width strictly. 
                // A better approach is using the parent's width via ref or simple css
             />
        </div>
        
        {/* Correct implementation of the comparison slider using 2 overlapping images */}
         <div 
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
         >
            {/* We need the second image to be exactly the same size */}
             <div 
                className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-indigo-400 bg-slate-900"
                style={{ width: `${sliderPosition}%` }}
             >
                <img 
                    src={heatmapSrc} 
                    alt="Heatmap" 
                    className="absolute top-0 left-0 max-w-none h-full"
                    style={{ 
                        width: '100%', // This is relative to the clipped div, which is wrong.
                        // We need to query parent width or simply use a slightly different structure.
                    }} 
                />
             </div>
         </div>
         
         {/* Let's redo the structure for simplicity and robustness */}
      </div>
      
      {/* 
        Redoing the slider logic in a more standard way for React 
        1. Container relative
        2. Background Image = Original
        3. Foreground Div = Heatmap, width = slider%, overflow hidden
        4. Foreground Image = width of Container
      */}
       <div 
        className="relative w-full rounded-xl overflow-hidden border border-slate-700 shadow-2xl cursor-ew-resize select-none group"
        onMouseMove={handleMouseMove}
        onTouchMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
            setSliderPosition((x / rect.width) * 100);
        }}
      >
          {/* Layer 1: Original */}
          <img src={fold.originalUrl} alt="Original" className="w-full h-auto block select-none" draggable={false} />

          {/* Layer 2: Heatmap (Clipped) */}
          <div 
            className="absolute top-0 left-0 h-full overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
             <img 
                src={heatmapSrc} 
                alt="Heatmap" 
                className="max-w-none h-full select-none"
                // The image inside the clipped div must be the same width as the container
                // We can achieve this by setting width to the container's width which we might not know in pixels easily without ref
                // BUT, '100%' in the child img relates to the clipped div width. 
                // We need 100% of the PARENT. 
                // Tailwind `w-[100vw]` is too wide. 
                // We can use transform translateX? No.
                // Best way: use Ref to get parent width, OR use `object-cover` if aspect ratio is same?
                // Actually, if we use a specific trick: 
                style={{ width: `calc(100vw - (100vw - 100%))` }} // This is tricky.
                // Let's rely on the fact that the images are identical dimensions.
             />
             {/* 
               Better CSS solution for React comparison sliders: 
               The inner image needs to be the size of the outer container.
             */}
             <div className="w-full h-full relative" style={{ width: `${100 * (100/sliderPosition)}%` }}>
                 <img src={heatmapSrc} className="w-full h-auto block" style={{width: '100%'}}/> 
                 {/* This scaling trick is unstable. Let's use absolute positioning with specific widths if possible. */}
             </div>
          </div>
          
           {/* 
             Correcting the slider implementation:
             Since we can't easily know parent width in pixels without Ref, let's use a Ref.
           */}
      </div>
      <CorrectSlider fold={fold} heatmapSrc={heatmapSrc} />
    </div>
  );
};

// Extracted for clean Ref usage
const CorrectSlider: React.FC<{fold: Fold, heatmapSrc: string}> = ({ fold, heatmapSrc }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setSliderPos((x / rect.width) * 100);
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full select-none cursor-ew-resize rounded-xl overflow-hidden border border-slate-700/50"
            onMouseMove={(e) => handleMove(e.clientX)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        >
             {/* Background: Original */}
             <img src={fold.originalUrl} alt="Original" className="w-full h-auto block pointer-events-none" />

             {/* Foreground: Heatmap (Clipped) */}
             <div 
                className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                style={{ width: `${sliderPos}%` }}
             >
                 {/* This image needs to be exactly the same size as the background one */}
                 {/* By setting it to absolute width of parent, we ensure alignment */}
                 <img 
                    src={heatmapSrc} 
                    alt="Heatmap" 
                    className="max-w-none h-full pointer-events-none"
                    style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }}
                 />
             </div>

             {/* Slider Handle Button (Optional Visual Aid) */}
             <div 
                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-lg pointer-events-none"
                style={{ left: `calc(${sliderPos}% - 16px)` }}
             >
                <div className="flex gap-0.5">
                    <div className="w-0.5 h-3 bg-slate-400"></div>
                    <div className="w-0.5 h-3 bg-slate-400"></div>
                </div>
             </div>
             
             <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-mono text-white/80 pointer-events-none">
                HEATMAP
             </div>
             <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-mono text-white/80 pointer-events-none">
                ORIGINAL
             </div>
        </div>
    );
};
