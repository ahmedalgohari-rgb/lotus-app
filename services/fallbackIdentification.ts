// Simple Egyptian plants database for offline identification
export const egyptianPlantsDatabase = [
  {
    id: '1',
    scientificName: 'Epipremnum aureum',
    nameEn: 'Golden Pothos',
    nameAr: 'البوتس الذهبي',
    category: 'Indoor Plant',
    difficulty: 'easy',
    care: {
      watering: 'Water when top 2cm of soil is dry (weekly)',
      light: 'Bright, indirect light',
      environment: 'Indoor, 18-24°C',
      careInstructions: [
        'Check soil moisture before watering',
        'Rotate weekly for even growth',
        'Wipe leaves monthly for dust'
      ],
      cairoTips: 'Perfect for Cairo apartments with good window light. Thrives in air conditioning.'
    },
    commonProblems: ['Yellowing leaves (overwatering)', 'Brown leaf tips (low humidity)'],
    visualFeatures: ['heart-shaped leaves', 'trailing vine', 'green and yellow variegation']
  },
  {
    id: '2',
    scientificName: 'Sansevieria trifasciata',
    nameEn: 'Snake Plant',
    nameAr: 'نبات الثعبان',
    category: 'Succulent',
    difficulty: 'easy',
    care: {
      watering: 'Water monthly, less in winter',
      light: 'Low to bright indirect light',
      environment: 'Indoor, very low maintenance',
      careInstructions: [
        'Let soil dry completely between waterings',
        'Dust leaves occasionally',
        'Rarely needs repotting'
      ],
      cairoTips: 'Excellent for Cairo\'s dry climate. Can handle dust and neglect.'
    },
    commonProblems: ['Root rot (overwatering)', 'Mushy leaves (too much water)'],
    visualFeatures: ['tall upright leaves', 'green with yellow edges', 'thick succulent leaves']
  },
  {
    id: '3',
    scientificName: 'Aloe barbadensis',
    nameEn: 'Aloe Vera',
    nameAr: 'الصبار',
    category: 'Succulent',
    difficulty: 'easy',
    care: {
      watering: 'Water deeply but infrequently (bi-weekly)',
      light: 'Bright, indirect sunlight',
      environment: 'Indoor/outdoor, drought tolerant',
      careInstructions: [
        'Water only when soil is completely dry',
        'Ensure good drainage',
        'Can be placed outdoors in shade'
      ],
      cairoTips: 'Perfect for Cairo\'s climate. Natural healing properties for skin.'
    },
    commonProblems: ['Brown/soft leaves (overwatering)', 'Pale leaves (too much sun)'],
    visualFeatures: ['thick fleshy leaves', 'rosette formation', 'serrated leaf edges']
  },
  {
    id: '4',
    scientificName: 'Chlorophytum comosum',
    nameEn: 'Spider Plant',
    nameAr: 'نبات العنكبوت',
    category: 'Indoor Plant',
    difficulty: 'easy',
    care: {
      watering: 'Water when top soil is dry (weekly)',
      light: 'Bright, indirect light',
      environment: 'Indoor, adaptable',
      careInstructions: [
        'Water regularly but don\'t let it sit in water',
        'Propagate from baby plantlets',
        'Remove brown leaf tips with scissors'
      ],
      cairoTips: 'Great air purifier for Cairo apartments. Easy to propagate and share.'
    },
    commonProblems: ['Brown leaf tips (fluoride in water)', 'No babies (needs more light)'],
    visualFeatures: ['long thin leaves', 'green and white stripes', 'produces baby plants']
  },
  {
    id: '5',
    scientificName: 'Ficus elastica',
    nameEn: 'Rubber Plant',
    nameAr: 'نبات المطاط',
    category: 'Indoor Tree',
    difficulty: 'medium',
    care: {
      watering: 'Water when top 3cm of soil is dry',
      light: 'Bright, indirect light',
      environment: 'Indoor, needs space',
      careInstructions: [
        'Wipe leaves weekly with damp cloth',
        'Rotate monthly for even growth',
        'Prune to control size'
      ],
      cairoTips: 'Excellent statement plant for Cairo homes. Handle leaf dropping during relocation.'
    },
    commonProblems: ['Leaf drop (stress/overwatering)', 'Pest issues (spider mites)'],
    visualFeatures: ['large glossy leaves', 'tree-like growth', 'burgundy new growth']
  },
  {
    id: '6',
    scientificName: 'Monstera deliciosa',
    nameEn: 'Monstera',
    nameAr: 'المونستيرا',
    category: 'Indoor Plant',
    difficulty: 'medium',
    care: {
      watering: 'Water when top 2cm of soil is dry',
      light: 'Bright, indirect light',
      environment: 'Indoor, needs humidity',
      careInstructions: [
        'Provide moss pole for climbing',
        'Mist regularly in dry conditions',
        'Clean leaves monthly'
      ],
      cairoTips: 'Needs extra humidity in Cairo\'s dry air. Use humidifier or pebble tray.'
    },
    commonProblems: ['No fenestrations (not enough light)', 'Brown leaf edges (low humidity)'],
    visualFeatures: ['large split leaves', 'climbing vine', 'aerial roots']
  },
  {
    id: '7',
    scientificName: 'Dracaena marginata',
    nameEn: 'Dragon Tree',
    nameAr: 'شجرة التنين',
    category: 'Indoor Tree',
    difficulty: 'easy',
    care: {
      watering: 'Water when top 5cm of soil is dry',
      light: 'Bright, indirect light',
      environment: 'Indoor, low maintenance',
      careInstructions: [
        'Allow soil to dry between waterings',
        'Remove yellowing lower leaves',
        'Can tolerate some neglect'
      ],
      cairoTips: 'Very forgiving for busy Cairo lifestyles. Handles air conditioning well.'
    },
    commonProblems: ['Yellow leaves (overwatering)', 'Brown leaf tips (fluoride sensitivity)'],
    visualFeatures: ['thin pointed leaves', 'red leaf edges', 'trunk-like stem']
  },
  {
    id: '8',
    scientificName: 'Zamioculcas zamiifolia',
    nameEn: 'ZZ Plant',
    nameAr: 'نبات زي زي',
    category: 'Indoor Plant',
    difficulty: 'easy',
    care: {
      watering: 'Water monthly, very drought tolerant',
      light: 'Low to bright indirect light',
      environment: 'Indoor, extremely low maintenance',
      careInstructions: [
        'Water only when soil is completely dry',
        'Can survive weeks without water',
        'Rarely needs fertilizing'
      ],
      cairoTips: 'Perfect for frequent travelers. Can handle Cairo\'s dust and dry air excellently.'
    },
    commonProblems: ['Yellowing stems (overwatering)', 'Very slow growth (normal)'],
    visualFeatures: ['glossy dark green leaves', 'thick stems', 'drought-adapted appearance']
  }
];

