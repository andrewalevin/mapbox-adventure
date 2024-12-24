

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


function adjustMarkerPosition(marker, index, nearbyMarkers, offsetMultiplier = 0.0005) {
    const angle = (index / nearbyMarkers.length) * 2 * Math.PI; // Угол смещения
    return [
        marker[0] + Math.cos(angle) * offsetMultiplier,
        marker[1] + Math.sin(angle) * offsetMultiplier
    ];
}


function spotUpdateMarkerSize() {
    const radius = getRadius(map.getZoom());
    for (const markerElem of  document.getElementsByClassName("marker")) {
        markerElem.style.width = `${radius}px`;
        markerElem.style.height = `${radius}px`;
    }
}

function spotFindNearbyMarkers(marker, allMarkers, threshold = 0.01) {
    return allMarkers.filter(otherMarker => {
        return (
            Math.abs(marker[0] - otherMarker[0]) < threshold &&
            Math.abs(marker[1] - otherMarker[1]) < threshold
        );
    });
}


function spotPlaceDataOnMap(data) {
    const radius = getRadius(map.getZoom());
    const allCoordinates = data.map(item => parseCoordinates(item.coords, config.mapCenter, config.spotOffsetForSpotNoCoords));

    data.forEach((dataItem, index) => {
        const { coords = '', title = '', about = '', img = '', link = '', kind = '' } = dataItem;
        const originalCoordinates = parseCoordinates(coords, config.mapCenter, config.spotOffsetForSpotNoCoords);
        const nearbyMarkers = spotFindNearbyMarkers(originalCoordinates, allCoordinates);
        const adjustedCoordinates = adjustMarkerPosition(originalCoordinates, index, nearbyMarkers);

        const markerElem = Object.assign(document.createElement('div'), {
            className: `marker marker-interest ${kind.trim()}`.trim(),
            style: `width: ${radius}px; height: ${radius}px;`});

        const markerPopupElem = Object.assign(document.createElement('div'), {
            className: 'popup'});

        if (title)
            markerPopupElem.appendChild(
                Object.assign(document.createElement('div'), {
                    className: 'popup-title',
                    innerHTML: isHTML(title) ? title : `<h3>${title}</h3>`}));

        if (kind.trim())
            markerPopupElem.classList.add(...kind.split(' '));

        if (img) {
            if (isHTML(img)) {
                markerPopupElem.appendChild(
                    Object.assign(document.createElement('div'), {
                        className: 'popup-img-container',
                        innerHTML: img,
                        style: {
                            backgroundColor: 'white' }}));

            } else {
                const [name, ext] = img.split('.');
                const imgSmallPath = `${config.spotPicsDirPath}/${name}-100px.${ext}`;
                const imgBigPath = `${config.spotPicsDirPath}/${name}-220px.${ext}`;

                markerElem.style.backgroundImage = `url('${imgSmallPath}\')`;

                markerPopupElem.appendChild(Object.assign(document.createElement('div'), {
                    className: 'popup-img-container',
                    innerHTML: `<img loading="lazy" alt="" src="${imgBigPath}">`
                }));
            }
        }

        if (about)
            markerPopupElem.appendChild(
                Object.assign(document.createElement('div'), {
                    className: 'popup-about',
                    innerHTML: isHTML(about) ? about : `<p>${about}</p>`}));

        if (link)
            markerPopupElem.appendChild(
                Object.assign(document.createElement('div'), {
                    className: 'popup-link',
                    innerHTML: isHTML(link) ? link : `<a href="${link}" target="_blank">${link}</a>`}));


        new mapboxgl.Marker(markerElem)
            .setLngLat(adjustedCoordinates)
            .setPopup(new mapboxgl.Popup({ offset: 50 }).setHTML(markerPopupElem.outerHTML))
            .addTo(map);
    });
}


