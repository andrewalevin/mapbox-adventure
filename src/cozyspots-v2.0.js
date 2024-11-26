

mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kcmV3bGV2aW4iLCJhIjoiY2t5ZXM5c3cyMWJxYjJvcGJycmw0dGlyeSJ9.9QfCmimkyYicpprraBc-XQ';


const map = new mapboxgl.Map({
    container: 'map',
    center: config.map.center,
    zoom: config.map.zoom,
    style: config.map.style,
});

console.log('💚 START');

console.log('💚 config.data_path: ', config.data_path);


// file:///Users/andrewlevin/Desktop/mapbox-adventure/sandbox/index.html

fetch(config.data_path)
    .then((response) => {
        return response.text();
    })
    .then((text) => {
        return jsyaml.load(text);
    })
    .then((data) => {
        mapProcess(data);
    });

function getRadius(zoom) {
    let radius = 9 * (zoom - 9);
    if (radius < 10)
        radius = 10;
    return radius.toFixed(0)
}


function isHTML(str) {
    const doc = new DOMParser().parseFromString(str, "text/html");
    return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
}

function parseCoordinates(input, defaultCoords = [0, 0], offsetMultiplier = 0.001) {
    // Helper to generate random offset

    // Regular expression to match valid coordinate formats
    const coordRegex = /^\s*(-?\d+(\.\d+)?)\s*[,\s]\s*(-?\d+(\.\d+)?)\s*$/;

    // Attempt to parse input
    const match = input.match(coordRegex);
    if (match) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[3]);
        return [lat, lon];
    }

    console.log('☢️ No coordinates found');

    const getRandomOffset = () => (Math.random() * 2 - 1) * offsetMultiplier;

    defaultCoords = defaultCoords.reverse();

    return [
        defaultCoords[0] + getRandomOffset(),
        defaultCoords[1] + getRandomOffset(),
    ];
}

function mapProcess(data) {
    console.log('💙 mapProcess: ', data)

    const radius = getRadius(map.getZoom());
    for (const data_item of data) {
        const { coords = '', title = '', about = '', img = '', link = ''} = data_item;
        const item = {
            coordinates: coords,
            title: title,
            about: about,
            thumbnail: img,
            link: link,
        };


        const marker_elem = document.createElement('div');
        marker_elem.className = 'marker marker-interest';
        marker_elem.style.width = `${radius}px`;
        marker_elem.style.height = `${radius}px`;

        const popup_elem = document.createElement('div');
        popup_elem.className = 'popup';

        if (item.title) {
            const title_elem = document.createElement('div');
            title_elem.className = 'popup-title';
            if (isHTML(item.title)) {
                title_elem.innerHTML = item.title;
            }else {
                title_elem.appendChild(
                    Object.assign(document.createElement('h3'), {textContent: item.title}));
            }
            popup_elem.appendChild(title_elem);
        }


        if (item.thumbnail) {
            const thumbnail_elem = document.createElement('div');
            thumbnail_elem.className = 'popup-img-container';

            if (isHTML(item.thumbnail)) {
                thumbnail_elem.innerHTML = item.thumbnail;
                marker_elem.style.backgroundColor = 'white';
            } else {

                const parts = item.thumbnail.split('.');

                const img_small_path = `${config.root_url_debug}${config.imgs_folder}/${parts[0]}-100px.${parts[1]}`;
                const img_big_path = `${config.root_url_debug}${config.imgs_folder}/${parts[0]}-220px.${parts[1]}`;

                marker_elem.style.backgroundImage = `url('${img_small_path}\')`;

                const img_elem = document.createElement('img');
                img_elem.loading='lazy';
                img_elem.alt='';
                img_elem.src = img_big_path;

                thumbnail_elem.appendChild(img_elem);
            }
            popup_elem.appendChild(thumbnail_elem);
        }

        if (item.about){
            const about_elem = document.createElement('div');
            about_elem.className = 'popup-about';
            if (isHTML(item.about)) {
                about_elem.innerHTML = item.about;
            }else {
                about_elem.appendChild(
                    Object.assign(document.createElement('p'), {textContent: item.about}));
            }
            popup_elem.appendChild(about_elem);
        }

        if (item.link){
            console.log('💘 LINK: ', item.link);

            const link_elem = document.createElement('div');
            link_elem.className = 'popup-link';

            if (isHTML(item.link)) {
                link_elem.innerHTML = item.link;
            }else {
                const a_block = Object.assign(document.createElement('a'), {
                    href: item.link,
                    textContent: item.link});
                link_elem.appendChild(a_block);
            }
            popup_elem.appendChild(link_elem);
        }


        new mapboxgl.Marker(marker_elem)
            .setLngLat(
                parseCoordinates(item.coordinates, config.map.center, 0.0001).reverse())
            .setPopup(
                new mapboxgl.Popup({
                    offset: 50
                }).setHTML(popup_elem.outerHTML))
            .addTo(map);
    }
}


function changeSizeByZoom(map, className, zoomFunction, ){

}

map.on('zoom', () => {
    const radius = getRadius(map.getZoom());

    for (const elem of document.getElementsByClassName("marker")) {
        elem.style.width = `${radius}px`;
        elem.style.height = `${radius}px`;
    }
});


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





