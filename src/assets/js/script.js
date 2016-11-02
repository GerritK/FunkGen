(function () {
    var app = angular.module('funk-gen', []);

    app.run(function ($http) {
        $http.get('messages.json').then(function (result) {
            data.messages = result.data;
        });
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
        };

        this.removeVehicle = function (index) {
            this.vehicles.splice(index, 1);
        };
    });

    app.controller('ConfigurationController', function () {
        this.config = config;
    });

    app.controller('GenerateController', function () {
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
                var vehicleId = Math.floor(Math.random() * vehicles.length);
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

                var destinationCount = config.multipleDestinations && Math.floor(Math.random() * 3) == 0 ? Math.ceil(Math.random() * (vehicles.length - 2)) : 1;
                var destinations = [];

                for(n = 0; n < destinationCount; n++) {
                    var dst = Math.floor(Math.random() * vehicles.length);
                    if(contains(destinations, dst)) {
                        n--;
                        continue;
                    }
                    destinations[n] = dst;
                    messagesPerVehicle[dst].receive++;
                }

                var messageId = Math.floor(Math.random() * data.messages.length);

                messages.push({
                    'src': vehicleId,
                    'dst': destinations,
                    'announcement': false,
                    msg: data.messages[messageId],
                    offset: Math.floor(offset)
                });

                offset += config.interval;
            }
        };
    });

    app.controller('MessagesController', function () {
        this.messages = messages;

        this.getVehicle = function (id) {
            return vehicles[id];
        };
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
        'messages': []
    };

    var vehicles = [
        {'name': 'TSF-W MA', 'number': 'Florian Braunschweig 9-41-43'},
        {'name': 'TSF-W GF', 'number': 'Florian Braunschweig 9-41-44'},
        {'name': 'TSF-W AT', 'number': 'Florian Braunschweig 9-41-45'},
        {'name': 'TSF-W WT', 'number': 'Florian Braunschweig 9-41-46'},
        {'name': 'TSF-W ST', 'number': 'Florian Braunschweig 9-41-47'}
    ];

    var config = {
        duration: 60,
        interval: 2.5,
        delay: 5,
        multipleDestinations: true
    };

    var messages = [];
})();