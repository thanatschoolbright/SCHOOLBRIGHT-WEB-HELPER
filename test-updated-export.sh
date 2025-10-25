#!/bin/bash

echo "🧪 Testing Updated ExportModalByProject (Project vs Sub Project)"
echo "================================================================"

# Test 1: Export by Project
echo "📝 Test 1: Testing Project Summary Export..."
curl -X POST http://localhost:3001/api/v1/timesheet/excel/template_2 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "export_type": "project"
  }' \
  --output test_project_export.xlsx \
  --write-out "HTTP Status: %{http_code}, Time: %{time_total}s\n"

if [ -f "test_project_export.xlsx" ]; then
  echo "✅ SUCCESS: Project Excel file generated"
  echo "📁 File size: $(ls -lh test_project_export.xlsx | awk '{print $5}')"
else
  echo "❌ FAILED: Project Excel file not generated"
fi

echo ""

# Test 2: Export by Sub Project
echo "📝 Test 2: Testing Sub Project Summary Export..."
curl -X POST http://localhost:3001/api/v1/timesheet/excel/template_2 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "export_type": "sub_project"
  }' \
  --output test_subproject_export.xlsx \
  --write-out "HTTP Status: %{http_code}, Time: %{time_total}s\n"

if [ -f "test_subproject_export.xlsx" ]; then
  echo "✅ SUCCESS: Sub Project Excel file generated"
  echo "📁 File size: $(ls -lh test_subproject_export.xlsx | awk '{print $5}')"
else
  echo "❌ FAILED: Sub Project Excel file not generated"
fi

echo ""

# Test 3: Invalid export type
echo "📝 Test 3: Testing invalid export type..."
curl -X POST http://localhost:3001/api/v1/timesheet/excel/template_2 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "export_type": "invalid"
  }' \
  --write-out "HTTP Status: %{http_code}, Time: %{time_total}s\n"

echo ""

# Test 4: Missing export type
echo "📝 Test 4: Testing missing export type..."
curl -X POST http://localhost:3001/api/v1/timesheet/excel/template_2 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }' \
  --write-out "HTTP Status: %{http_code}, Time: %{time_total}s\n"

echo ""
echo "🧹 Cleaning up test files..."
rm -f test_*_export.xlsx

echo ""
echo "✨ Testing completed!"
echo ""
echo "📖 Expected Results:"
echo "• Project Export: Shows total hours grouped by main projects"
echo "  Example: Project A - 134 hours, Project B - 994 hours"
echo ""
echo "• Sub Project Export: Shows total hours grouped by features/sub-projects"
echo "  Example: Feature X - 45 hours, Feature Y - 128 hours"
echo ""
echo "📱 UI Changes:"
echo "• Removed project and user filters"
echo "• Added export type selection (Project/Sub Project)"
echo "• Updated descriptions and help text"