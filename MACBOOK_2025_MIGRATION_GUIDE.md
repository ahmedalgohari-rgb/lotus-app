# 🚀 MacBook 2017 → MacBook 2025 iOS Development Migration Guide

## 📋 **Complete Setup for Lotus Plant Care App Development**

This guide will set up your new MacBook 2025 with the exact development environment needed for the Lotus Plant Care app, based on your current working configuration.

---

## 🛠️ **Phase 1: Core System Setup**

### **1.1 Install Homebrew (Package Manager)**
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add to PATH (follow instructions displayed after installation)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Verify installation
brew --version
```

### **1.2 Install Git**
```bash
# Install Git
brew install git

# Configure Git (replace with your info)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# Verify installation
git --version
```

### **1.3 Install Node.js & npm**
```bash
# Install Node.js (version 20+ required by project)
brew install node@20

# Add Node 20 to PATH
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile

# Verify versions match project requirements
node --version  # Should be v20.x.x or higher
npm --version   # Should be v10.x.x or higher
```

---

## 🍎 **Phase 2: iOS Development Environment**

### **2.1 Install Xcode & Command Line Tools**
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Xcode from App Store (required for iOS development)
# Go to App Store → Search "Xcode" → Install (this is large, ~10GB)

# Verify installation
xcode-select --version
```

### **2.2 Accept Xcode License**
```bash
# Accept Xcode license agreement
sudo xcodebuild -license accept

# Run Xcode first-launch setup
sudo xcodebuild -runFirstLaunch
```

---

## 💎 **Phase 3: Ruby & CocoaPods Setup**

### **3.1 Install Ruby Version Manager (rbenv)**
```bash
# Install rbenv for Ruby version management
brew install rbenv

# Add rbenv to shell profile
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.zprofile
echo 'eval "$(rbenv init -)"' >> ~/.zprofile
source ~/.zprofile

# Verify rbenv installation
rbenv --version
```

### **3.2 Install Ruby & CocoaPods**
```bash
# Install Ruby 3.1.0 (matches your current setup)
rbenv install 3.1.0
rbenv global 3.1.0

# Verify Ruby installation
ruby --version  # Should show ruby 3.1.0

# Install CocoaPods
gem install cocoapods

# Verify CocoaPods installation
pod --version   # Should show 1.16.x or higher
```

---

## ⚛️ **Phase 4: React Native & Expo Setup**

### **4.1 Install Expo CLI & EAS CLI**
```bash
# Install Expo CLI (local version, not legacy)
npm install -g @expo/cli

# Install EAS CLI for builds and deployment
npm install -g eas-cli

# Verify installations
npx expo --version  # Should show latest version
eas --version       # Should show 16.x.x or higher
```

### **4.2 Install Additional Development Tools**
```bash
# Install Watchman (improves file watching performance)
brew install watchman

# Install iOS Simulator utilities
brew install ios-sim

# Install additional helpful tools
brew install tree      # For directory visualization
brew install jq        # For JSON processing
brew install curl      # Enhanced curl
```

---

## 📱 **Phase 5: iOS Simulator Setup**

### **5.1 Install iOS Simulators**
```bash
# List available simulators
xcrun simctl list devicetypes

# Create iOS simulators (run these after Xcode is installed)
xcrun simctl create "iPhone 15 Pro" "iPhone 15 Pro" "iOS 17.0"
xcrun simctl create "iPhone 15" "iPhone 15" "iOS 17.0"

# List created simulators
xcrun simctl list devices
```

### **5.2 Test Simulator**
```bash
# Boot a simulator to test
xcrun simctl boot "iPhone 15 Pro"

# Open Simulator app
open -a Simulator
```

---

## 🏗️ **Phase 6: Project Migration**

### **6.1 Clone Lotus Project Repository**
```bash
# Navigate to desired directory
cd ~/
mkdir Development
cd Development

# Clone the repository (replace with your actual repo URL)
git clone https://github.com/your-username/lotus-plant-care.git
cd lotus-plant-care/mobile-app/GEMINI-expo

# Verify project structure
tree -L 2
```

