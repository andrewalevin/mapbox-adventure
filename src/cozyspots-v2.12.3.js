

function radiusLine(zoom){
    console.log('🔍 zoom: ', zoom);
    if (zoom > 12) return 12;
    if (zoom > 11) return 11;
    if (zoom > 10) return 10;
    if (zoom > 9) return 9;
    if (zoom > 8) return 8;
    if (zoom > 7) return 7;
    if (zoom > 6) return 6;
    if (zoom > 5) return 5;
    return 14;
}


function getRadius(zoom) {
    const radius = Math.max(3 * (zoom - 6) + 15, 15);
    console.log('🔍 1 - zoom:', zoom, 'radius: ', radius);
    return Math.round(radius + 2);
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
    for (const markerElem of  document.getElementsByClassName("marker-cozy-spot")) {
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


function appendLinksToPopup(markerPopupElem, links) {
    if (!links || !markerPopupElem) return;

    const createLinkElement = (link) => {
        if (isHTML(link)) {
            return link;
        }
        return `<a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a>`;
    };

    const generateInnerHTML = () => {
        if (typeof links === "string") {
            return createLinkElement(links);
        }

        if (Array.isArray(links)) {
            return links.map(createLinkElement).join('<br>'); // Separate links with line breaks
        }

        return '';
    };

    const innerHTML = generateInnerHTML();
    if (innerHTML) {
        const linkContainer = document.createElement('div');
        linkContainer.className = 'popup-link';
        linkContainer.innerHTML = innerHTML;
        markerPopupElem.appendChild(linkContainer);
    }
}


function appendAboutToPopup(markerPopupElem, about) {
    if (!about || !markerPopupElem) return;

    const createAboutElement = (content) => {
        const container = document.createElement('div');
        container.className = 'popup-about';
        container.innerHTML = isHTML(content) ? content : `<p>${content}</p>`;
        return container;
    };

    markerPopupElem.appendChild(createAboutElement(about));
}

function appendTitleToPopup(markerPopupElem, title) {
    if (!title || !markerPopupElem) return;

    const createTitleElement = (content) => {
        const container = document.createElement('div');
        container.className = 'popup-title';
        container.innerHTML = isHTML(content) ? content : `<h3>${content}</h3>`;
        return container;
    };

    markerPopupElem.appendChild(createTitleElement(title));
}

function addClassesToPopup(markerPopupElem, kind) {
    if (!kind?.trim() || !markerPopupElem) return;

    const classes = kind.split(' ').filter(Boolean); // Remove any empty strings
    markerPopupElem.classList.add(...classes);
}

function spotPlaceDataOnMap(data) {
    const radius = getRadius(map.getZoom());
    const allCoordinates = data.map(item => parseCoordinates(item.coords, config.mapCenter, config.spotOffsetForSpotNoCoords));

    data.forEach((dataItem, index) => {
        const { coords = '', title = '', about = '', img = '', links = '', kind = '' } = dataItem;
        const originalCoordinates = parseCoordinates(coords, config.mapCenter, config.spotOffsetForSpotNoCoords);
        const nearbyMarkers = spotFindNearbyMarkers(originalCoordinates, allCoordinates);
        const adjustedCoordinates = adjustMarkerPosition(originalCoordinates, index, nearbyMarkers);

        const markerElem = Object.assign(document.createElement('div'), {
            className: `marker marker-interest marker-cozy-spot ${kind.trim()}`.trim(),
            style: `width: ${radius}px; height: ${radius}px;`});

        const markerPopupElem = Object.assign(document.createElement('div'), {
            className: 'popup'});

        appendTitleToPopup(markerPopupElem, title);

        addClassesToPopup(markerPopupElem, kind);

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
                const imgSmallPath = `${config.imagesRoot}/${name}-120px.${ext}`;
                const imgBigPath = `${config.imagesRoot}/${name}-420px.${ext}`;

                markerElem.style.backgroundImage = `url('${imgSmallPath}\')`;

                markerPopupElem.appendChild(Object.assign(document.createElement('div'), {
                    className: 'popup-img-container',
                    innerHTML: `<img loading="lazy" alt="" src="${imgBigPath}">`
                }));
            }
        }

        appendAboutToPopup(markerPopupElem, about);

        appendLinksToPopup(markerPopupElem, links);

        new mapboxgl.Marker(markerElem)
            .setLngLat(adjustedCoordinates)
            .setPopup(new mapboxgl.Popup({
                offset: 50,
                className: 'popup-spot',
            }).setHTML(markerPopupElem.outerHTML))
            .addTo(map);
    });
}


