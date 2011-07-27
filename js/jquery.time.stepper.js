/*
 * Time Stepper plugin v1.0.0
 * Created by: Ran Yefet 2011
 * http://ran.yefet.net
 */
( function( $ ) {
	
	// Hold the current time unit field
	var curTimeUnit = 'miliseconds';
	var curEl = false;

	// Contains all default settings
	var defaults = {
		
	};

	var units = {
		'h': 'hours',
		'm': 'minutes',
		's': 'seconds',
		'ms': 'miliseconds'
	};

	// Collection of internal methods
	var _methods = {
		timer: null,
		getTarget: function( ) {
			return curEl.find('.' + curTimeUnit);
		},
		setTimeUnit: function( timeUnit ) {
			curTimeUnit = timeUnit;
			return this;
		},
		getIncreaseNum: function( timeUnit ) {
			var unit = (timeUnit) ? timeUnit : curTimeUnit;
			switch( unit ) {
				case units.ms:
					return 100;
					break;
				default:
					return 1;
					break;
			}
		},
		getMaxTimeUnit: function( timeUnit ) {
			var unit = (timeUnit) ? timeUnit : curTimeUnit;
			switch( unit ) {
				case units.ms:
					return 999;
					break;
				case units.s:
					return 59;
					break;
				case units.m:
					return 59;
					break;
				case units.h:
					return 24;
					break;
			}
		},
		getResetNum: function() {
			switch( curTimeUnit ) {
				case units.ms:
					return '000';
					break;
				default:
					return '00';
					break;
			}
		},
		increase: function() {
				var val = parseFloat( this.getTarget().val() );
				var newVal = val + this.getIncreaseNum();

				return this.update( newVal );
		},
		decrease: function() {
				var val = parseFloat(  this.getTarget().val() );
				var newVal = val - this.getIncreaseNum();

				return this.update( newVal );
		},
		update: function( val ) {
			//console.log( 'Update: '+curTimeUnit + ' - ' + val);
			if( val >= this.getMaxTimeUnit() ) {
				val = this.getMaxTimeUnit();
			} else if( val <= 0 ) {
				val = this.getResetNum();
			}else {
				val = this.addZero( val );
			}
			
			 this.getTarget().val( val );
			 
			 clearTimeout(_methods.timer);
			 _methods.timer = setTimeout( function() {
				_methods.updateTotal();
			 }, 250);

			return this;
		},
		updateTotal: function() {
			var total = '';
			curEl.find('input').each( function() {
				total += this.value + ':';
			});
			total = total.substring(0, total.length-1);

			var toUpdate = curEl.attr('id').replace('ts_', '');

			if( $( '#' + toUpdate ).val() != total ) {
				console.log( curEl.attr('id') + ' Update Total :: c: ' + $( '#' + toUpdate ).val() + ' n: ' + total );
				$( '#' + toUpdate ).val( total );

				var mySettings = curEl.data('settings');

				if( typeof mySettings.onChange == "function" ) {
					mySettings.onChange( methods.getValue( null, curEl ) );
				}
			}
		},
		addZero: function( number ) {
			 var toAdd = '';
			 if( (curTimeUnit == units.ms) && (number < 100) ) {
				 toAdd += '0';
			 }
			 if( number < 10 ) {
				 toAdd += '0';
			 }
			return (toAdd + number);
		},
		formatResult: function( miliseconds, timeUnit ) {
			var result;
			switch( timeUnit ) {
				case units.s:
					result = miliseconds / 1000;
					break;
				case units.m:
					result = ( miliseconds / 1000 ) / 60;
					break;
				case units.h:
					result = (( miliseconds / 1000 ) / 60 ) / 60;
					break;
				default:
					result = miliseconds;
					break;
			};
			return result;
		},
		addHTML: function( el ) {

			var $colons = $('<span />').addClass('colons').text(':');
			var $controls = $('<div />').addClass('controls').append( $('<span />').addClass('plus').text('+'), $('<span />').addClass('minus').text('-') );

			var $timeStepper = $('<div />').attr('id', 'ts_' + el.id ).addClass('time-stepper').append(
				$('<input />').addClass( units.h ).val('00'),
				$colons,
				$('<input />').addClass( units.m ).val('00'),
				$colons.clone(),
				$('<input />').addClass( units.s ).val('00'),
				$colons.clone(),
				$('<input />').addClass( units.ms ).val('000'),
				$controls
			);

			$( el ).val('00:00:00:000').hide().before( $timeStepper );
			
			return $timeStepper;
		}
	};

	// Collection of external methods
	var methods = {
		init : function( options ) {
			
			// Overwrite default settings if we have custom ones
			var settings = {};
			if ( options ) {
					settings = this.extend( {}, defaults, options );
			}
			
			// Register bindings
			return this.each(function(){

				var timeStepper = curEl = _methods.addHTML(this);
				var tsInterval = false;

				timeStepper.data('settings', settings);
				
				timeStepper.bind('click', function() {
					curEl = $( this );
				});

				timeStepper.find('input').bind('focus.ts', function( e ) {

					_methods.setTimeUnit( $( this ).attr( 'class' ) );
					curEl = $(this).parent();
					
					$(this).bind('keydown.ts', function( e ) {
						// If user press up or left increase the number
						if (e.keyCode == 37 || e.keyCode == 38) {
							_methods.increase();
						}

						// If user press down or right decrease the number
						if (e.keyCode == 39 || e.keyCode == 40) {
							_methods.decrease();
						}
					});

				}).bind('blur.ts', function() {
					$(this).unbind('keydown.ts');
				}).bind('change.ts', function() {
					_methods.update( this.value );
				});
				
				timeStepper.find(".plus").bind('mousedown.ts', function() {
					tsInterval = setInterval( function() {_methods.increase();}, 100);
				}).bind('mouseup.ts', function() {
					clearInterval(tsInterval);
				}).bind('click.ts', function() {
					curEl = $(this).parent().parent();
					 _methods.increase();
				});

				timeStepper.find(".minus").bind('mousedown.ts', function() {
					tsInterval = setInterval( function() {_methods.decrease()}, 100);
				}).bind('mouseup.ts', function() {
					clearInterval(tsInterval);
				}).bind('click.ts', function() {
					curEl = $(this).parent().parent();
					_methods.decrease();
				});

			});
		},
		destroy : function( ) {

			return this.each(function(){
				 $(window).unbind('.ts');
			});

		},
		/*
		 * getValue - return the value of the input in different time format
		 * @format {String} - Can be: miliseconds / seconds / minutes / hours
		 */
		getValue: function( format, el ) {
			// Update current element
			el = (el) ? el : $('#ts_' + this.attr('id') );
			
			var hours = parseFloat( el.find('.' + units.h).val() );
			var minutes = parseFloat( el.find('.' + units.m).val() );
			var seconds = parseFloat( el.find('.' + units.s).val() );
			var miliseconds = parseFloat( el.find('.' + units.ms).val() );

			minutes = (hours * 60) + minutes;
			seconds = (minutes * 60) + seconds;
			miliseconds = (seconds * 1000) + miliseconds;

			var result = _methods.formatResult( miliseconds, format );
			result = Math.floor(result * 1000) / 1000;
			
			return result;
		},
		/*
		 * setValue - set the given value to the input
		 * @val {Int} - value in miliseconds
		 */
		setValue: function( val ) {
			// Update current element
			curEl = $('#ts_' + this.attr('id') );

			var miliseconds = Math.floor( val % 1000 );
			var seconds = Math.floor( val / 1000);
			var minutes = Math.floor(seconds / 60);
			var hours = Math.floor(minutes/60);

			seconds = seconds % 60;
			minutes = minutes % 60;

			//console.log('(' +  this.attr('id') + ') Set Value: ' + val + ' = h:' + hours + ', m:' + minutes + ', s:' + seconds + ', ms:' + miliseconds);
			
			_methods.setTimeUnit( units.h ).update( hours );
			_methods.setTimeUnit( units.m ).update( minutes );
			_methods.setTimeUnit( units.s ).update( seconds );
			_methods.setTimeUnit( units.ms ).update( miliseconds );

			return true;
		}
	};

	$.fn.timeStepper = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.timeStepper' );
		}
	};

})( jQuery );
