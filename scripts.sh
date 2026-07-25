#!/usr/bin/env bash

echo "=================================================="
echo "   AetherBio AI - Docker Launcher & Runner (Bash)"
echo "=================================================="

echo ""
echo "Running: docker compose up --build -d"
docker compose up --build -d

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Docker compose failed to start!"
    exit 1
fi

echo ""
echo "Waiting 5 seconds for services to initialize..."
sleep 5

echo ""
echo "Running: docker ps"
docker ps

echo ""
echo "Testing Backend API Health Check (http://localhost:8000/api/v1/health)..."
if command -v curl &> /dev/null; then
    curl -s http://localhost:8000/api/v1/health | python3 -m json.tool || curl -s http://localhost:8000/api/v1/health
else
    echo "curl command not found, skipping HTTP health check print."
fi

echo ""
echo "=================================================="
echo "AetherBio AI Docker Setup is Live!"
echo "Frontend UI:  http://localhost:3000"
echo "Backend API:   http://localhost:8000"
echo "=================================================="
