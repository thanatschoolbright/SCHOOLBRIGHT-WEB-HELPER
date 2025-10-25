#!/bin/bash

echo "🧪 Testing ExportModalByProject after fixing totalHours issue"
echo "============================================================="

# Test API endpoint
echo "📝 Testing API endpoint at http://localhost:3001..."

curl -X POST http://localhost:3001/api/v1/timesheet/excel/template_2 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }' \
  --output test_fixed_export.xlsx \
  --write-out "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n"

if [ -f "test_fixed_export.xlsx" ]; then
  echo "✅ SUCCESS: Excel file generated"
  echo "📁 File size: $(ls -lh test_fixed_export.xlsx | awk '{print $5}')"
  echo "🗂️  File type: $(file test_fixed_export.xlsx)"
else
  echo "❌ FAILED: Excel file not generated"
fi

echo ""
echo "🧹 Cleaning up..."
rm -f test_fixed_export.xlsx

echo "✨ Test completed!"