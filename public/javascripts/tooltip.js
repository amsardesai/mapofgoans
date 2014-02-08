/*
Constructor for the tooltip
@ param options an object containing: marker(required), content(required) and cssClass(a css class, optional)
@ see google.maps.OverlayView()
*/



function Tooltip(options) {

    this.offset_ = 5;

    // Now initialize all properties.
    this.marker_ = options.marker;
    this.content_ = options.content;
    this.map_ = options.marker.get('map');
    this.offsetX_ = options.offsetX || 0;
    this.offsetY_ = options.offsetY || 0;
	this.cssClass_ = options.cssClass || null;

    // We define a property to hold the content's
    // div. We'll actually create this div
    // upon receipt of the add() method so we'll
    // leave it null for now.
    this.div_ = null;

    // Explicitly call setMap on this overlay
    this.setMap(this.map_);

    // Fixes scoping bug inside listener
    var me = this;

	// Show tooltip on mouseover event.
	google.maps.event.addListener(me.marker_, 'mouseover', function() {
		me.show();
	});
	// Hide tooltip on mouseout event.
	google.maps.event.addListener(me.marker_, 'mouseout', function() {
		me.hide();
	});
}
// Now we extend google.maps.OverlayView()
Tooltip.prototype = new google.maps.OverlayView();

// onAdd is one of the functions that we must implement, 
// it will be called when the map is ready for the overlay to be attached.
Tooltip.prototype.onAdd = function() {

    // Create the DIV and set some basic attributes.
    var div = $("<div>").css({
        position: "absolute",
        display: "none"
    }).html(this.content_);

	if(this.cssClass_) div.addClass(this.cssClass_);

    // Set the overlay's div_ property to this DIV
    this.div_ = div;

    // We add an overlay to a map via one of the map's panes.
    // We'll add this overlay to the floatPane pane.
    var panes = this.getPanes();
    panes.floatPane.appendChild(this.div_.get(0));

    this.opacity_ = $(this.div_).css("opacity");
	
};

// We here implement draw
Tooltip.prototype.draw = function() {

    // Position the overlay. We use the position of the marker
    // to peg it to the correct position, just northeast of the marker.
    // We need to retrieve the projection from this overlay to do this.
    var overlayProjection = this.getProjection();

    // Retrieve the coordinates of the marker
    // in latlngs and convert them to pixels coordinates.
    // We'll use these coordinates to place the DIV.
    var ne = overlayProjection.fromLatLngToDivPixel(this.marker_.getPosition());

    // Position the DIV.
    this.div_.css({
        left: ne.x + this.offsetX_,
        top: ne.y + this.offsetY_
    });
    
    this.curTop_ = ne.y + this.offsetY_;
};

// We here implement onRemove
Tooltip.prototype.onRemove = function() {
    this.div_.remove();
    this.div_ = null;
};

Tooltip.prototype.show = function() {
    if (this.div_) {
        this.div_
            .stop()
            .css({
                display: "inline-block",
                opacity: 0,
                top: this.curTop_ - this.offset_
            })
            .animate({
                opacity: this.opacity_,
                top: this.curTop_
            }, 200);
    }
};

Tooltip.prototype.hide = function() {
    if (this.div_) {
        this.div_
            .stop()
            .animate({
                opacity: 0,
                top: this.curTop_ - this.offset_
            }, 200, function() {
                $(this).css({
                    display: "none"
                });
            });
    }
};