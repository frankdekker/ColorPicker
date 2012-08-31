


var ColorPicker = new Class({
	Implements: [Options],
	options: {
		classPrefix: "colorpicker-",
		presets: [
			[ '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF' ],
			'divider',
			[ '#980000', '#FF0000', '#FF9900', '#FF0000', '#00FF00', '#00FFFF', '#4a86e8', '#0000FF', '#9900FF', '#FF00FF' ],
			'divider',
			[ '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc' ],
			[ '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd' ],
			[ '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0' ],
			[ '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79' ],
			[ '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47' ],
			[ '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130' ]
		],
		offset: { x: 0, y: 0 },
		language: {
			"presets-button-custom": "Custom...",
			"picker-label-new": "New",
			"picker-label-current": "Current",
			"picker-button-ok": "Select",
			"picker-button-cancel": "Cancel"
		},
		history: 10,
		cookie: true,
		boxshadow: true
		// onSelect( color )
		// onChange( color )
		// onCancel( )

	},

	initialize: function( elements, options ) {
		this.elements = elements;
		this.setOptions( options );

		// bind function
		this.showPresets = this.showPresets.bind( this );
		this.showPalette  = this.showPalette.bind( this );

		// attach events
		this.attach();
	},

	showPresets: function( event ) {
		this.presets = this.presets || new ColorPicker.Presets( this.options );
		this.presets.show( event.target );
	},

	showPalette: function( event ) {
		this.palette = this.palette || new ColorPicker.Palette( this.options );
		this.palette.show( event.target, event.target.value );
	},

	/**
	 * Attach focus listeners to the elements
	 */
	attach: function() {
		this.elements.each( function( elm ) {
			elm.addEvent( "click", this.showPalette );
		}.bind( this ));
	},

	/**
	 * Detach focus listeners from all elements
	 */
	detach: function() {
		this.elements.each( function( elm ) {
			elm.removeEvent( "click", this.showPresets );
		}.bind( this ));
	}

});


/**
 * Colorpicker Palette class
 *
 */
