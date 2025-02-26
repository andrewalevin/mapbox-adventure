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


def convert_routes_to_js(tracks_yaml: pathlib.Path, tracks_dir: pathlib.Path = None):
    tracks_yaml = pathlib.Path(tracks_yaml).resolve()
    tracks_dir = tracks_yaml.parent if tracks_dir is None else pathlib.Path(tracks_dir).resolve()

    routes = load_yaml(tracks_yaml)
    result = []

    for route in routes:
        route_info = {key: value for key, value in route.items()}
        path = route.get('path')
        if path:
            gpx_path = tracks_dir / path
            gpx_points = parse_gpx(gpx_path) if gpx_path.exists() else []
            route_info['points'] = gpx_points
        result.append(route_info)

    js_file = tracks_yaml.with_suffix('.js')
    json_file = tracks_yaml.with_suffix('.json')
    js_variable = tracks_yaml.stem

    js_file.write_text(f"const {js_variable} = {json.dumps(result, indent=2, ensure_ascii=False)};", encoding='utf-8')
    json_file.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description="Convert routes from YAML to JS with GPX points.")
    parser.add_argument('tracks_yaml', type=pathlib.Path, help="Path to the YAML file containing the routes.")
    parser.add_argument('--tracks_dir', type=pathlib.Path, default=None,
                        help="Directory containing the GPX track files (optional, defaults to the same directory as tracks_yaml).")
    args = parser.parse_args()

    convert_routes_to_js(args.tracks_yaml, args.tracks_dir)


if __name__ == '__main__':
    main()
