# 🌿 Lotus Plant Care App

A comprehensive plant care application designed for Egyptian users, featuring plant identification, care scheduling, and localized advice for Cairo's climate.

![Lotus App](assets/icon.png)

## ✨ Features

- 🔍 **Plant Identification** - AI-powered plant recognition using PlantNet API
- 📱 **Plant Collection** - Manage your personal plant library
- 💧 **Smart Care Scheduling** - Automated watering and care reminders
- 🌡️ **Cairo Weather Integration** - Real-time weather-based care recommendations
- 🌐 **Arabic Support** - Full RTL support for Arabic language
- 📸 **Camera Integration** - In-app plant photography with quality validation
- 🔐 **Secure Authentication** - Guest mode and OAuth sign-in

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or physical device)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/lotus-app.git
cd lotus-app

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables (see Security Setup below)
cp .env.example .env
# Edit .env with your API keys

# Start the development server
npx expo start
```

---

## 🔒 Security Setup

**IMPORTANT:** Before running the app, you must configure API keys properly to ensure security.

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Obtain API Keys

#### Supabase (Database & Authentication)
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings → API** to find:
   - Project URL (`EXPO_PUBLIC_SUPABASE_URL`)
   - Anon/Public key (`EXPO_PUBLIC_SUPABASE_ANON_KEY`)
4. Run database migrations (see below)

#### PlantNet API (Plant Identification)
1. Create account at [my.plantnet.org](https://my.plantnet.org)
2. Request an API key (free tier: 500 requests/day)
3. Add your IP address to the API key authorization list
4. Copy the API key (`EXPO_PUBLIC_PLANTNET_API_KEY`)

#### OpenWeather API (Weather Data)
1. Create account at [openweathermap.org](https://openweathermap.org)
2. Generate an API key (free tier: 1000 requests/day)
3. Copy the API key (`EXPO_PUBLIC_OPENWEATHER_API_KEY`)

### 3. Configure .env File

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
EXPO_PUBLIC_PLANTNET_API_KEY=your-plantnet-api-key-here
EXPO_PUBLIC_OPENWEATHER_API_KEY=your-openweather-api-key-here
```

### 4. Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following migration files in order:
   - `supabase-schema.sql` (initial schema)
   - `supabase/migrations/001_security_audit_fixes.sql` (security policies)

**OR** use Supabase CLI:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

### 5. Security Best Practices

- ⚠️ **NEVER commit `.env` to git** (already in `.gitignore`)
- 🔄 Rotate API keys every 90 days
- 🔒 Add IP restrictions on PlantNet API dashboard
- 📊 Monitor API usage for anomalies
- 🛡️ Use separate API keys for development and production

For detailed security information, see [SECURITY.md](SECURITY.md).

---

## 📁 Project Structure

```
lotus-app/
├── assets/                # Images, fonts, icons
├── e2e/                   # Detox E2E tests
├── src/
│   ├── components/        # Reusable UI components
│   ├── constants/         # App constants and colors
│   ├── hooks/             # Custom React hooks
│   ├── i18n/              # Internationalization (Arabic/English)
│   ├── navigation/        # React Navigation configuration
│   ├── screens/           # App screens
│   ├── services/          # API clients (Supabase, PlantNet, Weather)
│   ├── store/             # Zustand state management
│   ├── types/             # TypeScript definitions
│   └── utils/             # Utility functions (validation, rate limiting)
├── supabase/
│   └── migrations/        # Database migration files
├── .env.example           # Environment variables template
├── SECURITY.md            # Security policies and documentation
├── package.json
└── README.md
```

---

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npx expo start

# Clear cache and restart
npx expo r -c

# Run tests
npm test

# Run test coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Build for production
npx eas build --profile production --platform all
```

### Technology Stack

- **Frontend:** React Native with Expo
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **State Management:** Zustand
- **UI Library:** NativeBase + custom components
- **Plant ID:** PlantNet API
- **Weather:** OpenWeather API
- **Testing:** Jest, React Native Testing Library, Detox

---

## 🔐 Security Features

This app implements multiple layers of security:

- ✅ **Row-Level Security (RLS)** on all database tables
- ✅ **Client-side rate limiting** (10 scans/hour, 50 operations/hour)
- ✅ **Image upload validation** (file type, size, dimensions)
- ✅ **Input sanitization** for all user inputs
- ✅ **Database query optimization** (no over-fetching)
- ✅ **API key protection** (environment variables only)

See [SECURITY.md](SECURITY.md) for complete security documentation.

---

## 🧪 Testing

### Test Coverage

- **Unit & Integration Tests:** 46/46 passing
- **E2E Tests:** 17 comprehensive test suites
- **Coverage:** ~85% code coverage

### Running Tests

```bash
# Unit and integration tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm run test:coverage

# E2E tests (requires simulator)
npm run test:e2e:build
npm run test:e2e
```

---

## 📱 Build & Deploy

### Development Build

```bash
npx eas build --profile development --platform ios
```

### Production Build

```bash
# Build for all platforms
npx eas build --profile production --platform all

# Build for specific platform
npx eas build --profile production --platform ios
npx eas build --profile production --platform android
```

---

## 🌍 Localization

The app supports English and Arabic with full RTL layout support.

### Adding New Translations

1. Edit `src/i18n/en.json` for English translations
2. Edit `src/i18n/ar.json` for Arabic translations
3. Use `t()` function in components:

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
return <Text>{t('scan.instruction.centerplant')}</Text>;
```

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Security Vulnerabilities

If you discover a security issue, please review our [Security Policy](SECURITY.md) for responsible disclosure guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [PlantNet](https://plantnet.org/) for the plant identification API
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Expo](https://expo.dev/) for the development platform
- [OpenWeather](https://openweathermap.org/) for weather data

---

## 📞 Support

For questions or support:

- 📧 Email: support@lotus-app.example
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/lotus-app/issues)
- 📚 Documentation: [GitHub Wiki](https://github.com/your-username/lotus-app/wiki)

---

**Built with ❤️ for plant lovers in Egypt 🇪🇬**
