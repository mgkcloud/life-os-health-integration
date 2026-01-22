#!/bin/bash
# Life OS Health Integration App - Complete Mac Setup & Test Script
# This script will set up, build, and test the iOS Health Integration app on macOS

set -e  # Exit on error

echo "🏥 Life OS Health Integration App - Mac Setup & Test"
echo "=================================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ========================================
# SECTION 1: PREREQUISITES
# ========================================

echo -e "${BLUE}Section 1: Checking Prerequisites${NC}"
echo "--------------------------------"

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo -e "${RED}❌ Error: This script is designed for macOS only${NC}"
  exit 1
fi

echo -e "${GREEN}✅ macOS detected${NC}"

# Check for Homebrew
if ! command -v brew &> /dev/null; then
  echo -e "${YELLOW}📦 Installing Homebrew...${NC}"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo -e "${GREEN}✅ Homebrew installed${NC}"
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}📦 Installing Node.js...${NC}"
  brew install node
else
  echo -e "${GREEN}✅ Node.js $(node --version) installed${NC}"
fi

# Check for Git
if ! command -v git &> /dev/null; then
  echo -e "${YELLOW}📦 Installing Git...${NC}"
  brew install git
else
  echo -e "${GREEN}✅ Git $(git --version) installed${NC}"
fi

# Check for Xcode Command Line Tools
if ! xcode-select -p &> /dev/null; then
  echo -e "${YELLOW}📦 Installing Xcode Command Line Tools...${NC}"
  xcode-select --install
  echo "Waiting for Xcode installation to complete..."
  read -p "Press ENTER after Xcode installation completes..."
else
  echo -e "${GREEN}✅ Xcode Command Line Tools installed${NC}"
fi

echo ""

# ========================================
# SECTION 2: CLONE REPOSITORY
# ========================================

echo -e "${BLUE}Section 2: Clone Repository${NC}"
echo "-------------------------"

# Check if directory exists
if [ -d "life-os-health-integration" ]; then
  echo -e "${YELLOW}⚠️  Directory exists, removing...${NC}"
  rm -rf life-os-health-integration
fi

# Clone repository
echo -e "${YELLOW}📥 Cloning repository...${NC}"
git clone https://github.com/mgkcloud/life-os-health-integration.git
cd life-os-health-integration

echo -e "${GREEN}✅ Repository cloned${NC}"
echo ""

# ========================================
# SECTION 3: INSTALL DEPENDENCIES
# ========================================

echo -e "${BLUE}Section 3: Install Dependencies${NC}"
echo "-------------------------------"

echo -e "${YELLOW}📦 Installing Expo CLI...${NC}"
npm install -g expo-cli eas-cli

echo -e "${YELLOW}📦 Installing npm packages...${NC}"
npm install

# Check for expo-health, if it fails use react-native-health
if ! npm list expo-health &> /dev/null; then
  echo -e "${YELLOW}⚠️  expo-health not available, installing react-native-health...${NC}"
  npm install react-native-health
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# ========================================
# SECTION 4: CONFIGURE API URL
# ========================================

echo -e "${BLUE}Section 4: Configure Dashboard API${NC}"
echo "----------------------------------"

# Ask for dashboard URL
read -p "🌐 Enter your Life OS Dashboard URL (default: http://localhost:3000): " DASHBOARD_URL
DASHBOARD_URL=${DASHBOARD_URL:-http://localhost:3000}

echo -e "${YELLOW}🔧 Configuring SyncService API URL...${NC}"

# Update SyncService.ts
if [ -f "services/SyncService.ts" ]; then
  # macOS sed syntax
  sed -i '' "s|const API_BASE_URL = 'http://localhost:3000';|const API_BASE_URL = '$DASHBOARD_URL';|g" services/SyncService.ts
  echo -e "${GREEN}✅ API URL configured: $DASHBOARD_URL${NC}"
else
  echo -e "${RED}❌ Error: services/SyncService.ts not found${NC}"
  exit 1
fi

echo ""

# ========================================
# SECTION 5: START DEVELOPMENT SERVER
# ========================================

echo -e "${BLUE}Section 5: Start Development Server${NC}"
echo "---------------------------------"

echo -e "${YELLOW}🚀 Starting Expo development server...${NC}"
echo -e "${BLUE}In a new terminal, run:${NC}"
echo "   cd life-os-health-integration"
echo "   npm start"
echo ""
echo "Then:"
echo "   - Press 'i' for iOS simulator"
echo "   - Press 'a' for Android emulator"
echo "   - Scan QR code for physical device (Expo Go app)"
echo ""

# Start in background and capture PID
npm start &
NPM_PID=$!

echo "Development server started with PID: $NPM_PID"
echo "Waiting for server to initialize..."
sleep 10

echo ""

# ========================================
# SECTION 6: TEST API ENDPOINTS
# ========================================

echo -e "${BLUE}Section 6: Test Dashboard API Endpoints${NC}"
echo "--------------------------------------------"

# Test health sync endpoint
echo -e "${YELLOW}🧪 Testing health sync endpoint...${NC}"
curl -X POST http://localhost:3000/api/health/sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "timestamp": "2026-01-22T03:00:00Z",
    "date": "2026-01-22",
    "steps": 8500,
    "stepsGoal": 10000,
    "distance": 6500,
    "activeEnergyBurned": 450,
    "heartRate": 72,
    "heartRateVariability": 45,
    "sleepDuration": 28800,
    "sleepGoal": 28800,
    "deepSleep": 7200,
    "remSleep": 7200,
    "workouts": 1,
    "workoutMinutes": 30
  }'