function mapSetup(urlParams) {
    // Default configuration
    const defaultConfig = {
        mapboxToken: '',
        mapStyle: 'mapbox://styles/mapbox/outdoors-v12',
        mapZoom: 8,
        mapCenter: [55.675887, 37.585792],
        spotDataYamlPath: 'spots.yaml',
        spotOffsetForSpotNoCoords: 0.0025,
        imagesRoot: 'images',
        routesRoot: 'routes',
        lineWidth: 3,
        lineWidthMax: 7
    };


    // Merge default and user-provided configuration
    window.config = { ...defaultConfig, ...window.config };

    console.log('🛠🐝 CONFIG: ', config);

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
            center: (!isNaN(urlParams.lat) && !isNaN(urlParams.lon)) ? [urlParams.lon, urlParams.lat] : config.mapCenter.reverse(),
            zoom: !isNaN(urlParams.zoom) ? urlParams.zoom : config.mapZoom,
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
    console.log('🎃 fetchRoute: ', route);

    try {
        const url = config.routesRoot + '/' + route.path;
        console.log('url: ', url);

        const response = await fetch(url);

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

        console.log('🍋 Points: ');
        console.log(points);

        // Возвращаем объект с данными
        return {
            path: route.path,
            title: route.title || '',
            color: route.color,
            width: route.width,
            links: route.links,
            points: points
        };

    } catch (error) {
        console.error(`Ошибка при обработке маршрута ${route.path}: ${error.message}`);
        throw error; // выбрасываем ошибку, чтобы она была обработана в Promise.all
    }
}


const routeClickBoxTemplate = `
  <div class="card">
    <h3>{{title}}</h3>
    <h4>{{distance}} km</h4>
    <p><a href="{{link_gpx_href}}" target="_blank">Download GPX</p>
  </div>
`;


function routePlaceOnMap(route){
    console.log('📌 routePlaceOnMap:');
    console.log(route.title);

    const coordsRoute = route.points.map(point => [parseFloat(point.lon), parseFloat(point.lat)]);
    const lineWidth = route?.width ?? config.lineWidth;

    const lineStringRoute = turf.lineString(coordsRoute);

    const distanceRoute = Math.trunc(turf.lineDistance(lineStringRoute));

    const bboxRoute = turf.bbox(lineStringRoute);

    const routeLayerId = 'route-' + route.path;
    const sourceRouteId = 'source-' + routeLayerId;

    map.addSource(sourceRouteId, {
        type: 'geojson',
        lineMetrics: true,
        data: {
            'type': 'FeatureCollection',
            'features': [{
                'type': 'Feature',
                'geometry': {'coordinates': coordsRoute, 'type': 'LineString'}
            }]
        }
    });

    map.addLayer({
        id: routeLayerId,
        type: 'line',
        source: sourceRouteId,
        paint: {
            'line-color': route.color,
            'line-width': lineWidth
        },
        layout: {'line-cap': 'round', 'line-join': 'round'}
    });

    const paddingRouteLayerId = 'padding-route-' + route.path;
    const paddingWidth = 30;
    map.addLayer({
        id: paddingRouteLayerId,
        type: 'line',
        source: sourceRouteId,
        paint: {
            'line-color': 'rgba(0, 0, 0, 0)', // Fully transparent
            'line-width': lineWidth + paddingWidth
        },
        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        }
    });

    map.on('mousemove', paddingRouteLayerId, () => {
        map.setPaintProperty(routeLayerId, 'line-width', config.lineWidthMax);
    });

    map.on('mouseleave', paddingRouteLayerId, () => {
        map.setPaintProperty(routeLayerId, 'line-width', lineWidth);
    });


    let additionalInfo = '';
    if (config.debug)
        additionalInfo += '<small>' +
            'minlat=' + bboxRoute[1] + '&<br>' +
            'minlon=' + bboxRoute[0] + '&<br>' +
            'maxlat=' + bboxRoute[3] + '&<br>' +
            'maxlon=' + bboxRoute[2] + '</small>';

    map.on('click', paddingRouteLayerId, function(e) {
        if (e.originalEvent.target.closest('.mapboxgl-marker'))
            return;

        console.log('🌍 CLICK');

        const card = document.createElement('div');
        card.className = 'card';

        card.appendChild(Object.assign(
            document.createElement('h3'), { textContent: route.title }));

        card.appendChild(Object.assign(
            document.createElement('h4'), { textContent: `${distanceRoute} km` }));

        if (route.links) {
            const linksArray = [].concat(route.links);

            linksArray.forEach(link => {
                const linkP = document.createElement('p');
                linkP.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
                card.appendChild(linkP);
            });
        }

        const link = Object.assign(
            document.createElement('a'), {
                href: route.path,
                target: '_blank',
                textContent: 'Download GPX'
            });

        const paragraph = document.createElement('p');
        paragraph.appendChild(link);
        card.appendChild(paragraph);

        if (additionalInfo)
            card.appendChild(Object.assign(
                document.createElement('p'), { innerHTML: additionalInfo }));


        new mapboxgl.Popup({offset: 10, className: 'popup-route'})
            .setLngLat(e.lngLat)
            .setHTML(card.innerHTML)
            .addTo(map);
    });
}


