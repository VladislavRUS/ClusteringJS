var Util = {
    countComponentsDistance: function (components, volumes, stations, params) {
        var self = this;
        var cost = Util.getNumber(params && params.stationCost || 0);
        var totalSum = 0;

        components.forEach(function (c) {
            totalSum += self.countComponentDistance(c, volumes, stations, params, cost);
        });

        return {
            idx: self.countDBCoefficient(components),
            averageInCluster: Math.round(totalSum / components.length),
            betweenCenters: self.countAverageDistanceBetweenCenters(components),
            numberOfClusters: components.length,
            sumDistance: self.countSumDistance(components, stations, cost),
            cost: self.countCost(components, stations, cost),
            sumDistanceSize: self.countSumDistanceWithSize(components)
        }
    },

    projection: function(k, volumes, stations) {
        var self = this;

        var randomStationsIdx = [];

        console.log('0');
        console.log('Length: ' + stations.length);
        for (var i = 0; i < k; i++) {
            randomStationsIdx.push(Math.floor(Math.random() * (stations.length - 1 - i) + i));
        }
        randomStationsIdx.forEach(function(idx) {
            console.log(idx)
        });

        var componentObject = {};

        for (var i = 0; i < randomStationsIdx.length; i++) {
            componentObject[randomStationsIdx[i]] = {};
            componentObject[randomStationsIdx[i]].points = [];
        }

        var randomStations = [];
        for (var i = 0; i < randomStationsIdx.length; i++) {
            randomStations.push(stations[randomStationsIdx[i]]);
        }

        for (var i = 0; i < volumes.length; i++) {
            var point = volumes[i];
            var idx = self.findClosestStationForComponentCenter(point, randomStations);
            componentObject[randomStationsIdx[idx]].points.push(point);
        }

        for (var prop in componentObject) {
            if (componentObject.hasOwnProperty(prop)) {
                if (componentObject[prop].points.length == 0) {
                    delete componentObject[prop];
                }
            }
        }

        var components = [];
        for (var prop in componentObject) {
            if (componentObject.hasOwnProperty(prop)) {
                var component = {};
                component.points = [];

                for (var i = 0; i < componentObject[prop].points.length; i++) {
                    var p = componentObject[prop].points[i];
                    component.points.push(p);
                }

                component.center = self.findComponentCenter(component);
                component.station = stations[prop];

                components.push(component);
            }
        }

        console.log(components);
        return components;
    },

    countCost: function(components, stations, cost) {
        var self = this;
        var sumDistance = 0;
        var componentStations = [];

        for (var i = 0; i < components.length; i++) {
            var component = components[i];
            var center = self.findComponentCenter(component);
            var station = self.findClosestStationForComponentCenter(center, stations);
            componentStations.push(station);

            for (var j = 0; j < component.points.length; j++) {
                sumDistance += this.getDistanceBetweenTwoPoints(stations[station], component.points[j]);
            }
        }

        var uniqueStations = [];
        console.log('Stations before: ' +  componentStations.length);
        for (var i = 0; i < componentStations.length; i++) {
            if (uniqueStations.indexOf(componentStations[i]) == -1) {
                uniqueStations.push(componentStations[i]);
            }
        }

        console.log('Stations unique: ' + uniqueStations.length);

        return sumDistance + uniqueStations.length * cost;
    },

    countSumDistanceWithSize: function (components) {
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

    countSumDistance: function (components, stations) {
        var self = this;
        var sumDistance = 0;

        for (var i = 0; i < components.length; i++) {
            var component = components[i];
            var center = self.findComponentCenter(component);
            var station = self.findClosestStationForComponentCenter(center, stations);
            for (var j = 0; j < component.points.length; j++) {
                sumDistance += this.getDistanceBetweenTwoPoints(stations[station], component.points[j]);
            }
        }

        return sumDistance;
    },

    countDBCoefficient: function (components) {
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

    findMinDistance: function (arr, params) {
        var criteria = false;

        if (params.criteria == true) {
            criteria = true;
        }

        if (criteria) {
            var minIdx = arr[0].idx, idx = 0;
            for (var i = 1; i < arr.length; i++) {
                if (arr[i].idx < minIdx) {
                    minIdx = arr[i].idx;
                    idx = i;
                }
            }
        } else {
            var minCost = arr[0].cost, idx = 0;
            for (var i = 1; i < arr.length; i++) {
                if (arr[i].cost < minCost) {
                    minCost = arr[i].cost;
                    idx = i;
                }
            }
        }

        return {
            min: arr[idx],
            idx: idx
        };
    },

    countAverageDistanceBetweenCenters: function (components) {
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

    countAverageDistanceInCluster: function (cluster) {
        var center = this.findComponentCenter(cluster);
        var distances = [];

        for (var i = 0; i < cluster.points.length; i++) {
            distances.push(this.getDistanceBetweenTwoPoints(center, cluster.points[i]));
        }

        var sum = 0;
        for (var i = 0; i < distances.length; i++) {
            sum += distances[i];
        }

        return +(sum / distances.length).toFixed(2);
    },

    prepareResult: function (result, params) {

        var cost = params && params.stationCost || 0;
        var n = result.numberOfClusters;

        var averageDistance = 'Суммарное расстояние: ' + result.sumDistance + '. Количество кластеров: ' + n;
        var criteria = '. Критерий: ' + (params.criteria ? 'Индекс Дэвиса-Боулди (' + result.idx + ')' : ' Стоимость (' + (result.cost) +')');
        return averageDistance + criteria;
    }
};