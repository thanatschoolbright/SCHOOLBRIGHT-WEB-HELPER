#!/bin/bash

echo "🚀 Testing Timesheet Project Summary Export System"
echo "=================================================="

# Test 1: Basic API endpoint test
echo "📝 Test 1: Testing API endpoint..."
curl -X POST http://localhost:3000/api/v1/timesheet/excel/template_2 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }' \
  --output test_export.xlsx

if [ -f "test_export.xlsx" ]; then
  echo "✅ Test 1 PASSED: Excel file generated successfully"
  echo "📁 File size: $(ls -lh test_export.xlsx | awk '{print $5}')"
else
  echo "❌ Test 1 FAILED: Excel file not generated"
fi

echo ""

# Test 2: API with project filter
echo "📝 Test 2: Testing API with project filter..."
curl -X POST http://localhost:3000/api/v1/timesheet/excel/template_2 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "project_id": 1
  }' \
  --output test_export_filtered.xlsx

if [ -f "test_export_filtered.xlsx" ]; then
  echo "✅ Test 2 PASSED: Filtered Excel file generated successfully"
  echo "📁 File size: $(ls -lh test_export_filtered.xlsx | awk '{print $5}')"
else
  echo "❌ Test 2 FAILED: Filtered Excel file not generated"
fi

echo ""

# Test 3: API with user filter
echo "📝 Test 3: Testing API with user filter..."
curl -X POST http://localhost:3000/api/v1/timesheet/excel/template_2 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "created_by": 1
  }' \
  --output test_export_user_filtered.xlsx

if [ -f "test_export_user_filtered.xlsx" ]; then
  echo "✅ Test 3 PASSED: User filtered Excel file generated successfully"
  echo "📁 File size: $(ls -lh test_export_user_filtered.xlsx | awk '{print $5}')"
else
  echo "❌ Test 3 FAILED: User filtered Excel file not generated"
fi

echo ""
echo "🧹 Cleaning up test files..."
rm -f test_export*.xlsx

echo ""
echo "✨ Testing completed!"
echo "=================================================="

# Instructions for manual testing
echo ""
echo "📖 Manual Testing Instructions:"
echo "1. Start your development server: npm run dev"
echo "2. Navigate to /timesheet/all"
echo "3. Click on 'ส่งออกรายงานโปรเจ็ค' button"
echo "4. Select date range and optional filters"
echo "5. Click 'สร้างรายงาน' to download Excel file"
echo ""
echo "Expected Excel structure:"
echo "- Sheet 1: สรุปรวม (Project summary)"
echo "- Sheet 2+: รายละเอียดแต่ละโปรเจ็ค (Individual project details)"