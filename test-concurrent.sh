#!/bin/bash

echo "🚀 Testing Concurrent Image Generation"
echo "======================================"
echo ""

BASE_URL="http://localhost:3000"

# Function to generate image
generate_image() {
  local id=$1
  echo "  Request $id: Starting..."
  START=$(date +%s)
  
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/test/test-generate" \
    -H "Content-Type: application/json" \
    -d "{
      \"id\": $id,
      \"type\": \"goal_test_$id\",
      \"title\": \"Test $id\",
      \"gw\": \"1\",
      \"data\": {
        \"home_team\": {
          \"name\": \"Manchester City\",
          \"logo\": \"https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg\",
          \"short_name\": \"MCI\"
        },
        \"away_team\": {
          \"name\": \"Arsenal\",
          \"logo\": \"https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg\",
          \"short_name\": \"ARS\"
        },
        \"goal_scored_team\": \"Manchester City\",
        \"club_name\": \"Premier League\",
        \"club_logo\": \"https://brandlogos.net/wp-content/uploads/2021/10/Premier-League-logo-symbol.png\",
        \"goals\": 1,
        \"scorers\": []
      }
    }")
  
  END=$(date +%s)
  DURATION=$((END - START))
  
  if echo "$RESPONSE" | grep -q "success"; then
    echo "  Request $id: ✓ Completed in ${DURATION}s"
  else
    echo "  Request $id: ✗ Failed"
  fi
}

echo "Sending 5 concurrent requests..."
echo ""

# Send 5 concurrent requests
for i in {1..5}; do
  generate_image $i &
done

# Wait for all background jobs
wait

echo ""
echo "======================================"
echo "✅ Concurrent test completed!"
echo ""
echo "Generated images:"
ls -lh output/ | tail -n +2
