/*jshint -W083 */

var color1 = "#00B2FF";
var color2 = "#FFA200";
var color3 = "#FF6200";

var datapoints = [];

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
		panControl: !Modernizr.touch,
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

	google.maps.event.addListener(map, "click", function() {
		$(".cityInfo").empty();
		$(".pointerInfo").hide();
		$(".tooltip").show();
		for (var j = 0; j < markers.length; j++) {
			var icon = markers[j].getIcon();
			icon.fillOpacity = 0.4;
			icon.strokeWeight = 2;
			markers[j].setIcon(icon);
		}
	});

	// Limit the zoom level
	var minZoomLevel = 3;
	var maxZoomLevel = 8;
	google.maps.event.addListener(map, 'zoom_changed', function() {
		if (map.getZoom() < minZoomLevel)
			map.setZoom(minZoomLevel);
		else if (map.getZoom() > maxZoomLevel)
			map.setZoom(maxZoomLevel);
	});
	
	console.log("/data");
	
	$.getJSON("/data", function(datapoints, textStatus, jqXHR) {

			console.log(datapoints);
			console.log(textStatus);
		for (var i = 0; i < datapoints.length; i++) {
			var population = datapoints[i].people.length;
			var scale = Math.log(population + 1) / Math.log(1.12);


			var curMarker = new google.maps.Marker({
				position: new google.maps.LatLng(datapoints[i].location.lat,datapoints[i].location.lng),
				map: map,
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					fillOpacity: 0,
					strokeOpacity: 0,
					strokeWeight: 0,
					scale: scale
				}
			});

			markers.push(curMarker);

			// Tooltip for markers
			var tooltip = new Tooltip({
				marker: curMarker,
				content: population + (population == 1 ? " person" : " people"),
				offsetX: -40,
				offsetY: -(30 + scale),
				cssClass: "mapTooltip"
			});
			
			// Marker animating in the beginning
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
				}, i * 30);
			})(i, curMarker, scale);

			// Make markers clickable
			(function() {
				var currentMarker = curMarker;
				var curIndex = i;
				google.maps.event.addListener(curMarker, "click", function(e) {
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

					var curCity = datapoints[curIndex];

					$(".tooltip").hide();
					$(".pointerInfo").show();
					$(".city").text(curCity.name);
					$(".peopleCount").text(curCity.people.length + " Goan" + (curCity.people.length == 1 ? "" : "s"));
					$(".cityInfo").empty();
					
					for (var k = 0; k < curCity.people.length; k++) {
						var newItem = $("<div class='person'>");
						newItem.append($("<div class='name'>").text(curCity.people[k].name));
						$(".cityInfo").append(newItem);
					}

				});
			})();
		}

	});


});

