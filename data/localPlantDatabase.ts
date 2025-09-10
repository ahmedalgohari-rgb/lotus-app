/**
 * Local Plant Database for Offline Identification
 * Common Egyptian/Mediterranean plants with detailed care instructions
 */

export interface LocalPlantData {
  id: string;
  names: {
    english: string;
    arabic: string;
    scientific: string;
  };
  category: string;
  family: string;
  description: string;
  images: string[];
  care: {
    watering: string;
    light: string;
    environment: string;
    careInstructions: string[];
    cairoTips?: string;
  };
  features: {
    leafShape: string[];
    leafColor: string[];
    flowerColor?: string[];
    size: 'small' | 'medium' | 'large';
    growth: 'slow' | 'medium' | 'fast';
  };
  difficulty: 'easy' | 'moderate' | 'hard';
  commonInEgypt: boolean;
}

export const LOCAL_PLANT_DATABASE: LocalPlantData[] = [
  {
    id: 'golden-pothos',
    names: {
      english: 'Golden Pothos',
      arabic: 'بوثوس ذهبي',
      scientific: 'Epipremnum aureum',
    },
    category: 'Indoor Plant',
    family: 'Araceae',
    description: 'Popular trailing vine with heart-shaped variegated leaves',
    images: ['pothos1.jpg', 'pothos2.jpg'],
    care: {
      watering: 'Water when top inch of soil is dry, typically every 1-2 weeks',
      light: 'Bright, indirect light. Tolerates low light conditions',
      environment: 'Warm, humid environment. Ideal temperature 65-75°F (18-24°C)',
      careInstructions: [
        'Allow soil to dry between waterings',
        'Trim yellow or damaged leaves',
        'Wipe leaves clean monthly',
        'Feed monthly during growing season',
        'Pinch growing tips to encourage bushier growth'
      ],
      cairoTips: 'Perfect for Cairo apartments - very tolerant of air conditioning and low light. Keep away from direct desert sun.'
    },
    features: {
      leafShape: ['heart-shaped', 'variegated'],
      leafColor: ['green', 'yellow', 'cream'],
      size: 'medium',
      growth: 'fast'
    },
    difficulty: 'easy',
    commonInEgypt: true
  },
  {
    id: 'snake-plant',
    names: {
      english: 'Snake Plant',
      arabic: 'نبات الثعبان',
      scientific: 'Sansevieria trifasciata',
    },
    category: 'Succulent',
    family: 'Asparagaceae',
    description: 'Tall, upright succulent with sword-like leaves and yellow margins',
    images: ['snake1.jpg', 'snake2.jpg'],
    care: {
      watering: 'Water deeply but infrequently, every 2-6 weeks depending on season',
      light: 'Tolerates low light to bright, indirect light',
      environment: 'Very drought tolerant. Prefers warm, dry conditions',
      careInstructions: [
        'Water less in winter months',
        'Ensure good drainage to prevent root rot',
        'Clean leaves with damp cloth',
        'Rarely needs repotting',
        'Can be propagated from leaf cuttings'
      ],
      cairoTips: 'Excellent for Cairo climate - very drought tolerant and handles temperature changes well. Great air purifier.'
    },
    features: {
      leafShape: ['sword-like', 'upright'],
      leafColor: ['dark green', 'yellow margins'],
      size: 'large',
      growth: 'slow'
    },
    difficulty: 'easy',
    commonInEgypt: true
  },
  {
    id: 'spider-plant',
    names: {
      english: 'Spider Plant',
      arabic: 'نبات العنكبوت',
      scientific: 'Chlorophytum comosum',
    },
    category: 'Indoor Plant',
    family: 'Asparagaceae',
    description: 'Arching grass-like leaves with white stripes and baby plantlets',
    images: ['spider1.jpg', 'spider2.jpg'],
    care: {
      watering: 'Water regularly, keeping soil slightly moist but not soggy',
      light: 'Bright, indirect light. Some direct morning sun is beneficial',
      environment: 'Room temperature with good air circulation',
      careInstructions: [
        'Water when top inch of soil feels dry',
        'Remove brown leaf tips with scissors',
        'Propagate baby plantlets in water or soil',
        'Feed monthly during spring and summer',
        'Prefers to be slightly root-bound'
      ],
      cairoTips: 'Handles dry air well but benefits from occasional misting. Popular choice for Cairo homes.'
    },
    features: {
      leafShape: ['long', 'arching', 'striped'],
      leafColor: ['green', 'white stripes'],
      size: 'medium',
      growth: 'fast'
    },
    difficulty: 'easy',
    commonInEgypt: true
  },
  {
    id: 'peace-lily',
    names: {
      english: 'Peace Lily',
      arabic: 'زنبق السلام',
      scientific: 'Spathiphyllum wallisii',
    },
    category: 'Flowering Plant',
    family: 'Araceae',
    description: 'Elegant plant with dark green leaves and white spathe flowers',
    images: ['peace1.jpg', 'peace2.jpg'],
    care: {
      watering: 'Keep soil consistently moist but not waterlogged',
      light: 'Low to medium indirect light. Avoid direct sunlight',
      environment: 'Prefers high humidity and warm temperatures',
      careInstructions: [
        'Water when leaves start to droop slightly',
        'Mist leaves regularly or use humidity tray',
        'Remove spent flowers at base',
        'Wipe leaves clean to prevent dust buildup',
        'Feed monthly during growing season'
      ],
      cairoTips: 'Needs extra humidity in Cairo\'s dry climate. Place on pebble tray with water or use humidifier.'
    },
    features: {
      leafShape: ['broad', 'lance-shaped'],
      leafColor: ['dark green'],
      flowerColor: ['white'],
      size: 'medium',
      growth: 'medium'
    },
    difficulty: 'moderate',
    commonInEgypt: true
  },
  {
    id: 'rubber-plant',
    names: {
      english: 'Rubber Plant',
      arabic: 'شجرة المطاط',
      scientific: 'Ficus elastica',
    },
    category: 'Indoor Tree',
    family: 'Moraceae',
    description: 'Large glossy leaves on a sturdy trunk, can grow quite tall indoors',
    images: ['rubber1.jpg', 'rubber2.jpg'],
    care: {
      watering: 'Water when top 2 inches of soil are dry',
      light: 'Bright, indirect light. Can tolerate some direct morning sun',
      environment: 'Warm, humid conditions with good air circulation',
      careInstructions: [
        'Water thoroughly and allow excess to drain',
        'Clean glossy leaves regularly with damp cloth',
        'Rotate plant occasionally for even growth',
        'Prune to control size and shape',
        'Watch for pests on leaf undersides'
      ],
      cairoTips: 'Very popular in Cairo offices and homes. Handle with care as milky sap can irritate skin.'
    },
    features: {
      leafShape: ['large', 'glossy', 'oval'],
      leafColor: ['dark green', 'burgundy (some varieties)'],
      size: 'large',
      growth: 'medium'
    },
    difficulty: 'easy',
    commonInEgypt: true
  },
  {
    id: 'aloe-vera',
    names: {
      english: 'Aloe Vera',
      arabic: 'الألوة فيرا',
      scientific: 'Aloe vera',
    },
    category: 'Succulent',
    family: 'Asphodelaceae',
    description: 'Medicinal succulent with thick, fleshy leaves containing healing gel',
    images: ['aloe1.jpg', 'aloe2.jpg'],
    care: {
      watering: 'Water deeply but infrequently, every 2-3 weeks',
      light: 'Bright, indirect light with some direct sun',
      environment: 'Warm, dry conditions with good drainage',
      careInstructions: [
        'Allow soil to dry completely between waterings',
        'Use well-draining cactus soil mix',
        'Remove dead outer leaves regularly',
        'Harvest outer leaves for gel when mature',
        'Propagate from offsets (pups)'
      ],
      cairoTips: 'Perfect for Cairo climate! Very drought tolerant and useful for treating minor burns and cuts.'
    },
    features: {
      leafShape: ['thick', 'fleshy', 'serrated edges'],
      leafColor: ['green', 'gray-green'],
      size: 'medium',
      growth: 'slow'
    },
    difficulty: 'easy',
    commonInEgypt: true
  },
  {
    id: 'mint',
    names: {
      english: 'Mint',
      arabic: 'نعناع',
      scientific: 'Mentha spicata',
    },
    category: 'Herb',
    family: 'Lamiaceae',
    description: 'Aromatic herb with serrated leaves, essential for Egyptian tea',
    images: ['mint1.jpg', 'mint2.jpg'],
    care: {
      watering: 'Keep soil consistently moist, water daily in hot weather',
      light: 'Partial shade to full sun, morning sun preferred',
      environment: 'Cool, humid conditions with good air circulation',
      careInstructions: [
        'Water frequently, never let soil dry out',
        'Pinch flowers to keep leaves tender',
        'Harvest regularly to encourage growth',
        'Repot annually as it grows quickly',
        'Can be grown in water indefinitely'
      ],
      cairoTips: 'Essential for Egyptian households! Keep in partial shade during hot summer months and water twice daily.'
    },
    features: {
      leafShape: ['small', 'serrated', 'aromatic'],
      leafColor: ['bright green'],
      size: 'small',
      growth: 'fast'
    },
    difficulty: 'easy',
    commonInEgypt: true
  },
  {
    id: 'basil',
    names: {
      english: 'Sweet Basil',
      arabic: 'ريحان',
      scientific: 'Ocimum basilicum',
    },
    category: 'Herb',
    family: 'Lamiaceae',
    description: 'Fragrant culinary herb with glossy green leaves',
    images: ['basil1.jpg', 'basil2.jpg'],
    care: {
      watering: 'Water regularly, keeping soil moist but not soggy',
      light: 'Full sun to partial shade, at least 6 hours of light daily',
      environment: 'Warm conditions, protect from cold drafts',
      careInstructions: [
        'Pinch flower buds to keep leaves flavorful',
        'Harvest leaves regularly to encourage growth',
        'Water at soil level to avoid wetting leaves',
        'Feed weekly during growing season',
        'Start new plants from cuttings'
      ],
      cairoTips: 'Grows well on Cairo balconies. Provide afternoon shade in summer and bring indoors during winter.'
    },
    features: {
      leafShape: ['oval', 'glossy', 'aromatic'],
      leafColor: ['bright green'],
      flowerColor: ['white', 'purple'],
      size: 'medium',
      growth: 'fast'
    },
    difficulty: 'moderate',
    commonInEgypt: true
  },
  {
    id: 'jasmine',
    names: {
      english: 'Arabian Jasmine',
      arabic: 'ياسمين',
      scientific: 'Jasminum sambac',
    },
    category: 'Flowering Plant',
    family: 'Oleaceae',
    description: 'Fragrant white flowers beloved in Egyptian culture',
    images: ['jasmine1.jpg', 'jasmine2.jpg'],
    care: {
      watering: 'Water regularly during growing season, reduce in winter',
      light: 'Bright light with some direct sun, morning sun preferred',
      environment: 'Warm, humid conditions with good air circulation',
      careInstructions: [
        'Water when top inch of soil is dry',
        'Prune after flowering to maintain shape',
        'Feed monthly during spring and summer',
        'Provide support for climbing varieties',
        'Bring indoors during cold weather'
      ],
      cairoTips: 'Symbol of Egyptian hospitality! Grows well in Cairo but needs protection from harsh afternoon sun.'
    },
    features: {
      leafShape: ['small', 'oval', 'glossy'],
      leafColor: ['dark green'],
      flowerColor: ['white'],
      size: 'medium',
      growth: 'medium'
    },
    difficulty: 'moderate',
    commonInEgypt: true
  },
  {
    id: 'hibiscus',
    names: {
      english: 'Hibiscus',
      arabic: 'كركديه',
      scientific: 'Hibiscus rosa-sinensis',
    },
    category: 'Flowering Plant',
    family: 'Malvaceae',
    description: 'Tropical flowering plant with large, colorful blooms',
    images: ['hibiscus1.jpg', 'hibiscus2.jpg'],
    care: {
      watering: 'Water regularly, keep soil moist during growing season',
      light: 'Full sun to partial shade, needs bright light to flower',
      environment: 'Warm, humid conditions, protect from cold',
      careInstructions: [
        'Water daily during hot weather',
        'Deadhead spent flowers regularly',
        'Prune in late winter to encourage bushier growth',
        'Feed weekly during flowering season',
        'Watch for aphids and spider mites'
      ],
      cairoTips: 'Popular ornamental in Cairo gardens. Used to make traditional karkadeh tea from dried flowers.'
    },
    features: {
      leafShape: ['broad', 'serrated'],
      leafColor: ['green'],
      flowerColor: ['red', 'pink', 'white', 'yellow', 'orange'],
      size: 'large',
      growth: 'fast'
    },
    difficulty: 'moderate',
    commonInEgypt: true
  }
];

