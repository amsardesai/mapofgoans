/*jshint -W083 */

var color1 = "#70D3F8";
var color2 = "#FB8C29";
var color3 = "#C35C00";

var markers = [];
var cityData = [];
var map;
var searchQuery = "", personSearchCount, allSearchResults = [], searchCities = 0;
var currentlySelectedMarker = -1;
var mobileMarkerLimit = 60;
var viewportMobileThreshold = 600;

$(function() {

	// Message for older browsers
	if (!Modernizr.generatedcontent) {
		var newDiv = $("<div class='notSupported'>");
		var notice = "Your browser is too old to view this application. Please download a modern browser, such as Google Chrome or Mozilla Firefox.";
		$("body").append(newDiv.text(notice));
		return;
	}

	$(".search").placeholder();

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
		
		// If details exist then display them
		var hiddenElement;
		if (person.homeTown || person.highSchool || person.profCollege || person.workingAt) {
			newItem.attr("href", "#").addClass("hasDropdown");
			hiddenElement = $("<ul>").css("display", "none");

			if (person.homeTown)
				hiddenElement.append($("<li>").html("<strong>Home Town:</strong> " + person.homeTown + "<br />"));
			if (person.highSchool)
				hiddenElement.append($("<li>").html("<strong>High School:</strong> " + person.highSchool + "<br />"));
			if (person.profCollege)
				hiddenElement.append($("<li>").html("<strong>College:</strong> " + person.profCollege + "<br />"));
			if (person.workingAt)
				hiddenElement.append($("<li>").html("<strong>Working At:</strong> " + person.workingAt + "<br />"));

			newItem.append(hiddenElement).click(function(e) {
				e.preventDefault();
				hiddenElement.slideToggle(200);
			});
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
		
		if (searchQuery !== "") {
			$(".help").hide();
			$(".tooltip").addClass("resultsDisplayed");
			$(".searchInfo").text("Searching for \"" + searchQuery + "\"");
			if (personSearchCount > 0) {
				$(".peopleCount").text(allSearchResults.length + (allSearchResults.length == 1 ? " Goan found" : " Goans found"));
				$(".city").text("in " + searchCities + (searchCities == 1 ? " city" : " cities"));
				$(".pointerInfo").show();
				var cityInfo = $(".cityInfo");
				cityInfo.empty();
				for (var k = 0; k < allSearchResults.length; k++)
					cityInfo.append(createItemFromPerson(allSearchResults[k], true));
				cityInfo.show();
			} else {
				$(".peopleCount").text("No Goans found");
				$(".city").empty();
				$(".pointerInfo").show();
				$(".cityInfo").empty().show();
			}
		} else {
			$(".help").show();
			$(".tooltip").removeClass("resultsDisplayed");
		}

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
			$(".searchInfo").text(searchQuery ? "Searching for \"" + searchQuery + "\"" : "");
			$(".peopleCount").text(people.length + " Goan" + (people.length == 1 ? "" : "s"));
			$(".city").text("in " + curCity.name);
			$(".pointerInfo").show();

			var cityInfo = $(".cityInfo");
			cityInfo.empty();
			
			// Loop all people in city
			for (var k = 0; k < people.length; k++) {
				cityInfo.append(createItemFromPerson(people[k]));
			}

			if (searchQuery !== "") {
				var clickToReturn = Modernizr.touch ? $("<a>") : $("<div>");
				clickToReturn
					.attr("href", "#")
					.addClass("returnToSearch")
					.text("Click here to return to all results")
					.click(function(e) {
						e.preventDefault();
						unselectMarkers();
					});
				cityInfo.append(clickToReturn);
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
	var updateMarker = function(markerID, overridePeople) {
		// Override people
		var people = overridePeople;
		if (people.length === 0) people = cityData[markerID].people;
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

	var reloadMarkers = function(reloadSearch) {
		//var d = new Date().getTime();
		var i, limitCounter = 0;
		reloadSearch = typeof reloadSearch !== 'undefined';

		var tempSearchCount = 0;
		var weAreSearching = (searchQuery !== "");
		var searchArray = searchQuery.split(/\s+/);

		if (reloadSearch) {
			allSearchResults = [];
			searchCities = 0;
		}

		// If mobile device, display the most markers possible
		for (i = cityData.length - 1; i >= 0; i--) {

			if (reloadSearch) {
				var searchResults = [];
				if (weAreSearching) {
					var people = cityData[i].people;
					for (var j = 0; j < people.length; j++) {
						var isFound = true;
						var personName = people[j].name.toLowerCase();
						for (var l = 0; l < searchArray.length; l++) {
							if (personName.indexOf(searchArray[l]) == -1) isFound = false;
						}
						if (isFound) {
							searchResults.push(people[j]);
							people[j].location = cityData[i].name;
							allSearchResults.push(people[j]);
						}
					}
					tempSearchCount += searchResults.length;
				}
				cityData[i].searchResults = searchResults;
			}

			var isInResult = cityData[i].searchResults.length !== 0;
			var isInMap = cityData[i].marker.getMap() !== null;
			var isInBounds = map.getBounds().contains(cityData[i].marker.getPosition());

			if (isInResult) searchCities++;

			// If we are searching and the city is in the search result OR we are not searching and it's not on the map AND it is in the map bounds
			if (((weAreSearching && isInResult && (reloadSearch || !isInMap)) || (!weAreSearching && (reloadSearch || !isInMap))) && isInBounds) {
				updateMarker(i, cityData[i].searchResults);
			} else if ((isInMap && !isInBounds) || (weAreSearching && !isInResult && isInMap && isInBounds)) {
				removeMarker(i);
			}

			if (Modernizr.touch && cityData[i].marker.getMap() !== null && ++limitCounter > mobileMarkerLimit)
				break;
		}

		// Sort search results
		if (reloadSearch) {
			personSearchCount = tempSearchCount;
			allSearchResults.sort(function(a, b) {
				return a.lastName < b.lastName ? -1 :
					a.lastName > b.lastName ? 1 :
					a.firstName < b.firstName ? -1 :
					a.firstName > b.firstName ? 1 :
					a.middleName < b.middleName ? -1 :
					a.middleName > b.middleName ? 1 : 0;
			});
		}

		// Remove the rest of the markers to save memory
		if (Modernizr.touch && limitCounter >= mobileMarkerLimit)
			for (var k = 0; k <= i; k++) removeMarker(k);

		//console.log("reloading took " + (new Date().getTime() - d) + " ms");
	};

	// Get data after map is fully loaded
	google.maps.event.addListenerOnce(map, 'idle', function() {

		// Get map data from database
		$.getJSON("/data", function(data, textStatus, jqXHR) {
			cityData = data;

			// Measure how many timeouts and intervals are set
			var totalTimeouts = 0;
			var totalIntervals = 0;
			
			for (var i = 0; i < cityData.length; i++) {
				var population = cityData[i].people.length;
				var scale = getScaleFromPopulation(population);

				// Add marker
				var curMarker = addMarker(i, !Modernizr.touch);

				cityData[i].searchResults = [];

				// Load social media buttons when animation is complete
				var finishedAnimation = function() {
					$.ajaxSetup({ cache: true });
					$.getScript("/javascripts/social.js");
					google.maps.event.addListener(map, "idle", reloadMarkers);
					var justTyped, timer = 0;
					(justTyped = function() {
						var enteredQuery = $.trim($(".search").val().toLowerCase());
						if (searchQuery != enteredQuery) {
							searchQuery = enteredQuery;
							(function() {
								clearTimeout(timer);
								timer = setTimeout(function() {
									reloadMarkers(true);
									unselectMarkers();
								}, 300);
							})();
						}
					}).call(this);
					$(".search").bind("propertychange keyup input paste", justTyped);
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

