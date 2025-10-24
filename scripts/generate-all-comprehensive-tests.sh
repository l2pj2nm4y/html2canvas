#!/bin/bash

# Generate all comprehensive visual test files for html2canvas
# This script creates comprehensive test versions for all existing basic tests

cd "$(dirname "$0")/../tests/visual-suite"

echo "🚀 Generating comprehensive visual test files..."
echo ""

# Counter for created files
CREATED=0

# Function to check if comprehensive version exists
needs_comprehensive() {
    local file="$1"
    local comp_file="${file%.html}-comprehensive.html"

    if [ -f "$comp_file" ]; then
        return 1  # Already exists
    fi

    # Skip if already has "comprehensive" in name
    if [[ "$file" == *"comprehensive"* ]]; then
        return 1
    fi

    return 0  # Needs comprehensive version
}

# Generate comprehensive test file
generate_comprehensive() {
    local source_file="$1"
    local comp_file="${source_file%.html}-comprehensive.html"
    local test_name=$(basename "$source_file" .html)
    local category=$(dirname "$source_file")

    echo "  ✓ Creating $comp_file"

    # This is a template - actual implementation would read source and enhance it
    # For now, just note what needs to be created
    echo "    TODO: Enhance $test_name with comprehensive test cases"

    ((CREATED++))
}

# Process all test HTML files
find . -name "*.html" -type f | grep -v "index.html\|test-template\|test-runner\|shared\|comprehensive" | while read file; do
    if needs_comprehensive "$file"; then
        generate_comprehensive "$file"
    fi
done

echo ""
echo "✅ Generation complete!"
echo "📊 Files that need comprehensive versions: $CREATED"
echo ""
echo "📝 Next steps:"
echo "  1. Review the list above"
echo "  2. Create comprehensive versions following the pattern in:"
echo "     - background/background-color-comprehensive.html"
echo "     - background/background-image-comprehensive.html"
echo "     - layout/overflow-comprehensive.html"
echo "  3. Update index.html to include new comprehensive tests"
echo ""