/**
 * Search local database by features
 */
export function searchLocalPlants(query: string): LocalPlantData[] {
  const searchTerm = query.toLowerCase();
  
  return LOCAL_PLANT_DATABASE.filter(plant => 
    plant.names.english.toLowerCase().includes(searchTerm) ||
    plant.names.arabic.includes(searchTerm) ||
    plant.names.scientific.toLowerCase().includes(searchTerm) ||
    plant.description.toLowerCase().includes(searchTerm) ||
    plant.features.leafColor.some(color => color.toLowerCase().includes(searchTerm)) ||
    plant.features.leafShape.some(shape => shape.toLowerCase().includes(searchTerm)) ||
    plant.category.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get popular Egyptian plants
 */
export function getPopularEgyptianPlants(): LocalPlantData[] {
  return LOCAL_PLANT_DATABASE.filter(plant => plant.commonInEgypt)
    .sort((a, b) => {
      // Sort by difficulty (easy first) then by name
      if (a.difficulty !== b.difficulty) {
        const difficultyOrder = { easy: 0, moderate: 1, hard: 2 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      }
      return a.names.english.localeCompare(b.names.english);
    });
}

/**
 * Get plant by ID
 */
export function getPlantById(id: string): LocalPlantData | undefined {
  return LOCAL_PLANT_DATABASE.find(plant => plant.id === id);
}

/**
 * Get plants by category
 */
export function getPlantsByCategory(category: string): LocalPlantData[] {
  return LOCAL_PLANT_DATABASE.filter(plant => 
    plant.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get easy care plants for beginners
 */
export function getBeginnerFriendlyPlants(): LocalPlantData[] {
  return LOCAL_PLANT_DATABASE.filter(plant => plant.difficulty === 'easy');
}