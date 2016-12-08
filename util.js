var Util = {
    countComponentsDistance: function (components, volumes, stations) {
        var self = this;

        var totalSum = 0;
        components.forEach(function (c) {
            totalSum += self.countComponentDistance(c, volumes, stations);
        });
        return totalSum / components.length;
    },

    countComponentDistance: function (component, volumes, stations) {
        var center = this.findComponentCenter(component, volumes);
        var station = stations[this.findClosestStationForComponentCenter(center, stations)];

        var componentDistance = 0;
        for (var i = 0; i < component.points.length; i++) {
            componentDistance += this.getDistanceBetweenTwoPoints(component.points[i], station);
        }

        return componentDistance / (component.points.length);
    },

    getDistanceBetweenTwoPoints: function (p1, p2) {
        return Math.round(Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)));
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
        var minDistance = Number.MAX_VALUE, clusters = -1;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].distance < minDistance) {
                minDistance = arr[i].distance;
                clusters = arr[i].clusters;
            }
        }
        return {
            distance: minDistance,
            clusters: clusters
        }
    }
};