importScripts('util.js');

onmessage = function(event) {
    startClosest(event.data.volumes, event.data.stations);
};

function startClosest(volumes, stations) {
    Util.prepareData(volumes);
    Util.prepareData(stations);

    var components = {};
    for (var i = 0; i < volumes.length; i++) {
        var volume = volumes[i];
        var closestStation = Util.findClosestStationForComponentCenter(volume, stations);
        if (!components[closestStation]) {
            components[closestStation] = [];
        }
        components[closestStation].push(volume);
    }

    var arr = [],
        cnt = 0;

    for (var s in components) {
        var component = {};
        component.idx = cnt++;
        component.station = stations[s];
        component.points = components[s];
        component.center = Util.findComponentCenter(component, volumes);

        arr.push(component);
    }

    sendMessage('shortest', JSON.stringify(arr));
    sendMessage('Result', 'Среднее расстояние: ' + (Util.countComponentsDistance(arr, volumes, stations)) + ', количество кластеров: ' + arr.length);
    sendMessage('stations', JSON.stringify(stations));
}

function sendMessage(msg, text) {
    postMessage({msg: msg, text: text});
}