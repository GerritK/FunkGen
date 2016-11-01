(function () {
    var app = angular.module('funk-gen', []);

    app.controller('VehicleConfigController', function () {
        this.vehicles = vehicles;

        this.addVehicle = function (name, number) {
            this.vehicles.push({
                name: name,
                number: number
            });
            this.vehicleName = "";
            this.vehicleNumber = "";
        };

        this.removeVehicle = function (index) {
            this.vehicles.splice(index, 1);
        };
    });

    app.controller('GenerateController', function () {

    });

    app.controller('MessagesController', function () {
        this.messages = messages;

        this.getVehicle = function (id) {
            return vehicles[id];
        };
    });

    var vehicles = [
        {'name': 'TSF-W MA', 'number': 'Florian Braunschweig 9-41-43'},
        {'name': 'TSF-W GF', 'number': 'Florian Braunschweig 9-41-44'},
        {'name': 'TSF-W AT', 'number': 'Florian Braunschweig 9-41-45'},
        {'name': 'TSF-W WT', 'number': 'Florian Braunschweig 9-41-46'},
        {'name': 'TSF-W ST', 'number': 'Florian Braunschweig 9-41-47'}
    ];

    var messages = [
        {'src': 0, 'dst': [1], 'announcement': false, msg: 'Hello World!', offset: 5},
        {'src': 2, 'dst': [4], 'announcement': true, msg: 'Hello Earth!', offset: 7},
        {'src': 1, 'dst': [3,2], 'announcement': false, msg: 'Hello Moon!', offset: 10}
    ];
})();