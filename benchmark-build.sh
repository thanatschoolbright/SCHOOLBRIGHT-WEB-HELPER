#!/bin/bash

echo "🚀 Build Performance Comparison"
echo "================================"
echo ""

# ลบ .next folder ก่อน
echo "🧹 Cleaning .next folder..."
rm -rf .next
echo ""

# Test NPM Build
echo "📦 Testing NPM BUILD..."
echo "---"
START_NPM=$(date +%s)
npm run build
END_NPM=$(date +%s)
NPM_TIME=$((END_NPM - START_NPM))
echo ""
echo "✅ NPM Build completed in: ${NPM_TIME} seconds"
echo ""

# รอสักครู่
sleep 2

# ลบ .next folder อีกครั้ง
echo "🧹 Cleaning .next folder..."
rm -rf .next
echo ""

# Test BUN Build
echo "⚡ Testing BUN BUILD..."
echo "---"
START_BUN=$(date +%s)
bun run bun-build
END_BUN=$(date +%s)
BUN_TIME=$((END_BUN - START_BUN))
echo ""
echo "✅ BUN Build completed in: ${BUN_TIME} seconds"
echo ""

# แสดงผลเปรียบเทียบ
echo "================================"
echo "📊 RESULTS:"
echo "================================"
echo "NPM:  ${NPM_TIME} seconds"
echo "BUN:  ${BUN_TIME} seconds"
echo ""

if [ $BUN_TIME -lt $NPM_TIME ]; then
    DIFF=$((NPM_TIME - BUN_TIME))
    PERCENT=$((DIFF * 100 / NPM_TIME))
    echo "🏆 Winner: BUN is ${DIFF}s faster (${PERCENT}% improvement)"
else
    DIFF=$((BUN_TIME - NPM_TIME))
    PERCENT=$((DIFF * 100 / BUN_TIME))
    echo "🏆 Winner: NPM is ${DIFF}s faster (${PERCENT}% improvement)"
fi
echo ""
echo "✨ Benchmark completed!"
