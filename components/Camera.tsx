import React, { useRef, useState, useEffect, useCallback } from 'react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);

  const startCamera = useCallback(async () => {
    const setupStream = (mediaStream: MediaStream) => {
        streamRef.current = mediaStream;
        
        if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            
            const track = mediaStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            if ('zoom' in capabilities) {
                setMaxZoom((capabilities as any).zoom.max || 3);
            }
        }
    };

    try {
      try {
        const constraints = {
            video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            },
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setupStream(mediaStream);
      } catch (envError) {
         console.warn("Environment camera failed, falling back to default.", envError);
         const fallbackConstraints = {
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
            },
         };
         const mediaStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
         setupStream(mediaStream);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please allow permissions or check if your device has a camera.");
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      
      if ('zoom' in capabilities) {
        try {
          track.applyConstraints({ advanced: [{ zoom: newZoom }] } as any);
        } catch (error) {
           console.log("Hardware zoom failed, falling back to CSS scale");
        }
      }
    }
  };

  const takePicture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        onCapture(base64);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between">
      {/* Viewport */}
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
         <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover opacity-90"
         />
         
         {/* Live Viewfinder UI */}
         <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            {/* Top Info */}
            <div className="flex justify-between items-start">
                 <div className="bg-black/40 px-3 py-1 rounded text-white text-xs font-mono backdrop-blur-sm border border-white/20">
                     LIVE RECOGNITION
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                     <span className="text-white text-xs font-mono shadow-sm">REC</span>
                 </div>
            </div>

            {/* Crosshair Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center opacity-70">
                <div className="w-[1px] h-full bg-yellow-400/50"></div>
                <div className="h-[1px] w-full bg-yellow-400/50 absolute"></div>
                <div className="w-4 h-4 border border-yellow-400 rounded-full bg-yellow-400/10 z-10"></div>
            </div>

            {/* Corner Brackets */}
            <div className="absolute inset-12 pointer-events-none">
                {/* Top Left */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg drop-shadow-md"></div>
                {/* Top Right */}
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg drop-shadow-md"></div>
                {/* Bottom Left */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg drop-shadow-md"></div>
                {/* Bottom Right */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg drop-shadow-md"></div>
            </div>
         </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/60 to-transparent pt-12 pb-10 px-6">
        {/* Zoom Slider */}
        <div className="flex items-center justify-center mb-8 space-x-4">
            <span className="text-white text-xs font-bold drop-shadow">1x</span>
            <input 
                type="range" 
                min="1" 
                max={Math.min(maxZoom, 5)} 
                step="0.1" 
                value={zoom} 
                onChange={handleZoomChange}
                className="w-64 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />
            <span className="text-white text-xs font-bold drop-shadow">{zoom}x</span>
        </div>

        <div className="flex items-center justify-between px-8">
            {/* Cancel Button */}
            <button 
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Shutter Button */}
            <button 
                onClick={takePicture}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
            >
                <div className="w-16 h-16 bg-white rounded-full border border-gray-300"></div>
            </button>

            {/* Spacer */}
            <div className="w-12"></div>
        </div>
      </div>
    </div>
  );
};