function routesAllPlaceMap() {
    console.log('🐠👺 routesPlaceMap');

    config.routes.forEach(route => {
        console.log('Fetching route from path:', route.path);

        fetchRoute(route)
            .then(fetchedRoute => {
                if (fetchedRoute) {
                    routePlaceOnMap(fetchedRoute);
                }
            })
            .catch(error => {
                console.error(`❌ Ошибка при загрузке маршрута ${route.path}: ${error.message}`);
            });
    });

    console.log('✅ Запущен процесс загрузки маршрутов.');
}

function placeSpotOnMap(dataItem) {
    const { coords = '', title = '', about = '', img = '', links = '', kind = '' } = dataItem;
    const originalCoordinates = parseCoordinates(coords, config.mapCenter, config.spotOffsetForSpotNoCoords);

    const nearbyMarkers = spotFindNearbyMarkers(originalCoordinates, allCoordinates);
    const adjustedCoordinates = adjustMarkerPosition(originalCoordinates, index, nearbyMarkers);

    addMarkerToMap(adjustedCoordinates, title, about, img, links, kind);
}

function spotsPlaceMap2() {
    console.log('🦋 spotsPlaceMap() config.spotDataYamlPath: ', config.spotDataYamlPath);

    fetch(config.spotDataYamlPath)
        .then(response => response.text())
        .then(jsyaml.load)
        .then(data => {
            const radius = getRadius(map.getZoom());
            const allCoordinates = data.map(item =>
                parseCoordinates(item.coords, config.mapCenter, config.spotOffsetForSpotNoCoords)
            );

            data.forEach((dataItem, index) => placeSpotOnMap(dataItem));
        })
        .catch(error => {
            console.error('Error processing the map data:', error);
        });
}

function spotsAllPlaceMap(){
    console.log('🦋 spotsPlaceMap() config.spotDataYamlPath: ', config.spotDataYamlPath);

    try {
        fetch(config.spotDataYamlPath)
            .then(response => response.text())
            .then(jsyaml.load)
            .then(spotPlaceDataOnMap)
            .catch(error => {
                console.error('Error processing the map data:', error);
            });
    } catch (error) {
        console.error('Unexpected error:', error);
    }

}

function parseUrlParams(urlOrParams, paramList) {
    if (!urlOrParams.startsWith('?'))
        return {}

    const params = new URLSearchParams(urlOrParams);

    const result = {};

    paramList.forEach(param => {
        const value = params.get(param);
        if (value !== null) {
            result[param] = isNaN(value) ? value : (value.includes('.') ? parseFloat(value) : parseInt(value, 10));
        }
    });

    return result;
}


const urlParamsNames = ['lon', 'lat', 'zoom', 'minlat', 'minlon', 'maxlat', 'maxlon', 'segment']
const urlParams = parseUrlParams(window.location.search, urlParamsNames);
console.log('🥗 urlParams: \n', urlParams);

mapSetup(urlParams);

if (config.routes)
    routesAllPlaceMap();

spotsAllPlaceMap();

const segmentsList = {
    'z0': {
        'path': 'mars.gpx',
        'southwest': {
            'lat': 55.58488,
            'lon': 36.41636
        },
        'northeast': {
            'lat': 55.62753,
            'lon': 36.58957
        }
    },
    'z1': {
        'southwest': {
            'lat': 55.71145,
            'lon': 36.79049
        },
        'northeast': {
            'lat': 55.73516,
            'lon': 36.85897
        }
    }
};

map.on('load', () => {
    console.log('🥗🥗 urlParams: \n', urlParams);
    console.log("🗺🗺🗺🗺🗺🗺 Map fully loaded!");

    let boundsFit = [];
    const lonDelta = 0.02;
    const latDelta = 0.02;
    let layerIdSetLineWidth = '';

    if(urlParams?.segment && segmentsList[urlParams.segment]){
        const segment = segmentsList[urlParams.segment];

        boundsFit = [
            [segment.southwest.lon - lonDelta, segment.southwest.lat - latDelta],
            [segment.northeast.lon + lonDelta, segment.northeast.lat + latDelta],
        ]

        layerIdSetLineWidth = 'route-' + segment.path;
    }

    if(!isNaN(urlParams.minlat) && !isNaN(urlParams.minlon) && !isNaN(urlParams.maxlat) && !isNaN(urlParams.maxlon))
        boundsFit = [
            [parseFloat(urlParams.minlon) - lonDelta, parseFloat(urlParams.minlat) - latDelta], // Southwest corner
            [parseFloat(urlParams.maxlon) + lonDelta, parseFloat(urlParams.maxlat) + latDelta]  // Northeast corner
        ];

    if (boundsFit)
        setTimeout(() => {
            map.fitBounds(boundsFit, {
                padding: 20,
                duration: 2000,
                maxZoom: 15
            });
        }, 1000);

    if (layerIdSetLineWidth)
        setTimeout(() => {
            map.setPaintProperty(layerIdSetLineWidth, 'line-width', config.lineWidthMax);
        }, 3000);
});


mapEventHandler('zoom', [
    () => spotUpdateMarkerSize()
]);







