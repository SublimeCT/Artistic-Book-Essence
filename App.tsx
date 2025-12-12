import React, { useState } from 'react';
import { Hero } from './components/Hero';
import { VisualJourney } from './components/VisualJourney';
import { AppState, BookAnalysis } from './types';
import { extractTextFromPDF } from './services/pdfService';
import { analyzeBookContent, analyzeBookByTitle, refineAnalysis } from './services/geminiService';
import { downloadStaticPage } from './services/exportService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisData, setAnalysisData] = useState<BookAnalysis | null>(null);

  // Increased default timeout to 60s
  const safeCall = async <T,>(promise: Promise<T>, timeoutMs = 60000): Promise<T> => {
    let timeoutHandle: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error("Request timed out. The AI is taking too long.")), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutHandle));
  };

  const startTransition = async (data: BookAnalysis) => {
    setAnalysisData(data);
    setAppState(AppState.TRANSITIONING);
    setTimeout(() => {
        setAppState(AppState.READY);
    }, 1000);
  };

  // 1. Handle File Upload
  const handleFileSelect = async (file: File) => {
    try {
      setAppState(AppState.READING_PDF);
      const text = await extractTextFromPDF(file);
      
      setAppState(AppState.ANALYZING);
      // Increased timeout to 120s (2 minutes) for deep analysis
      const data = await safeCall(analyzeBookContent(text), 120000); 
      startTransition(data);
    } catch (error) {
      console.error("Processing failed", error);
      alert("Error processing file. The text might be too long or the AI is busy. Please try again.");
      setAppState(AppState.IDLE);
    }
  };

  // 2. Handle Title Input
  const handleTitleSubmit = async (title: string) => {
    try {
      setAppState(AppState.CHECKING_KNOWLEDGE);
      const data = await safeCall(analyzeBookByTitle(title));
      
      if (data) {
        startTransition(data);
      } else {
        // Fallback to IDLE but maybe show a specific message in UI
        setAppState(AppState.ERROR); 
        // Small delay to let user see error state before potentially resetting logic if needed
        setTimeout(() => setAppState(AppState.IDLE), 4000); 
      }
    } catch (error) {
      console.error("Title check failed", error);
      setAppState(AppState.ERROR);
      setTimeout(() => setAppState(AppState.IDLE), 4000); 
    }
  };

  // 3. Handle Edit Request
  const handleEdit = async (instruction: string) => {
    if (!analysisData) return;
    
    try {
      setAppState(AppState.UPDATING);
      const newData = await safeCall(refineAnalysis(analysisData, instruction));
      setAnalysisData(newData);
      setAppState(AppState.READY);
    } catch (error) {
      console.error("Update failed", error);
      setAppState(AppState.READY);
    }
  };

  // 4. Handle Download
  const handleDownload = () => {
    if (analysisData) {
      downloadStaticPage(analysisData);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setAnalysisData(null);
  };

  return (
    <div className="bg-[#050505] min-h-screen text-[#e0e0e0] font-sans selection:bg-orange-500/30 selection:text-white">
      <Hero 
        appState={appState} 
        onFileSelect={handleFileSelect} 
        onTitleSubmit={handleTitleSubmit} 
      />
      
      {appState === AppState.READY && analysisData && (
        <VisualJourney 
          data={analysisData} 
          appState={appState}
          onReset={handleReset} 
          onEdit={handleEdit}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default App;