

function radiusLine(zoom) {
    console.log('Zoom: ', zoom);
    if (zoom > 11)
        return 6;
    else if (zoom > 10){
        return 5;
    } else {
        return 1;
    }
}


function mapAddLayer(_map, _id, coordinates, color = 'red', width = 4) {
    _map.addLayer({
        id: _id,
        type: 'line',
        source: {
            type: 'geojson',
            lineMetrics: true,
            data: {
                'type': 'FeatureCollection',
                'features': [{
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'coordinates': coordinates,
                        'type': 'LineString'
                    }
                }]
            }
        },
        paint: {
            'line-color': color,
            'line-width': width,
        },
        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        }
    });

    _map.on('click', _id, function(e) {
        new mapboxgl.Popup({
            offset: 10
        })
            .setLngLat(e.lngLat)
            .setHTML(`<h3>${Math.trunc(turf.lineDistance(turf.lineString(coordinates)))} km</h3>`)
            .addTo(map);
    });
}

function getRadius(zoom) {
    const radius = Math.max(9 * (zoom - 9), 10);
    return Math.round(radius);
}

function isHTML(str) {
    const doc = new DOMParser().parseFromString(str, "text/html");
    return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
}

function parseCoordinates(input, defaultCoords = [0, 0], offsetMultiplier = 0.001) {
    const coordRegex = /^\s*(-?\d+(\.\d+)?)\s*[,\s]\s*(-?\d+(\.\d+)?)\s*$/;

    // Parse input using regex
    const match = input.match(coordRegex);
    if (match) {
        const [_, lat, , lon] = match.map(Number); // Extract and convert to numbers
        return [lon, lat];
    }

    // Generate random offset for default coordinates
    const getRandomOffset = () => (Math.random() * 2 - 1) * offsetMultiplier;

    return [
        defaultCoords[0] + getRandomOffset(),
        defaultCoords[1] + getRandomOffset()
    ];
}


// Function to update the size of markers based on the zoom level
function updateMarkerSize(map) {
    const radius = getRadius(map.getZoom());
    const markers = document.getElementsByClassName("marker");

    // Loop through all markers and update their size
    for (const markerElem of markers) {
        markerElem.style.width = `${radius}px`;
        markerElem.style.height = `${radius}px`;
    }
}

function displayBanner(message) {
    const banner_elem = document.createElement("div");
    banner_elem.className = "error-banner";
    banner_elem.textContent = message;
    document.body.appendChild(banner_elem);
}

function mapProcess(data) {
    console.log('💙 mapProcess: ', data)

    const radius = getRadius(map.getZoom());
    for (const data_item of data) {
        const { coords = '', title = '', about = '', img = '', link = '', kind = ''} = data_item;
        const spot = {
            coordinates: coords,
            title: title,
            about: about,
            thumbnail: img,
            link: link,
            kind: kind
        };

        const markerElem = document.createElement('div');
        markerElem.className = 'marker marker-interest';
        markerElem.style.width = `${radius}px`;
        markerElem.style.height = `${radius}px`;

        const markerPopupElem = document.createElement('div');
        markerPopupElem.className = 'popup';

        if (spot.kind.trim()) {
            markerElem.classList.add(...spot.kind.split(' '));
            markerPopupElem.classList.add(...spot.kind.split(' '));
        }

        if (spot.title) {
            const titleElem = document.createElement('div');
            titleElem.className = 'popup-title';
            if (isHTML(spot.title)) {
                titleElem.innerHTML = spot.title;
            } else {
                titleElem.appendChild(
                    Object.assign(document.createElement('h3'), {textContent: spot.title}));
            }
            markerPopupElem.appendChild(titleElem);
        }


        if (spot.thumbnail) {
            const thumbnailElem = document.createElement('div');
            thumbnailElem.className = 'popup-img-container';

            if (isHTML(spot.thumbnail)) {
                thumbnailElem.innerHTML = spot.thumbnail;
                markerElem.style.backgroundColor = 'white';
            } else {

                const parts = spot.thumbnail.split('.');

                const imgSmallPath = `${config.rootURL}${config.imgDirPath}/${parts[0]}-100px.${parts[1]}`;
                const imgBigPath = `${config.rootURL}${config.imgDirPath}/${parts[0]}-220px.${parts[1]}`;

                markerElem.style.backgroundImage = `url('${imgSmallPath}\')`;

                const imgElem = document.createElement('img');
                imgElem.loading='lazy';
                imgElem.alt='';
                imgElem.src = imgBigPath;

                thumbnailElem.appendChild(imgElem);
            }
            markerPopupElem.appendChild(thumbnailElem);
        }

        if (spot.about){
            const aboutElem = document.createElement('div');
            aboutElem.className = 'popup-about';
            if (isHTML(spot.about)) {
                aboutElem.innerHTML = spot.about;
            } else {
                aboutElem.appendChild(
                    Object.assign(document.createElement('p'), {textContent: spot.about}));
            }
            markerPopupElem.appendChild(aboutElem);
        }

        if (spot.link){
            const linkElem = document.createElement('div');
            linkElem.className = 'popup-link';

            if (isHTML(spot.link)) {
                linkElem.innerHTML = spot.link;
            } else {
                const aElem = Object.assign(document.createElement('a'), {
                    href: spot.link,
                    textContent: spot.link});
                linkElem.appendChild(aElem);
            }
            markerPopupElem.appendChild(linkElem);
        }

        new mapboxgl.Marker(markerElem)
            .setLngLat(parseCoordinates(spot.coordinates, config.mapCenter, config.offsetForSpotNoCoords))
            .setPopup(new mapboxgl.Popup({offset: 50}).setHTML(markerPopupElem.outerHTML))
            .addTo(map);
    }
}

// Set default values using nullish coalescing operator
config.mapboxToken = config.mapboxToken ?? '';
config.mapStyle = config.mapStyle ?? 'mapbox://styles/mapbox/outdoors-v12';
config.mapZoom = config.mapZoom ?? 12;
config.mapCenter = config.mapCenter ?? [55.751746, 37.618117];
config.rootURL = config.rootURL ?? '';
config.dataYamlPath = config.dataYamlPath ?? 'data.yaml';
config.offsetForSpotNoCoords = config.offsetForSpotNoCoords ?? 0.0025;
config.imgDirPath = config.imgDirPath ?? 'imgs';

// Check if mapboxToken is missing
if (!config.mapboxToken?.trim()) {
    displayBanner("Token (mapboxgl.accessToken) is missing!");
}

mapboxgl.accessToken = config.mapboxToken;
const map = new mapboxgl.Map({
    container: 'map',
    center: config.mapCenter.reverse(),
    zoom: config.mapZoom,
    style: config.mapStyle,
});

console.log('💚 config.dataYamlPath: ', config.dataYamlPath);


fetch(config.dataYamlPath)
    .then(response => response.text())
    .then(jsyaml.load)
    .then(mapProcess)
    .catch(error => {
        console.error('Error processing the map data:', error);
    });


// Add zoom event listener to the map
map.on('zoom', () => {
    updateMarkerSize(map);
});






