import React, { useState, useEffect } from 'react';
import { Camera } from './components/Camera';
import { WordCard } from './components/WordCard';
import { WordItem } from './types';
import { analyzeImage, generateSticker } from './services/geminiService';
import { initDB, getWords, saveWord } from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'camera' | 'processing'>('home');
  const [words, setWords] = useState<WordItem[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // Load from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB();
        const loadedWords = await getWords();
        setWords(loadedWords);
      } catch (e) {
        console.error("Failed to load words from DB", e);
      }
    };
    loadData();
  }, []);

  const handleCapture = async (base64Image: string) => {
    setView('processing');
    
    try {
      // Step 1: Analyze Image
      setProcessingStatus('Identifying Object...');
      const analysis = await analyzeImage(base64Image);
      
      // Step 2: Generate Sticker (Image-to-Image)
      setProcessingStatus(`Making "${analysis.word}" Sticker...`);
      // Pass themeColor to generate a seamless background
      const stickerUrl = await generateSticker(base64Image, analysis.word, analysis.themeColor);

      // Step 3: Save
      const newItem: WordItem = {
        id: Date.now().toString(),
        word: analysis.word,
        phonetic: analysis.phonetic,
        imageUrl: stickerUrl,
        originalImageUrl: `data:image/jpeg;base64,${base64Image}`,
        timestamp: Date.now(),
        themeColor: analysis.themeColor,
      };

      // Save to DB first
      await saveWord(newItem);
      
      // Update State
      setWords(prev => [newItem, ...prev]);
      setView('home');

    } catch (error) {
      console.error("Processing failed", error);
      alert("Oops! Couldn't identify that. Try getting closer or using better lighting.");
      setView('camera'); // Go back to camera to try again
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-gray-50 flex flex-col shadow-2xl">
      
      {/* Header */}
      <header className="px-6 py-5 bg-white sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight">Snap<span className="text-yellow-500">Vocab</span></h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-wide">CAPTURE • CREATE • LEARN</p>
        </div>
        <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
            {words.length}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 overflow-y-auto no-scrollbar">
        {words.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center mt-10 opacity-60">
                <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                </div>
                <h2 className="text-base font-bold text-gray-700">No words yet</h2>
                <p className="text-xs text-gray-500 max-w-[180px]">Tap the button below to start!</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
            {words.map((item) => (
                <WordCard key={item.id} item={item} />
            ))}
            </div>
        )}
      </main>

      {/* Camera Button (Floating Action Button) */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <button 
            onClick={() => setView('camera')}
            className="pointer-events-auto bg-gray-900 hover:bg-black text-white w-16 h-16 rounded-full shadow-2xl shadow-gray-400 border-4 border-white flex items-center justify-center transform transition-transform hover:scale-105 active:scale-95"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
        </button>
      </div>

      {/* Camera View */}
      {view === 'camera' && (
        <Camera 
            onCapture={handleCapture} 
            onClose={() => setView('home')} 
        />
      )}

      {/* Processing Overlay */}
      {view === 'processing' && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 mb-6 relative">
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl">✨</span>
                </div>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2 animate-pulse">{processingStatus}</h2>
            <p className="text-gray-500 text-xs max-w-xs mx-auto">
                Designing your card...
            </p>
        </div>
      )}

    </div>
  );
};

export default App;