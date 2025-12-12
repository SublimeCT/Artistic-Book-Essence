export type LayoutType = 
  | 'typographic_storm'  
  | 'entity_focus'       
  | 'constellation_nodes' // Renamed from grid_interactive to reflect organic nature
  | 'split_dynamic'      
  | 'timeline_process'    // NEW: Vertical timeline
  | 'architectural_lens'; // NEW: Structured, line-heavy layout

export interface VisualParams {
  shape: 'organic' | 'geometric' | 'spiky' | 'fluid' | 'scattered' | 'architectural';
  motion: 'pulse' | 'rotate' | 'flow' | 'explode' | 'orbit' | 'scan';
  complexity: number; 
  speed: number; 
}

export type BackgroundPattern = 'noise' | 'grid' | 'lines' | 'dots' | 'gradient_mesh' | 'crosshairs';

export interface SceneConfig {
  layout: LayoutType;
  backgroundPattern: BackgroundPattern;
  palette: {
    primary: string;   
    secondary: string; 
    accent: string;     // Added for highlights
    background: string; 
    text: string;      
  };
  visualParams: VisualParams; 
  dataPoints?: { label: string; value: number }[];
  galleryItems?: { title: string; description: string; icon: string }[];
}

export interface StoryScene {
  id: string;
  chapterTitle: string; 
  paragraphs: string[]; // Changed from content string to array for better layout control
  highlightPhrase: string;    
  visual: SceneConfig;
}

export interface BookAnalysis {
  meta: {
    title: string;
    author: string;
    essence: string;
    language: string;
  };
  screenplay: StoryScene[];
}

export enum AppState {
  IDLE = 'IDLE',
  CHECKING_KNOWLEDGE = 'CHECKING_KNOWLEDGE',
  READING_PDF = 'READING_PDF',
  ANALYZING = 'ANALYZING',
  TRANSITIONING = 'TRANSITIONING',
  UPDATING = 'UPDATING',
  READY = 'READY',
  ERROR = 'ERROR'
}