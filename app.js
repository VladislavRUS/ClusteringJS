var worker = new Worker('treeClustering.js');
var kMeansWorker = new Worker('kMeansClustering.js');
var closestWorker = new Worker('closestClustering.js');

var info = document.getElementById('info');
var mapStations = [];
var map = null, geoCollection = null;
var algorithm;

var canvas = document.getElementById('canvas');
var width = canvas.width = 4000;
var height = canvas.height = 1500;
var ctx = canvas.getContext('2d');

var shiftX = 5000;
var shiftY = 5300;

function getCostAndClustersNumber() {
    return {
        clustersNumber: document.getElementById('clustersNumber').value,
        stationCost: document.getElementById('stationCost').value,
        kmCost: document.getElementById('kmCost').value
    }
}

function startTree() {
    algorithm = 'Минимальное покрывающее дерево';

    clearCanvas();
    worker.postMessage({
        volumes: JSON.parse(JSON.stringify(volumes)),
        stations: JSON.parse(JSON.stringify(stations)),
        params: getCostAndClustersNumber()
    });
}

function startKMeans() {
    algorithm = 'K-Means';

    clearCanvas();
    kMeansWorker.postMessage({
        volumes: JSON.parse(JSON.stringify(volumes)),
        stations: JSON.parse(JSON.stringify(stations)),
        params: getCostAndClustersNumber()
    });
}

function startClosest() {
    algorithm = 'Ближайшая станция';

    clearCanvas();
    closestWorker.postMessage({
        volumes: JSON.parse(JSON.stringify(volumes)),
        stations: JSON.parse(JSON.stringify(stations)),
        params: getCostAndClustersNumber()
    });
}

function clearCanvas() {
    mapStations.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.rect(0, 0, canvas.width, canvas.height);
}

[worker, kMeansWorker, closestWorker].forEach(function (w) {
    w.onmessage = processEvent;
});

function showCanvas() {
    var res = $('#info').text();
    $('#result-block').show();
    $('.first-container').hide();
    $('#map').hide();
    $('.main-container').show();
    $('#result-text').text(res);
    $('#canvas').show();
    $('#charts').show();
}

function hideCanvas() {
    $('.first-container').show();
    $('#optimizations').show();
    $('#buttons-block').show();
    $('#result-block').hide();
    $('#info').hide();
    $('#progress-bar').hide();
    $('#canvas').hide();
    $('#charts').hide();
    $('#map').hide();
}

function showMap() {

    $('#map').show();

    if (map == null) {
        map = new ymaps.Map('map', {
            center: [53.11, 50.07],
            zoom: 5
        });
    }

    if (geoCollection == null) {
        geoCollection = new ymaps.GeoObjectCollection({}, {
            preset: 'twirl#blueIcon', //все метки красные
            draggable: false // и их можно перемещать
        });

        map.geoObjects.add(geoCollection);
    }

    geoCollection.removeAll();

    for (var i = 0; i < mapStations.length; i++) {
        var station = mapStations[i];
        var lat = +parseFloat(station.latitude.replace(',', '.')).toFixed(2);
        var lon = +parseFloat(station.longitude.replace(',', '.')).toFixed(2);

        var myPlacemark = new ymaps.Placemark([lat, lon], {
            balloonContent: station.name
        });

        geoCollection.add(myPlacemark);
    }
}

