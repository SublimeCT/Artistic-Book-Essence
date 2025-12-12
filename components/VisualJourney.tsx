import React, { useRef, useState, useEffect } from 'react';
import { BookAnalysis, StoryScene, VisualParams, AppState } from '../types';
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Pencil, Download, ArrowLeft, Layers, Menu, X, ChevronRight } from 'lucide-react';

interface VisualJourneyProps {
  data: BookAnalysis;
  appState: AppState;
  onReset: () => void;
  onEdit: (instruction: string) => void;
  onDownload: () => void;
}

export const VisualJourney: React.FC<VisualJourneyProps> = ({ data, appState, onReset, onEdit, onDownload }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  // Global Mouse tracking for CSS variables
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      document.documentElement.style.setProperty('--mouse-x', x.toString());
      document.documentElement.style.setProperty('--mouse-y', y.toString());
      document.documentElement.style.setProperty('--mouse-abs-x', e.clientX + 'px');
      document.documentElement.style.setProperty('--mouse-abs-y', e.clientY + 'px');
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const activeScene = data.screenplay[activeSceneIndex];
  const activePalette = activeScene?.visual.palette || { background: '#050505', primary: '#ffffff', secondary: '#888', accent: '#fff', text: '#fff' };

  // Scroll to scene handler
  const scrollToScene = (index: number) => {
    const element = document.getElementById(`scene-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsTocOpen(false);
    }
  };

  return (
    <div 
      className="w-full transition-colors duration-1000 ease-linear relative overflow-x-hidden font-sans"
      style={{ 
        backgroundColor: activePalette.background, 
        color: activePalette.text 
      }}
    >
      {/* Dynamic Background Pattern */}
      <BackgroundLayer pattern={activeScene?.visual.backgroundPattern || 'noise'} color={activePalette.primary} />
      
      {/* Global Ambient Glow */}
      <div 
        className="fixed inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at var(--mouse-abs-x) var(--mouse-abs-y), ${activePalette.primary}10 0%, transparent 40%)`,
          zIndex: 1
        }}
      />

      {/* NAV */}
      <nav className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center mix-blend-exclusion text-white pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4">
           <button onClick={onReset} className="flex items-center gap-2 text-xs font-mono tracking-[0.2em] uppercase hover:text-orange-400 transition-colors group">
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Library
           </button>
        </div>
        <div className="pointer-events-auto flex gap-4">
           <button onClick={() => setIsEditModalOpen(true)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><Pencil className="w-4 h-4" /></button>
           <button onClick={onDownload} className="p-2 hover:bg-white/20 rounded-full transition-colors"><Download className="w-4 h-4" /></button>
           <button onClick={() => setIsTocOpen(true)} className="p-2 hover:bg-white/20 rounded-full transition-colors flex items-center gap-2">
              <span className="hidden md:inline text-xs font-mono tracking-widest uppercase">Index</span>
              <Menu className="w-4 h-4" />
           </button>
        </div>
      </nav>

      {/* TOC SIDEBAR */}
      <AnimatePresence>
        {isTocOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsTocOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-96 bg-[#0a0a0a] border-l border-white/10 z-[70] p-8 overflow-y-auto"
            >
               <div className="flex justify-between items-center mb-12">
                  <h2 className="text-2xl font-serif-display italic">Table of Contents</h2>
                  <button onClick={() => setIsTocOpen(false)}><X className="w-6 h-6 opacity-50 hover:opacity-100" /></button>
               </div>
               <div className="space-y-6 relative">
                  {/* Timeline Line in Menu */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10"></div>
                  
                  {data.screenplay.map((s, i) => (
                    <div key={s.id} className="relative pl-8 group cursor-pointer" onClick={() => scrollToScene(i)}>
                       <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border border-white/20 bg-[#0a0a0a] transition-colors group-hover:border-white ${activeSceneIndex === i ? 'bg-white border-white' : ''}`}></div>
                       <p className="text-xs font-mono opacity-50 mb-1">CHAPTER {i + 1}</p>
                       <h3 className={`text-lg font-serif-display transition-colors ${activeSceneIndex === i ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>{s.chapterTitle}</h3>
                    </div>
                  ))}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SCROLLABLE CONTENT */}
      <main className="relative z-10">
        <HeroSection meta={data.meta} palette={data.screenplay[0].visual.palette} />
        
        {data.screenplay.map((scene, index) => (
          <div id={`scene-${index}`} key={scene.id}>
             <SceneRenderer 
               scene={scene} 
               index={index} 
               total={data.screenplay.length}
               onVisible={() => setActiveSceneIndex(index)}
             />
          </div>
        ))}

        <Footer meta={data.meta} onReset={onReset} />
      </main>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="w-full max-w-lg bg-[#0a0a0a] p-8 border border-white/10 shadow-2xl">
               <h3 className="font-serif-display text-2xl text-white mb-4">Director's Input</h3>
               <textarea 
                 value={editInstruction}
                 onChange={(e) => setEditInstruction(e.target.value)}
                 className="w-full h-32 p-4 bg-white/5 border border-white/10 text-white outline-none focus:border-white/40 font-mono text-sm"
                 placeholder="E.g., Make the background more geometric and red..."
               />
               <div className="flex justify-end gap-4 mt-6">
                 <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white text-xs uppercase tracking-widest">Cancel</button>
                 <button onClick={() => { onEdit(editInstruction); setIsEditModalOpen(false); }} className="px-6 py-2 bg-white text-black text-xs uppercase font-bold tracking-widest hover:bg-gray-200">Apply Visuals</button>
               </div>
            </div>
          </div>
      )}
    </div>
  );
};

// --- BACKGROUND LAYER ---
const BackgroundLayer: React.FC<{ pattern: string; color: string }> = ({ pattern, color }) => {
   const style: React.CSSProperties = {
     opacity: 0.15,
     position: 'fixed',
     top: 0,
     left: 0,
     width: '100%',
     height: '100%',
     pointerEvents: 'none',
     zIndex: 0,
     transition: 'all 1s ease'
   };

   if (pattern === 'grid') {
     return <div style={{ ...style, backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(to right, ${color} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />;
   }
   if (pattern === 'dots') {
     return <div style={{ ...style, backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />;
   }
   if (pattern === 'lines') {
      return <div style={{ ...style, backgroundImage: `repeating-linear-gradient(45deg, ${color} 0, ${color} 1px, transparent 0, transparent 50%)`, backgroundSize: '20px 20px' }} />;
   }
   if (pattern === 'crosshairs') {
      return (
        <div style={{ ...style, backgroundImage: `radial-gradient(${color} 1px, transparent 1px), radial-gradient(${color} 1px, transparent 1px)`, backgroundSize: '40px 40px', backgroundPosition: '0 0, 20px 20px' }}>
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black"></div>
        </div>
      );
   }
   // Default Noise
   return <div style={{ ...style, backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')`, opacity: 0.05 }}></div>;
};

// --- SCENE RENDERER ---
const SceneRenderer: React.FC<{ scene: StoryScene; index: number; total: number; onVisible: () => void }> = ({ scene, index, total, onVisible }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.4 && latest < 0.6) onVisible();
  });

  const LayoutMap: any = {
    'typographic_storm': LayoutTypography,
    'entity_focus': LayoutEntity,
    'constellation_nodes': LayoutConstellation,
    'split_dynamic': LayoutSplit,
    'timeline_process': LayoutTimeline,
    'architectural_lens': LayoutArchitectural
  };

  const Component = LayoutMap[scene.visual.layout] || LayoutSplit;

  return (
    <section ref={containerRef} className="min-h-[120vh] relative flex flex-col items-center justify-center py-32 px-6">
       {/* Chapter Marker */}
       <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-4 opacity-30">
          <span className="text-xs font-mono vertical-rl rotate-180 tracking-widest">CHAPTER {index + 1} / {total}</span>
          <div className="w-px h-16 bg-current"></div>
       </div>

      <Component scene={scene} progress={scrollYProgress} />
    </section>
  );
};

// --- TEXT RENDERER WITH HIGHLIGHTS ---
const HighlightText: React.FC<{ text: string; accentColor: string }> = ({ text, accentColor }) => {
  if (!text) return null;
  const parts = text.split(/(\*.*?\*)/g); // Split by *word*
  
  return (
    <span className="leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          const content = part.slice(1, -1);
          return (
            <span 
               key={i} 
               className="inline-block font-bold mx-1 px-1 relative z-10"
               style={{ 
                  color: accentColor,
                  textShadow: `0 0 10px ${accentColor}40`
               }}
            >
              {content}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

// --- LAYOUTS ---

// 1. TIMELINE PROCESS (Story Progression)
const LayoutTimeline: React.FC<{ scene: StoryScene; progress: any }> = ({ scene, progress }) => {
   return (
     <div className="w-full max-w-5xl z-10 flex gap-8 md:gap-16">
        {/* Line */}
        <div className="hidden md:block w-px bg-white/20 relative">
           <motion.div 
             className="absolute top-0 left-1/2 -translate-x-1/2 w-1 bg-white" 
             style={{ height: useTransform(progress, [0.2, 0.8], ["0%", "100%"]), backgroundColor: scene.visual.palette.accent }}
           />
        </div>

        <div className="flex-1 space-y-24 py-12">
           {scene.paragraphs.map((para, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, x: 50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ margin: "-10%" }}
               transition={{ duration: 0.8 }}
               className="relative"
             >
                <div className="md:absolute -left-[4.5rem] top-2 w-8 h-8 rounded-full border border-white/20 bg-[#050505] flex items-center justify-center font-mono text-xs">
                   {i + 1}
                </div>
                {i === 0 && <h2 className="text-5xl font-serif-display mb-8">{scene.highlightPhrase}</h2>}
                <p className="text-xl md:text-2xl font-light opacity-90">
                   <HighlightText text={para} accentColor={scene.visual.palette.accent} />
                </p>
                {/* Visual Anchor per paragraph */}
                <div className="mt-8 h-px w-24 bg-current opacity-20"></div>
             </motion.div>
           ))}
        </div>

        {/* Floating Entity Sidecar */}
        <div className="hidden md:block w-1/3 relative">
           <div className="sticky top-1/4">
             <GenerativeEntity params={scene.visual.visualParams} color={scene.visual.palette.primary} secondaryColor={scene.visual.palette.secondary} progress={progress} />
           </div>
        </div>
     </div>
   );
};

// 2. ARCHITECTURAL LENS (Structured, Technical)
const LayoutArchitectural: React.FC<{ scene: StoryScene; progress: any }> = ({ scene, progress }) => {
   return (
     <div className="w-full max-w-7xl z-10 relative border-t border-b border-current/20 py-12">
        <div className="absolute top-0 left-1/4 w-px h-full bg-current/10"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-current/10"></div>
        
        <div className="grid md:grid-cols-12 gap-12">
           <div className="col-span-12 md:col-span-3 text-right space-y-4">
              <span className="block text-xs font-mono uppercase tracking-widest opacity-50">Analysis Mode</span>
              <div className="text-6xl font-serif-display leading-none">{scene.chapterTitle.split(' ')[0]}</div>
              <GenerativeEntity params={{...scene.visual.visualParams, shape: 'geometric'}} color={scene.visual.palette.accent} secondaryColor={scene.visual.palette.primary} progress={progress} />
           </div>

           <div className="col-span-12 md:col-span-6 border-l border-r border-current/10 px-8 md:px-12 space-y-12 bg-black/20 backdrop-blur-sm">
              <h2 className="text-4xl md:text-5xl font-bold font-serif-display text-center">{scene.highlightPhrase}</h2>
              {scene.paragraphs.map((para, i) => (
                 <p key={i} className="text-lg leading-loose text-justify opacity-80 font-light">
                    <HighlightText text={para} accentColor={scene.visual.palette.accent} />
                 </p>
              ))}
           </div>

           <div className="col-span-12 md:col-span-3 space-y-12">
              <div className="w-full h-full border border-dashed border-current/20 p-4 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                 <GenerativeEntity params={scene.visual.visualParams} color={scene.visual.palette.secondary} secondaryColor={scene.visual.palette.accent} progress={progress} />
              </div>
           </div>
        </div>
     </div>
   );
};

// 3. CONSTELLATION NODES (Replacing Cards)
const LayoutConstellation: React.FC<{ scene: StoryScene; progress: any }> = ({ scene, progress }) => {
  const items = scene.visual.galleryItems || [];
  const primaryColor = scene.visual.palette.primary;

  return (
    <div className="w-full max-w-7xl z-10 relative">
      <div className="text-center mb-24 max-w-3xl mx-auto">
         <h2 className="text-5xl md:text-7xl font-serif-display font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
            {scene.highlightPhrase}
         </h2>
         {scene.paragraphs.slice(0, 1).map((p, i) => (
            <p key={i} className="text-xl font-light opacity-80 leading-relaxed">
               <HighlightText text={p} accentColor={scene.visual.palette.accent} />
            </p>
         ))}
      </div>

      <div className="relative w-full min-h-[60vh] flex flex-wrap justify-center items-center gap-16 perspective-1000">
         {items.map((item, i) => {
            const yOffset = (i % 2 === 0 ? 40 : -40);
            
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ margin: "-100px" }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="relative group w-full md:w-[28%] text-left"
                style={{ transform: `translateY(${yOffset}px)` }}
              >
                 {/* Connecting Lines */}
                 <div className="absolute -top-12 left-6 w-px h-12 bg-gradient-to-b from-transparent to-current opacity-20"></div>

                 <div className="flex items-start gap-4">
                    <div className="mt-1 w-3 h-3 rounded-full bg-current shadow-[0_0_10px_currentColor]" style={{ color: primaryColor }}></div>
                    <div>
                       <h3 className="text-xl font-bold font-serif-display mb-2 group-hover:text-[var(--primary)] transition-colors" style={{ '--primary': primaryColor } as any}>
                          {item.title}
                       </h3>
                       <p className="text-sm opacity-60 leading-relaxed group-hover:opacity-100 transition-opacity">
                          {item.description}
                       </p>
                    </div>
                 </div>
              </motion.div>
            );
         })}
      </div>
    </div>
  );
};

// 4. TYPOGRAPHIC STORM
const LayoutTypography: React.FC<{ scene: StoryScene; progress: any }> = ({ scene, progress }) => {
  const xDir = useTransform(progress, [0, 1], [-200, 200]);
  const color = scene.visual.palette.primary;

  return (
    <div className="w-full max-w-6xl relative z-10 flex flex-col items-center text-center">
        <motion.div 
          style={{ x: xDir }} 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-black font-serif-display opacity-[0.04] whitespace-nowrap pointer-events-none select-none blur-sm"
        >
           {scene.highlightPhrase}
        </motion.div>

        <motion.div className="relative z-10 p-12 bg-black/40 backdrop-blur-md border border-white/5 shadow-2xl rounded-sm">
           <span className="inline-block mb-6 px-4 py-1 border border-current rounded-full text-xs font-mono uppercase tracking-widest opacity-60">
              {scene.chapterTitle}
           </span>
           <h1 className="text-6xl md:text-8xl font-serif-display font-bold leading-none mb-10 mix-blend-lighten">
             {scene.highlightPhrase}
           </h1>
           {scene.paragraphs.map((para, i) => (
              <p key={i} className="text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto opacity-90 mb-6 last:mb-0">
                 <HighlightText text={para} accentColor={scene.visual.palette.accent} />
              </p>
           ))}
        </motion.div>
    </div>
  );
};

// 5. ENTITY FOCUS
const LayoutEntity: React.FC<{ scene: StoryScene; progress: any }> = ({ scene, progress }) => {
  return (
    <div className="w-full max-w-7xl grid md:grid-cols-2 gap-20 items-center z-10">
       <div className="order-2 md:order-1 space-y-8">
          <motion.div initial={{ width: 0 }} whileInView={{ width: 60 }} className="h-1 bg-current mb-8" />
          <h2 className="text-5xl md:text-7xl font-serif-display font-bold leading-tight">
             {scene.highlightPhrase}
          </h2>
          {scene.paragraphs.map((para, i) => (
             <p key={i} className="text-lg opacity-80 leading-loose max-w-lg border-l-2 border-current/10 pl-6">
                <HighlightText text={para} accentColor={scene.visual.palette.accent} />
             </p>
          ))}
       </div>
       
       <div className="order-1 md:order-2 flex items-center justify-center">
          <GenerativeEntity 
            params={scene.visual.visualParams} 
            color={scene.visual.palette.primary} 
            secondaryColor={scene.visual.palette.secondary}
            progress={progress} 
          />
       </div>
    </div>
  );
};

// 6. SPLIT DYNAMIC
const LayoutSplit: React.FC<{ scene: StoryScene; progress: any }> = ({ scene, progress }) => {
  const scale = useTransform(progress, [0, 1], [1, 1.1]);
  
  return (
     <div className="w-full max-w-7xl z-10 flex flex-col md:flex-row items-center gap-16 md:gap-32">
        <div className="flex-1 relative aspect-square md:aspect-auto md:h-[60vh] w-full flex items-center justify-center overflow-hidden rounded-sm border border-white/10 bg-white/5">
            <motion.div style={{ scale }} className="absolute inset-0 bg-gradient-to-br from-transparent to-black/80"></motion.div>
            <GenerativeEntity 
               params={scene.visual.visualParams} 
               color={scene.visual.palette.secondary} 
               secondaryColor={scene.visual.palette.primary}
               progress={progress} 
            />
        </div>
        
        <div className="flex-1 space-y-12">
            <div>
               <h2 className="text-4xl md:text-6xl font-serif-display font-bold mb-6">{scene.highlightPhrase}</h2>
               <div className="w-full h-px bg-gradient-to-r from-current to-transparent opacity-30"></div>
            </div>
            {scene.paragraphs.map((para, i) => (
               <p key={i} className="text-xl font-light leading-relaxed opacity-90">
                  <HighlightText text={para} accentColor={scene.visual.palette.accent} />
               </p>
            ))}
        </div>
     </div>
  );
};

// --- GENERATIVE ENTITY ---
const GenerativeEntity: React.FC<{ params: VisualParams; color: string; secondaryColor: string; progress: any }> = ({ params, color, secondaryColor, progress }) => {
  const rotate = useTransform(progress, [0, 1], [0, params.speed * 360]);
  const pulse = useTransform(progress, [0, 0.5, 1], [1, 1.1, 1]);
  
  if (params.shape === 'spiky') {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
         <motion.div style={{ rotate, scale: pulse }} className="relative z-10">
            <svg viewBox="0 0 200 200" className="w-64 h-64 md:w-96 md:h-96 overflow-visible drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
               <defs>
                 <linearGradient id="spikeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color} />
                    <stop offset="100%" stopColor={secondaryColor} />
                 </linearGradient>
               </defs>
               {[...Array(12)].map((_, i) => (
                  <motion.polygon 
                    key={i}
                    points="100,100 110,20 100,0 90,20"
                    fill="url(#spikeGrad)"
                    style={{ rotate: i * 30 }}
                    className="origin-center opacity-80 mix-blend-plus-lighter"
                  />
               ))}
               <circle cx="100" cy="100" r="30" fill={color} className="blur-md" />
            </svg>
         </motion.div>
      </div>
    );
  }

  if (params.shape === 'geometric') {
     return (
        <div className="relative w-full h-full flex items-center justify-center perspective-1000">
           <motion.div 
             style={{ rotateX: rotate, rotateY: rotate }} 
             className="w-48 h-48 md:w-64 md:h-64 border border-current relative transform-style-3d bg-white/5 backdrop-blur-sm"
           >
              <div className="absolute inset-0 border border-current opacity-30 transform translate-z-10"></div>
              <div className="absolute inset-0 border border-current opacity-30 transform -translate-z-10"></div>
              <motion.div 
                style={{ scale: pulse }} 
                className="absolute inset-0 bg-gradient-to-br from-current to-transparent opacity-20"
              />
           </motion.div>
        </div>
     );
  }

  if (params.shape === 'fluid') {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
           <motion.div 
              style={{ 
                rotate,
                background: `radial-gradient(circle at 30% 30%, ${color}, ${secondaryColor})` 
              } as any}
              animate={{ 
                 borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "30% 70% 70% 30% / 30% 30% 70% 70%"] 
              }}
              transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }}
              className="w-64 h-64 md:w-96 md:h-96 blur-xl opacity-70 mix-blend-screen"
           />
        </div>
      );
  }

  // Default
  return (
    <div className="relative flex items-center justify-center">
        <motion.div 
           style={{ scale: pulse, backgroundColor: color }}
           className="w-64 h-64 rounded-full blur-[100px] opacity-30"
        />
        <svg viewBox="0 0 100 100" className="w-64 h-64 absolute animate-spin-slow opacity-60">
           <circle cx="50" cy="50" r="48" stroke={color} strokeWidth="0.2" strokeDasharray="1 3" fill="none" />
           <circle cx="50" cy="50" r="30" stroke={secondaryColor} strokeWidth="0.5" fill="none" />
           <path d="M50 20 L50 80 M20 50 L80 50" stroke={color} strokeWidth="0.2" />
        </svg>
    </div>
  );
};

