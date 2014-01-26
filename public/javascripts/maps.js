/*jshint -W083 */

var color1 = "#70D3F8";
var color2 = "#FB8C29";
var color3 = "#C35C00";

var markers = [];


$(function() {
	var viewport = {
		"width": $(window).width(),
		"height": $(window).height()
	};

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
	
	$.getJSON("/data", function(datapoints, textStatus, jqXHR) {

		for (var i = 0; i < datapoints.length; i++) {
			var population = datapoints[i].people.length;
			var scale = Math.round(10 * Math.pow(population / 4, 0.5));

			var icon = Modernizr.touch ? {
				path: google.maps.SymbolPath.CIRCLE,
				fillOpacity: 0.4,
				fillColor: color2,
				strokeOpacity: 1.0,
				strokeColor: color3,
				strokeWeight: 2,
				scale: scale
			} : {
				path: google.maps.SymbolPath.CIRCLE,
				fillOpacity: 0,
				strokeOpacity: 0,
				strokeWeight: 0,
				scale: scale
			};

			var curMarker = new google.maps.Marker({
				position: new google.maps.LatLng(datapoints[i].location.lat,datapoints[i].location.lng),
				map: map,
				icon: icon
			});

			markers.push(curMarker);

			if (!Modernizr.touch) {
				// Tooltip for markers
				var tooltip = new Tooltip({
					marker: curMarker,
					content: population + (population == 1 ? " person" : " people") + " in <br />" + datapoints[i].name,
					offsetX: -65,
					offsetY: -(42 + scale),
					cssClass: "mapTooltip"
				});

				// Highly optimized numbers (19, 37 have high LCMs) by leaving no idle time slots or overlapping threads
				var animationDelay = 19;
				var datapointDelay = 37;

				// Marker animating in the beginning
				(function() {
					var markerNumber = i;
					var marker = curMarker;
					var newScale = scale;

					var animateMarker = function(marker, scale, curScale) {
						curScale = (Math.ceil(curScale * 2) / 2) || 0;
						if (curScale < scale) {
							var icon = marker.getIcon();
							icon.scale = curScale;
							marker.setIcon(icon);
							setTimeout(function() {
								animateMarker(marker, scale, curScale + ((scale - curScale) * 0.2));
							}, curScale === 0 ? 600 : animationDelay);
						}
					};
					
					setTimeout(function() {
						marker.setIcon({
							path: google.maps.SymbolPath.CIRCLE,
							fillOpacity: 0.4,
							fillColor: color2,
							strokeOpacity: 1.0,
							strokeColor: color3,
							strokeWeight: 2,
							scale: 0
						});
						animateMarker(marker, newScale);
					}, markerNumber * datapointDelay);
				
				})();
			}


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
						(function() {
							var person = curCity.people[k];

							var newItem = $("<a class='person'>");
							newItem.append($("<div class='name'>").text(person.name));

							var hiddenElement;
							if (person.homeTown || person.highSchool || person.profCollege || person.workingAt) {
								newItem.attr("href", "#").addClass("hasDropdown");
								hiddenElement = $("<div class='details'>").css("display", "none");
								var html = "";

								if (person.homeTown)
									html += "<strong>Home Town:</strong> " + person.homeTown + "<br />";

								if (person.highSchool)
									html += "<strong>High School:</strong> " + person.highSchool + "<br />";

								if (person.profCollege)
									html += "<strong>College:</strong> " + person.profCollege + "<br />";

								if (person.workingAt)
									html += "<strong>Working At:</strong> " + person.workingAt + "<br />";

								newItem.append(hiddenElement.html(html));

							}

							newItem.click(function() {
								if (hiddenElement)
									hiddenElement.slideToggle(200, function() {
										if ($(this).is(":hidden")) {
											
										}
									});
							});
							$(".cityInfo").append(newItem);
						})();

					}

				});
			})();
		}

	});


});

