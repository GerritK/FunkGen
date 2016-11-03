(function () {
    var app = angular.module('funk-gen', []);

    app.run(function ($http) {
        $http.get('assets/data/messages.json').then(function (result) {
            data.messages = result.data;
        });
        $http.get('assets/data/cities.json').then(function (result) {
            data.cities = result.data;
        });
        $http.get('assets/data/streets.json').then(function (result) {
            data.streets = result.data;
        });
        $http.get('assets/data/names.json').then(function (result) {
            data.names = result.data;
        });
    });

    app.controller('MainController', function () {
        this.vehicles = vehicles;
        this.messages = messages;
    });

    app.controller('VehicleConfigController', function () {
        this.vehicles = vehicles;

        this.submitVehicle = function () {
            this.addVehicle(this.vehicleName, this.vehicleNumber);
            this.vehicleName = "";
            this.vehicleNumber = "";
            $('#vehicleName').focus();
        };

        this.addVehicle = function (name, number) {
            this.vehicles.push({
                name: name,
                number: number
            });
            messages.length = 0;
        };

        this.removeVehicle = function (index) {
            this.vehicles.splice(index, 1);
            messages.length = 0;
        };
    });

    app.controller('ConfigurationController', function ($scope) {
        this.config = config;
        $scope.$watch(function () {
            return config;
        }, function () {
            messages.length = 0;
        }, true);
    });

    app.controller('GenerateController', function (MessageService) {
        this.canGenerate = function () {
            if(vehicles.length == 0) {
                return false;
            }

            if(!angular.isNumber(config.delay)) {
                return false;
            }

            if(!angular.isNumber(config.interval)) {
                return false;
            }

            if(!angular.isNumber(config.duration) || config.duration < (config.delay + config.interval)) {
                return false;
            }

            return true;
        };

        this.generate = function () {
            var messageCount = Math.floor((config.duration - config.delay) / config.interval);
            var maxMessagesPerVehicle = Math.ceil(messageCount / vehicles.length);
            var messagesPerVehicle = [];
            var offset = config.delay;

            for(var i = 0; i < vehicles.length; i++) {
                messagesPerVehicle[i] = {
                    send: 0,
                    receive: 0
                };
            }

            messages.length = 0;

            for(i = 0; i < messageCount; i++) {
                var vehicleId = _.random(vehicles.length - 1);
                if(messagesPerVehicle[vehicleId].send >= maxMessagesPerVehicle) {
                    var lowest = -1;
                    for(var n = 0; n < vehicles.length; n++) {
                        if(lowest == -1 || lowest > messagesPerVehicle[n].send) {
                            lowest = messagesPerVehicle[n].send;
                            vehicleId = n;
                        }
                    }
                }
                messagesPerVehicle[vehicleId].send++;

                var destinationCount = config.multipleDestinations && _.random(100) <= config.multipleDestinationsRate ? _.random(1, vehicles.length - 2) : 1;
                var destinations = [];

                for(n = 0; n < destinationCount; n++) {
                    var dst = _.random(vehicles.length - 1);
                    if(contains(destinations, dst) || dst === vehicleId) {
                        n--;
                        continue;
                    }
                    destinations[n] = dst;
                    messagesPerVehicle[dst].receive++;
                }

                var announcement = _.random(1, 100) <= config.announcementRate;

                messages.push({
                    src: vehicleId,
                    dst: destinations,
                    announcement: announcement,
                    msg: MessageService.getMessage(),
                    offset: Math.floor(offset)
                });

                offset += config.interval;
            }
        };
    });

    app.controller('SupervisorController', function () {
        this.duration = function () {
            return config.duration;
        };

        this.interval = function () {
            return config.interval;
        };

        this.vehicles = function () {
            return vehicles.length;
        };

        this.messages = function () {
            return messages.length;
        };
    });

    app.controller('MessagesController', function () {
        this.messages = messages;

        this.getVehicle = function (id) {
            return vehicles[id];
        };
    });

    app.service('MessageService', function () {
        this.getMessage = function () {
            var msg = _.sample(data.messages);

            var matches = msg.match(/\{([a-z]+):([0-9]*)*\}/g);
            if(angular.isArray(matches)) {
                var replacings = {};
                for(var i = 0; i < matches.length; i++) {
                    var replacing = "";
                    var match = matches[i].replace('{', '').replace('}', '').split(':');
                    match[1] = parseInt(match[1]);

                    if(!replacings[match[0]]) {
                        replacings[match[0]] = [];
                    }

                    if(!replacings[match[0]][match[1]]) {
                        switch(match[0]) {
                            case 'street':
                                replacing = this.getStreet();
                                break;
                            case 'name':
                                replacing = this.getName();
                                break;
                            case 'city':
                                replacing = this.getCity();
                                break;
                        }

                        var spell = _.random(1) == 0;
                        if(spell) {
                            replacing = replacing.toUpperCase();
                        }

                        replacings[match[0]][match[1]] = replacing;
                    } else {
                        replacing = replacings[match[0]][match[1]];
                    }

                    msg = msg.replace(matches[i], replacing);
                }
            }

            return msg;
        };

        this.getStreet = function() {
            return _.sample(data.streets);
        };

        this.getName = function() {
            return _.sample(data.names);
        };

        this.getCity = function() {
            return _.sample(data.cities);
        };
    });

    app.filter('sender', function () {
        return function (input, sender) {
            var result = [];

            for(var i = 0; i < input.length; i++) {
                if(input[i].src === sender) {
                    result.push(input[i]);
                }
            }
            return result;
        }
    });

    function contains(array, value) {
        for(var i = 0; i < array.length; i++) {
            if(array[i] === value) {
                return true;
            }
        }
        return false;
    }

    var data = {
        messages: [],
        streets: [],
        cities: [],
        names: []
    };

    var vehicles = [
        {'name': 'LF Rautheim', 'number': 'Florian Braunschweig 9-45-41'},
        {'name': 'TLF Mascherode', 'number': 'Florian Braunschweig 9-21-42'},
        {'name': 'TSF-W Stöckheim', 'number': 'Florian Braunschweig 9-41-43'},
        {'name': 'TSF-W Leiferde', 'number': 'Florian Braunschweig 9-41-44'},
        {'name': 'LF Melverode', 'number': 'Florian Braunschweig 9-47-45'}
    ];

    var config = {
        duration: 60,
        interval: 2.5,
        delay: 5,
        multipleDestinations: true,
        announcementRate: 50,
        multipleDestinationsRate: 33
    };

    var messages = [];
})();