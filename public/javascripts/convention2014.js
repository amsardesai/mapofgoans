/*jshint -W083 */

var color1 = "#70D3F8";
var color2 = "#ede3d1";
var color3 = "#ae8844";

var markers = [];
var cityData = [];
var map;
var currentlySelectedMarker = -1;
var mobileMarkerLimit = 60;
var viewportMobileThreshold = 600;

$(function() {

	// Scroll to 0
	$(window).load(function() {
		setTimeout(function() {
			window.scrollTo(0, 1);
		}, 0);
	});

	// Message for older browsers
	if (!Modernizr.generatedcontent) {
		var newDiv = $("<div class='notSupported'>");
		var notice = "Your browser is too old to view this application. Please download a modern browser, such as Google Chrome or Mozilla Firefox.";
		$("body").append(newDiv.text(notice));
		return;
	}

	// Viewport object
	var reloadViewport, viewport;
	(reloadViewport = function() {
		viewport = {
			"width": $(window).width(),
			"height": $(window).height()
		};
	}).call(this);
	$(window).resize(reloadViewport);

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
	var initZoom = viewport.width < viewportMobileThreshold ? 3 : 4;
	var initLng = viewport.width < viewportMobileThreshold ? -100 : -107;

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

	// Initialize map
	map = new google.maps.Map($("#mapcanvas").get(0), mapOptions);
	map.setOptions({ styles: styleArray });

	// Limit the zoom level
	var minZoomLevel = viewport.width < viewportMobileThreshold ? 2 : 3;
	var maxZoomLevel = 9;
	google.maps.event.addListener(map, 'zoom_changed', function() {
		if (map.getZoom() < minZoomLevel)
			map.setZoom(minZoomLevel);
		else if (map.getZoom() > maxZoomLevel)
			map.setZoom(maxZoomLevel);
	});
	
	// FUNCTIONS

	// Square root function for population to marker size
	var getScaleFromPopulation = function(population) {
		return Math.round(10 * Math.pow(population / 5, 0.5));
	};

	// Create a person jQuery object given a person object
	var createItemFromPerson = function(person, includeLocation) {

		// Use a instead of div on mobile so they can see highlight while clicking
		var newItem = Modernizr.touch ? $("<a>") : $("<div>");
		newItem.addClass("person");

		var city = $("<div class='name'>").text(person.name);
		newItem.append(city);
		
		if (includeLocation) {
			city.addClass("smallerName");
			newItem.append($("<div class='location'>").text(person.location));
		}

		return newItem;
	};


	// Remove selection of all markers on the map
	var dehighlightMarkers = function() {
		if (currentlySelectedMarker > -1) {
			var icon = cityData[currentlySelectedMarker].marker.getIcon();
			icon.fillOpacity = 0.4;
			icon.strokeWeight = 2;
			cityData[currentlySelectedMarker].marker.setIcon(icon);
			currentlySelectedMarker = -1;
		}
	};

	// Unselect markers completely (changing labels as well)
	var unselectMarkers = function() {
		$(".cityInfo").empty().hide();
		$(".pointerInfo").hide();
		
		$(".help").show();
		$(".tooltip").removeClass("resultsDisplayed");

		dehighlightMarkers();
	};

	// Highlight a single marker on the map
	var highlightMarker = function(markerID) {
		
		var curMarker = cityData[markerID].marker;
		dehighlightMarkers();
		var curIcon = curMarker.getIcon();
		curIcon.fillOpacity = 0.9;
		curIcon.strokeWeight = 3;
		curMarker.setIcon(curIcon);
		currentlySelectedMarker = markerID;

	};

	// Add the black tooltip to a marker
	var updateTooltip = function(markerID, scale, overridePeople) {
		var people = overridePeople || cityData[markerID].people;
		var curMarker = cityData[markerID].marker;
		var content = people.length + (people.length == 1 ? " person" : " people") + " in <br />" + cityData[markerID].name;
		
		// Tooltip for markers
		if (cityData[markerID].tooltip)
			cityData[markerID].tooltip.setMap(null);

		cityData[markerID].tooltip = new Tooltip({
			marker: curMarker,
			content: content,
			offsetX: -70,
			offsetY: -(42 + scale),
			cssClass: "mapTooltip"
		});
	};

	// Add click handler to marker
	var populateMarker = function(markerID, overridePeople) {
		google.maps.event.clearInstanceListeners(cityData[markerID].marker);
		google.maps.event.addListener(cityData[markerID].marker, "click", function(e) {

			// Highlight clicked marker
			highlightMarker(markerID);

			// Get city that this marker represents
			var curCity = cityData[markerID];

			// Sort by last name
			var people = overridePeople || curCity.people;
			people.sort(function(a, b) {
				return a.lastName < b.lastName ? -1 :
					a.lastName > b.lastName ? 1 :
					a.firstName < b.firstName ? -1 :
					a.firstName > b.firstName ? 1 :
					a.middleName < b.middleName ? -1 :
					a.middleName > b.middleName ? 1 : 0;
			});

			// Manipulate UI
			$(".help").hide();
			$(".tooltip").addClass("resultsDisplayed");
			$(".peopleCount").text(people.length + " Goan" + (people.length == 1 ? "" : "s"));
			$(".city").text("in " + curCity.name);
			$(".pointerInfo").show();

			var cityInfo = $(".cityInfo");
			cityInfo.empty();
			
			// Loop all people in city
			for (var k = 0; k < people.length; k++) {
				cityInfo.append(createItemFromPerson(people[k]));
			}

			// Show sidebar if not already shown
			cityInfo.show();
		});
	};

	// Add marker to map
	var addMarker = function(markerID, initiallyHiddenCondition) {

		// Calculate size of marker
		var population = cityData[markerID].people.length;
		var scale = getScaleFromPopulation(population);
				
		// Settings for marker
		var icon = initiallyHiddenCondition ? {
			path: google.maps.SymbolPath.CIRCLE,
			fillOpacity: 0,
			strokeOpacity: 0,
			strokeWeight: 0,
			scale: 0
		} : {
			path: google.maps.SymbolPath.CIRCLE,
			fillOpacity: 0.4,
			fillColor: color2,
			strokeOpacity: 1.0,
			strokeColor: color3,
			strokeWeight: 2,
			scale: scale
		};

		// Add marker to map
		cityData[markerID].marker = new google.maps.Marker({
			position: new google.maps.LatLng(cityData[markerID].location.lat,cityData[markerID].location.lng),
			map: Modernizr.touch && markerID < cityData.length - mobileMarkerLimit ? null : map,
			icon: icon
		});

		// Add null tooltip
		cityData[markerID].tooltip = null;

		// Add people list to marker
		populateMarker(markerID);

		// Return created marker
		return cityData[markerID].marker;
	};

	// Edit size of marker
	var updateMarker = function(markerID) {
		// Override people
		var people = cityData[markerID].people;
		var curMarker = cityData[markerID].marker;
		var scale = getScaleFromPopulation(people.length);
		var curIcon = curMarker.getIcon();

		if (curIcon.scale != scale) {
			curIcon.scale = scale;
			curMarker.setIcon(curIcon);
		}

		// In case it was removed
		if (!curMarker.getMap()) {
			curMarker.setMap(map);
		}

		// Update people list
		populateMarker(markerID, people);

		// Add tooltip
		if (!Modernizr.touch) updateTooltip(markerID, scale, people);
	};

	// Remove one marker
	var removeMarker = function(markerID) {
		google.maps.event.clearInstanceListeners(cityData[markerID].marker);
		cityData[markerID].marker.setMap(null);
		if (!Modernizr.touch) {
			cityData[markerID].tooltip.setMap(null);
			cityData[markerID].tooltip = null;
		}
	};

	// Remove all markers from the map
	var removeAllMarkers = function() {
		for (var i = 0; i < cityData.length; i++)
			removeMarker(i);
	};

	var reloadMarkers = function() {
		//var d = new Date().getTime();
		var i, limitCounter = 0;

		// If mobile device, display the most markers possible
		for (i = cityData.length - 1; i >= 0; i--) {

			var isInMap = cityData[i].marker.getMap() !== null;
			var isInBounds = map.getBounds().contains(cityData[i].marker.getPosition());

			if (!isInMap && isInBounds) {
				updateMarker(i);
			} else if (isInMap && !isInBounds) {
				removeMarker(i);
			}

			if (Modernizr.touch && cityData[i].marker.getMap() !== null && ++limitCounter > mobileMarkerLimit)
				break;
		}

		// Remove the rest of the markers to save memory
		if (Modernizr.touch && limitCounter >= mobileMarkerLimit)
			for (var k = 0; k <= i; k++) removeMarker(k);
	};

	// Get data after map is fully loaded
	google.maps.event.addListenerOnce(map, 'idle', function() {

		// Get map data from database
		$.getJSON("/data/convention2014", function(data, textStatus, jqXHR) {
			cityData = data;

			// Measure how many timeouts and intervals are set
			var totalTimeouts = 0;
			var totalIntervals = 0;
			
			for (var i = 0; i < cityData.length; i++) {
				var population = cityData[i].people.length;
				var scale = getScaleFromPopulation(population);

				// Add marker
				var curMarker = addMarker(i, !Modernizr.touch);

				// Load social media buttons when animation is complete
				var finishedAnimation = function() {
					$.ajaxSetup({ cache: true });
					google.maps.event.addListener(map, "idle", reloadMarkers);
				};

				if (!Modernizr.touch) {

					// Configuration for animation
					var animationDelay = 31;
					var datapointDelay = 129;
					var initialDelay = 0;
					var laggingThreshold = 400;
					var simultaneousMarkers = 12;

					// Marker animating in the beginning
					(function() {
						var markerID = i,
							marker = curMarker,
							newScale = scale * 2,
							curScale = 0,
							icon = {
								path: google.maps.SymbolPath.CIRCLE,
								fillOpacity: 0.4,
								fillColor: color2,
								strokeOpacity: 1.0,
								strokeColor: color3,
								strokeWeight: 2,
								scale: 0
							},
							isLagging = false,
							curTimer;

						// Recursively increases size over time
						var animateMarker = function() {
							curScale = Math.ceil(curScale + ((newScale - curScale) * 0.5));
							if (curScale < newScale && !isLagging)
								icon.scale = curScale / 2;
							else {
								icon.scale = newScale / 2;
								clearInterval(curTimer);
								if (--totalIntervals === 0 && totalTimeouts === 0) finishedAnimation();
								updateTooltip(markerID, newScale / 2);
							}

							marker.setIcon(icon);
						};
						
						// Initial call to animateMarker
						totalTimeouts++;
						var delay = Math.floor(markerID / simultaneousMarkers) * datapointDelay + initialDelay;

						var start = new Date().getTime();
						setTimeout(function() {
							var lag = new Date().getTime() - start - delay;
							isLagging = (lag > laggingThreshold);
							if (isLagging) animationDelay++;
							totalTimeouts--;
							totalIntervals++;
							curTimer = setInterval(animateMarker, animationDelay);
						}, delay);

					})();
				} else finishedAnimation();
			}

			// Clean all markers if clicked outside map
			google.maps.event.addListener(map, "click", unselectMarkers);

		});
	});

});

