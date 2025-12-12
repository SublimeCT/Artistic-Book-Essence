import React, { useRef, useState, useEffect } from 'react';
import { Upload, ArrowRight, AlertCircle } from 'lucide-react';
import { AppState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroProps {
  appState: AppState;
  onFileSelect: (file: File) => void;
  onTitleSubmit: (title: string) => void;
}

const STRINGS: Record<string, any> = {
  'en-US': {
    brand: "VIBARY",
    sub: "The Visual Library",
    placeholder: "Enter a known classic...",
    or: "Or Upload PDF",
    unknown: "* If I don't know the book, I will ask for a PDF.",
    loading_consult: "Consulting Archives",
    loading_direct: "Directing Visuals",
    error: "I don't know this book well enough. Please upload a PDF."
  },
  'zh-CN': {
    brand: "VIBARY", // Keep brand English often looks better, or "阅界"
    sub: "视觉化图书馆",
    placeholder: "输入经典书籍名称...",
    or: "或者上传 PDF",
    unknown: "* 如果我不了解这本书，我会请你上传文件",
    loading_consult: "正在查阅档案",
    loading_direct: "正在构建视觉",
    error: "我不够了解这本书，请上传 PDF 文件。"
  },
  'es-ES': {
    brand: "VIBARY",
    sub: "La Biblioteca Visual",
    placeholder: "Introduce un clásico...",
    or: "O subir PDF",
    unknown: "* Si no conozco el libro, pediré un PDF.",
    loading_consult: "Consultando archivos",
    loading_direct: "Dirigiendo visuales",
    error: "No conozco este libro. Por favor sube un PDF."
  }
};

export const Hero: React.FC<HeroProps> = ({ appState, onFileSelect, onTitleSubmit }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [showError, setShowError] = useState(false);
  const [lang, setLang] = useState('en-US');

  useEffect(() => {
    const l = navigator.language;
    if (STRINGS[l]) setLang(l);
    else if (l.startsWith('zh')) setLang('zh-CN');
    else if (l.startsWith('es')) setLang('es-ES');
    
    const saved = localStorage.getItem('biblioart_last_book');
    if (saved) setTitle(saved);
  }, []);

  const t = STRINGS[lang] || STRINGS['en-US'];

  useEffect(() => {
    if (appState === AppState.IDLE) setShowError(false);
  }, [appState]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    localStorage.setItem('biblioart_last_book', e.target.value);
    setShowError(false);
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onTitleSubmit(title);
    }
  };

  const handleClick = () => inputRef.current?.click();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) onFileSelect(e.target.files[0]);
  };
  
  if (appState === AppState.READY || appState === AppState.UPDATING) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#050505] text-[#e0e0e0]">
      {/* Cinematic Grain */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      {/* Ambient Breath */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
         <motion.div 
           animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
           transition={{ duration: 10, repeat: Infinity }}
           className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-900 blur-[150px]" 
         />
         <motion.div 
           animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
           transition={{ duration: 15, repeat: Infinity, delay: 1 }}
           className="absolute bottom-[-10%] right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-900 blur-[180px]" 
         />
      </div>

      <AnimatePresence mode="wait">
        {(appState === AppState.IDLE || appState === AppState.ERROR) && (
          <motion.div 
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-xl w-full text-center space-y-16 z-10"
          >
             <div className="space-y-4">
                <h1 className="text-7xl md:text-9xl font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-tighter leading-none">
                  {t.brand}
                </h1>
                <p className="text-sm font-mono tracking-[0.4em] uppercase text-gray-500">{t.sub}</p>
             </div>

             <div className="space-y-8 relative">
               <form onSubmit={handleTitleSubmit} className="relative w-full group">
                 <input 
                   type="text"
                   value={title}
                   onChange={handleTitleChange}
                   placeholder={t.placeholder}
                   className="w-full bg-transparent border-b border-gray-700 py-4 text-2xl md:text-3xl font-serif-display text-center text-white placeholder:text-gray-700 focus:border-white outline-none transition-colors"
                 />
                 <button 
                   type="submit"
                   disabled={!title.trim()}
                   className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                 >
                   <ArrowRight className="w-6 h-6" />
                 </button>
               </form>

               <div className="flex items-center justify-center gap-4">
                  <span className="h-px w-8 bg-gray-800"></span>
                  <span 
                    className="text-[10px] font-mono uppercase tracking-widest text-gray-500 cursor-pointer hover:text-white transition-colors"
                    onClick={handleClick}
                  >
                    {t.or}
                  </span>
                  <span className="h-px w-8 bg-gray-800"></span>
               </div>
               <input type="file" ref={inputRef} accept="application/pdf" className="hidden" onChange={handleChange} />
             </div>

             {appState === AppState.IDLE && title && !title.includes(' ') && title.length > 3 && (
                 <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-xs text-gray-600">
                    {t.unknown}
                 </motion.p>
             )}
          </motion.div>
        )}

        {(appState !== AppState.IDLE && appState !== AppState.ERROR && appState !== AppState.READY && appState !== AppState.UPDATING) && (
           <motion.div 
             key="loading"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]"
           >
              <div className="w-px h-24 bg-gray-800 mb-8 relative overflow-hidden">
                 <motion.div 
                   className="absolute top-0 left-0 w-full bg-white"
                   initial={{ height: "0%" }}
                   animate={{ height: "100%" }}
                   transition={{ duration: 2, repeat: Infinity }}
                 />
              </div>
              
              <motion.h2 
                 animate={{ opacity: [0.5, 1, 0.5] }} 
                 transition={{ duration: 2, repeat: Infinity }}
                 className="text-2xl font-serif-display text-white"
              >
                 {appState === AppState.CHECKING_KNOWLEDGE ? t.loading_consult : t.loading_direct}
              </motion.h2>
           </motion.div>
        )}
      </AnimatePresence>
      
      {appState === AppState.ERROR && (
        <div className="absolute bottom-10 left-0 w-full text-center">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-900/50 rounded-full text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>{t.error}</span>
             </div>
        </div>
      )}
    </div>
  );
};