#!/bin/bash

# Test script for AI Form Builder Backend API
# Make sure the server is running on http://localhost:5000

BASE_URL="http://localhost:5000"

echo "=== Testing AI Form Builder Backend ==="

# Test 1: Health check
echo -e "\n1. Testing health check..."
curl -X GET "$BASE_URL/" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

# Test 2: Register a new user
echo -e "\n2. Registering a new user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }')

echo "Register Response: $REGISTER_RESPONSE"

# Extract token from register response (assuming JSON response with token)
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

# Test 3: Login
echo -e "\n3. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token from login response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

# Test 4: Get forms (requires auth)
echo -e "\n4. Getting user forms..."
curl -X GET "$BASE_URL/api/forms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

# Test 5: Create a form via AI (assuming AI route exists)
echo -e "\n5. Creating a form via AI..."
AI_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/generate-form" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a contact form with name, email, and message fields"
  }')

echo "AI Form Creation Response: $AI_RESPONSE"

# Extract form ID if created
FORM_ID=$(echo $AI_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "Form ID: $FORM_ID"

# Test 6: Get specific form (public)
if [ ! -z "$FORM_ID" ]; then
  echo -e "\n6. Getting specific form..."
  curl -X GET "$BASE_URL/api/forms/$FORM_ID" \
    -H "Content-Type: application/json" \
    -w "\nStatus: %{http_code}\n"
fi

# Test 7: Submit form response (public)
if [ ! -z "$FORM_ID" ]; then
  echo -e "\n7. Submitting form response..."
  curl -X POST "$BASE_URL/api/forms/$FORM_ID/submit" \
    -H "Content-Type: application/json" \
    -d '{
      "responses": {
        "name": "John Doe",
        "email": "john@example.com",
        "message": "This is a test message"
      }
    }' \
    -w "\nStatus: %{http_code}\n"
fi

# Test 8: Get form submissions (requires auth)
if [ ! -z "$FORM_ID" ]; then
  echo -e "\n8. Getting form submissions..."
  curl -X GET "$BASE_URL/api/forms/$FORM_ID/submissions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -w "\nStatus: %{http_code}\n"
fi

# Test 9: Test file upload (if endpoint exists)
echo -e "\n9. Testing file upload..."
curl -X POST "$BASE_URL/api/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_file.txt" \
  -w "\nStatus: %{http_code}\n" || echo "File upload test skipped (no test file)"

echo -e "\n=== Testing Complete ==="
