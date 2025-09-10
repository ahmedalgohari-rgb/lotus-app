export interface PlantSpecies {
  id: string;
  commonName: string;
  arabicName: string;
  scientificName: string;
  description: string;
  careInstructions: {
    watering: string;
    light: string;
    humidity: string;
    temperature: string;
    soil: string;
    fertilization: string;
    pruning: string;
  };
  windowPositionRatings: {
    North: number;
    East: number;
    South: number;
    West: number;
  };
  cairoTips: {
    en: string;
    ar: string;
  };
  imageUrl: string;
}

// Placeholder data - replace with actual data from backend/database
export const PLANT_SPECIES_DATA: PlantSpecies[] = [
  {
    id: '1',
    commonName: 'Snake Plant',
    arabicName: 'نبات الثعبان',
    scientificName: 'Sansevieria trifasciata',
    description: 'A popular indoor plant known for its stiff, upright, sword-like leaves.',
    careInstructions: {
      watering: 'Water every 2-4 weeks, allow soil to dry completely.',
      light: 'Low to bright indirect light.',
      humidity: 'Average room humidity.',
      temperature: '18-35°C (65-95°F).',
      soil: 'Well-draining potting mix.',
      fertilization: 'Feed once a month during growing season.',
      pruning: 'Remove yellow or damaged leaves.',
    },
    windowPositionRatings: {
      North: 4,
      East: 3,
      South: 2,
      West: 5,
    },
    cairoTips: {
      en: 'Tolerates Cairo dry air well, but protect from direct summer sun.',
      ar: 'يتحمل جفاف هواء القاهرة جيداً، ولكن احمه من أشعة الشمس المباشرة في الصيف.',
    },
    imageUrl: 'https://example.com/snake-plant.jpg',
  },
  {
    id: '2',
    commonName: 'Pothos',
    arabicName: 'البوتس',
    scientificName: 'Epipremnum aureum',
    description: 'A very easy-to-care-for plant with heart-shaped leaves.',
    careInstructions: {
      watering: 'Water when top inch of soil is dry.',
      light: 'Low to medium indirect light.',
      humidity: 'Average room humidity.',
      temperature: '18-30°C (65-85°F).',
      soil: 'Standard potting mix.',
      fertilization: 'Feed every 2-4 weeks during growing season.',
      pruning: 'Trim to maintain shape and encourage bushiness.',
    },
    windowPositionRatings: {
      North: 5,
      East: 4,
      South: 3,
      West: 4,
    },
    cairoTips: {
      en: 'Thrives in Cairo indoor conditions. Avoid overwatering, especially in cooler months.',
      ar: 'يزدهر في الظروف الداخلية بالقاهرة. تجنب الإفراط في الري، خاصة في الأشهر الباردة.',
    },
    imageUrl: 'https://example.com/pothos.jpg',
  },
];

export const getPlantSpeciesById = (id: string): PlantSpecies | undefined => {
  return PLANT_SPECIES_DATA.find(plant => plant.id === id);
};