### **6.2 Install Project Dependencies**
```bash
# Install Node.js dependencies
npm install

# Verify package installation
npm list --depth=0

# Install iOS dependencies (CocoaPods)
cd ios
pod install
cd ..

# Verify iOS dependencies
ls ios/Pods/
```

---

## 🔐 **Phase 7: Environment Configuration**

### **7.1 Create Environment Files**
```bash
# Create .env file for environment variables
touch .env

# Add required environment variables (edit with your actual keys)
cat << 'EOF' > .env
# PlantNet API Configuration
EXPO_PUBLIC_PLANTNET_API_KEY=2b10QgH9qWRWKnhbJ9g5z556fe

# Supabase Configuration (replace with your actual values)
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Development Configuration
NODE_ENV=development
EOF
```

### **7.2 Configure Git for Project**
```bash
# Set up git for the project
git config --local user.name "Your Name"
git config --local user.email "your-email@example.com"

# Check git status
git status
```

---

## 🧪 **Phase 8: Build Verification**

### **8.1 Test Development Server**
```bash
# Clear any cached data
npm run clean

# Start Expo development server
npm start

# Should see QR code and development options
# Server should run on http://localhost:8081
```

### **8.2 Test iOS Build**
```bash
# Test iOS simulator build
npm run ios

# Should open iOS Simulator with the app
# Verify app loads correctly and navigation works
```

### **8.3 Verify All Core Features**
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# All should pass without errors
```

---

## 🔧 **Phase 9: Development Tools Setup**

### **9.1 Install VS Code & Extensions**
```bash
# Install VS Code via Homebrew
brew install --cask visual-studio-code

# Install essential extensions via command line
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension expo-dev.expo-vscode
code --install-extension ms-vscode.vscode-react-native
```

### **9.2 Configure Terminal (Optional)**
```bash
# Install oh-my-zsh for enhanced terminal
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Install powerlevel10k theme (optional)
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

---

## 📊 **Phase 10: Performance & Quality Tools**

### **10.1 Install Performance Monitoring Tools**
```bash
# Install Flipper for React Native debugging
brew install --cask flipper

# Install additional debugging tools
npm install -g react-devtools
npm install -g @react-native-community/cli
```

### **10.2 Install Testing & Quality Tools**
```bash
# Install global testing utilities
npm install -g jest-cli
npm install -g typescript

# Install code quality tools
npm install -g prettier
npm install -g eslint
```

---

## 🚀 **Phase 11: Final Verification & Deployment Setup**

### **11.1 EAS Build Setup**
```bash
# Login to Expo account
eas login

# Configure EAS for your project
eas build:configure

# Test build configuration
eas build --platform ios --profile development --local
```

### **11.2 Apple Developer Setup**
```bash
# Note: These require Apple Developer account setup
# 1. Sign up for Apple Developer Program ($99/year)
# 2. Add certificates to Keychain
# 3. Configure provisioning profiles

# Verify Apple Developer tools
xcrun security find-identity -v -p codesigning
```

---

## ✅ **Phase 12: Complete Setup Verification**

### **12.1 Run Full System Check**
```bash
# Create verification script
cat << 'EOF' > verify_setup.sh
#!/bin/bash
echo "🔍 Verifying iOS Development Setup..."
echo

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo "✅ Git: $(git --version | head -1)"
echo "✅ Ruby: $(ruby --version | head -1)"
echo "✅ CocoaPods: $(pod --version)"
echo "✅ Expo CLI: $(npx expo --version)"
echo "✅ EAS CLI: $(eas --version)"
echo "✅ Xcode: $(xcodebuild -version | head -1)"

echo
echo "🏗️ Project Dependencies:"
echo "✅ Node modules: $([ -d node_modules ] && echo "Installed" || echo "Missing")"
echo "✅ iOS Pods: $([ -d ios/Pods ] && echo "Installed" || echo "Missing")"
echo "✅ Environment: $([ -f .env ] && echo "Configured" || echo "Missing")"

echo
echo "🚀 Setup Complete! Ready for iOS development."
EOF

chmod +x verify_setup.sh
./verify_setup.sh
```

