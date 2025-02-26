#!/bin/bash

set -e  # Exit immediately on error
set -o pipefail  # Ensure failures propagate in pipes
set -u  # Treat unset variables as an error

# Default values
PYTHON_SCRIPT="https://raw.githubusercontent.com/andrewalevin/mapbox-adventure/main/utils/convert-tracks2json.py"
REQUIRED_PACKAGES=("pyyaml" "gpxpy")  # Add necessary Python dependencies
VENV_DIR=".venv"  # Virtual environment directory

# Usage message
usage() {
    echo "Usage: $0 --yaml <tracks.yaml> [--dir <gpx_folder>] [--var <js_var_name>]"
    echo "Example: $0 --yaml routes.yaml --dir gpx_folder --var myRoutes"
    exit 1
}

# Argument parsing
YAML_FILE=""
DIR_ARG=""
VAR_ARG=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --yaml) YAML_FILE="$2"; shift ;;
        --dir) DIR_ARG="--dir $2"; shift ;;
        --var) VAR_ARG="--var $2"; shift ;;
        *) echo "Unknown parameter: $1"; usage ;;
    esac
    shift
done

# Validate required arguments
if [[ -z "$YAML_FILE" ]]; then
    echo "Error: --yaml argument is required."
    usage
fi

# Ensure Python and pip are installed
if ! command -v python3 &>/dev/null; then
    echo "Error: Python3 is not installed. Please install it first."
    exit 1
fi

if ! command -v pip3 &>/dev/null; then
    echo "Error: pip3 is not installed. Please install it first."
    exit 1
fi

# Create a virtual environment if not exists
if [[ ! -d "$VENV_DIR" ]]; then
    python3 -m venv "$VENV_DIR"
    echo "Virtual environment created at $VENV_DIR"
fi

# Activate the virtual environment
source "$VENV_DIR/bin/activate"

# Install required Python packages
echo "Checking required Python packages..."
pip3 install --upgrade pip
for package in "${REQUIRED_PACKAGES[@]}"; do
    if ! python3 -c "import $package" &>/dev/null; then
        echo "Installing missing package: $package"
        pip3 install "$package"
    fi
done

# Fetch Python script if not present (uncomment if needed)
# if [[ ! -f "$PYTHON_SCRIPT" ]]; then
#     echo "Fetching Python script..."
#     curl -O https://yourdomain.com/path/to/convert-tracks2json.py
# fi

# Run the Python script with arguments
echo "Running the Python script..."
python3 "$PYTHON_SCRIPT" "$YAML_FILE" $DIR_ARG $VAR_ARG

# Cleanup: remove the Python script if it was fetched (uncomment if needed)
# rm -f "$PYTHON_SCRIPT"

# Deactivate virtual environment
deactivate

echo "✅ Conversion completed successfully!"