function mapSetup() {
    // Default configuration
    const defaultConfig = {
        mapboxToken: '',
        mapStyle: 'mapbox://styles/mapbox/outdoors-v12',
        mapZoom: 12,
        mapCenter: [55.751746, 37.618117],
        spotDataYamlPath: 'data.yaml',
        spotOffsetForSpotNoCoords: 0.0025,
        spotPicsDirPath: 'imgs',
    };

    // Merge default and user-provided configuration
    const config = { ...defaultConfig, ...window.config };
    window.config = config; // Store the merged configuration globally

    try {
        // Validate critical configuration
        if (!config.mapboxToken?.trim()) {
            throw new Error("Token (mapboxgl.accessToken) is missing!");
        }

        // Set Mapbox access token
        mapboxgl.accessToken = config.mapboxToken;

        // Initialize and store the map instance
        window.map = new mapboxgl.Map({
            container: 'map',
            center: [...config.mapCenter].reverse(), // Reverse without mutating the original array
            zoom: config.mapZoom,
            style: config.mapStyle,
        });
    } catch (error) {
        Object.assign(document.createElement("div"), {
            className: "error-banner",
            textContent: error.message
        });
    }
}

function mapEventHandler(eventType, callbacks) {
    if (!Array.isArray(callbacks) || typeof map.on !== 'function') {
        throw new Error("Invalid input: Ensure 'callbacks' is an array and 'map' is a valid Mapbox instance.");
    }

    callbacks.forEach(callback => {
        if (typeof callback === 'function') {
            map.on(eventType, callback);
        } else {
            console.warn("Skipped a non-function callback:", callback);
        }
    });
}




//  🚀 RUN SETUP


async function fetchRoute(route) {
    try {
        // Выполняем fetch для получения данных из .gpx файла
        const response = await fetch(route.path);

        if (!response.ok) {
            throw new Error(`Ошибка при загрузке маршрута: ${route.path}`);
        }

        // Читаем ответ как текст
        const text = await response.text();

        // Парсим текст как XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");

        // Извлекаем все элементы trkpt
        const trkpts = xmlDoc.getElementsByTagName("trkpt");

        // Преобразуем их в массив объектов с нужными данными
        const points = Array.from(trkpts).map(trkpt => ({
            lat: trkpt.getAttribute("lat"),
            lon: trkpt.getAttribute("lon"),
            ele: trkpt.getElementsByTagName("ele")[0]?.textContent,
            time: trkpt.getElementsByTagName("time")[0]?.textContent
        }));

        // Возвращаем объект с данными
        return {
            path: route.path,
            title: route.title || 'Без названия',
            color: route.color,
            points: points
        };

    } catch (error) {
        console.error(`Ошибка при обработке маршрута ${route.path}: ${error.message}`);
        throw error; // выбрасываем ошибку, чтобы она была обработана в Promise.all
    }
}


function routesAllPlace(data){
    console.log('🐠 routesAllPlace:');

    data.forEach(function(route, index) {
        const coords = route.points.map(point => [point.lon, point.lat]);

        const width = 4;
        map.addLayer({
            id: route.path,
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
                            'coordinates': coords,
                            'type': 'LineString'
                        }
                    }]
                }
            },
            paint: {'line-color': route.color, 'line-width': width},
            layout: {'line-cap': 'round', 'line-join': 'round'}
        });

    });

}

function routesPlaceMap() {
    console.log('🐠 routesPlaceMap');

    const routePromises = config.routes.map(route => {
        console.log('Fetching route from path:', route.path);
        return fetchRoute(route);
    });

    Promise.all(routePromises)
        .then(results => {
            routesAllPlace(results);  // All fetches complete
        })
        .catch(error => {
            console.error(`Ошибка при обработке маршрутов: ${error.message}`);
        });
}


mapSetup();

// Fetch Spots
fetch(config.spotDataYamlPath)
    .then(response => response.text())
    .then(jsyaml.load)
    .then(spotPlaceDataOnMap)
    .catch(error => {
        console.error('Error processing the map data:', error);
    });

if (config.routes)
    routesPlaceMap();


/*

mapEventHandler('zoom', [
    () => spotUpdateMarkerSize()
]);

 */





