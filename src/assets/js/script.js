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
        var messagesPerVehicle;

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

            if(!angular.isNumber(config.announcementRate) || config.announcementRate > 100 || config.announcementRate < 0) {
                return false;
            }

            if(!angular.isNumber(config.multipleDestinationsRate) || config.multipleDestinationsRate > 100 || config.multipleDestinationsRate < 0) {
                return false;
            }

            return true;
        };

        this.generate = function () {
            var messageCount = Math.floor((config.duration - config.delay) / config.interval);
            var maxMessagesPerVehicle = Math.ceil(messageCount / vehicles.length);
            var offset = config.delay;
            messagesPerVehicle = [];

            for(var i = 0; i < vehicles.length; i++) {
                messagesPerVehicle[i] = {
                    send: 0,
                    received: 0,
                    announcements: 0,
                    multipleDestinations: 0
                };
            }

            messages.length = 0;

            for(i = 0; i < messageCount; i++) {
                var nextVehicles = getNextVehicleList(messagesPerVehicle);
                var vehicleId = nextVehicles[_.random(nextVehicles.length - 1)];
                messagesPerVehicle[vehicleId].send++;

                var destinationCount = config.multipleDestinations && _.random(100) <= config.multipleDestinationsRate ? _.random(1, vehicles.length - 2) : 1;
                var destinations = [];

                if(destinationCount > 1) {
                    if(messagesPerVehicle[vehicleId].multipleDestinations <= maxMessagesPerVehicle * (config.multipleDestinationsRate / 100)) {
                        messagesPerVehicle[vehicleId].multipleDestinations++;
                    } else {
                        destinationCount = 1;
                    }
                }

                for(var n = 0; n < destinationCount; n++) {
                    var dst = _.random(vehicles.length - 1);
                    if(contains(destinations, dst) || dst === vehicleId) {
                        n--;
                        continue;
                    }
                    destinations[n] = dst;
                    messagesPerVehicle[dst].received++;
                }

                var announcement = _.random(1, 100) <= config.announcementRate
                    && messagesPerVehicle[vehicleId].announcements < maxMessagesPerVehicle * (config.announcementRate / 100);
                if(announcement) {
                    messagesPerVehicle[vehicleId].announcements++;
                }

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

        function getNextVehicleList(messagesPerVehicle) {
            var minMessages = -1;
            var result = [];

            for(var i = 0; i < vehicles.length; i++) {
                if(minMessages == -1 || messagesPerVehicle[i].send < minMessages) {
                    minMessages = messagesPerVehicle[i].send;
                }
            }

            for(i = 0; i < vehicles.length; i++) {
                if(messagesPerVehicle[i].send == minMessages) {
                    result.push(i);
                }
            }

            return result;
        }
    });

    app.controller('SupervisorController', function ($filter) {
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

        this.messagesPerVehicle = function (vehicleId) {
            return $filter('sender')(messages, vehicleId).length;
        };

        this.announcementsPerVehicle = function (vehicleId) {
            var messagesForVehicle = $filter('sender')(messages, vehicleId);
            return $filter('announcements')(messagesForVehicle).length;
        };

        this.multipleDestinationsPerVehicle = function (vehicleId) {
            var messagesForVehicle = $filter('sender')(messages, vehicleId);
            return $filter('multipleDestinations')(messagesForVehicle).length;
        }
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

                        var spell = _.random(1) == 0 && config.spell;
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

    app.filter('announcements', function () {
        return function (input) {
            var result = [];

            for(var i = 0; i < input.length; i++) {
                if(input[i].announcement) {
                    result.push(input[i]);
                }
            }
            return result;
        }
    });

    app.filter('multipleDestinations', function () {
        return function (input) {
            var result = [];

            for(var i = 0; i < input.length; i++) {
                if(input[i].dst.length > 1) {
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
        spell: true,
        announcementRate: 50,
        multipleDestinationsRate: 33
    };

    var messages = [];
})();