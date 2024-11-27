# 🗺 mapbox-adventure
Mapbox Adventure lets you design your own maps


https://andrewalevin.github.io/mapbox-adventure/


### Example usage

```html

<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>🗺 2 Moscow</title>
    <meta property="og:title" content="🗺 2 Moscow Map" />
    <meta property="og:description" content="🗺 2 Moscow Map Description" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="/maps2/moscow/" />
    <meta property="og:image" content="preview2.png" />

    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">

    <link href="https://andrewalevin.github.io/mapbox-adventure/src/style.css" rel="stylesheet">

    <link href="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css" rel="stylesheet">
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js"></script>


    <link href="https://andrewalevin.github.io/mapbox-adventure/src/cozyspots-v2.0.css" rel="stylesheet">

    <style>

    </style>
</head>

<body>
<div id="map"></div>

<script src="https://andrewalevin.github.io/mapbox-adventure/assets/js-yaml.min.js"></script>

<script src="https://unpkg.com/@turf/turf@6/turf.min.js"></script>


<script>
    let config = {
        mapboxToken: 'pk.eyJ1IjoiYW5kcmV3bGV2aW4iLCJhIjoiY2t5ZXM5c3cyMWJxYjJvcGJycmw0dGlyeSJ9.9QfCmimkyYicpprraBc-XQ',
    }
</script>

<script src="https://andrewalevin.github.io/mapbox-adventure/src/cozyspots-v2.0.js"></script>

</body>

</html>

```


### Yaml Example

```yaml
%YAML 1.2
---

- coords: 55.728324, 37.555595
  title: Дорогу утятам!
  about: Дорогу утятам! D
  img: utki.png

- coords: 55.742752, 37.612733
  title: ГЭС-2
  about: ГЭС-2 - D
  img: ges2.png
  link: https://andrewalevin.github.io/mapbox-adventure/
  kind: culture museum

- coords: 55.743758, 37.597320
  title: Музей А. С. Пушкина
  about: Музей А. С. Пушкина
  img: pushkin.png
  link: https://yandex.ru/maps/-/CDxtqN5l
  kind: museum

- coords: 55.746589, 37.605129
  title: Галерея искусства стран Европы и Америки XIX – XX веков
  about: Галерея искусства стран Европы и Америки XIX – XX веков
  img: gmii-galery.png
  link: https://yandex.ru/maps/-/CDxtqROY
  kind: culture museum

- coords: 55.747224, 37.605240
  title: ГМИИ

- coords: 55.738737, 37.596090
  title: |
    <h1>Музей И.С. Тургенева</h1>

  about: |
    <p><span style="color:#00acc1;">Описание музея Тургенева</span></p>
    <p><span style="color:#ab47bc;"><strong><u>Второе описание музея Тургенева</u></strong></span></p>
    <p><span style="color:#7cb342;"><i>Третее описание музея Тургенева</i></span></p>
  img: turgenev.png
  link: |
    <a href="https://yandex.ru/maps/-/CDxtqZ2U" style="color: green;">Музей Тургенева на Яндекс Картах</a>

- title: Перезвон кафе
  about: Перезвон кафе
  img: perezvon.png

- title: Cобор Петра и Павла
  about: Cобор Петра и Павла
  img: petra-pavla-cathidral.png

- coords: 55.735631, 37.624037
  title: Нитка чайная
  about: Нитка чайная
  img: nitka.png

- coords: 55.724326, 37.592946
  title: Андреевский мост

```