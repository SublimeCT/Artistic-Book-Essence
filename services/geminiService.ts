import { GoogleGenAI, Type } from "@google/genai";
import { BookAnalysis } from "../types";

const getUserLanguage = () => {
  if (typeof navigator !== 'undefined') {
    return navigator.language || 'en-US';
  }
  return 'en-US';
};

const SYSTEM_INSTRUCTION = `
You are a Digital Art Director & Data Viz Expert. Transform this book into a **Generative Web Experience**.

**VISUAL RULES (STRICT):**
1. **NO WALLS OF TEXT**: Split content into short, punchy \`paragraphs\`.
2. **HIGHLIGHTING**: You MUST wrap key concepts or emotional words in asterisks *like this* in the text. These will be visually enlarged/colored.
3. **MANDATORY VISUALIZATION**: Every chapter MUST have a concrete visual concept.
   - "Time/History" -> \`layout: 'timeline_process'\`, \`shape: 'geometric'\`.
   - "Chaos/War" -> \`layout: 'typographic_storm'\`, \`shape: 'spiky'\`, \`motion: 'explode'\`.
   - "Lists/Groups" -> \`layout: 'constellation_nodes'\` (nodes floating in space).
   - "Analysis/Deep Dive" -> \`layout: 'architectural_lens'\`.
4. **BACKGROUNDS**: Choose a \`backgroundPattern\` (grid, lines, dots) that fits the mood. Never use plain backgrounds.
5. **COLOR**: Use high-contrast, artistic palettes. \`accent\` color is for the *highlights*.

**JSON OUTPUT**:
Cover the ENTIRE book structure. Output in "${getUserLanguage()}".
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    meta: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        author: { type: Type.STRING },
        essence: { type: Type.STRING },
        language: { type: Type.STRING }
      },
      required: ['title', 'author', 'essence', 'language']
    },
    screenplay: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          chapterTitle: { type: Type.STRING },
          paragraphs: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "2-3 short, impactful paragraphs. Use *asterisks* for highlights."
          },
          highlightPhrase: { type: Type.STRING },
          visual: {
            type: Type.OBJECT,
            properties: {
              layout: { 
                type: Type.STRING, 
                enum: ['typographic_storm', 'entity_focus', 'constellation_nodes', 'split_dynamic', 'timeline_process', 'architectural_lens'] 
              },
              backgroundPattern: {
                type: Type.STRING,
                enum: ['noise', 'grid', 'lines', 'dots', 'gradient_mesh', 'crosshairs']
              },
              palette: {
                type: Type.OBJECT,
                properties: {
                  primary: { type: Type.STRING },
                  secondary: { type: Type.STRING },
                  accent: { type: Type.STRING },
                  background: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ['primary', 'secondary', 'accent', 'background', 'text']
              },
              visualParams: {
                type: Type.OBJECT,
                properties: {
                  shape: { type: Type.STRING, enum: ['organic', 'geometric', 'spiky', 'fluid', 'scattered', 'architectural'] },
                  motion: { type: Type.STRING, enum: ['pulse', 'rotate', 'flow', 'explode', 'orbit', 'scan'] },
                  complexity: { type: Type.NUMBER },
                  speed: { type: Type.NUMBER }
                },
                required: ['shape', 'motion', 'complexity', 'speed']
              },
              galleryItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING }
                  },
                  required: ['title', 'description']
                }
              }
            },
            required: ['layout', 'backgroundPattern', 'palette', 'visualParams']
          }
        },
        required: ['id', 'chapterTitle', 'paragraphs', 'highlightPhrase', 'visual']
      }
    }
  },
  required: ['meta', 'screenplay']
};

export const analyzeBookContent = async (text: string): Promise<BookAnalysis> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Reduced to 250k chars to improve processing speed and reduce timeout likelihood while still keeping enough context
    const safeText = text.slice(0, 250000); 

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this book.\n\nTEXT:\n${safeText}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");
    return JSON.parse(jsonText) as BookAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const analyzeBookByTitle = async (title: string): Promise<BookAnalysis | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Title: "${title}".`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            known: { type: Type.BOOLEAN },
            analysis: RESPONSE_SCHEMA
          },
          required: ['known']
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    if (result.known && result.analysis) {
      return result.analysis as BookAnalysis;
    }
    return null;
  } catch (error) {
    console.error("Gemini Title Check Error:", error);
    return null;
  }
};

export const refineAnalysis = async (currentData: BookAnalysis, instruction: string): Promise<BookAnalysis> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Current JSON:\n${JSON.stringify(currentData)}\n\nUser Change: "${instruction}"\n\nRefine visuals.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");
    return JSON.parse(jsonText) as BookAnalysis;
  } catch (error) {
    console.error("Gemini Refinement Error:", error);
    throw error;
  }
};