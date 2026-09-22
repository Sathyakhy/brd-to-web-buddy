export type MusicPreset = {
  id: string;
  title: string;
  category: "khmer" | "classical" | "romantic" | "acoustic";
  description: string;
  url: string;
  duration?: string;
};

export const MUSIC_PRESETS: MusicPreset[] = [
  {
    id: "khmer-pleng-kar",
    title: "Pleng Kar — Traditional Wedding Suite",
    category: "khmer",
    description: "Traditional Khmer ceremonial wedding melodies (Roneat & Tro strings).",
    url: "https://actions.google.com/sounds/v1/ambiences/outdoor_celebration.ogg",
    duration: "Instrumental",
  },
  {
    id: "canon-in-d",
    title: "Pachelbel's Canon in D",
    category: "classical",
    description: "Timeless classical wedding processional with violin & warm chamber strings.",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Pachelbel%27s_Canon_in_D_Major_%28synthesized%29.ogg",
    duration: "Classical",
  },
  {
    id: "clair-de-lune",
    title: "Clair de Lune — Debussy",
    category: "romantic",
    description: "Gentle, romantic solo piano with serene twilight ambiance.",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/be/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg",
    duration: "Piano",
  },
  {
    id: "gymnopedie",
    title: "Gymnopédie No. 1 — Satie",
    category: "acoustic",
    description: "Atmospheric, soothing acoustic piano cadence for relaxed reception invites.",
    url: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Erik_Satie_-_Gymnopedie_No._1.ogg",
    duration: "Minimalist",
  },
  {
    id: "vivaldi-spring",
    title: "Vivaldi — Spring Allegro",
    category: "classical",
    description: "Uplifting festive baroque strings celebrating new beginnings.",
    url: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Vivaldi_Spring_mvt_1_Allegro.ogg",
    duration: "Baroque",
  },
];