ColorPicker.Palette = new Class({
	Implements: [Events,Options],

	initialize: function( options ) {
		this.setOptions( options );
		this.current = null;
		this.colors = {};

		this.select = this.select.bind( this );
		this.cancel = this.cancel.bind( this );

		this.create();
		this.attach();
	},

	create: function() {

		var f = function( c, p, t ){return new Element( t ? t : 'div', { "class": this.options.classPrefix + c  } ).inject( p )}.bind( this );
		var i = function( l, c, p, min, max ){
			new Element( 'span', { "class": this.options.classPrefix + "label", text: l } ).inject( p );
			return new Element( 'input', { type: "number", min: min, max: max, size: 3, maxlength: 3, "class": this.options.classPrefix + c + " number" } ).inject( p )
		}.bind( this );

		// lightbox
		this.lightbox = f( "lightbox", document.body );
		this.lightbox.set( "tween", { duration: 201 } );

		// lightbox shadow
		if ( this.options.boxshadow && Browser.ie && Browser.version <= 8 )
			this.boxshadow = new Element( "div", { "class": this.options.classPrefix + "ie-boxshadow" }).inject( this.lightbox, 'after' );

		// Browser Quirks
		if ( Browser.ie7 ) this.lightbox.addClass( "ie7 ie78" );
		if ( Browser.ie8 ) this.lightbox.addClass( "ie8 ie78" );

		// palette
		this.palette  = f( "palette", this.lightbox );
		this.overlay1 = f( "overlay1", this.palette );
		this.overlay2 = f( "overlay2", this.palette );
		this.pcursor  = f( "cursor", this.palette );

		// drag event
		this.pdrag = new ColorPicker.Drag( this.palette, {
			cursor: false,
			limit: { x: [0, 255], y: [0, 255] },
			onDrag: function( x, y ) {
				this.setColor( x, y, null );
			}.bind( this )
		});

		// rainbow
		var rainbow = f( "rainbow", this.lightbox );
		this.rcursor = f( "cursor", rainbow );

		this.rdrag = new ColorPicker.Drag( rainbow, {
			limit: { x: [0, 255], y: [0, 255] },
			onDrag: function( x, y ) {
				this.setColor( null, null, y );
			}.bind( this )
		});

		// preview
		var preview = f( "preview", this.lightbox );
		this.preview = {};
		this.preview.n = f( "new", preview );
		this.preview.c = f( "current", preview );
		new Element( "span", { "class": this.options.classPrefix + "label label-new", text: this.options.language['picker-label-new'] } ).inject( preview );
		new Element( "span", { "class": this.options.classPrefix + "label label-current", text: this.options.language['picker-label-current'] } ).inject( preview );

		// input holders
		this.input = { rgb: {}, hsb: {} };

		// rgb
		var rgb = f( "colors-rgb", this.lightbox );
		var rgbR = f( "color-r", rgb );
		var rgbG = f( "color-g", rgb );
		var rgbB = f( "color-b", rgb );

		this.input.rgb.r = i( "R", "input-r", rgbR, 0, 255 );
		this.input.rgb.g = i( "G", "input-g", rgbG, 0, 255 );
		this.input.rgb.b = i( "B", "input-b", rgbB, 0, 255 );

		// hsb
		var hsb = f( "colors-hsb", this.lightbox );
		var hsbH = f( "color-h", hsb );
		var hsbS = f( "color-s", hsb );
		var hsbB = f( "color-b", hsb );

		this.input.hsb.h = i( "H", "input-h", hsbH, 0, 360 );
		this.input.hsb.s = i( "S", "input-s", hsbS, 0, 100 );
		this.input.hsb.b = i( "B", "input-b", hsbB, 0, 100 );

		// hex
		var hex = f( "colors-hex", this.lightbox );
		new Element( "span", { "class": this.options.classPrefix + "label", text: "HEX" } ).inject( hex );
		this.input.hex = new Element( "input", { type: "text", "class": this.options.classPrefix + "hex", size: 7, maxlength: 7 } ).inject( hex );

		// buttons
		var buttons = f( "buttons", this.lightbox );
		this.buttons = {};
		this.buttons.ok = new Element( "a", { href: "javascript:;", "class": this.options.classPrefix + "button okbutton", text: this.options.language['picker-button-ok'] } ).inject( buttons );
		this.buttons.cancel = new Element( "a", { href: "javascript:;", "class": this.options.classPrefix + "button cancelbutton", text: this.options.language['picker-button-cancel'] } ).inject( buttons );
	},

	// show picker
	show: function( element, color ) {

		// store current element
		this.current = element;

		// sanitize parameter
		color = ( color && color.hexToRgb ? color.hexToRgb( true ) : null ) || [ 0, 0, 0 ];

		// set current preview
		this.preview.c.setStyle( "background-color", color.rgbToHex() );

		// set color
		color = this.rgbToHsb( color[0], color[1], color[2] );
		color = this.hsbToXyz( color[0], color[1], color[2] );
		this.setColor( color[0], color[1], color[2], true );

		var dSize = window.getScrollSize();
		var dBox = this.lightbox.getSize();
		var vPort = window.getSize();
		var dScroll = window.getScroll();

		// show lightbox
		this.lightbox.setStyles({
			opacity: 0,
			top: Math.max( 0, dScroll.y + ( vPort.y - dBox.y ) / 2 ),
			left: Math.max( 0, dScroll.x + ( vPort.x - dBox.x ) / 2 )
		});
		this.lightbox.tween( "opacity", 1 );

		// show boxshadow
		if ( this.boxshadow )
		{
			this.lightbox.get( "tween" ).chain( function() {
				this.boxshadow.setStyles({
					width: dBox.x,
					height: dBox.y,
					left: this.lightbox.getStyle( "left" ).toInt() - 7,
					top: this.lightbox.getStyle( "top" ).toInt() - 7
				});
				this.boxshadow.tween( "opacity", 1 );
			}.bind( this ));
		}
	},

	// hide picker
	hide: function() {

		var styleReset = { width: null, height: null, left: null, top: null, opacity: null };

		this.lightbox.tween( "opacity", 0 );
		if ( this.boxshadow ) this.boxshadow.setStyles( styleReset );

		this.lightbox.get( "tween" ).chain( function() {
			this.lightbox.setStyles( styleReset );
		}.bind( this ));
	},

	setColor: function( x, y, z, noEvent ) {

		var z0 = z;

		x = x === null ? this.pcursor.getStyle( "left" ).toInt() + 6 : x;
		y = y === null ? this.pcursor.getStyle( "top" ).toInt() + 6 : y;
		z = z === null ? this.rcursor.getStyle( "top" ).toInt() + 5 : z;

		// HSB
		var s = Math.min( Math.max( Math.round((x * 100) / 255), 0 ), 100 );
		var b = Math.min( Math.max( 100 - Math.round((y * 100) / 255), 0 ), 100 );
		var h = 360 - Math.round((z * 360) / 255);
		h = (h >= 360) ? 0 : (h < 0) ? 0 : h;
		var hsb = [h, s, b];

		// set overlay hue
		if ( z0 !== null )
			this.overlay1.setStyle( "background-color", this.hsbToRgb( h, 100, 100 ).rgbToHex() );

		// set HSB
		this.input.hsb.h.value = h;
		this.input.hsb.s.value = s;
		this.input.hsb.b.value = b;

		// set RGB
		var rgb = this.hsbToRgb( h, s, b );
		this.input.rgb.r.value = rgb[0];
		this.input.rgb.g.value = rgb[1];
		this.input.rgb.b.value = rgb[2];

		// set hex
		var hex = rgb.rgbToHex();
		this.input.hex.value = hex;

		// set cursors
		this.pcursor.setStyles({ left: x - 6, top: y - 6 });
		this.rcursor.setStyles({ top: z - 5 });

		// set preview
		this.preview.n.setStyle( "background-color", hex );

		// fire event
		if ( !noEvent && this.colors.current != hex ) this.fireEvent( "change", hex );

		// store current color state
		this.colors.current = hex;
	},

	select: function() {

		if ( this.current
		&&   this.current.get( "tag" ) == "input"
		&&   this.current.get( "type" ) == "text" )
			this.current.set( "value", this.colors.current );

		// fire event
		this.fireEvent( "select", this.colors.current );
		this.hide();
	},

	cancel: function() {
		this.fireEvent( "cancel" );
		this.hide();
	},

	attach: function() {
		this.rdrag.attach();
		this.pdrag.attach();
		this.buttons.ok.addEvent( "click", this.select );
		this.buttons.cancel.addEvent( "click", this.cancel );
	},

	detach: function() {
		this.rdrag.detach();
		this.pdrag.detach();
		this.buttons.ok.removeEvent( "click", this.select );
		this.buttons.cancel.removeEvent( "click", this.cancel );
	},

	hsbToXyz: function( h, s, b )
	{
		var x = Math.min( Math.max( Math.round( s * 255 / 100 ), 0 ), 255 );
		var y = Math.min( Math.max( Math.round( ( 100 - b ) * 255 / 100 ), 0 ), 255 );
		var z = Math.min( Math.max( Math.round( ( 360 - h ) * 255 / 360 ), 0 ), 255 );
		return [ x, y, z ];
	},

	rgbToHsb: function( red, green, blue ) {
		var hue = 0;
		var max = Math.max(red, green, blue), min = Math.min(red, green, blue);
		var delta = max - min;
		var brightness = max / 255, saturation = (max != 0) ? delta / max : 0;
		if (saturation != 0){
			var rr = (max - red) / delta;
			var gr = (max - green) / delta;
			var br = (max - blue) / delta;
			if (red == max) hue = br - gr;
			else if (green == max) hue = 2 + rr - br;
			else hue = 4 + gr - rr;
			hue /= 6;
			if (hue < 0) hue++;
		}
		return [Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100)];
	},

	hsbToRgb: function( h, s, b ) {
		var br = Math.round( b / 100 * 255);
		if ( s == 0){
			return [br, br, br];
		} else {
			var hue = h % 360;
			var f = hue % 60;
			var p = Math.round((b * (100 - s)) / 10000 * 255);
			var q = Math.round((b * (6000 - s * f)) / 600000 * 255);
			var t = Math.round((b * (6000 - s * (60 - f))) / 600000 * 255);
			switch (Math.floor(hue / 60)){
				case 0: return [br, t, p];
				case 1: return [q, br, p];
				case 2: return [p, br, t];
				case 3: return [p, q, br];
				case 4: return [t, p, br];
				case 5: return [br, p, q];
			}
		}
		return false;
	}


});


