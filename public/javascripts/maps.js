/*jshint -W083 */

var color1 = "#00B2FF";
var color2 = "#FFA200";
var color3 = "#FF6200";

var datapoints = [
	{
		city: "Toronto, ON",
		positionX: 40,
		positionY: -100,
		population: 3,
		people: [
			{
				name: "Nita Sardesai"
			}
		]
	},
	{
		city: "New York, NY",
		positionX: 42,
		positionY: -98,
		population: 6,
		people: [
			{
				name: "Arka Ganguli"
			}, {
				name: "Habeeb Ahmed"
			}
		]
	},
	{
		city: "Miami, FL",
		positionX: 44,
		positionY: -95,
		population: 2,
		people: [
			{
				name: "Ankit Sardesai"
			}, {
				name: "Mahesh Sardesai"
			}, {
				name: "Meghana Pramod"
			}, {
				name: "Anmol Gupta"
			}
		]
	},
	{
		city: "Charlottetown, PE",
		positionX: 40,
		positionY: -96,
		population: 15,
		people: [
			{
				name: "Aanchal Bajaj"
			}, {
				name: "Aditi Banerjee"
			}
		]
	},
	{
		city: "Vancouver, BC",
		positionX: 48,
		positionY: -95,
		population: 100,
		people: [
			{
				name: "Sanga Yoganathan"
			}, {
				name: "Pooja Sardesai"
			}, {
				name: "Khadeeja Sajid"
			}
		]
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
		var population = datapoints[i].population;
		var scale = Math.log(population) / Math.log(1.15);

		var curMarker = new google.maps.Marker({
			position: new google.maps.LatLng(datapoints[i].positionX,datapoints[i].positionY),
			map: map,
			icon: {
				path: google.maps.SymbolPath.CIRCLE,
				fillOpacity: 0,
				strokeOpacity: 0,
				strokeWeight: 0,
				scale: scale
			},
			title: "hi"
		});

		markers.push(curMarker);

		var tooltip = new Tooltip({
			marker: curMarker,
			content: population + " people",
			offsetX: -40,
			offsetY: -(30 + scale),
			cssClass: "mapTooltip"
		});


		(function(i, marker, scale) {
			var animateMarker = function(marker, scale, curScale) {
				curScale = curScale || 0;
				if (curScale < scale) {
					marker.setIcon({
						path: google.maps.SymbolPath.CIRCLE,
						fillOpacity: 0.4,
						fillColor: color2,
						strokeOpacity: 1.0,
						strokeColor: color3,
						strokeWeight: 2,
						scale: curScale
					});
					setTimeout(function() {
						animateMarker(marker, scale, curScale + ((scale - curScale) * 0.07) + 0.2);
					}, curScale === 0 ? 600 : 10);
				}
			};
			setTimeout(function() {
				animateMarker(marker, scale);
			}, i * 50);
		})(i, curMarker, scale);

		(function() {
			var currentMarker = curMarker;
			var curIndex = i;
			google.maps.event.addListener(curMarker, "click", function(e) {
				$(".tooltip").hide();
				for (var j = 0; j < markers.length; j++) {
					var icon = markers[j].getIcon();
					icon.fillOpacity = 0.4;
					icon.strokeWeight = 2;
					markers[j].setIcon(icon);
				}
				var curIcon = currentMarker.getIcon();
				curIcon.fillOpacity = 0.9;
				curIcon.strokeWeight = 3;
				currentMarker.setIcon(curIcon);

				var curObject = datapoints[curIndex];

				$(".cityLabel").show();
				$(".city").text(curObject.city);


			});
		})();


	}


	// Limit the zoom level
	var minZoomLevel = 3;
	var maxZoomLevel = 8;
	google.maps.event.addListener(map, 'zoom_changed', function() {
		if (map.getZoom() < minZoomLevel) map.setZoom(minZoomLevel);
		if (map.getZoom() > maxZoomLevel) map.setZoom(maxZoomLevel);
	});

});

