import { BookAnalysis } from "../types";

export const downloadStaticPage = (data: BookAnalysis) => {
  const htmlContent = generateHtml(data);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.meta.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_biblioart.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const formatText = (text: string, accentColor: string) => {
  return text.replace(/\*(.*?)\*/g, `<span style="color:${accentColor}; font-weight:bold;">$1</span>`);
};

const generateHtml = (data: BookAnalysis) => {
  return `<!DOCTYPE html>
<html lang="${data.meta.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.meta.title} - Visual Journey</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #050505; color: #e0e0e0; overflow-x: hidden; }
        .font-serif-display { font-family: 'Playfair Display', serif; }
        .scene { min-height: 100vh; padding: 4rem 2rem; display: flex; align-items: center; justify-content: center; opacity: 0; transform: translateY(20px); transition: all 1s; }
        .scene.visible { opacity: 1; transform: translateY(0); }
    </style>
</head>
<body>
    <header class="h-screen flex flex-col items-center justify-center text-center p-8">
       <h1 class="text-6xl md:text-9xl font-serif-display font-bold mb-8 text-white">${data.meta.title}</h1>
       <p class="text-gray-500 uppercase tracking-widest text-sm mb-12">${data.meta.author}</p>
       <p class="max-w-xl mx-auto text-xl font-light italic text-gray-300">"${data.meta.essence}"</p>
    </header>

    <main>
    ${data.screenplay.map((scene) => {
       const layout = scene.visual.layout;
       let innerContent = '';
       const paragraphsHtml = scene.paragraphs.map(p => `<p class="mb-4 text-lg font-light leading-relaxed">${formatText(p, scene.visual.palette.accent)}</p>`).join('');
       
       if (layout === 'typographic_storm') {
         innerContent = `
           <div class="text-center max-w-4xl">
             <h2 class="text-6xl md:text-8xl font-serif-display font-bold mb-8 text-white">${scene.highlightPhrase}</h2>
             ${paragraphsHtml}
           </div>
         `;
       } else if (layout === 'constellation_nodes' && scene.visual.galleryItems) {
         innerContent = `
           <div class="max-w-6xl w-full">
             <h2 class="text-4xl font-serif-display mb-12 text-center text-white">${scene.highlightPhrase}</h2>
             <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               ${scene.visual.galleryItems.map(item => `
                 <div class="p-8 border border-white/10 rounded-xl bg-white/5">
                    <h3 class="text-xl font-bold mb-2 text-white">${item.title}</h3>
                    <p class="text-sm text-gray-400">${item.description}</p>
                 </div>
               `).join('')}
             </div>
           </div>
         `;
       } else {
         innerContent = `
           <div class="max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center">
             <div class="space-y-6">
                <span class="text-xs uppercase tracking-widest text-gray-500 border border-gray-700 px-2 py-1 rounded-full">${scene.chapterTitle}</span>
                <h2 class="text-5xl font-serif-display font-bold text-white">${scene.highlightPhrase}</h2>
                <div class="text-gray-400 border-l border-gray-700 pl-6 space-y-4">
                  ${paragraphsHtml}
                </div>
             </div>
             <div class="flex justify-center">
                <div class="w-64 h-64 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                   <div class="text-center text-white">
                      [Generative Visual Placeholder]
                   </div>
                </div>
             </div>
           </div>
         `;
       }
       return `<section class="scene" style="background-color: ${scene.visual.palette.background}; color: ${scene.visual.palette.text}">${innerContent}</section>`;
    }).join('')}
    </main>
    
    <script>
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.2 });
        document.querySelectorAll('.scene').forEach(el => observer.observe(el));
    </script>
</body>
</html>`;
};