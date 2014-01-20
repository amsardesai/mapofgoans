/*jshint -W083 */

var color1 = "#00B2FF";
var color2 = "#FFA200";
var color3 = "#FF6200";

var datapoints = [
	{
		location: "hi1",
		positionX: 40,
		positionY: -100,
		population: 3
	},
	{
		location: "hi2",
		positionX: 42,
		positionY: -98,
		population: 6
	},
	{
		location: "hi3",
		positionX: 44,
		positionY: -95,
		population: 2
	},
	{
		location: "hi4",
		positionX: 40,
		positionY: -96,
		population: 15
	},
	{
		location: "hi5",
		positionX: 48,
		positionY: -95,
		population: 100
	}
];

var markers = [];


$(function() {

	var styleArray = [
		{
			"featureType": "road",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "transit",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "poi",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "administrative",
			"elementType": "geometry",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "administrative.country",
			"elementType": "geometry.stroke",
			"stylers": [
				{ "visibility": "on" },
				{ "color": "#AAAAAA" },
				{ "weight": 1 }
			]
		},{
			"featureType": "administrative.province",
			"elementType": "geometry.stroke",
			"stylers": [
				{ "visibility": "on" },
				{ "color": "#CCCCCC" },
				{ "weight": 0.7 }
			]
		},{
			"featureType": "administrative.locality",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "administrative.neighborhood",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "administrative.land_parcel",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "landscape",
			"stylers": [
				{ "color": "#FFFFFF" }
			]
		},{
			"featureType": "water",
			"stylers": [
				{ "color": color1 }
			]
		},{
			"elementType": "labels",
			"stylers": [
				{ "visibility": "off" }
			]
		}
	];


	var mapOptions = {
		center: new google.maps.LatLng(40, -107),
		zoom: 4,
		panControl: true,
		panControlOptions: {
			position: google.maps.ControlPosition.RIGHT_TOP
		},
		zoomControl: true,
		zoomControlOptions: {
			style: google.maps.ZoomControlStyle.SMALL,
			position: google.maps.ControlPosition.RIGHT_TOP
		},
		mapTypeControl: false,
		scaleControl: false,
		streetViewControl: false,
		rotateControl: false,
		overviewMapControl: false
	};




	var map = new google.maps.Map($("#mapcanvas").get(0), mapOptions);
	map.setOptions({ styles: styleArray });
	
	for (var i = 0; i < datapoints.length; i++) {
		var scale = Math.log(datapoints[i].population) / Math.log(1.15);
		markers.push(new google.maps.Marker({
			position: new google.maps.LatLng(datapoints[i].positionX,datapoints[i].positionY),
			map: map,
			icon: {
				path: google.maps.SymbolPath.CIRCLE,
				fillOpacity: 0,
				strokeOpacity: 0,
				strokeWeight: 0,
				scale: scale
			}
		}));

		(function(i, marker, scale) {
			var animateMarker = function(marker, scale, curScale) {
				curScale = curScale || 0;
				if (curScale < scale) {
					marker.setOptions({
						icon: {
							path: google.maps.SymbolPath.CIRCLE,
							fillOpacity: 0.5,
							fillColor: color2,
							strokeOpacity: 1.0,
							strokeColor: color3,
							strokeWeight: curScale < 7 ? 1 : 2,
							scale: curScale
						}
					});
					setTimeout(function() {
						animateMarker(marker, scale, curScale + ((scale - curScale) * 0.07) + 0.2);
					}, curScale === 0 ? 500 : 10);
				}
			};
			setTimeout(function() {
				animateMarker(marker, scale);
			}, i * 50);
		})(i, markers.slice(-1)[0], scale);
	}


	// Limit the zoom level
	var minZoomLevel = 3;
	var maxZoomLevel = 8;
	google.maps.event.addListener(map, 'zoom_changed', function() {
		if (map.getZoom() < minZoomLevel) map.setZoom(minZoomLevel);
		if (map.getZoom() > maxZoomLevel) map.setZoom(maxZoomLevel);
	});

});