### **12.2 Test App Launch**
```bash
# Final test - launch the complete app
npm start

# In another terminal, test iOS build
npm run ios

# Verify all features work:
# ✅ App launches without errors
# ✅ Navigation between tabs works
# ✅ Camera permissions and functionality
# ✅ PlantNet API integration
# ✅ Supabase authentication
# ✅ Arabic/English language switching
```

---

## 📝 **Project-Specific Architecture Summary**

### **Current Project Configuration:**
- **Framework:** React Native with Expo Router
- **SDK Version:** Expo SDK 52
- **React Native:** 0.76.9
- **Node.js:** v20+ (required)
- **npm:** v10+ (required)
- **TypeScript:** ~5.6.3
- **iOS Deployment Target:** 13.4+

### **Key Dependencies:**
```json
{
  "expo": "~52.0.0",
  "react-native": "0.76.9",
  "@supabase/supabase-js": "^2.48.1",
  "expo-camera": "~16.0.4",
  "react-navigation": "^7.x",
  "zustand": "^5.0.1",
  "i18next": "^25.4.1"
}
```

### **Project Structure:**
```
GEMINI-expo/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   ├── auth.tsx           # Authentication
│   └── onboarding.tsx     # Onboarding flow
├── components/            # Reusable UI components
├── constants/             # Design system & constants
├── services/              # API services (PlantNet, Supabase)
├── store/                 # Zustand state management
├── localization/          # i18next translations (EN/AR)
├── ios/                   # iOS native configuration
└── package.json           # Dependencies & scripts
```

### **Available Scripts:**
```bash
npm start              # Start Expo development server
npm run ios           # Build & run on iOS simulator
npm run lint          # Run ESLint code checking
npm run type-check    # Run TypeScript type checking
npm run test          # Run Jest tests
npm run clean         # Clean cache & reinstall dependencies
```

---

## 🎯 **Quick Setup Summary (TL;DR)**

For experienced developers, here's the essential command sequence:

```bash
# 1. Install core tools
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install git node@20 rbenv watchman
rbenv install 3.1.0 && rbenv global 3.1.0
gem install cocoapods
npm install -g @expo/cli eas-cli

# 2. Install Xcode from App Store, then:
xcode-select --install
sudo xcodebuild -license accept

# 3. Clone & setup project
git clone [your-repo-url]
cd lotus-plant-care/mobile-app/GEMINI-expo
npm install
cd ios && pod install && cd ..

# 4. Configure environment
echo "EXPO_PUBLIC_PLANTNET_API_KEY=2b10QgH9qWRWKnhbJ9g5z556fe" > .env

# 5. Test setup
npm run clean && npm start
npm run ios  # In another terminal
```

---

## 🆘 **Troubleshooting Common Issues**

### **Node.js Version Issues**
```bash
# If Node version is wrong
brew unlink node
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zprofile
```

### **CocoaPods Issues**
```bash
# If pod install fails
cd ios
sudo gem install cocoapods
pod cache clean --all
pod deintegrate
pod install --repo-update
```

### **Expo CLI Issues**
```bash
# If Expo CLI doesn't work
npm uninstall -g expo-cli
npm install -g @expo/cli
npx expo install --fix
```

### **iOS Simulator Issues**
```bash
# Reset iOS Simulator
xcrun simctl shutdown all
xcrun simctl erase all
xcrun simctl create "iPhone 15 Pro" "iPhone 15 Pro" "iOS 17.0"
```

---

## 🎉 **Congratulations!**

Your MacBook 2025 is now configured with the complete iOS development environment for the Lotus Plant Care app. You have:

✅ **Complete development toolchain** (Node.js, Expo, Xcode, CocoaPods)  
✅ **Project-specific setup** (dependencies, environment variables)  
✅ **iOS development environment** (simulators, build tools)  
✅ **Performance optimization tools** (PlantNet API, Supabase integration)  
✅ **Quality assurance tools** (TypeScript, ESLint, Jest)  
✅ **Deployment pipeline** (EAS CLI, Apple Developer tools)  

**Next Steps:**
1. Start development server: `npm start`
2. Test iOS build: `npm run ios`
3. Verify all features work as expected
4. Begin development on your new MacBook 2025!

---

**🌿 Happy coding with the Lotus Plant Care app! Your new MacBook 2025 is ready for world-class iOS development.**