/**
 * Presets
 */
ColorPicker.Presets = new Class({
	Implements: [Options],

	initialize: function( options ) {
		this.setOptions( options );

		this.create();
		this.loadColors();

		this.blur = this.blur.bind( this );
		this.hide = this.hide.bind( this );


		// cookie domain
		this.domain = document.location.hostname == "localhost" ? false : document.location.hostname;
	},

	create: function() {
		// create dropdown
		this.dropdown = new Element( 'div', { "class": this.options.classPrefix + "dropdown" } ).inject( document.body );

		// Browser Quirks
		if ( Browser.ie7 ) this.dropdown.addClass( "ie7 ie78" );
		if ( Browser.ie8 ) this.dropdown.addClass( "ie8 ie78" );

		// create box (for shadow)
		var box = new Element( 'div', {	"class": this.options.classPrefix + "box" } ).inject( this.dropdown );

		// create presets list
		var presets = new Element( 'div', {	"class": this.options.classPrefix + "presets" } ).inject( box );

		// color preset events
		presets.addEvent( "click:relay(div."+this.options.classPrefix+"presets-color)", this.select.bind( this ) );

		// create preset colors
		if ( this.options.presets )
			this.options.presets.each( function( colorRows ) {

				if ( colorRows === 'divider' )
				{
					new Element( 'div', { "class": this.options.classPrefix + "presets-divider"	} ).inject( presets );
					return;
				}

				var row = new Element( 'div', {
					"class": this.options.classPrefix + "presets-row"
				}).inject( presets );

				colorRows.each( function( color ) {

					new Element( 'div', {
						"class": this.options.classPrefix + "presets-color",
						"title": color.toUpperCase(),
						"data-color": color,
						styles: {
							backgroundColor: color
						}
					}).inject( row );

				}.bind( this ));

			}.bind( this ));

		// clear
		new Element( 'div', { styles: { clear: 'both' } } ).inject( presets );


		// custom colorpicker
		var custom = new Element( 'div', {
			"class": this.options.classPrefix + "custom-color",
			"html": this.options.language['presets-button-custom'],
			events: {
				click: function() {
					this.hide();
					this.colorpicker.showPalette();
				}.bind( this )
			}
		}).inject( box );

		// color history
		if ( this.options.history > 0 )
		{
			this.history = new Element( 'div', { "class": this.options.classPrefix + "history"  } ).inject( box );
			for ( var i = 0; i < this.options.history; i++ )
				new Element( 'div', { "class": this.options.classPrefix + "history-color" } ).inject( this.history );
			new Element( 'div', { styles: { clear: 'both' } } ).inject( this.history );
		}
	},

	// select color
	select: function( event ) {

		var color = event.target.get( "data-color" );

		if ( this.current
		&&   this.current.get( "tag" ) == "input"
	    &&   this.current.get( "type" ) == "text" )
			this.current.set( "value", color );

		this.hide();

		this.fireEvent( "select", color );
	},

	// show preset dropdown
	show: function( element ) {
		this.current = element;

		document.addEvent( "mousedown", this.blur );

		var c = element.getCoordinates();

		this.dropdown.setStyles({
			opacity: Browser.ie7 || Browser.ie8 ? 1 : 0,
			left: c.left + this.options.offset.x,
			top: c.top + c.height + this.options.offset.y
		});

		if( !Browser.ie7 && !Browser.ie8 )
			this.dropdown.tween( "opacity", 1 );
	},

	// blur dropdown
	blur: function( event ) {
		console.log( event.target );

		if ( event
		&& ( event.target.hasClass( this.options.classPrefix + "dropdown" )
		||   event.target.getParent( "." + this.options.classPrefix + "dropdown" ) ) )
			return;

		this.hide();
		this.fireEvent( "cancel" );
	},

	// hide preset dropdown
	hide: function() {

		document.removeEvent( "mousedown", this.blur );

		if ( Browser.ie7 || Browser.ie8 )
		{
			this.dropdown.setStyles({
				left: null,
				top: null
			});
			return;
		}

		this.dropdown
			.tween( "opacity", 0 )
			.get( "tween" )
			.chain( function() {
				this.dropdown.setStyles({
					left: null,
					top: null
				});
		}.bind( this ));
	},

	// save colors
	saveColors: function() {
		if ( !this.options.cookie ) return;

		var colors = new Array();

		// gather colors
		this.history.getElements( "." + this.options.classPrefix + "history-color" ).each( function( elm ) {
			var color = elm.get( "data-color" );
			if ( color && !colors.contains( color ) ) colors.push( color );
		}.bind( this ));

		// store colors
		Cookie.write( "colorpicker-colors", colors.join( "|" ), { domain: this.domain, path: '/', duration: 7 });
	},

	// load colors
	loadColors: function() {
		if ( !this.options.cookie ) return;

		var colors = Cookie.read( "colorpicker-colors" );
		if ( !colors ) return;
		colors = colors.split( "|" );

		console.log( colors );
	}
});


