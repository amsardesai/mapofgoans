/*jshint -W083 */

var color1 = "#70D3F8";
var color2 = "#FB8C29";
var color3 = "#C35C00";

var markers = [];

$(function() {

	if (!Modernizr.generatedcontent) {
		var newDiv = $("<div class='notSupported'>");
		var notice = "Your browser is too old to view this application. Please download a modern browser, such as Google Chrome or Mozilla Firefox.";
		$("body").append(newDiv.text(notice));
		return;
	}

	// Viewport
	var viewport = {
		"width": $(window).width(),
		"height": $(window).height()
	};

	// Styles in map
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

	// Set initial zoom and position based on screen width
	var initZoom = viewport.width < 600 ? 3 : 4;
	var initLng = viewport.width < 600 ? -100 : -107;

	// Options for map
	var mapOptions = {
		center: new google.maps.LatLng(40, initLng),
		zoom: initZoom,
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

	// Limit the zoom level
	var minZoomLevel = viewport.width < 600 ? 2 : 3;
	var maxZoomLevel = 9;
	google.maps.event.addListener(map, 'zoom_changed', function() {
		if (map.getZoom() < minZoomLevel)
			map.setZoom(minZoomLevel);
		else if (map.getZoom() > maxZoomLevel)
			map.setZoom(maxZoomLevel);
	});
	
	// Get map data from database
	$.getJSON("/data", function(datapoints, textStatus, jqXHR) {
		for (var i = 0; i < datapoints.length; i++) {

			// Calculate size of marker
			var population = datapoints[i].people.length;
			var scale = Math.round(10 * Math.pow(population / 4, 0.5));

			// Settings for marker
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

			// Initiaize marker
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

					// Recursively increases size over time
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
					
					// Initial call to animateMarker
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

					// De-highlight all icons
					for (var j = 0; j < markers.length; j++) {
						var icon = markers[j].getIcon();
						icon.fillOpacity = 0.4;
						icon.strokeWeight = 2;
						markers[j].setIcon(icon);
					}

					// Highlight clicked icon
					var curIcon = currentMarker.getIcon();
					curIcon.fillOpacity = 0.9;
					curIcon.strokeWeight = 3;
					currentMarker.setIcon(curIcon);

					// Get city that this marker represents
					var curCity = datapoints[curIndex];

					// Manipulate UI
					$(".tooltip").hide();
					$(".pointerInfo").show();
					$(".city").text(curCity.name);
					$(".peopleCount").text(curCity.people.length + " Goan" + (curCity.people.length == 1 ? "" : "s"));
					$(".cityInfo").empty();
					
					// Loop all people in city
					for (var k = 0; k < curCity.people.length; k++) {
						(function() {
							var person = curCity.people[k];

							// Use a instead of div on mobile so they can see highlight while clicking
							var newItem = Modernizr.touch ? $("<a>") : $("<div>");
							newItem.addClass("person");
							newItem.append($("<div class='name'>").text(person.name));

							// If details exist then display them
							var hiddenElement;
							if (person.homeTown || person.highSchool || person.profCollege || person.workingAt) {
								newItem.attr("href", "javascript:void()").addClass("hasDropdown");
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
								newItem.append(hiddenElement.html(html)).click(function() {
									hiddenElement.slideToggle(200);
								});
							}

							// Push person to sidebar
							$(".cityInfo").append(newItem);
						})();
					}

					// Show sidebar if not already shown
					$(".cityInfo").show();
				});
			})();
		}
	});

	// Clean all markers if clicked outside map
	google.maps.event.addListener(map, "click", function() {
		$(".cityInfo").empty().hide();
		$(".pointerInfo").hide();
		$(".tooltip").show();
		for (var j = 0; j < markers.length; j++) {
			var icon = markers[j].getIcon();
			icon.fillOpacity = 0.4;
			icon.strokeWeight = 2;
			markers[j].setIcon(icon);
		}
	});

});

