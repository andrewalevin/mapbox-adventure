import '@maptiler/sdk/dist/maptiler-sdk.css';
import { config, Map, helpers, MapStyle, Marker, gpx, LngLatBounds } from '@maptiler/sdk';
import { ElevationProfileControl } from "@maptiler/elevation-profile-control";

config.apiKey = 'YOUR_MAPTILER_API_KEY_HERE';

let polyline, epc, marker;

const map = new Map({
    container: 'map', // container's id or the HTML element in which SDK will render the map
    center: [7.6011,45.9078], // starting position [lng, lat]
    zoom: 11.39, // starting zoom
    style: MapStyle.OUTDOOR
});

map.on('load', async () => {

    polyline = await helpers.addPolyline(map, {
        data: 'YOUR_MAPTILER_DATASET_ID_HERE',
        lineColor: '#66f',
        lineWidth: 4,
        outline: true,
        outlineWidth: 2
    });

    marker = new Marker()
        .setLngLat([0, 0])
        .addTo(map);

    // Create an instance (with no options)
    epc = new ElevationProfileControl({
        container: "profileContainer",
        visible: true,
        showButton: false,
        profileLineColor: "#66f",
        profileBackgroundColor: "#a103fc11",
        displayTooltip: true,
        onMove: (data) => {
            marker.setLngLat(data.position)
        },
    });

    // Add it to your map
    map.addControl(epc);

    // Add some data (from a URL or a MapTiler Data UUID)
    const sourceObject = map.getSource(polyline.polylineSourceId);
    epc.setData(sourceObject._data);

    moveMarkerToGPXStart(sourceObject._data);

});

function fitToDataBounds(data) {
    // Geographic coordinates of the LineString
    const coordinates = data.features[0].geometry.coordinates;

    // Pass the first coordinates in the LineString to `lngLatBounds` &
    // wrap each coordinate pair in `extend` to include them in the bounds
    // result. A variation of this technique could be applied to zooming
    // to the bounds of multiple Points or Polygon geomteries - it just
    // requires wrapping all the coordinates with the extend method.
    const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
    }, new LngLatBounds(coordinates[0], coordinates[0]));

    map.fitBounds(bounds, {
        padding: 20
    });
    moveMarkerToGPXStart(data);
}

function moveMarkerToGPXStart(data) {
    marker.setLngLat(data.features[0].geometry.coordinates[0])
}

function readGPXFile(file){
    if (file.name.split('.').pop().toLowerCase() !== 'gpx') {
        return;
    }
    const reader = new FileReader();
    reader.onload = function (event) {
        const sourceObject = map.getSource(polyline.polylineSourceId);
        sourceObject.setData(gpx(event.target.result));

        epc.setData(sourceObject._data);
        fitToDataBounds(sourceObject._data);
    };
    reader.readAsText(file, 'UTF-8');
}