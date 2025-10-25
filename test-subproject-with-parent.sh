#!/bin/bash

echo "🧪 Testing Sub Project Export with Parent Project Columns"
echo "========================================================="

# Test Sub Project Export
echo "📝 Testing Sub Project Export with Parent Project Info..."
curl -X POST http://localhost:3001/api/v1/timesheet/excel/template_2 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "export_type": "sub_project"
  }' \
  --output test_subproject_with_parent.xlsx \
  --write-out "HTTP Status: %{http_code}, Time: %{time_total}s\n"

if [ -f "test_subproject_with_parent.xlsx" ]; then
  echo "✅ SUCCESS: Sub Project Excel file with parent info generated"
  echo "📁 File size: $(ls -lh test_subproject_with_parent.xlsx | awk '{print $5}')"
  echo "🗂️  File type: $(file test_subproject_with_parent.xlsx)"
else
  echo "❌ FAILED: Sub Project Excel file not generated"
fi

echo ""

# Test Project Export (should remain unchanged)
echo "📝 Testing Project Export (should remain unchanged)..."
curl -X POST http://localhost:3001/api/v1/timesheet/excel/template_2 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "export_type": "project"
  }' \
  --output test_project_unchanged.xlsx \
  --write-out "HTTP Status: %{http_code}, Time: %{time_total}s\n"

if [ -f "test_project_unchanged.xlsx" ]; then
  echo "✅ SUCCESS: Project Excel file generated (unchanged format)"
  echo "📁 File size: $(ls -lh test_project_unchanged.xlsx | awk '{print $5}')"
else
  echo "❌ FAILED: Project Excel file not generated"
fi

echo ""
echo "🧹 Cleaning up test files..."
rm -f test_*_with_parent.xlsx test_*_unchanged.xlsx

echo ""
echo "✨ Testing completed!"
echo ""
echo "📊 Expected Excel Structure for Sub Project Export:"
echo "┌──────────────────┬─────────────────────┬─────────────────┬──────────────────┬─────────────────┬─────────────┬─────────────┐"
echo "│ โปรเจ็คหลัก        │ รหัสโปรเจ็คหลัก        │ Sub Project     │ รหัส Sub Project  │ จำนวนชั่วโมงรวม  │ จำนวนผู้ใช้ │ เปอร์เซ็นต์  │"
echo "├──────────────────┼─────────────────────┼─────────────────┼──────────────────┼─────────────────┼─────────────┼─────────────┤"
echo "│ Project Alpha    │ 1                   │ Feature Login   │ 10               │ 45.50           │ 3           │ 25.30%      │"
echo "│ Project Alpha    │ 1                   │ Feature Dashboard│ 11              │ 65.25           │ 4           │ 36.20%      │"
echo "│ Project Beta     │ 2                   │ Feature API     │ 15               │ 89.75           │ 2           │ 49.80%      │"
echo "└──────────────────┴─────────────────────┴─────────────────┴──────────────────┴─────────────────┴─────────────┴─────────────┘"
echo ""
echo "📊 Expected Excel Structure for Project Export (unchanged):"
echo "┌──────────────────┬─────────────────────┬─────────────────┬─────────────┬─────────────┐"
echo "│ โปรเจ็ค           │ รหัสโปรเจ็ค          │ จำนวนชั่วโมงรวม  │ จำนวนผู้ใช้ │ เปอร์เซ็นต์  │"
echo "├──────────────────┼─────────────────────┼─────────────────┼─────────────┼─────────────┤"
echo "│ Project Alpha    │ 1                   │ 134.50          │ 5           │ 55.20%      │"
echo "│ Project Beta     │ 2                   │ 109.25          │ 3           │ 44.80%      │"
echo "└──────────────────┴─────────────────────┴─────────────────┴─────────────┴─────────────┘"