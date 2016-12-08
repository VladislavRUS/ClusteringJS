var worker = new Worker('treeClustering.js');
var kMeansWorker = new Worker('kMeansClustering.js');
var closestWorker = new Worker('closestClustering.js');

function startWorker() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    worker.postMessage({volumes: JSON.parse(JSON.stringify(volumes)), stations: JSON.parse(JSON.stringify(stations))});
}

function startKMeans() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    kMeansWorker.postMessage({volumes: JSON.parse(JSON.stringify(volumes)), stations: JSON.parse(JSON.stringify(stations))});
}

function startClosest() {
    //ctx.clearRect(0, 0, canvas.width, canvas.height);
    closestWorker.postMessage({volumes: JSON.parse(JSON.stringify(volumes)), stations: JSON.parse(JSON.stringify(stations))});
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
}

function hideCanvas() {
    $('.first-container').show();
    $('#buttons-block').show();
    $('#result-block').hide();
    $('#info').hide();
    $('#progress-bar').hide();
    $('#canvas').hide();
}

var traces = [];

function processEvent(event) {

    switch (event.data.msg) {
        case 'tree':
        case 'shortest':
        case 'kmeans': {
            var d3 = Plotly.d3;

            var components = JSON.parse(event.data.text);

            for (var i = 0; i < components.length; i++) {
                var center = components[i].center;
                var trace = {
                    mode: 'markers',
                    x: [],
                    y: [],
                    marker: {
                        size: 15
                    },
                    name: 'C' + i
                };
                //drawCircle(ctx, center, { color: 'red', radius: 10});

                var station = components[i].station;
                var points = components[i].points;

                var randomColor = getRandomColor();

                var lineTrace = {
                    x: [],
                    y: [],
                    type: 'scatter',
                    line: {
                        width:1
                    },
                    color: 'black'
                };
                points.forEach(function(p) {
                    trace.x.push(p.x);
                    trace.y.push(p.y);

                    lineTrace.x.push(p.x);
                    lineTrace.x.push(center.x);
                    lineTrace.y.push(p.y);
                    lineTrace.y.push(center.y);

                    traces.push(lineTrace);
                    /*drawCircle(ctx, p, { color: randomColor });
                    drawLine(ctx, p, station);*/
                });

                traces.push(trace);
            }

            Plotly.newPlot('result', traces);
            break;
        }

        case 'stations': {
            var trace = {
                mode: 'markers',
                x: [],
                y: [],
                marker: {
                    size: 30
                },
                name: 'Stations'
            };
            var stations = JSON.parse(event.data.text);
            stations.forEach(function(s) {
                trace.x.push(s.x);
                trace.y.push(s.y);
                //drawCircle(ctx, s, { color: 'orange', radius: 8});
            });

            traces.push(trace);
            break;
        }

        default: {
            info.innerHTML = event.data.msg + ', ' + event.data.text;
            if (event.data.msg == 'to') {
                var percent = (event.data.last - event.data.first)*50/event.data.last;
                $('.determinate').width(percent + '%');
            }
            else if (event.data.msg == 'distance') {
                var percent = ((event.data.first)*50/event.data.last) + 50;
                $('.determinate').width(percent + '%');
            }
            else if (event.data.msg == '_result') {
                $('.determinate').width('100%');
                setTimeout(showCanvas, 1000);
            }
        }
    }
};

var canvas = document.getElementById('canvas');
var width = canvas.width = 1;
var height = canvas.height = 1;
var ctx = canvas.getContext('2d');

var shiftX = 2000;
var shiftY = 3200;

function drawCircle(ctx, point, params) {
    ctx.beginPath();
    ctx.fillStyle = params && params.color || 'black';
    var radius = params && params.radius || 3;
    /*ctx.arc(point.x, point.y , radius, 0, 2 * Math.PI);*/
    ctx.arc(point.x - shiftX, point.y - shiftY, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
}

function drawLine(ctx, from, to) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    /*ctx.moveTo(from.x, from.y );
    ctx.lineTo(to.x, to.y);*/
    ctx.moveTo(from.x - shiftX, from.y - shiftY);
    ctx.lineTo(to.x - shiftX, to.y - shiftY);
    ctx.closePath();
    ctx.stroke();
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}