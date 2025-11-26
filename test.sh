#!/bin/bash

# Test script for image generation service

echo "🧪 Testing Image Generation Service"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
AUTH_KEY="my-secret-auth-key-12345"

echo "📋 Test Configuration:"
echo "   Base URL: $BASE_URL"
echo "   Auth Key: $AUTH_KEY"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "success"; then
    echo -e "   ${GREEN}✓ Health check passed${NC}"
else
    echo -e "   ${RED}✗ Health check failed${NC}"
    echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: Generate Image (without auth)
echo "2️⃣  Testing Generate Image (without auth - should fail)..."
UNAUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/images/generate" \
    -H "Content-Type: application/json" \
    -d @data.json)
if echo "$UNAUTH_RESPONSE" | grep -q "Unauthorized"; then
    echo -e "   ${GREEN}✓ Auth protection working${NC}"
else
    echo -e "   ${RED}✗ Auth protection not working${NC}"
    echo "   Response: $UNAUTH_RESPONSE"
fi
echo ""

# Test 3: Generate Image (with auth)
echo "3️⃣  Testing Generate Image (with auth)..."
GENERATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/images/generate" \
    -H "Content-Type: application/json" \
    -H "auth_key: $AUTH_KEY" \
    -d @data.json)

if echo "$GENERATE_RESPONSE" | grep -q "success"; then
    echo -e "   ${GREEN}✓ Image generation successful${NC}"
    IMAGE_URL=$(echo "$GENERATE_RESPONSE" | grep -o '"imageUrl":"[^"]*"' | cut -d'"' -f4)
    IMAGE_KEY=$(echo "$GENERATE_RESPONSE" | grep -o '"imageKey":"[^"]*"' | cut -d'"' -f4)
    echo "   Image URL: $IMAGE_URL"
    echo "   Image Key: $IMAGE_KEY"
    
    # Test 4: Delete Image
    if [ ! -z "$IMAGE_KEY" ]; then
        echo ""
        echo "4️⃣  Testing Delete Image..."
        DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/images/$IMAGE_KEY" \
            -H "auth_key: $AUTH_KEY")
        if echo "$DELETE_RESPONSE" | grep -q "success"; then
            echo -e "   ${GREEN}✓ Image deletion successful${NC}"
        else
            echo -e "   ${RED}✗ Image deletion failed${NC}"
            echo "   Response: $DELETE_RESPONSE"
        fi
    fi
else
    echo -e "   ${RED}✗ Image generation failed${NC}"
    echo "   Response: $GENERATE_RESPONSE"
fi

echo ""
echo "===================================="
echo "✅ Tests completed!"
