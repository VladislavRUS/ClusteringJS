importScripts('util.js');

onmessage = function (event) {
    work(event.data.volumes, event.data.stations, event.data.params)
};

function dfs(idx, used, matrix, arr) {
    arr.push(idx);

    used[idx] = true;
    for (var i = 0; i < matrix[idx].length; i++) {
        if (matrix[idx][i] && !used[i]) {
            dfs(i, used, matrix, arr);
        }
    }
}

function findComponents(matrix, volumes) {
    var used = new Array(matrix.length);
    used.fill(false);

    var components = [];
    for (var i = 0; i < matrix[0].length; i++) {
        if (!used[i]) {
            var arr = [];
            dfs(i, used, matrix, arr);
            components.push(arr);
        }
    }

    var result = [];
    for (var i = 0; i < components.length; i++) {
        var component = {};
        component.points = [];

        for (var j = 0; j < components[i].length; j++) {
            component.points.push(volumes[components[i][j]]);
        }

        result.push(component);
    }
    return result;
}

function createTree(points) {
    var matrix = [];
    for (var i = 0; i < points.length; i++) {
        matrix[i] = [];
    }

    for (var i = 0; i < points.length; i++) {
        for (var j = 0; j < points.length; j++) {
            matrix[i][j] = 0;
        }
    }

    var from = [];
    from.push(0);

    var to = [];
    for (var i = 1; i < points.length; i++) {
        to.push(i)
    }

    while (to.length > 0) {
        var minDistance = Number.MAX_VALUE,
            fromIdx = -1, toIdx = -1;

        for (var i = 0; i < from.length; i++) {
            for (var j = 0; j < to.length; j++) {
                if (from[i] !== to[j] && !(containsEdge(from[i], to[j], matrix))) {
                    var p1 = points[from[i]];
                    var p2 = points[to[j]];
                    var distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                    if (distance < minDistance) {
                        minDistance = distance;
                        fromIdx = i;
                        toIdx = j;
                    }
                }
            }
        }

        matrix[from[fromIdx]][to[toIdx]] = minDistance;
        matrix[to[toIdx]][from[fromIdx]] = minDistance;

        from.push(to[toIdx]);
        to.splice(toIdx, 1);

        sendMessage('to', 'Вершин осталось: ' + to.length + '/' + points.length, to.length, points.length);
    }

    return matrix;
}

function containsEdge(from, to, edges) {
    return edges[from][to] || edges[to][from];
}

function work(volumes, stations, params) {
    Util.prepareData(volumes);
    Util.prepareData(stations);

    var matrix = createTree(volumes);

    var distances = [];

    if (params.clustersNumber == "") {
        for (var i = 5; i < 30; i++) {
            var matrixCopy = JSON.parse(JSON.stringify(matrix));
            removeLongestEdge(i, matrixCopy);

            var result = countTreeDistance(matrixCopy, volumes, stations, params);

            sendMessage('distance', 'Проверено ребер: ' + i + '/30', i, 30);

            distances.push(result);
        }
    } else {
        var clustersNumber = Util.getNumber(params.clustersNumber) - 1;
        var matrixCopy = JSON.parse(JSON.stringify(matrix));
        removeLongestEdge(clustersNumber, matrixCopy);

        var result = countTreeDistance(matrixCopy, volumes, stations, params);
        sendMessage('distance', 'Проверено ребер: ' + clustersNumber + '/30', clustersNumber, 30);
        distances.push(result);
    }

    sendMessage('chart', JSON.stringify(distances));

    var result = Util.findMinDistance(distances, params);

    removeLongestEdge(result.min.numberOfClusters - 1, matrix);
    var components = findComponents(matrix, volumes);

    var arr = [];

    for (var i = 0; i < components.length; i++) {
        var component = components[i];
        component.idx = i;
        component.center = Util.findComponentCenter(component, volumes);
        component.station = stations[Util.findClosestStationForComponentCenter(component.center, stations)];
    }

    sendMessage('tree', JSON.stringify(components));
    sendMessage('Result', Util.prepareResult(result.min, params));
}


function countTreeDistance(matrix, volumes, stations, params) {
    var components = findComponents(matrix, volumes);

    return Util.countComponentsDistance(components, volumes, stations, params);
}

function removeLongestEdge(edgesToDelete, edges) {
    for (var i = 0; i < edgesToDelete; i++) {
        var longest = 0, firstInd = -1, secondInd = -1;
        for (var k = 0; k < edges.length; k++) {
            for (var l = 0; l < edges.length; l++) {
                if (+edges[k][l] > longest) {
                    firstInd = k;
                    secondInd = l;
                    longest = +edges[k][l];
                }
            }
        }
        edges[firstInd][secondInd] = 0;
        edges[secondInd][firstInd] = 0;
    }
}

function sendMessage(msg, text, first=0, last=0) {
    postMessage({msg: msg, text: text, first: first, last: last});
}