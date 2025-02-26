import argparse
import pathlib
import gpxpy
import json
import yaml


def convert_keys_to_lowercase(data):
    if isinstance(data, dict):
        return {k.lower(): convert_keys_to_lowercase(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_keys_to_lowercase(item) for item in data]
    return data


def load_yaml(filename: pathlib.Path):
    with filename.open('r', encoding='utf-8') as file:
        data = yaml.safe_load(file)
        return convert_keys_to_lowercase(data)


def parse_gpx(filename: pathlib.Path):
    with filename.open('r', encoding='utf-8') as file:
        gpx = gpxpy.parse(file)

    return [[point.latitude, point.longitude] for track in gpx.tracks for segment in track.segments for point in
            segment.points]


def convert_routes_to_js(tracks_yaml: pathlib.Path, tracks_dir: pathlib.Path, js_var_name: str):
    """Converts YAML routes to a JS file with GPX track points."""
    routes = load_yaml(tracks_yaml)
    result = []

    for route in routes:
        route_info = {key: value for key, value in route.items()}

        gpx_path = tracks_dir / route.get('path', '') if 'path' in route else None
        gpx_points = parse_gpx(gpx_path) if gpx_path and gpx_path.exists() else []

        route_info['points'] = gpx_points
        result.append(route_info)

    # Convert to JS file format
    js_file = tracks_yaml.with_suffix('.js')
    json_file = tracks_yaml.with_suffix('.json')

    js_content = f"const {js_var_name} = {json.dumps(result, indent=2, ensure_ascii=False)};"

    with js_file.open('w', encoding='utf-8') as f:
        f.write(js_content)

    # Save as JSON
    with json_file.open('w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser(description="Convert routes from YAML to JS with GPX points.")
    parser.add_argument('tracks_yaml', type=pathlib.Path, help="Path to the YAML file containing the routes.")
    parser.add_argument('--dir', '-d', type=pathlib.Path, default=None,
                        help="Directory containing the GPX track files (optional, defaults to the same directory as tracks_yaml).")
    parser.add_argument(
        "--var", "-v", type=str, default=None,
        help="Variable name in the JavaScript file (optional, defaults to the YAML filename stem)."
    )

    args = parser.parse_args()

    # Set default tracks_dir to YAML file's directory if not provided
    tracks_dir = args.dir if args.dir else args.tracks_yaml.parent
    js_var_name = args.var if args.var else args.tracks_yaml.stem

    convert_routes_to_js(args.tracks_yaml, tracks_dir, js_var_name)


if __name__ == '__main__':
    main()
