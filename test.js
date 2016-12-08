function removeRepeat(arr) {
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr.length; j++) {
            var first = arr[i];
            var second = arr[j];

            if (i !== j && first.x == second.x && first.y == second.y) {
                arr.splice(j, 1);
            }
        }
    }
}

function prepareData(arr) {
    for (var i = 0; i < arr.length; i++) {
        arr[i].x = getNumber(arr[i].x);
        arr[i].y = getNumber(arr[i].y);

        if (arr[i].size) {
            arr[i].mass = getNumber(arr[i].size);
        }
    }
    removeRepeat(arr);
}

function makeTree() {
    volumes.splice(0, volumes.length - 400);

    prepareData(volumes);
    var dots = volumes;

/*
    for (var i = 0; i < volumes.length; i++) {
        for (var j = 0; j < volumes.length; j++) {
            if (i !== j && first.x == second.x && first.y == second.y) {
                console.log()
            }
        }
    }*/
   /* var dots = [];

    for (var i = 0; i < 100; i++) {
        dots.push({
            x: Math.floor(Math.random() * 600 + 100),
            y: Math.floor(Math.random() * 600 + 100)
        });
    }
*/
    var matrix = tree(dots);
    removeLongestEdge(20, matrix);
    var components = findComponents(matrix);

    components.forEach(function(c) {
        var center = findComponentCenter(c);
        console.log(center);
    });
    return;

    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix.length; j++) {
            if (matrix[i][j] > 0) {
                var from = dots[i];
                var to = dots[j];
                drawLine(ctx, from, to);
            }
        }
    }

    dots.forEach(function (dot, idx) {
        drawCircle(ctx, dot, {idx: idx});
    });

}

var canvas = document.getElementById('canvas');
var width = canvas.width = 5000;
var height = canvas.height = 5000;
var ctx = canvas.getContext('2d');

function drawCircle(ctx, point, params) {
    ctx.beginPath();
    ctx.fillStyle = params && params.color || 'black';
    var radius = params && params.radius || 3;
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();

    ctx.font = '14px Verdana';
    //ctx.fillText(params.idx, point.x - 10, point.y - 10);
}

function getNumber(str) {
    return str.indexOf(',') == -1 ? parseInt(str) : parseInt(str.substr(0, str.indexOf(',')));
}

function drawLine(ctx, from, to) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.closePath();
    ctx.stroke();
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

makeTree();

function tree(dots) {
    var matrix = [];
    for (var i = 0; i < dots.length; i++) {
        matrix[i] = [];
    }

    for (var i = 0; i < dots.length; i++) {
        for (var j = 0; j < dots.length; j++) {
            matrix[i][j] = 0;
        }
    }

    var from = [];
    from.push(0);

    var to = [];
    for (var i = 1; i < dots.length; i++) {
        to.push(i)
    }

    while (to.length > 0) {
        var minDistance = Number.MAX_VALUE,
            fromIdx = -1, toIdx = -1;

        for (var i = 0; i < from.length; i++) {
            for (var j = 0; j < to.length; j++) {
                if (from[i] !== to[j] && !(containsEdge(from[i], to[j], matrix))) {
                    var p1 = dots[from[i]];
                    var p2 = dots[to[j]];
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
    }

    return matrix;
}

function containsEdge(from, to, edges) {
    return edges[from][to] || edges[to][from];
}

function findComponents(matrix) {
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

    return components;
}

function dfs(idx, used, matrix, arr) {
    arr.push(idx);

    used[idx] = true;
    for (var i = 0; i < matrix[idx].length; i++) {
        if (matrix[idx][i] && !used[i]) {
            dfs(i, used, matrix, arr);
        }
    }
}

function findComponentCenter(component) {
    var c = component, xSum = 0, ySum = 0, massSum = 0;
    for (var i = 0; i < c.length; i++) {
        xSum += volumes[c[i]].x * volumes[c[i]].mass;
        ySum += volumes[c[i]].y * volumes[c[i]].mass;
        massSum += volumes[c[i]].mass;
    }

    return {
        x: (xSum / massSum),
        y: (ySum / massSum)
    }
}