// We rely on the global pdfjsLib loaded via CDN in index.html for simplicity 
// in this specific environment, or we can try to import it if available.
// To ensure robust "pure frontend" execution without complex bundlers, 
// we interface with the window object for the library.

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = async function() {
      const typedarray = new Uint8Array(this.result as ArrayBuffer);

      try {
        if (!window.pdfjsLib) {
            reject(new Error("PDF.js library not loaded"));
            return;
        }

        const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
        let fullText = "";
        
        // Limit pages to avoid browser crash on massive books, 
        // or read all if performant. Let's cap at first 50 pages for the demo 
        // to ensure speed, or read all if < 100.
        const maxPages = Math.min(pdf.numPages, 50); 

        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + "\n\n";
        }

        resolve(fullText);
      } catch (error) {
        console.error("Error reading PDF:", error);
        reject(error);
      }
    };

    fileReader.onerror = (err) => reject(err);
    fileReader.readAsArrayBuffer(file);
  });
};