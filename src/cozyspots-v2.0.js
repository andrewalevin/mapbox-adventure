

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


function mapProcess(data) {
    console.log('💙 mapProcess: ', data)

    const radius = getRadius(map.getZoom());
    for (const data_item of data) {
        const { coords = '', title = '', about = '', img = '' } = data_item;
        const item = {
            coordinates: coords,
            title: title,
            description: about,
            thumbnail: img,
        };

        const elem = document.createElement('div');
        elem.className = 'marker marker-interest';
        elem.style.width = `${radius}px`;
        elem.style.height = `${radius}px`;


        let img_content = '';
        if (item.thumbnail){
            const parts = item.thumbnail.split('.')
            const filename = `imgs/${parts[0]}-100px.${parts[1]}`;
            //elem.style.backgroundImage = `url('${config.root_url_debug}''${filename }\')`;
            elem.style.backgroundImage = `url('${config.root_url_debug}${filename}\')`;

            const img_url = `imgs/${parts[0]}-220px.${parts[1]}`;
            img_content = `<img loading="lazy" src="${config.root_url_debug}${img_url}" alt=""/>`;
        }


        const coordinates = item.coordinates.split(', ').reverse();

        let description = '';
        if (item.description)
            description = item.description;

        new mapboxgl.Marker(elem)
            .setLngLat(coordinates)
            .setPopup(
                new mapboxgl.Popup({
                    offset: 50
                })
                    .setHTML(
                        `<div class="popup">
           <h3>${item.title}</h3>
           <div class="popup-img-container">${img_content}</div>
           <p>${description}</p>
          </div>`
                    )
            )
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





