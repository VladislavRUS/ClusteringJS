importScripts('util.js');

onmessage = function(event) {
    startProjection(event.data.volumes, event.data.stations, event.data.params);
};

function startProjection(volumes, stations, params) {
    Util.prepareData(volumes);
    Util.prepareData(stations);

    var componentsArr = [];
    var distances = [];


    for (var i = 5; i < 50; i++) {
        var components = Util.projection(i, volumes, stations);
        componentsArr.push(components);
        var result = Util.countComponentsDistance(components, volumes, stations, params);
        distances.push(result);
    }

    sendMessage('chart', JSON.stringify(distances));

    var bestDistance = Util.findMinDistance(distances, params);
    var components = componentsArr[bestDistance.idx];
    sendMessage('projection', JSON.stringify(components));
    sendMessage('Result', Util.prepareResult(bestDistance.min, params));

    console.log(bestDistance);
}

function sendMessage(msg, text, first=0, last=0) {
    postMessage({msg: msg, text: text, first: first, last: last});
}
