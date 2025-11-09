#!/bin/bash
# Script to create WordPress plugin ZIP file

# Plugin name and version
PLUGIN_NAME="modular-blocks-plugin"
VERSION="1.0.0"
ZIP_NAME="${PLUGIN_NAME}-${VERSION}.zip"

echo "Creating WordPress Plugin ZIP: ${ZIP_NAME}"
echo "============================================"

# Remove old ZIP if exists
if [ -f "$ZIP_NAME" ]; then
    echo "Removing old ZIP file..."
    rm "$ZIP_NAME"
fi

# Create temporary directory
TEMP_DIR="${PLUGIN_NAME}"
if [ -d "$TEMP_DIR" ]; then
    echo "Removing old temp directory..."
    rm -rf "$TEMP_DIR"
fi

echo "Creating temporary directory..."
mkdir "$TEMP_DIR"

# Copy necessary files
echo "Copying plugin files..."

# Core PHP files
cp modular-blocks-plugin.php "$TEMP_DIR/"

# Includes directory
cp -r includes "$TEMP_DIR/"

# Admin directory
cp -r admin "$TEMP_DIR/"

# Assets directory (including vendor libraries)
cp -r assets "$TEMP_DIR/"

# Build directory (compiled blocks)
cp -r build "$TEMP_DIR/"

# Blocks directory (for block.json, render.php, and view.js)
echo "Copying blocks directory..."
mkdir "$TEMP_DIR/blocks"
for block_dir in blocks/*/; do
    block_name=$(basename "$block_dir")
    mkdir -p "$TEMP_DIR/blocks/$block_name"

    # Copy block.json (required)
    if [ -f "$block_dir/block.json" ]; then
        cp "$block_dir/block.json" "$TEMP_DIR/blocks/$block_name/"
    fi

    # Copy render.php (if exists)
    if [ -f "$block_dir/render.php" ]; then
        cp "$block_dir/render.php" "$TEMP_DIR/blocks/$block_name/"
    fi

    # Copy view.js source (needed for registration)
    if [ -f "$block_dir/view.js" ]; then
        cp "$block_dir/view.js" "$TEMP_DIR/blocks/$block_name/"
    fi

    echo "  ✓ Copied $block_name"
done

# Languages directory (if exists)
if [ -d "languages" ]; then
    cp -r languages "$TEMP_DIR/"
fi

# README
if [ -f "README.md" ]; then
    cp README.md "$TEMP_DIR/"
fi

# License
if [ -f "LICENSE.txt" ]; then
    cp LICENSE.txt "$TEMP_DIR/"
elif [ -f "LICENSE" ]; then
    cp LICENSE "$TEMP_DIR/"
fi

echo ""
echo "Files copied. Creating ZIP archive..."

# Create ZIP file
zip -r "$ZIP_NAME" "$TEMP_DIR" -q

# Clean up temporary directory
echo "Cleaning up..."
rm -rf "$TEMP_DIR"

# Get ZIP size
ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)

echo ""
echo "============================================"
echo "✓ Plugin ZIP created successfully!"
echo "  File: $ZIP_NAME"
echo "  Size: $ZIP_SIZE"
echo ""
echo "You can now upload this ZIP file to WordPress:"
echo "  Plugins → Add New → Upload Plugin"
echo "============================================"