function processEvent(event) {
    switch (event.data.msg) {
        case 'tree':
        case 'shortest':
        case 'kmeans': {
            var components = JSON.parse(event.data.text);

            for (var i = 0; i < components.length; i++) {

                var station = components[i].station;

                drawRing(ctx, station, {color: 'orange', radius: 8});

                mapStations.push(station);

                var points = components[i].points;

                var randomColor = getRandomColor();

                points.forEach(function (p) {
                    drawCircle(ctx, p, {color: randomColor, radius: 5});
                    drawLine(ctx, p, station);
                });

                drawText(ctx, station, station.name, {textShiftX: 40, font: '15px Verdana'});
            }

            drawText(ctx, {x: 400 + shiftX, y: 70 + shiftY}, 'Алгоритм: ' + "'" + algorithm + "'", {font: '30px Verdana'});
            drawText(ctx, {x: 400 + shiftX, y: 100 + shiftY}, 'Количество кластеров: ' + components.length, {font: '20px Verdana'});
            var params = getCostAndClustersNumber();
            //drawText(ctx, {x: 400 + shiftX, y: 130 + shiftY}, 'Параметры: цена станции - ' + params.stationCost + ', количество заданных кластеров - ' + params.clustersNumber, {font: '20px Verdana'});
            drawText(ctx, {x: 400 + shiftX, y: 130 + shiftY}, 'Параметры: количество заданных кластеров - ' + params.clustersNumber, {font: '20px Verdana'});

            break;
        }

        case 'chart': {
            var distances = JSON.parse(event.data.text);
            var betweenCenters = {
                x: [],
                y: [],
                name: 'Среднее между центрами'
            };

            var inCluster = {
                x: [],
                y: [],
                name: 'Среднее внутри кластеров'
            };

            var cost = {
                x: [],
                y: [],
                name: 'Индекс ДБ * 100'
            };

            var sumDistance = {
                x: [],
                y: [],
                name: 'Суммарное расстояние'
            };

            var sumDistanceSize = {
                x: [],
                y: [],
                name: 'Суммарное расстояние с умножением на размер точки'
            };

            var idxOnly = {
                x: [],
                y: [],
                name: 'Индекс'
            };

            var averageInAverage = {
                x: [],
                y: [],
                name: 'Среднее по средним'
            };

            var averageInClusterK = {
                x: [],
                y: [],
                name: 'Среднее с умножением на К'
            };

            var averageInClusterN = {
                x: [],
                y: [],
                name: 'Среднее с умножением на среднее кол-во точек в кластере'
            };

            for (var i = 0; i < distances.length; i++) {
                betweenCenters.x.push(distances[i].numberOfClusters);
                betweenCenters.y.push(distances[i].betweenCenters);

                inCluster.x.push(distances[i].numberOfClusters);
                inCluster.y.push(distances[i].averageInCluster);

                cost.x.push(distances[i].numberOfClusters);
                cost.y.push(distances[i].idx * 100);

                sumDistance.x.push(distances[i].numberOfClusters);
                sumDistance.y.push(distances[i].sumDistance);

                sumDistanceSize.x.push(distances[i].numberOfClusters);
                sumDistanceSize.y.push(distances[i].sumDistanceSize);

                idxOnly.x.push(distances[i].numberOfClusters);
                idxOnly.y.push(distances[i].idx);

                averageInAverage.x.push(distances[i].numberOfClusters);
                averageInAverage.y.push(distances[i].averageInAverage);

                averageInClusterK.x.push(distances[i].numberOfClusters);
                averageInClusterK.y.push(distances[i].averageInCluster * distances[i].numberOfClusters);

                averageInClusterN.x.push(distances[i].numberOfClusters);
                averageInClusterN.y.push(distances[i].averageInCluster * distances[i].averageN);
            }

            var layout = {
                xaxis: {title: 'Количество кластеров'},
                yaxis: {title: 'Расстояние'},
                title: 'Исходные данные'
            };

            Plotly.newPlot('chart', [betweenCenters, inCluster, cost], layout);

            var layout1 = {
                xaxis: {title: 'Количество кластеров'},
                yaxis: {title: 'Расстояние'},
                title: 'Сумм. расст. от точек до центров их кластеров'
            };

            Plotly.newPlot('sum', [sumDistance], layout1);

            var layout2 = {
                xaxis: {title: 'Количество кластеров'},
                yaxis: {title: 'Расстояние'},
                title: 'Сумм. расст. от точек до центров их кл-в с умножением на размер точки'
            };
            Plotly.newPlot('sumSize', [sumDistanceSize], layout2);

            var layout3 = {
                xaxis: {title: 'Количество кластеров'},
                yaxis: {title: 'Расстояние'},
                title: 'Индекс ДВ'
            };
            Plotly.newPlot('idx', [idxOnly], layout3);

            var layout4 = {
                xaxis: {title: 'Количество кластеров'},
                yaxis: {title: 'Расстояние'},
                title: 'Среднее по средним'
            };
            Plotly.newPlot('averageInAverage', [averageInAverage], layout4);

            var layout6 = {
                xaxis: {title: 'Количество кластеров'},
                yaxis: {title: 'Расстояние'},
                title: 'Среднее в кластере с умножением на кол-во кластеров'
            };
            Plotly.newPlot('averageInClusterK', [averageInClusterK], layout6);

            var layout7 = {
                xaxis: {title: 'Количество кластеров'},
                yaxis: {title: 'Расстояние'},
                title: 'Среднее в кластере с умножением на среднее на кол-во точек'
            };
            Plotly.newPlot('averageInClusterN', [averageInClusterN], layout7);

            break;
        }
        case 'Result': {
            info.innerHTML = event.data.text;
            $('.determinate').width('100%');
            setTimeout(showCanvas, 1000);

            drawText(ctx, {x: 400 + shiftX, y: 160 + shiftY}, event.data.text, {font: '20px Verdana'});

            break;
        }

        default: {
            info.innerHTML = event.data.text;
            if (event.data.msg == 'to') {
                var percent = (event.data.last - event.data.first) * 50 / event.data.last;
                $('.determinate').width(percent + '%');
            }
            else if (event.data.msg == 'distance') {
                var percent = ((event.data.first) * 50 / event.data.last) + 50;
                $('.determinate').width(percent + '%');
            }
        }
    }
}

function drawCircle(ctx, point, params) {
    ctx.beginPath();
    ctx.fillStyle = 'black';
    var radius = params && params.radius || 3;
    ctx.arc(point.x - shiftX, canvas.height - (point.y - shiftY), radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = params && params.color || 'black';
    var radius = params && params.radius || 3;
    ctx.arc(point.x - shiftX, canvas.height - (point.y - shiftY), radius - 3, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
}

function drawRing(ctx, point, params) {
    ctx.beginPath();
    ctx.strokeStyle = params && params.color || 'black';
    ctx.lineWidth = 3;
    var radius = params && params.radius || 5;
    ctx.arc(point.x - shiftX, canvas.height - (point.y - shiftY), radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
}

function drawLine(ctx, from, to) {
    ctx.save();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(from.x - shiftX, canvas.height - (from.y - shiftY));
    ctx.lineTo(to.x - shiftX, canvas.height - (to.y - shiftY));
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function drawText(ctx, point, text, params) {
    ctx.font = params && params.font || '12px Verdana';
    ctx.fillStyle = 'black';
    var textShiftX = params && params.textShiftX || 0;
    var textShiftY = params && params.textShiftY || 0;
    ctx.fillText(text, point.x - shiftX + textShiftX, canvas.height - (point.y - shiftY) + textShiftY);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