echo ""
echo -e "${YELLOW}🧪 Testing screen time sync endpoint...${NC}"
curl -X POST http://localhost:3000/api/screentime/sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "timestamp": "2026-01-22T03:00:00Z",
    "date": "2026-01-22",
    "totalScreenTime": 420,
    "productiveTime": 180,
    "entertainmentTime": 120,
    "focusSessions": 4,
    "appUsage": [],
    "pickups": 45,
    "notifications": 120
  }'

echo ""
echo -e "${YELLOW}🧪 Testing productivity score endpoint...${NC}"
curl -X POST http://localhost:3000/api/productivity/sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "date": "2026-01-22",
    "score": 75,
    "breakdown": {
      "stepsScore": 15,
      "sleepScore": 12,
      "focusScore": 10,
      "workoutScore": 8
    },
    "streak": 3
  }'

echo ""
echo -e "${GREEN}✅ API endpoints tested${NC}"
echo ""

# ========================================
# SECTION 7: SYNC TEST GUIDE
# ========================================

echo -e "${BLUE}Section 7: Manual Sync Test Guide${NC}"
echo "---------------------------------"
echo ""
echo -e "${YELLOW}📱 To test the full sync flow:${NC}"
echo ""
echo "1. Ensure iOS simulator is running (press 'i' in Expo terminal)"
echo "2. Grant HealthKit permissions when prompted"
echo "3. Grant Screen Time permissions when prompted"
echo "4. Navigate to dashboard"
echo "5. Tap 'Sync Now' button"
echo "6. Check terminal for sync logs"
echo "7. Verify data appears in Life OS dashboard"
echo ""
echo -e "${BLUE}Expected sync logs:${NC}"
echo "POST /api/health/sync - 200 OK"
echo "POST /api/screentime/sync - 200 OK"
echo "POST /api/productivity/sync - 200 OK"
echo ""

# ========================================
# SECTION 8: TROUBLESHOOTING
# ========================================

echo -e "${BLUE}Section 8: Troubleshooting${NC}"
echo "------------------------"
echo ""

echo -e "${YELLOW}Issue: Expo dev server won't start${NC}"
echo "Solution: npm start --clear"
echo ""

echo -e "${YELLOW}Issue: Permissions not granted${NC}"
echo "Solution: Delete app from simulator and reinstall"
echo ""

echo -e "${YELLOW}Issue: Sync failing${NC}"
echo "Solution:"
echo "  1. Check API URL in services/SyncService.ts"
echo "  2. Ensure dashboard is running: $DASHBOARD_URL"
echo "  3. Check browser console for errors"
echo "  4. Check iOS simulator logs (Debug menu)"
echo ""

echo -e "${YELLOW}Issue: expo-health package not found${NC}"
echo "Solution:"
echo "  npm uninstall expo-health"
echo "  npm install react-native-health"
echo "  Update services/HealthKitService.ts imports"
echo ""

# ========================================
# SECTION 9: NEXT STEPS
# ========================================

echo -e "${BLUE}Section 9: Next Steps${NC}"
echo "--------------------"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "To integrate with Life OS dashboard:"
echo ""
echo "1. Update dashboard Health Card to use real data from:"
echo "   GET /api/productivity/score?userId=<user>&date=<date>"
echo ""
echo "2. Remove mock health data from dashboard"
echo ""
echo "3. Test end-to-end flow:"
echo "   - iOS app requests permissions"
echo "   - Health data synced to dashboard API"
echo "   - Dashboard displays real health metrics"
echo "   - Productivity score calculated and shown"
echo ""
echo "4. Deploy to TestFlight:"
echo "   eas build --platform ios --profile development"
echo ""

# Stop npm server
echo -e "${YELLOW}Stopping development server (PID: $NPM_PID)...${NC}"
kill $NPM_PID 2>/dev/null || echo "Server already stopped"

echo ""
echo -e "${GREEN}🎉 Setup complete! Ready to build and test.${NC}"
echo ""
echo "Repository: https://github.com/mgkcloud/life-os-health-integration"
echo "Dashboard: $DASHBOARD_URL"
echo ""

echo -e "${BLUE}Quick Commands:${NC}"
echo "  Start app:     npm start"
echo "  iOS Sim:       Press 'i'"
echo "  Android:       Press 'a'"
echo "  Physical:      Scan QR code (Expo Go)"
echo "  Build iOS:     eas build --platform ios"
echo ""
