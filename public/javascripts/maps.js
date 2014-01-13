
var initialize = function() {

	var mapOptions = {
		center: new google.maps.LatLng(-34.397, 150.644),
		zoom: 8
	};

	var map = new google.maps.Map(document.getElementById("mapcanvas"), mapOptions);

};

google.maps.event.addDomListener(window, 'load', initialize);