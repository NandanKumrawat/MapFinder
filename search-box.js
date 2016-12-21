angular.module("search-box-example", ['uiGmapgoogle-maps'])
.config(['uiGmapGoogleMapApiProvider', function (GoogleMapApi) {
    GoogleMapApi.configure({
        key: 'AIzaSyA3Xwlf3SNWSK5OpuyszoPh-k643rCFAeo',
        v: '3.17',
        libraries: 'places'
    });
}])
.run(['$templateCache', function ($templateCache) {
    $templateCache.put('searchbox.tpl.html', '<input id="pac-input" class="pac-controls form-control" type="text" placeholder="Make A Search">');
    $templateCache.put('window.tpl.html', '<div ng-controller="WindowCtrl" ng-init="showPlaceDetails(parameter)">{{place.name}}</div>');
}])
.controller('WindowCtrl', function ($scope) {
    $scope.place = {};
    $scope.showPlaceDetails = function (param) {
        $scope.place = param;
    }
})

//--------------------------------------------------------------------Search Custom code--------------------------------------------------------------------
.controller("SearchBoxController", ['$scope', '$timeout', 'uiGmapLogger', '$http', 'uiGmapGoogleMapApi'
    , function ($scope, $timeout, $log, $http, GoogleMapApi) {
        $log.doLog = true
        $scope.toggleMap = function () {
            $scope.searchbox.options.visible = !$scope.searchbox.options.visible;
        }

        //------------------Custom Code------------------
        $scope.SearchHistory = [];
        SearchHistory = [];
        //------------------ResetHistory Refreshesh Last search list------------------
        $scope.ResetHistory = function () {
            localStorage.SearchHistory = [];
            $scope.SearchHistory = [];
            SearchHistory = [];
        }
        //------------------ResetHistory Refreshesh Last search list------------------
        //------------------MapMe maps search location------------------
        $scope.MapMe = function (SH) {
            var s = document.getElementById('pac-input');
            s.value = SH[0].templateparameter.formatted_address;
            document.title = "Map Finder: " + SH[0].templateparameter.formatted_address;
            $scope.map.bounds = {
                northeast: {
                    latitude: SH[0].latitude,
                    longitude: SH[0].longitude
                },
                southwest: {
                    latitude: SH[0].latitude,
                    longitude: SH[0].longitude
                }
            }
            $scope.map.markers = SH;
        }
        //------------------MapMe maps search location------------------
        //------------------Custom Code------------------

        GoogleMapApi.then(function (maps) {
            maps.visualRefresh = true;
            $scope.defaultBounds = new google.maps.LatLngBounds(
              new google.maps.LatLng(40.82148, -73.66450),
              new google.maps.LatLng(40.66541, -74.31715));

            $scope.map.bounds = {
                northeast: {
                    latitude: $scope.defaultBounds.getNorthEast().lat(),
                    longitude: $scope.defaultBounds.getNorthEast().lng()
                },
                southwest: {
                    latitude: $scope.defaultBounds.getSouthWest().lat(),
                    longitude: -$scope.defaultBounds.getSouthWest().lng()
                }
            }
            document.title = "Map Finder: Let's Start";
            $scope.searchbox.options.bounds = new google.maps.LatLngBounds($scope.defaultBounds.getNorthEast(), $scope.defaultBounds.getSouthWest());
            //------------------Check For Last Searh Locatoion if Yes Then Map It------------------
            if (localStorage.SearchHistory == undefined) {
                localStorage.SearchHistory = '';
            }
            if (localStorage.SearchHistory != '') {
                //localStorage.SearchHistory = '';
                $scope.SearchHistory = JSON.parse(localStorage.SearchHistory);
                console.log($scope.SearchHistory);
                SearchHistory = $scope.SearchHistory;
            }
            //------------------Check For Last Searh Locatoion if Yes Then Map It------------------
        });

        angular.extend($scope, {
            window: {
                show: false,
                options: {
                    pixelOffset: { width: 0, height: -40 }
                },
                templateurl: 'window.tpl.html',
                templateparameter: {},
                closeClick: function () {
                    $scope.window.show = false;
                }
            },
            map: {
                control: {},
                center: {
                    latitude: 40.74349,
                    longitude: -73.990822
                },
                zoom: 12,
                dragging: false,
                bounds: {},
                markers: [],
                idkey: 'place_id',
                events: {
                    idle: function (map) {
                    },
                    dragend: function (map) {
                        //update the search box bounds after dragging the map
                        var bounds = map.getBounds();
                        var ne = bounds.getNorthEast();
                        var sw = bounds.getSouthWest();
                        $scope.searchbox.options.bounds = new google.maps.LatLngBounds(sw, ne);
                    }
                }
            },
            searchbox: {
                template: 'searchbox.tpl.html',
                position: 'top-right',
                options: {
                    bounds: {},
                    visible: true
                },
                events: {
                    places_changed: function (searchBox) {
                        places = searchBox.getPlaces()
                        if (places.length == 0) {
                            return;
                        }
                        // For each place, get the icon, place name, and location.
                        newMarkers = [];
                        var bounds = new google.maps.LatLngBounds();
                        for (var i = 0, place; place = places[i]; i++) {
                            // Create a marker for each place.
                            var marker = {
                                idKey: i,
                                place_id: place.place_id,
                                name: place.name,
                                latitude: place.geometry.location.lat(),
                                longitude: place.geometry.location.lng(),
                                templateurl: 'window.tpl.html',
                                templateparameter: place,
                                events: {
                                    click: function (marker) {
                                        $scope.window.coords = {
                                            latitude: marker.model.latitude,
                                            longitude: marker.model.longitude
                                        }
                                        $scope.window.templateparameter = marker.model.templateparameter;
                                        $scope.window.show = true;
                                    }
                                }
                            };
                            newMarkers.push(marker);
                            //Can Save Marker Details in Database (SQL, MySql) and recall it for map
                            //------------------Store In Memory code------------------
                            SearchHistory.push(newMarkers);
                            $scope.SearchHistory = SearchHistory;
                            localStorage.SearchHistory = JSON.stringify($scope.SearchHistory);
                            //------------------Store In Memory code------------------
                            bounds.extend(place.geometry.location);
                        }
                        $scope.map.bounds = {
                            northeast: {
                                latitude: bounds.getNorthEast().lat(),
                                longitude: bounds.getNorthEast().lng()
                            },
                            southwest: {
                                latitude: bounds.getSouthWest().lat(),
                                longitude: bounds.getSouthWest().lng()
                            }
                        }
                        $scope.map.markers = newMarkers;
                    }
                }
            }
        });
    }]);
//--------------------------------------------------------------------Search Custom code--------------------------------------------------------------------