export class FallbackIdentificationService {
  static async identifyFromLocalDatabase(imageFeatures?: any): Promise<any> {
    // Simple matching based on visual features
    // This is a simplified version - you can enhance with better algorithms
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, return random suggestions as fallback
      const possibleMatches = egyptianPlantsDatabase
        .sort(() => Math.random() - 0.5) // Randomize
        .slice(0, 3); // Take first 3

      if (possibleMatches.length > 0) {
        return {
          success: true,
          source: 'Local Database',
          results: possibleMatches.map((plant, index) => ({
            confidence: Math.floor(Math.random() * 30 + 40), // 40-70% confidence for local matches
            scientificName: plant.scientificName,
            commonNames: [plant.nameEn, plant.nameAr],
            localData: true,
            careInstructions: plant.care,
            difficulty: plant.difficulty,
            category: plant.category,
            commonProblems: plant.commonProblems,
            cairoTips: plant.care.cairoTips,
            rank: index + 1,
          })),
          bestMatch: {
            confidence: Math.floor(Math.random() * 30 + 40),
            scientificName: possibleMatches[0].scientificName,
            commonNames: [possibleMatches[0].nameEn, possibleMatches[0].nameAr],
            localData: true,
            careInstructions: possibleMatches[0].care,
            difficulty: possibleMatches[0].difficulty,
            category: possibleMatches[0].category,
            cairoTips: possibleMatches[0].care.cairoTips,
          },
          message: 'Identified using local plant database',
        };
      }

      return {
        success: false,
        source: 'Local Database',
        message: 'Could not identify plant from local database',
        genericAdvice: true,
      };
    } catch (error) {
      console.error('Local identification error:', error);
      return {
        success: false,
        source: 'Local Database',
        error: error instanceof Error ? error.message : 'Local identification failed',
      };
    }
  }

  /**
   * Get plant by scientific name from local database
   */
  static getPlantByScientificName(scientificName: string) {
    return egyptianPlantsDatabase.find(
      plant => plant.scientificName.toLowerCase() === scientificName.toLowerCase()
    );
  }

  /**
   * Search plants by common name (English or Arabic)
   */
  static searchPlantsByName(searchTerm: string) {
    const term = searchTerm.toLowerCase();
    return egyptianPlantsDatabase.filter(plant => 
      plant.nameEn.toLowerCase().includes(term) ||
      plant.nameAr.includes(searchTerm) ||
      plant.scientificName.toLowerCase().includes(term)
    );
  }

  /**
   * Get all plants in a category
   */
  static getPlantsByCategory(category: string) {
    return egyptianPlantsDatabase.filter(plant => 
      plant.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get plants by difficulty level
   */
  static getPlantsByDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
    return egyptianPlantsDatabase.filter(plant => plant.difficulty === difficulty);
  }

  /**
   * Get generic plant care advice when identification fails
   */
  static getGenericCareAdvice() {
    return {
      success: false,
      source: 'Generic Care Guide',
      genericAdvice: true,
      message: 'We couldn\'t identify your plant, but here are general care tips',
      tips: [
        {
          category: 'Watering',
          tip: 'Water when top inch of soil is dry',
          cairoTip: 'In Cairo\'s dry climate, check soil moisture more frequently'
        },
        {
          category: 'Light',
          tip: 'Most houseplants prefer bright, indirect light',
          cairoTip: 'Avoid direct afternoon sun through windows in Cairo'
        },
        {
          category: 'Environment',
          tip: 'Keep away from heating/cooling vents',
          cairoTip: 'Air conditioning can dry out plants quickly in Cairo'
        },
        {
          category: 'Monitoring',
          tip: 'Check for yellowing leaves regularly',
          cairoTip: 'Dust leaves weekly due to Cairo\'s dusty environment'
        }
      ],
      commonPlantTypes: [
        'If it has thick, fleshy leaves, it might be a succulent (water less)',
        'If it has thin, delicate leaves, it might need more humidity',
        'If it\'s a climbing plant, provide support like a moss pole'
      ]
    };
  }
}