ColorPicker.Drag = new Class({

	Implements: [Events, Options],

	options: {
		//onDrag: function( x, y ) {}
		limit: null,
		cursor: true
	},

	initialize: function( element, options ) {

		this.element = document.id( element );
		this.document = this.element.getDocument();
		this.setOptions( options );

		this.selection = (Browser.ie) ? 'selectstart' : 'mousedown';

		if (Browser.ie && !ColorPicker.Drag.ondragstartFixed){
			document.ondragstart = Function.from(false);
			ColorPicker.Drag.ondragstartFixed = true;
		}

		this.bound = {
			start: this.start.bind(this),
			drag: this.drag.bind(this),
			stop: this.stop.bind(this),
			eventStop: Function.from(false)
		};

		this.attach();
	},

	attach: function(){
		this.element.addEvent('mousedown', this.bound.start);
		return this;
	},

	detach: function(){
		this.element.removeEvent('mousedown', this.bound.start);
		return this;
	},

	start: function( event ) {

		this.now = this.element.getPosition();
		this.x = this.y = -1;

		// add events
		var events = {
			mousemove: this.bound.drag,
			mouseup: this.bound.stop
		};
		events[this.selection] = this.bound.eventStop;
		this.document.addEvents( events );

		// hide cursor
		if ( !this.options.cursor ) this.element.setStyle( "cursor", "none" );

		// fire event
		this.fireDrag( event.page.x - this.now.x, event.page.y - this.now.y );
	},

	drag: function( event ) {

		// fire event
		this.fireDrag( event.page.x - this.now.x, event.page.y - this.now.y );
	},

	fireDrag: function( x, y ) {

		if ( this.options.limit )
		{
			x = Math.max( Math.min( x, this.options.limit.x[1] ), this.options.limit.x[0] );
			y = Math.max( Math.min( y, this.options.limit.y[1] ), this.options.limit.y[0] );
		}

		// no change
		if ( this.x == x && this.y == y )
			return;

		this.x = x;
		this.y = y;

		// fire event
		this.fireEvent( "drag", [ x, y ] );
	},

	stop: function( event ) {

		// show cursor
		if ( !this.options.cursor ) this.element.setStyle( "cursor", null );

		// add events
		var events = {
			mousemove: this.bound.drag,
			mouseup: this.bound.stop
		};
		events[this.selection] = this.bound.eventStop;
		this.document.removeEvents( events );
	}

});



ColorPicker.KeyBounds = new Class({
	Implements: [Options],

	initialize: function( elements, options ) {
		this.elements = elements;
		this.setOptions( options );

		this.attach();
	},

	attach: function() {
		this.elements.addEvent( "keydown" );
	}




});