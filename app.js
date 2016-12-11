var worker = new Worker('treeClustering.js');
var kMeansWorker = new Worker('kMeansClustering.js');
var closestWorker = new Worker('closestClustering.js');

function getCostAndClustersNumber() {
    return {
        clustersNumber: document.getElementById('clustersNumber').value,
        stationCost: document.getElementById('stationCost').value
    }
}

function startTree() {
    clearCanvas();
    worker.postMessage({
        volumes: JSON.parse(JSON.stringify(volumes)),
        stations: JSON.parse(JSON.stringify(stations)),
        params : getCostAndClustersNumber()
    });
}

function startKMeans() {
    clearCanvas();
    kMeansWorker.postMessage({
        volumes: JSON.parse(JSON.stringify(volumes)),
        stations: JSON.parse(JSON.stringify(stations)),
        params : getCostAndClustersNumber()
    });
}

function startClosest() {
    clearCanvas();
    closestWorker.postMessage({
        volumes: JSON.parse(JSON.stringify(volumes)),
        stations: JSON.parse(JSON.stringify(stations)),
        params : getCostAndClustersNumber()
    });
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

var info = document.getElementById('info');

[worker, kMeansWorker, closestWorker].forEach(function(w) {
    w.onmessage = processEvent;
});

function showCanvas() {
    var res = $('#info').text();
    $('#result-block').show();
    $('.first-container').hide();
    $('.main-container').show();
    $('#result-text').text(res);
    $('#canvas').show();
    $('#chart').show();
}

function hideCanvas() {
    $('.first-container').show();
    $('#optimizations').show();
    $('#buttons-block').show();
    $('#result-block').hide();
    $('#info').hide();
    $('#progress-bar').hide();
    $('#canvas').hide();
    $('#chart').hide();
}

function processEvent(event) {

    switch (event.data.msg) {
        case 'tree':
        case 'shortest':
        case 'kmeans': {
            var cnt = 0;

            var components = JSON.parse(event.data.text);

            for (var i = 0; i < components.length; i++) {

                var station = components[i].station;
                cnt++;
                drawRing(ctx, station, { color: 'orange', radius: 8});
                drawText(ctx, station, station.name, { textShiftX: 20 });

                var points = components[i].points;

                var randomColor = getRandomColor();

                points.forEach(function(p) {
                    drawCircle(ctx, p, { color: randomColor, radius: 5 });
                    drawLine(ctx, p, station);
                });
            }
            break;
        }

        case 'chart': {
            var distances = JSON.parse(event.data.text);
            console.log(event.data.text);
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

            for (var i = 0; i < distances.length; i++) {
                betweenCenters.x.push(distances[i].result.numberOfClusters);
                betweenCenters.y.push(distances[i].result.betweenCenters);

                inCluster.x.push(distances[i].result.numberOfClusters);
                inCluster.y.push(distances[i].result.averageInCluster)
            }
            var layout = {
                xaxis: { title: 'Количество кластеров'},
                yaxis: { title: 'Расстояние'},
                title: 'Исходные данные'
            };

            Plotly.newPlot('chart', [betweenCenters, inCluster], layout);
            break;
        }

        case 'stations': {
            break;
        }

        default: {
            info.innerHTML = event.data.text;
            if (event.data.msg == 'to') {
                var percent = (event.data.last - event.data.first)*50/event.data.last;
                $('.determinate').width(percent + '%');
            }
            else if (event.data.msg == 'distance') {
                var percent = ((event.data.first)*50/event.data.last) + 50;
                $('.determinate').width(percent + '%');
            }
            else if (event.data.msg == 'Result') {
                $('.determinate').width('100%');
                setTimeout(showCanvas, 1000);
            }
        }
    }
};

var canvas = document.getElementById('canvas');
var width = canvas.width = 2000;
var height = canvas.height = 1700;
var ctx = canvas.getContext('2d');

var shiftX = 2000;
var shiftY = 3200;

function drawCircle(ctx, point, params) {
    ctx.beginPath();
    ctx.fillStyle = 'black';
    var radius = params && params.radius || 3;
    ctx.arc(point.x - shiftX, point.y - shiftY, radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = params && params.color || 'black';
    var radius = params && params.radius || 3;
    ctx.arc(point.x - shiftX, point.y - shiftY, radius - 3, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
}

function drawRing(ctx, point, params) {
    ctx.beginPath();
    ctx.strokeStyle = params && params.color || 'black';
    ctx.lineWidth = 3;
    var radius = params && params.radius || 5;
    ctx.arc(point.x - shiftX, point.y - shiftY, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
}

function drawLine(ctx, from, to) {
    ctx.save();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(from.x - shiftX, from.y - shiftY);
    ctx.lineTo(to.x - shiftX, to.y - shiftY);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function drawText(ctx, point, text, params) {
    ctx.font = params && params.font || '12px Verdana';
    ctx.fillStyle = 'black';
    var textShiftX = params && params.textShiftX || 0;
    var textShiftY = params && params.textShiftY || 0;
    ctx.fillText(text, point.x - shiftX + textShiftX, point.y - shiftY + textShiftY);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
