/**
 * COPYRIGHT NOTICE
 * Copyright (c) 2021 Neue Rituale GbR
 * @author NR <code@neuerituale.com>
 */

(function($, window, document, undefined) {
	'use strict';

	/**
	 * InputfieldGeocode
	 */
	$.InputfieldGeocode = function(el, options) {

		var t = this;
		t.helper = {};
		t.labels = {};

		var defaults = {
			statusOn: 1,
			statusSingleResult: 2,
			statusMultipleResults: 4,
			statusSkipGeocoding: 8,
			statusNotFound: 16,
			statusError: 128,
			initialZoom: 5,
			detailZoom: 15,

			// events
			create: function(){},
			open: function(){}

		};

		t.options = $.extend({}, defaults, options);
		t.$el = $(el);

		/* INIT */

		/**
		 * Init the Program
		 */
		t.init = function() {

			// Form
			t.$query = t.$el.find('.InputfieldGeocoderQuery');

			t.$description = t.$el.find(".InputfieldText .description");
			t.$formatted = t.$el.find('.InputfieldGeocoderFormatted');
			t.formatted = t.$formatted.val();

			t.$provider = t.$el.find('.InputfieldGeocoderProvider');
			t.$status = t.$el.find('.InputfieldGeocoderStatus');
			t.status = parseInt(t.$status.val());

			t.$lat = t.$el.find('.InputfieldGeocoderLat');
			t.$lng = t.$el.find('.InputfieldGeocoderLng');

			t.$geojson = t.$el.find('.InputfieldGeocoderGeojson');
			t.geojson = JSON.parse( t.$geojson.val() );

			t.ajaxurl = t.$el.data('ajaxurl');
			t.labels.notfound = t.$el.data('notfound');
			t.labels.apply = t.$el.data('apply');

			// Dom
			t.$icon = t.$el.find(".InputfieldGeocoderAutocompleteStatus .fa");
			t.$clearButton = t.$el.find(".InputfieldGeocoderAutocompleteClear");

			t.$preview = t.$el.find(".InputfieldGeocoderPreview");
			t.$latlng = t.$el.find(".InputfieldGeocoderLatlng");

			t.$icon.attr('data-class', t.$icon.attr('class'));

			t.map = undefined;
			t.geojsonLayer = undefined;
			t.item = undefined;

			t.helper.updateInputHeight();

			// init
			t.setLatlng(t.$lat.val(), t.$lng.val());
			t.initMap();
			t.initAutocomplete();
			if(t.helper.validGeojson(t.geojson)) t.replaceGeojson(t.geojson);

			// events
			t.$clearButton.click(t.clear.bind(this));
			if(t.$query.val().length) {
				t.$clearButton.show();
			}

			// update mapsize
			$(document).on('wiretabclick', function(e, $newTab, $oldTab) {
				t.map.invalidateSize();
				t.helper.updateInputHeight();
				if(t.helper.validGeojson(t.geojson)) t.replaceGeojson(t.geojson);
			});

			window.mmm = this;

			return this;
		};

		/**
		 * Init map
		 * @returns {jQuery.InputfieldGeocode}
		 */
		t.initMap = function() {

			var center = (!t.$lat.val() && !t.$lng.val())
				? t.$el.data('defaultcenter')
				: [Number(t.$lat.val()), Number(t.$lng.val())]
			;

			var zoom = t.helper.validGeojson(this.geojson) ? t.options.detailZoom : t.options.initialZoom;

			if(!window.hasOwnProperty('L')) return this;

			// init map
			t.map = L.map( t.$preview[0], { scrollWheelZoom: false } ).setView(center, zoom);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(t.map);

			// customize icon
			L.Icon.Default.prototype.options.imagePath = '/site/modules/FieldtypeGeocoder/assets/leaflet@1.7.1/images/'

			return this;
		}

		/**
		 * Init autocomplete
		 * @returns {jQuery.InputfieldGeocode}
		 */
		t.initAutocomplete = function() {

			t.$query.autocomplete({
				minLength: 2,

				source: function(request, response) {

					// Set loading
					t.$icon.attr('class', 'fa fa-fw fa-spin fa-spinner');

					var query = request.term.trim();
					$.getJSON(t.ajaxurl, { q: 'geocoder=' + query }, function(data) {

						t.$icon.attr('class', t.$icon.attr('data-class'));

						if(data.matches.length > 0) {
							t.$icon.attr('class', 'fa fa-fw fa-angle-double-down');
						}
						else {
							t.$icon.attr('class', 'fa fa-fw fa-window-close-o');
						}

						response($.map(data.matches, function(match) {
							var item = t.helper.match2item(match);
								item.total = data.matches.length;
							return item;
						}));
					});
				},

				focus: function() { return false; },

				select: function(event, ui) {
					if(!ui.item) return;

					ui.item.total = 1; /* one selected */
					t.setItem(ui.item);
					t.$query.blur();

					event.stopPropagation();
					return false;
				}

			})

				.blur(function() {
					t.$icon.attr('class', t.$icon.attr('data-class'));
				})

				.keyup(function() {
					t.$icon.attr('class', t.$icon.attr('data-class'));
				})

				.keydown(function(event) {
					if(event.keyCode === 13) {
						event.preventDefault();
						return false;
					}
				})

			;

			return this;
		};

		/**
		 *
		 * @param latLng
		 * @param marker
		 * @returns {jQuery.InputfieldGeocode}
		 */
		t.queryLatLng = function(latLng, marker = undefined) {

			var query = 'geocoder.reverse=' + latLng.lat + ',' + latLng.lng;
			var popup = marker ? marker.getPopup() : undefined;

			if(popup) popup.setContent('<div uk-spinner></div>');

			$.getJSON(t.ajaxurl, { q: query }, function(data) {

				if(data?.matches?.length) {

					var item = data.matches[0];
						item.total = data.matches.length;

					t.setItem(
						t.helper.match2item( item ),
						false,
						true
					);
				} else {
					t.clear({ geojson: false });
					t.helper.removeStatus(t.options.statusSingleResult | t.options.statusMultipleResults).addStatus(t.options.statusNotFound);
					if(popup) popup.setContent(t.labels.notfound);
				}

			})

			return this;
		};

		/* SETTER */

		/**
		 *
		 * @param item
		 * @param center
		 * @param preview
		 * @returns {jQuery.InputfieldGeocode}
		 */
		t.setItem = function(item, center = true, preview = false) {

			t.item = item;

			// empty
			if(!item || !item.hasOwnProperty('label') || !item.hasOwnProperty('value')) {
				if(preview === false) {
					var val = t.$query.val();
					t.clear();
					t.$query.val(val);
				}
				return this;
			}

			var title, geojson;
			try {
				title = item.label;
				geojson = JSON.parse(item.value);
			} catch(e) {
				console.error('Invalid geojson, please reload');
			}

			if(preview === false) {

				// set status
				if(item.hasOwnProperty('total')) {
					if(item.total === 1) t.helper.removeStatus(t.options.statusMultipleResults | t.options.statusNotFound).addStatus(t.options.statusSingleResult);
					else if(item.total > 1) t.helper.removeStatus(t.options.statusSingleResult | t.options.statusNotFound).addStatus(t.options.statusMultipleResults);
					else t.helper.removeStatus(t.options.statusSingleResult | t.options.statusMultipleResults).addStatus(t.options.statusNotFound);
				}

				// set formatted
				t.setDescription(title);

				// set lat lng
				t.setLatlng(geojson.geometry.coordinates, 0, true);

				// set geojson in form
				t.$geojson.val(item.value);

				// skip geocoding
				t.helper.addStatus(t.options.statusSkipGeocoding);

				// show clear button
				t.$clearButton.show();
			} else {
				t.formatted = title;
			}

			// replace geojson
			t.replaceGeojson(geojson, preview);

			if(center) t.map.flyTo(
				[t.$lat.val(), t.$lng.val()], t.options.detailZoom, {
					duration: .6
				});

			return this;

		};

		/**
		 * set description
		 * @param value
		 * @param italic
		 * @returns {jQuery.InputfieldGeocode}
		 */
		t.setDescription = function(value, italic = false){

			t.$description.empty();
			if(italic && value.length) {
				t.$description.append($('<em></em>').text(value));
			} else {
				t.$description.text(value);
			}

			t.$formatted.val(value);
			t.formatted = value;

			return this;
		};

		/**
		 * set Lat and Lng
		 * @param string|float|array lat (array in reverse order)
		 * @param string|float lng
		 * @returns {jQuery.InputfieldGeocode}
		 */
		t.setLatlng = function(lat = '', lng = '', reverse = false) {

			var latlng = t.helper.sanitizeLatLng(lat, lng, reverse);
			if(latlng === false) {
				t.$lat.val('');
				t.$lng.val('');
				t.$latlng.text('');
			} else {
				t.$lat.val(latlng[0]);
				t.$lng.val(latlng[1]);
				t.$latlng.text(latlng.join(', '));
			}

			return this;
		}

		/**
		 * @param input
		 * @param description
		 * @param coords
		 * @param provider
		 * @param geojson
		 * @param status
		 * @returns {jQuery.InputfieldGeocode}
		 */
		t.clear = function({input = true, description = true, coords = true, provider = true, geojson = true, status = true} = {}) {

			if(input) t.$query.val('');
			if(description) t.setDescription(t.labels.notfound, true);
			if(coords) t.setLatlng();
			if(provider) t.$provider.val('');
			if(input) t.$clearButton.hide();
			if(geojson) { t.removeGeojson(); t.$geojson.val(''); }
			if(status) t.helper.setStatus(t.options.statusOn);

			return this;
		}

		/* GEOJSON */

		/**
		 * Replace geojson
		 * @param geojson
		 * @param preview
		 * @returns {jQuery.InputfieldGeocode}
		 */
		t.replaceGeojson = function(geojson, preview = false) {

			t.removeGeojson();

			// Create Layer
			t.geojsonLayer = L.geoJSON(
				geojson,
				{
					pointToLayer: function(geoJsonPoint, latlng) {

						var popupContent = t.helper.popupContent(preview);
						return L.marker(latlng, { draggable: true })
							.bindPopup(popupContent, {
								closeButton: false,
								autoClose: false,
								closeOnEscapeKey: false,
								maxWidth: 195
							})
							.on('add', function() {
								this.openPopup();
							})
							.on('dragend', function(e){
								t.queryLatLng(this.getLatLng(), e.target)
								this.openPopup();
							})
							;
					}
				}
			)

			// Add Layer
			t.geojsonLayer.addTo(t.map);

			return this;
		};

		/**
		 * Remove Layer
		 * @returns {jQuery.InputfieldGeocode}
		 */
		t.removeGeojson = function() {
			if(t.geojsonLayer) t.map.removeLayer(t.geojsonLayer);
			return this;
		}

		/* HELPER */

		/**
		 * @param match
		 * @returns {{label, value}}
		 * @private
		 */
		t.helper.match2item = function(match) {
			return {
				label: match.title,
				value: match.name,
				total: match.total
			};
		}

		t.helper.popupContent = function(preview = false) {

			var $wrapper = $('<p class="uk-text-bold"></p>').text(t.formatted);
			var $content = $('<div class="InputfieldGeocoderPopup"></div>').append($wrapper);
			if(preview) {
				var $button = $('<button class="uk-button uk-button-text" type="button"></button>')
					.text(t.labels.apply)
					.click(function() { t.setItem(t.item); })
				;
				$content.append($button);
			}

			return $content[0];
		}

		/***
		 * Sanitize Lat Lng input
		 * @param lat
		 * @param lng
		 * @param reverse
		 * @returns {[number, number]|boolean}
		 * @private
		 */
		t.helper.sanitizeLatLng = function(lat = '', lng = '', reverse = false) {

			//console.log(Array.isArray(lat), lat, lng);

			if(Array.isArray(lat)) {
				lng = lat[1];
				lat = lat[0];
				if(reverse) [lat, lng] = [lng, lat];
			}

			if(typeof lat === "string" && !lat.length && typeof lng === "string" && !lng.length) return false;

			lat = Math.min(Math.max(lat, -90.0), 90.0);
			lng = Math.min(Math.max(lng, -180.0), 180.0);

			return [lat, lng];
		}

		/**
		 * Validate Geojson (basic)
		 * @param object
		 * @returns {boolean}
		 * @private
		 */
		t.helper.validGeojson = function(object) {
			return (
				object === Object(object) &&
				'type' in object
			);
		}

		/**
		 * Add status
		 * @param flag
		 * @returns {helper}
		 */
		t.helper.addStatus = function(flag) {
			t.status |= flag;
			t.$status.val(t.status);
			return this;
		}

		/**
		 * Remove status
		 * @param flag
		 * @returns {helper}
		 */
		t.helper.removeStatus = function(flag) {
			t.status &= ~(flag);
			t.$status.val(t.status);
			return this;
		}

		/**
		 * Set status
		 * @param flag
		 * @returns {helper}
		 */
		t.helper.setStatus = function(flag) {
			t.status = flag;
			t.$status.val(t.status);
			return this;
		}

		/**
		 * Has status
		 * @param flag
		 * @returns {boolean}
		 */
		t.helper.hasStatus = function(flag) {
			return !!(t.status & flag);
		}

		/**
		 * Optimize ui
		 */
		t.helper.updateInputHeight = function() {
			t.$el[0].style.setProperty("--input-height", t.$query[0].offsetHeight + 'px');
		}

		// Run
		t.init();
	};

	/**
	 * Extend jQuery
	 * @param options
	 * @returns {*}
	 */
	$.fn.inputfieldgeocode = function(options) {

		// each element
		return this.each(function() {
			if(undefined === $(this).data('inputfieldgeocode')) {
				$(this).data('inputfieldgeocode', new $.InputfieldGeocode(this, options));
			}
		});

	};

}(jQuery, window, window.document));


// RUN
$(function() {

	if(window.hasOwnProperty('L') && L.hasOwnProperty('map')) {
		// map already loaded
	}
	else {
		const script = document.createElement("script");
		script.type = "text/javascript";
		script.src = "/site/modules/FieldtypeGeocoder/assets/leaflet@1.7.1/leaflet.js";
		$("head").append(script);

		const link = document.createElement("link");
		link.type = "text/css";
		link.rel = "stylesheet";
		link.href = "/site/modules/FieldtypeGeocoder/assets/leaflet@1.7.1/leaflet.css";
		$("head").append(link);
	}

	$('.InputfieldGeocoder').inputfieldgeocode();

});