#!/bin/bash

echo "========================================"
echo "Cleaning and Rebuilding Backend"
echo "========================================"

echo ""
echo "Step 1: Deleting target directory..."
rm -rf target

echo ""
echo "Step 2: Running Maven clean..."
./mvnw clean

echo ""
echo "Step 3: Compiling with Lombok annotation processing..."
./mvnw compile -DskipTests

echo ""
echo "========================================"
echo "Build Complete!"
echo "========================================"
