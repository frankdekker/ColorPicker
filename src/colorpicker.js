


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
		this.palette.show( event.target.value );
	},

	onSelect: function() {
		if ( this.current
		&&   this.current.get( "tag" ) == "input"
		&&   this.current.get( "type" ) == "text" )
			this.current.set( "value", color );
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
			return new Element( 'input', { type: Browser.ie ? "text" : "number", "min": min, "max": max, "size": 3, "maxLength": 3, "class": this.options.classPrefix + c + " number" } ).inject( p )
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
				this.setColor( [ x, y, this.rcursor.getStyle( "top" ).toInt() + 5 ], 'xyz', 'palette' );
			}.bind( this )
		});

		// rainbow
		var rainbow = f( "rainbow", this.lightbox );
		this.rcursor = f( "cursor", rainbow );

		this.rdrag = new ColorPicker.Drag( rainbow, {
			limit: { x: [0, 255], y: [0, 255] },
			onDrag: function( x, y ) {
				this.setColor( [ this.pcursor.getStyle( "left" ).toInt() + 6, this.pcursor.getStyle( "top" ).toInt() + 6, y ], 'xyz', 'rainbow' );
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
		this.input.hex = new Element( "input", { type: "text", "class": this.options.classPrefix + "hex", "size": 7, "maxLength": 7 } ).inject( hex );

		// keybounds
		this.bounds = {};
		this.bounds.rgb = new ColorPicker.KeyBounds( [ this.input.rgb.r, this.input.rgb.g, this.input.rgb.b ], {
			onChange: function( element, value ) {
				var rgb = [ this.input.rgb.r.get( "value" ).toInt(), this.input.rgb.g.get( "value" ).toInt(), this.input.rgb.b.get( "value" ).toInt() ];
				this.setColor( rgb, 'rgb', 'rgb' );
			}.bind( this )
		});
		this.bounds.hsb = new ColorPicker.KeyBounds( [ this.input.hsb.h, this.input.hsb.s, this.input.hsb.b ], {
			onChange: function( element, value ) {
				var hsb = [ this.input.hsb.h.get( "value" ).toInt(), this.input.hsb.s.get( "value" ).toInt(), this.input.hsb.b.get( "value" ).toInt() ];
				this.setColor( hsb, 'hsb', 'hsb' );
			}.bind( this )
		});
		this.bounds.hex = new ColorPicker.KeyBounds( [ this.input.hex ], {
			type: 'hex',
			onChange: function( element, value ) {
				var rgb = ( value && value.hexToRgb ? value.hexToRgb( true ) : null ) || [ 0, 0, 0 ];
				this.setColor( rgb, 'rgb', 'hex' );
			}.bind( this )
		});

		// buttons
		var buttons = f( "buttons", this.lightbox );
		this.buttons = {};
		this.buttons.ok = new Element( "a", { href: "javascript:;", "class": this.options.classPrefix + "button okbutton", text: this.options.language['picker-button-ok'] } ).inject( buttons );
		this.buttons.cancel = new Element( "a", { href: "javascript:;", "class": this.options.classPrefix + "button cancelbutton", text: this.options.language['picker-button-cancel'] } ).inject( buttons );
	},

	// show picker
	show: function( color ) {

		// sanitize parameter
		color = ( color && color.hexToRgb ? color.hexToRgb( true ) : null ) || [ 0, 0, 0 ];

		// set current preview
		this.preview.c.setStyle( "background-color", color.rgbToHex() );

		// set color
		this.setColor( color, 'rgb', 'show' );

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

	setColor: function( color, type, source ) {

		var hex, rgb, hsb, xyz = null;

		// color conversion
		switch( type )
		{
			case "rgb":
				rgb = color;
				hex = color.rgbToHex();
				hsb = color.rgbToHsb();
				xyz = hsb.hsbToXyz();
				break;

			case "hsb":
				hsb = color;
				rgb = color.hsbToRgb();
				xyz = color.hsbToXyz();
				hex = rgb.rgbToHex();
				break;

			case "xyz":
				xyz = color;
				hsb = color.xyzToHsb();
				rgb = hsb.hsbToRgb();
				hex = rgb.rgbToHex();
				break;
		}

		// set overlay hue
		if ( source != 'palette' )
			this.overlay1.setStyle( "background-color", hex );

		// set HSB
		if ( source != 'hsb' )
		{
			this.input.hsb.h.value = hsb[0];
			this.input.hsb.s.value = hsb[1];
			this.input.hsb.b.value = hsb[2];
		}

		// set RGB
		if ( source != 'rgb' )
		{
			this.input.rgb.r.value = rgb[0];
			this.input.rgb.g.value = rgb[1];
			this.input.rgb.b.value = rgb[2];
		}

		// set hex
		if ( source != 'hex' )
			this.input.hex.value = hex;

		// set cursors
		this.pcursor.setStyles({ left: xyz[0] - 6, top: xyz[1] - 6 });
		this.rcursor.setStyles({ top: xyz[2] - 5 });

		// set preview
		this.preview.n.setStyle( "background-color", hex );

		// fire event
		if ( source != 'show' && this.colors.current != hex ) this.fireEvent( "change", hex );

		// store current color state
		this.colors.current = hex;
	},

	select: function() {
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
		this.bounds.rgb.attach();
		this.bounds.hsb.attach();
		this.bounds.hex.attach();
		this.buttons.ok.addEvent( "click", this.select );
		this.buttons.cancel.addEvent( "click", this.cancel );
	},

	detach: function() {
		this.rdrag.detach();
		this.pdrag.detach();
		this.bounds.rgb.detach();
		this.bounds.hsb.detach();
		this.bounds.hex.detach();
		this.buttons.ok.removeEvent( "click", this.select );
		this.buttons.cancel.removeEvent( "click", this.cancel );
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
	Implements: [Events,Options],
	options: {
		type: 'numbers'
		//onChange: function( element, value ) {}
	},

	initialize: function( elements, options ) {
		this.elements = elements;
		this.setOptions( options );

		this.onKeyDown = this.onKeyDown.bind( this );
		this.onValidate = this.onValidate.bind( this );
	},	

	onKeyDown: function( event ) {

		switch( event.code )
		{
			case 35: // home
			case 36: // end
			case 37: // up
			case 38: // left
			case 39: // down
			case 40: // right
			case 46: // delete
			case  8: // backspace

			case 96: // num 0 - 9
			case 97:
			case 98:
			case 99:
			case 100:
			case 101:
			case 102:
			case 103:
			case 104:
			case 105:
				return true;

			case 48: // 0 - 9
			case 49:
			case 50:
			case 51:
			case 52:
			case 53:
			case 54:
			case 55:
			case 56:
			case 57:
				if ( event.shift ) break;
				return true;
		}

		if ( this.options.type == 'numbers' )
		{
			event.stop();
			return false;
		}
	},

	onValidate: function( event ) {

		var element = event.target;
		var previous = element.retrieve( "keybounds:previous" );
		var value = element.value;
		var min, max;

		if ( !value || value == null || value == undefined || value == "" )
			return;

		value = value.trim();

		// sanitize
		if ( this.options.type == 'numbers' )
			value = value.replace( /[^0-9]/g, "" );

		else if ( this.options.type == 'hex' )
			value = value.replace( /[^#A-Fa-f0-9]/g, "" );

		// limit
		if ( (min = element.get( "min" )) && value.toInt() < min.toInt() )
			value = min;

		if ( (max = element.get( "max" )) && value.toInt() > max.toInt() )
			value = max;

		if ( element.value != value )
			element.value = value;

		if ( !previous || previous != value )
		{
			element.store( "keybounds:previous", value );
			this.fireEvent( "change", [element, value ] );
		}
	},

	attach: function() {
		this.elements.each( function( elm ) {
			elm.addEvent( "keydown", this.onKeyDown );
			elm.addEvent( "keyup", this.onValidate );
			elm.addEvent( "change", this.onValidate );
			elm.addEvent( "paste", this.onValidate );
		}.bind( this ) );
	},

	detach: function() {
		this.elements.each( function( elm ) {
			elm.removeEvent( "keydown", this.onKeyDown );
			elm.removeEvent( "keyup", this.onValidate );
			elm.removeEvent( "change", this.onValidate );
			elm.removeEvent( "paste", this.onValidate );
		}.bind( this ) );
	}
});

/**
 * HSB - XYZ conversion functions
 */
Array.implement({

	hsbToXyz: function()
	{
		var h = this[0], s = this[1], b = this[2];
		var x = Math.min( Math.max( Math.round( s * 255 / 100 ), 0 ), 255 );
		var y = Math.min( Math.max( Math.round( ( 100 - b ) * 255 / 100 ), 0 ), 255 );
		var z = Math.min( Math.max( Math.round( ( 360 - h ) * 255 / 360 ), 0 ), 255 );
		return [ x, y, z ];
	},

	xyzToHsb: function() {
		var x = this[0], y = this[1], z = this[2];
		var s = Math.min( Math.max( Math.round((x * 100) / 255), 0 ), 100 );
		var b = Math.min( Math.max( 100 - Math.round((y * 100) / 255), 0 ), 100 );
		var h = 360 - Math.round((z * 360) / 255);
		h = (h >= 360) ? 0 : (h < 0) ? 0 : h;
		return [h, s, b];
	}

});

/**
 * Add RGB - HSB functions, if not available
 */
if ( !Array.rgbToHsb || !Array.hsbToRgb )
{
	Array.implement({

		rgbToHsb: function(){
			var red = this[0],
				green = this[1],
				blue = this[2],
				hue = 0;
			var max = Math.max(red, green, blue),
				min = Math.min(red, green, blue);
			var delta = max - min;
			var brightness = max / 255,
				saturation = (max != 0) ? delta / max : 0;
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

		hsbToRgb: function(){
			var br = Math.round(this[2] / 100 * 255);
			if (this[1] == 0){
				return [br, br, br];
			} else {
				var hue = this[0] % 360;
				var f = hue % 60;
				var p = Math.round((this[2] * (100 - this[1])) / 10000 * 255);
				var q = Math.round((this[2] * (6000 - this[1] * f)) / 600000 * 255);
				var t = Math.round((this[2] * (6000 - this[1] * (60 - f))) / 600000 * 255);
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
};