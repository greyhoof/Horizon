#!/bin/bash

# Script to bump version numbers in package.json files
# Usage: ./bump_version.sh

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if jq is installed (required for JSON manipulation)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Error: jq is not installed.${NC}"
    echo "jq is required for JSON manipulation."
    echo "Please install jq first:"
    echo "  - On Debian/Ubuntu: sudo apt install jq"
    echo "  - On Fedora: sudo dnf install jq"
    echo "  - On Arch Linux: sudo pacman -S jq"
    echo "  - On macOS: brew install jq"
    exit 1
fi

# Paths to package.json files
ROOT_PACKAGE="package.json"
ELECTRON_PACKAGE="electron/package.json"

# Check if files exist
if [ ! -f "$ROOT_PACKAGE" ]; then
    echo -e "${YELLOW}Error: $ROOT_PACKAGE not found.${NC}"
    exit 1
fi

if [ ! -f "$ELECTRON_PACKAGE" ]; then
    echo -e "${YELLOW}Error: $ELECTRON_PACKAGE not found.${NC}"
    exit 1
fi

# Get current versions
ROOT_CURRENT_VERSION=$(jq -r '.version' "$ROOT_PACKAGE")
ELECTRON_CURRENT_VERSION=$(jq -r '.version' "$ELECTRON_PACKAGE")

echo -e "Current versions:"
echo -e "  Root package.json: ${GREEN}$ROOT_CURRENT_VERSION${NC}"
echo -e "  Electron package.json: ${GREEN}$ELECTRON_CURRENT_VERSION${NC}"
echo

# Ask for the new version
read -p "Enter new version number (e.g., 1.30.1): " NEW_VERSION

# Validate input (basic validation)
if [[ ! $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    echo -e "${YELLOW}Error: Invalid version format. Expected format: X.Y.Z or X.Y.Z-tag${NC}"
    exit 1
fi

# Confirm the change
echo
echo -e "Will update version from ${GREEN}$ROOT_CURRENT_VERSION${NC} to ${GREEN}$NEW_VERSION${NC} in both package.json files."
read -p "Continue? (y/n): " CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
fi

# Update versions
echo "Updating versions..."

# Update root package.json
jq ".version = \"$NEW_VERSION\"" "$ROOT_PACKAGE" > "$ROOT_PACKAGE.tmp" && mv "$ROOT_PACKAGE.tmp" "$ROOT_PACKAGE"

# Update electron package.json
jq ".version = \"$NEW_VERSION\"" "$ELECTRON_PACKAGE" > "$ELECTRON_PACKAGE.tmp" && mv "$ELECTRON_PACKAGE.tmp" "$ELECTRON_PACKAGE"

# Check if updates were successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully updated version to $NEW_VERSION in both package.json files.${NC}"
    
    # Check if git is available
    if command -v git &> /dev/null; then
        echo
        # Ask if user wants to git add and commit
        read -p "Do you want to git add and commit these changes? (y/n): " GIT_CONFIRM
        
        if [[ $GIT_CONFIRM =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}Running git add...${NC}"
            git add "$ROOT_PACKAGE" "$ELECTRON_PACKAGE"
            
            if [ $? -eq 0 ]; then
                echo -e "${BLUE}Running git commit...${NC}"
                git commit -m "Bump version to $NEW_VERSION"
                
                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}✓ Successfully committed version bump to $NEW_VERSION${NC}"
                    
                    # Ask if user wants to create a git tag
                    echo
                    read -p "Do you want to create a git tag for v$NEW_VERSION? (y/n): " TAG_CONFIRM
                    
                    if [[ $TAG_CONFIRM =~ ^[Yy]$ ]]; then
                        echo -e "${BLUE}Creating git tag v$NEW_VERSION...${NC}"
                        git tag -a "v$NEW_VERSION" -m "Version $NEW_VERSION"
                        
                        if [ $? -eq 0 ]; then
                            echo -e "${GREEN}✓ Successfully created git tag v$NEW_VERSION${NC}"
                            echo -e "To push the tag to remote, use: ${BLUE}git push origin v$NEW_VERSION${NC}"
                        else
                            echo -e "${YELLOW}Warning: Failed to create git tag.${NC}"
                        fi
                    fi
                else
                    echo -e "${YELLOW}Warning: Failed to commit changes.${NC}"
                fi
            else
                echo -e "${YELLOW}Warning: Failed to add files to git.${NC}"
            fi
        else
            echo
            echo -e "Changes were not committed. If you want to commit them later:"
            echo -e "  git add package.json electron/package.json"
            echo -e "  git commit -m \"Bump version to $NEW_VERSION\""
            echo -e "  git tag -a \"v$NEW_VERSION\" -m \"Version $NEW_VERSION\""
        fi
    else
        echo
        echo -e "You may want to commit these changes:"
        echo -e "  git add package.json electron/package.json"
        echo -e "  git commit -m \"Bump version to $NEW_VERSION\""
        echo -e "  git tag -a \"v$NEW_VERSION\" -m \"Version $NEW_VERSION\""
    fi
else
    echo -e "${YELLOW}Error: Failed to update one or both package.json files.${NC}"
    exit 1
fi 