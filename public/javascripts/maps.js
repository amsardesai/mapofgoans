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
	

	// Get data after map is fully loaded
	google.maps.event.addListenerOnce(map, 'tilesloaded', function() {

		// Get map data from database
		$.getJSON("/data", function(datapoints, textStatus, jqXHR) {

					var totalFrames = 0;
					var totalTimeouts = 0;
					var totalIntervals = 0;

			for (var i = 0; i < datapoints.length; i++) {

				// Calculate size of marker
				var population = datapoints[i].people.length;
				var scale = Math.round(10 * Math.pow(population / 5, 0.5));

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
					scale: 0
				};

				// Initiaize marker
				var curMarker = new google.maps.Marker({
					position: new google.maps.LatLng(datapoints[i].location.lat,datapoints[i].location.lng),
					map: map,
					icon: icon
				});

				markers.push(curMarker);

				// Load social media buttons when animation is complete
				var finishedAnimation = function() {
					$.getScript("/javascripts/social.js");
				};

				if (!Modernizr.touch) {

					// Tooltip for markers
					var tooltip = new Tooltip({
						marker: curMarker,
						content: population + (population == 1 ? " person" : " people") + " in <br />" + datapoints[i].name,
						offsetX: -65,
						offsetY: -(42 + scale),
						cssClass: "mapTooltip"
					});

					// Highly optimized numbers intended to leave no idle time slots or overlapping threads
					var animationDelay = 41;
					var datapointDelay = 33;


					// Marker animating in the beginning
					(function() {
						var markerNumber = i;
						var marker = curMarker;
						var newScale = scale * 2;
						var curScale = 0;
						var icon = {
							path: google.maps.SymbolPath.CIRCLE,
							fillOpacity: 0.4,
							fillColor: color2,
							strokeOpacity: 1.0,
							strokeColor: color3,
							strokeWeight: 2,
							scale: 0
						};

						var count = 0;
						var curTimer;

						// Recursively increases size over time
						var animateMarker = function() {
							curScale = Math.ceil(curScale + ((newScale - curScale) * 0.6) + 0.3);
							if (curScale < newScale) {
								icon.scale = curScale / 2;
							} else {
								icon.scale = newScale / 2;
								clearInterval(curTimer);
								if (--totalIntervals === 0 && totalTimeouts === 0)
									finishedAnimation();
							}

							//count++;
							//totalFrames++;
							//console.log("timeouts: "+totalTimeouts+", intervals: "+totalIntervals+", frame "+totalFrames+": mark #"+markerNumber+" @ "+count+": "+curScale+"/"+newScale);
							marker.setIcon(icon);
						};
						
						// Initial call to animateMarker
						totalTimeouts++;
						setTimeout(function() {
							totalTimeouts--;
							totalIntervals++;
							curTimer = setInterval(animateMarker, animationDelay);
						}, Math.floor(markerNumber / 3) * datapointDelay + 100);

					})();
				} else finishedAnimation();


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

						// Sort by last name
						var people = curCity.people;
						people.sort(function(a, b) {
							if (a.lastName < b.lastName)
								return -1;
							else if (a.lastName > b.lastName)
								return 1;
							return 0;
						});

						console.log(people);

						// Manipulate UI
						$(".tooltip").hide();
						$(".pointerInfo").show();
						$(".city").text(curCity.name);
						$(".peopleCount").text(people.length + " Goan" + (people.length == 1 ? "" : "s"));
						$(".cityInfo").empty();
						
						// Loop all people in city
						for (var k = 0; k < people.length; k++) {
							(function() {
								var person = people[k];

								// Use a instead of div on mobile so they can see highlight while clicking
								var newItem = Modernizr.touch ? $("<a>") : $("<div>");
								newItem.addClass("person");
								newItem.append($("<div class='name'>").text(person.name));

								// If details exist then display them
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
									newItem.append(hiddenElement.html(html)).click(function(e) {
										e.preventDefault();
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

		//console.log(markers);

		});
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

