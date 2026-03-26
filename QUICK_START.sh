#!/bin/bash
# Quick Start: Angular Test Framework Fix Checklist
# Run this to verify your setup and track progress

echo "🚀 Angular + Jasmine Testing Framework - Quick Start Checklist"
echo "================================================================"
echo ""

# Check 1: Dependencies
echo "1️⃣  Checking dependencies..."
if npm list zone.js @angular/platform-browser-dynamic karma-jasmine-html-reporter > /dev/null 2>&1; then
  echo "   ✅ All testing dependencies installed"
else
  echo "   ❌ Missing dependencies - run: npm install zone.js @angular/platform-browser-dynamic karma-jasmine-html-reporter"
  exit 1
fi
echo ""

# Check 2: Files
echo "2️⃣  Checking configuration files..."
if [ -f "karma.conf.js" ] && [ -f "src/test.ts" ] && [ -f "tsconfig.spec.json" ]; then
  echo "   ✅ All config files present"
else
  echo "   ❌ Missing config files"
  exit 1
fi
echo ""

# Check 3: Angular Version
echo "3️⃣  Checking Angular version..."
ANGULAR_VERSION=$(npm list @angular/core | grep '@angular/core' | head -1 | grep -o '[0-9][0-9]*\.[0-9]*')
if [[ $ANGULAR_VERSION == 21.* ]]; then
  echo "   ✅ Angular $ANGULAR_VERSION compatible"
else
  echo "   ⚠️  Angular version: $ANGULAR_VERSION (should be 21.x)"
fi
echo ""

# Check 4: Vitest imports (should be ZERO)
echo "4️⃣  Checking for Vitest remnants..."
VITEST_COUNT=$(find src -name "*.spec.ts" -exec grep -l "import.*vitest" {} \; | wc -l)
if [ "$VITEST_COUNT" -eq 0 ]; then
  echo "   ✅ No Vitest imports found (good!)"
else
  echo "   ❌ Found $VITEST_COUNT files with Vitest imports"
  echo "      Action: Remove 'import { vi } from vitest' lines"
fi
echo ""

# Check 5: Jest matchers (should be ZERO)
echo "5️⃣  Checking for Jest matchers..."
JEST_COUNT=$(find src -name "*.spec.ts" -exec grep -l "expect\.any\|expect\.objectContaining" {} \; | wc -l)
if [ "$JEST_COUNT" -eq 0 ]; then
  echo "   ✅ No Jest matchers found (good!)"
else
  echo "   ❌ Found $JEST_COUNT files with Jest matchers"
  echo "      Action: Replace expect.any( → jasmine.any("
  echo "      Action: Replace expect.objectContaining( → jasmine.objectContaining("
fi
echo ""

# Check 6: jasmine.createSignal (should be ZERO)
echo "6️⃣  Checking for invalid jasmine.createSignal..."
CREATESIGNAL_COUNT=$(find src -name "*.spec.ts" -exec grep -l "jasmine\.createSignal" {} \; | wc -l)
if [ "$CREATESIGNAL_COUNT" -eq 0 ]; then
  echo "   ✅ No jasmine.createSignal found (good!)"
else
  echo "   ❌ Found $CREATESIGNAL_COUNT files using jasmine.createSignal"
  echo "      Action: Replace with real signals: import { signal } from '@angular/core'"
fi
echo ""

# Check 7: Run TypeScript check
echo "7️⃣  Checking TypeScript compilation..."
echo ""
echo "   Running: npm test 2>&1 | head -50"
npm test 2>&1 | head -50
echo ""
echo "   (Exit Karma with Ctrl+C)"
echo ""

echo "================================================================"
echo "📋 NEXT STEPS:"
echo ""
echo "1. If all checks passed:"
echo "   → Fix remaining test errors using AUTOMATED_FIXES.md"
echo ""
echo "2. For automated fixes:"
echo "   → Open VS Code Find & Replace (Ctrl+H)"
echo "   → Apply patterns from AUTOMATED_FIXES.md"
echo ""
echo "3. For manual fixes:"
echo "   → Follow TESTING_FIXES_SUMMARY.md"
echo "   → Use AUTH_TEST_TEMPLATE.ts as reference"
echo ""
echo "4. After fixes:"
echo "   → Run 'npm test' again"
echo "   → Should see: 0 compilation errors"
echo ""
echo "📖 Documentation:"
echo "   - TESTING_STATUS.md          (This status)"
echo "   - TESTING_FIXES_SUMMARY.md   (Error categories & fixes)"
echo "   - AUTOMATED_FIXES.md         (Find & Replace patterns)"
echo "   - AUTH_TEST_TEMPLATE.ts      (Correct patterns)"
echo "   - TEST_REFACTOR_GUIDE.md     (Strategic guide)"
echo ""
echo "🎯 Target: 0 errors → Tests can run"
echo "================================================================"
