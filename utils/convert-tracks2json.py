import argparse
import pathlib
import gpxpy
import json
import yaml
import os


# Function to recursively convert all keys in a dictionary to lowercase
def convert_keys_to_lowercase(data):
    if isinstance(data, dict):
        return {k.lower(): convert_keys_to_lowercase(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_keys_to_lowercase(item) for item in data]
    else:
        return data


# Load YAML file and convert all keys to lowercase
def load_yaml(filename):
    with open(filename, 'r', encoding='utf-8') as file:
        data = yaml.safe_load(file)
        return convert_keys_to_lowercase(data)


# Parse GPX file and extract points
def parse_gpx(filename):
    with open(filename, 'r', encoding='utf-8') as file:
        gpx = gpxpy.parse(file)

    points = []
    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                points.append([point.latitude, point.longitude])
    return points


# Convert YAML routes to JavaScript
def convert_routes_to_js(tracks_yaml, tracks_dir):
    tracks_yaml = pathlib.Path(tracks_yaml)
    routes = load_yaml(tracks_yaml.as_posix())
    result = []

    for route in routes:
        route_info = {}
        for key, value in route.items():
            route_info[key] = value

        # Use dynamic key access
        path = route.get('path')
        # Prepend tracks directory to the GPX path if 'path' exists
        if path:
            path = os.path.join(tracks_dir, path)

        gpx_points = parse_gpx(path) if path else []

        route_info['points'] = gpx_points

        result.append(route_info)

    # Convert to JS file format
    js_file =  tracks_yaml.with_suffix('.js')
    js_variable = tracks_yaml.stem
    json_file = tracks_yaml.with_suffix('.json')

    js_content = f"const {js_variable} = {json.dumps(result, indent=2, ensure_ascii=False)};"

    with open(js_file.as_posix(), 'w', encoding='utf-8') as js_file:
        js_file.write(js_content)

    # Save result as a JSON file
    with open(json_file.as_posix(), 'w', encoding='utf-8') as _json_file:
        json.dump(result, _json_file, indent=2, ensure_ascii=False)


# Setup CLI arguments
def main():
    parser = argparse.ArgumentParser(description="Convert routes from YAML to JS with GPX points.")
    parser.add_argument('tracks_yaml', help="Path to the YAML file containing the routes.")
    parser.add_argument('tracks_dir', help="Directory containing the GPX track files.")

    args = parser.parse_args()

    # Call the conversion function with the provided arguments
    convert_routes_to_js(args.tracks_yaml, args.tracks_dir)


# Run the script
if __name__ == '__main__':
    main()