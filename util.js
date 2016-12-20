var Util = {
    countComponentsDistance: function (components, volumes, stations, params) {
        var self = this;
        var cost = Util.getNumber(params && params.stationCost || 0);
        var kmCost = Util.getNumber(params && params.kmCost || 1);
        var totalSum = 0;

        var idx = self.countDBCoefficient(components);

        components.forEach(function (c) {
            totalSum += self.countComponentDistance(c, volumes, stations, params, cost);
        });

        return {
            idx: idx,
            averageInCluster: Math.round(totalSum / components.length),
            betweenCenters: self.countAverageDistanceBetweenCenters(components),
            numberOfClusters: components.length,
            sumDistance: self.countSumDistance(components),
            sumDistanceSize: self.countSumDistanceWithSize(components),
            averageInAverage: self.countAverageInAverage(components),
            averageN: self.countAverageN(components)
        }
    },

    countAverageN: function(components) {
        var totalPoints = 0;
        for (var i = 0; i < components.length; i++) {
            totalPoints += components[i].points.length;
        }

        return totalPoints/components.length;
    },

    countAverageInAverage: function(components) {
        var self = this;
        var averageInClusters = 0;

        components.forEach(function(component) {
            var center = self.findComponentCenter(component);

            var distance = 0;
            for (var i = 0; i < component.points.length; i++) {
                distance += self.getDistanceBetweenTwoPoints(center, component.points[i]);
            }
            averageInClusters += (distance / component.points.length);
        });

       return averageInClusters/components.length;
    },

    countSumDistanceWithSize: function(components) {
        var sumDistance = 0;

        for (var i = 0; i < components.length; i++) {
            var component = components[i];
            var center = this.findComponentCenter(component);
            for (var j = 0; j < component.points.length; j++) {
                sumDistance += this.getDistanceBetweenTwoPoints(center, component.points[j]) * Util.getNumber(component.points[j].size);
            }
        }

        return sumDistance;
    },

    countSumDistance: function(components) {
        var sumDistance = 0;

        for (var i = 0; i < components.length; i++) {
            var component = components[i];
            var center = this.findComponentCenter(component);
            for (var j = 0; j < component.points.length; j++) {
                sumDistance += this.getDistanceBetweenTwoPoints(center, component.points[j]);
            }
        }

        return sumDistance;
    },

    countDBCoefficient: function(components) {
        var self = this;
        var max = [];

        for (var i = 0; i < components.length; i++) {
            var current = components[i];
            var idxArr = [];

            for (var j = 0; j < components.length; j++) {
                if (i !== j) {
                    var firstAverageDistanceInCluster = self.countAverageDistanceInCluster(current);
                    var secondAverageDistanceInCluster = self.countAverageDistanceInCluster(components[j]);

                    var firstCenter = self.findComponentCenter(current);
                    var secondCenter = self.findComponentCenter(components[j]);

                    var distanceBetweenClusters = self.getDistanceBetweenTwoPoints(firstCenter, secondCenter);

                    var result = (firstAverageDistanceInCluster + secondAverageDistanceInCluster) / distanceBetweenClusters;
                    idxArr.push(+result.toFixed(2));
                }
            }

            var maxIdx = 0;
            for (var k = 0; k < idxArr.length; k++) {
                if (idxArr[k] > maxIdx) {
                    maxIdx = idxArr[k];
                }
            }

            max.push(maxIdx);
        }

        var sum = 0;
        for (var i = 0; i < max.length; i++) {
            sum += max[i];
        }

        return +(sum / components.length).toFixed(2);
    },

    countComponentDistance: function (component, volumes, stations) {
        var center = this.findComponentCenter(component, volumes);
        var station = stations[this.findClosestStationForComponentCenter(center, stations)];

        var componentDistance = 0;
        for (var i = 0; i < component.points.length; i++) {
            componentDistance += this.getDistanceBetweenTwoPoints(component.points[i], station);
        }

        return (componentDistance / component.points.length);
    },

    getDistanceBetweenTwoPoints: function (p1, p2) {
        return Util.getNumber(Math.round(Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))));
    },

    findClosestStationForComponentCenter: function (center, stations) {
        var minDistance = Number.MAX_VALUE,
            idx = -1;

        for (var i = 0; i < stations.length; i++) {
            var distance = this.getDistanceBetweenTwoPoints(stations[i], center);
            if (distance < minDistance) {
                minDistance = distance;
                idx = i;
            }
        }

        return idx;
    },

    findComponentCenter: function (component) {
        var points = component.points, xSum = 0, ySum = 0, massSum = 0;
        for (var i = 0; i < points.length; i++) {
            xSum += points[i].x * points[i].mass;
            ySum += points[i].y * points[i].mass;
            massSum += points[i].mass;
        }

        return {
            x: (xSum / massSum),
            y: (ySum / massSum)
        }
    },

    getNumber: function (str) {
        if (!isNaN(str)) {
            return Math.round(str);
        }
        return str.indexOf(',') == -1 ? parseInt(str) : parseInt(str.substr(0, str.indexOf(',')));
    },

    prepareData: function (arr) {
        for (var i = 0; i < arr.length; i++) {

            arr[i].x = this.getNumber(arr[i].x);
            arr[i].y = this.getNumber(arr[i].y);

            if (arr[i].size) {
                arr[i].mass = this.getNumber(arr[i].size);
            }
        }
        this.removeRepeat(arr);
    },

    removeRepeat: function (arr) {
        for (var i = 0; i < arr.length; i++) {
            for (var j = 0; j < arr.length; j++) {
                var first = arr[i];
                var second = arr[j];

                if (i !== j && first.x == second.x && first.y == second.y) {
                    arr.splice(j, 1);
                }
            }
        }
    },

    findMinDistance: function (arr) {

        var minIdx = arr[0].idx, idx = 0;
        for (var i = 1; i < arr.length; i++) {
            if (arr[i].idx < minIdx) {
                minIdx = arr[i].idx;
                idx = i;
            }
        }
        return {
            min: arr[idx],
            idx: idx
        };
    },

    countAverageDistanceBetweenCenters: function(components) {
        var distance = 0, cnt = 0;
        for (var i = 0; i < components.length; i++) {
            var firstCenter = this.findComponentCenter(components[i]);

            for (var j = i; j < components.length; j++) {
                var secondCenter = this.findComponentCenter(components[j]);
                distance += this.getDistanceBetweenTwoPoints(firstCenter, secondCenter);
                cnt++;
            }
        }

        return Math.round(distance / cnt);
    },

    countAverageDistanceInCluster: function(cluster) {
        var center = this.findComponentCenter(cluster);
        var distances = [];

        for (var i = 0; i < cluster.points.length; i++) {
            distances.push(this.getDistanceBetweenTwoPoints(center, cluster.points[i]));
        }

        var sum = 0;
        for (var i = 0; i < distances.length; i++) {
            sum += distances[i];
        }

        return +(sum/distances.length).toFixed(2);
    },

    prepareResult: function(result, params) {

        var cost = params && params.stationCost || 0;
        var kmCost = params && params.kmCost || 1;
        var av = result.averageInCluster;
        var n = result.numberOfClusters;

        var averageDistance = 'Среднее расстояние в кластере: ' + av + '. ';
        var totalDistance = 'Суммарное расстояние: ' + av + ' * ' + n + ' = ' + av * n + '. ';
        //var totalCost = 'Затраты: ' + av * n + ' * ' + kmCost + ' + ' + n  + ' * ' + cost + ' = ' + (av * n * kmCost + n * cost) + '. ';
        var totalCost = '';
        return averageDistance + totalDistance + totalCost;
    }
};