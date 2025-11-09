#!/usr/bin/env python3
"""
Create WordPress Plugin ZIP file
"""

import os
import shutil
import zipfile
from pathlib import Path

# Configuration
PLUGIN_NAME = "modular-blocks-plugin"
VERSION = "1.0.0"
ZIP_NAME = f"{PLUGIN_NAME}-{VERSION}.zip"

def create_plugin_zip():
    print(f"Creating WordPress Plugin ZIP: {ZIP_NAME}")
    print("=" * 50)

    # Remove old ZIP if exists
    if os.path.exists(ZIP_NAME):
        print("Removing old ZIP file...")
        os.remove(ZIP_NAME)

    # Create temporary directory
    temp_dir = PLUGIN_NAME
    if os.path.exists(temp_dir):
        print("Removing old temp directory...")
        shutil.rmtree(temp_dir)

    print("Creating temporary directory...")
    os.makedirs(temp_dir)

    print("Copying plugin files...")

    # Core PHP file
    shutil.copy2("modular-blocks-plugin.php", f"{temp_dir}/")

    # Directories to copy entirely
    dirs_to_copy = ["includes", "admin", "assets", "build"]
    for dir_name in dirs_to_copy:
        if os.path.exists(dir_name):
            shutil.copytree(dir_name, f"{temp_dir}/{dir_name}")
            print(f"  ✓ Copied {dir_name}/")

    # Blocks directory (selective copy)
    print("Copying blocks directory...")
    os.makedirs(f"{temp_dir}/blocks")

    blocks_dir = Path("blocks")
    for block_dir in blocks_dir.iterdir():
        if block_dir.is_dir():
            block_name = block_dir.name
            dest_dir = f"{temp_dir}/blocks/{block_name}"
            os.makedirs(dest_dir)

            # Files to copy from each block
            files_to_copy = ["block.json", "render.php", "view.js"]
            for file_name in files_to_copy:
                src_file = block_dir / file_name
                if src_file.exists():
                    shutil.copy2(src_file, f"{dest_dir}/{file_name}")

            print(f"  ✓ Copied {block_name}")

    # Optional files
    optional_files = {
        "languages": True,  # Directory
        "README.md": False,
        "LICENSE.txt": False,
        "LICENSE": False
    }

    for item_name, is_dir in optional_files.items():
        if os.path.exists(item_name):
            if is_dir:
                shutil.copytree(item_name, f"{temp_dir}/{item_name}")
            else:
                shutil.copy2(item_name, f"{temp_dir}/{item_name}")

    print("\nFiles copied. Creating ZIP archive...")

    # Create ZIP file
    with zipfile.ZipFile(ZIP_NAME, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, os.path.dirname(temp_dir))
                zipf.write(file_path, arcname)

    # Clean up temporary directory
    print("Cleaning up...")
    shutil.rmtree(temp_dir)

    # Get ZIP size
    zip_size = os.path.getsize(ZIP_NAME)
    zip_size_mb = zip_size / (1024 * 1024)

    print("\n" + "=" * 50)
    print("✓ Plugin ZIP created successfully!")
    print(f"  File: {ZIP_NAME}")
    print(f"  Size: {zip_size_mb:.2f} MB")
    print("\nYou can now upload this ZIP file to WordPress:")
    print("  Plugins → Add New → Upload Plugin")
    print("=" * 50)

if __name__ == "__main__":
    try:
        create_plugin_zip()
    except Exception as e:
        print(f"\n❌ Error creating ZIP: {e}")
        import traceback
        traceback.print_exc()