// --- HERO & FOOTER ---
const HeroSection: React.FC<{ meta: BookAnalysis['meta']; palette: any }> = ({ meta, palette }) => {
  return (
    <section className="h-screen flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
       {/* Aurora Background */}
       <motion.div 
         animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
         transition={{ duration: 10, repeat: Infinity }}
         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full blur-[120px] -z-10"
         style={{ background: `radial-gradient(circle, ${palette.primary} 0%, transparent 70%)` }}
       />

       <motion.div 
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 1.5, ease: "easeOut" }}
         className="relative z-10"
       >
         <div className="inline-flex items-center gap-3 mb-8 opacity-60">
            <Layers className="w-5 h-5" />
            <span className="text-xs font-mono tracking-[0.4em] uppercase">Visual Archive</span>
         </div>
         
         <h1 className="text-6xl md:text-9xl font-serif-display font-bold leading-[0.85] tracking-tighter mb-12 mix-blend-normal">
           {meta.title}
         </h1>
         
         <div className="max-w-2xl mx-auto border-t border-current/20 pt-8">
            <p className="text-xl md:text-2xl font-light italic opacity-90">
              "{meta.essence}"
            </p>
         </div>
       </motion.div>
    </section>
  );
};

const Footer: React.FC<{ meta: BookAnalysis['meta'], onReset: () => void }> = ({ meta, onReset }) => {
  return (
    <footer className="h-[60vh] flex flex-col items-center justify-center relative bg-[#020202] text-white overflow-hidden">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black opacity-50"></div>
       <div className="z-10 text-center space-y-12">
          <p className="text-xs font-mono tracking-[0.5em] uppercase opacity-30">End of Volume</p>
          <h2 className="text-5xl font-serif-display text-gray-400">{meta.title}</h2>
          <button 
             onClick={onReset}
             className="px-12 py-4 border border-white/10 bg-white/5 hover:bg-white hover:text-black transition-all duration-500 uppercase text-xs font-bold tracking-[0.2em] rounded-sm"
          >
            Open New Book
          </button>
       </div>
    </footer>
  );
};