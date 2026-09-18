<?php
/**
 * COPYRIGHT NOTICE
 * Copyright (c) 2025 Neue Rituale GbR
 * @author NR <code@neuerituale.com>
 */

namespace ProcessWire;

class FieldtypeGeocoderConfig extends ModuleConfig
{
	/**
	 * @return array
	 */
	public function getDefaults(): array {

		return [
			'apiKey' => '',
			'formatterMapping' => 'native',
			'tileUrl' => 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			'tileAttribution' => '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			'css' => '',
			'script' => '',
			'loadLeafletCss' => true,
			'loadLeafletScript' => true,
			'libCss' => $this->config->urls->InputfieldGeocoder . 'assets/leaflet@1.9.4/leaflet.css',
			'libScript' => $this->config->urls->InputfieldGeocoder . 'assets/leaflet@1.9.4/leaflet.js'
		];
	}

	/**
	 * @return InputfieldWrapper
	 */
	public function getInputfields(): InputfieldWrapper {

		$inputfields = parent::getInputfields();

		$inputfields->add([
			'type' => 'text',
			'name' => 'apiKey',
			'label' => __('ApiKey'),
			'description' => __('ApiKey for your geocode provider. Default geocoder is [OpenCage](https://opencagedata.com/users/sign_up)')
		]);

		$inputfields->add([
			'type' => 'text',
			'name' => 'formatterMapping',
			'notes' => __('e.g. %S %n %z %L'),
			'label' => __('Format'),
			'description' => __('Format the geocoded data. Leave empty or "native" for default formatting. Here is the mapping: [Geocoder-PHP Formatter](https://geocoder-php.org/docs/#formatters)')
		]);

		$inputfields->add([
			'type' => 'text',
			'name' => 'tileUrl',
			'label' => __('Map tile URL'),
			'notes' => __('e.g. https://tile.tracestrack.com/topo__/{z}/{x}/{y}.webp?key=YOUR_KEY'),
			'description' => __('URL template for the map preview shown in the field. Works with any Leaflet-compatible raster tile endpoint, not just OpenStreetMap - just paste its URL template ({s}/{z}/{x}/{y} placeholders, API key included as a query param if the provider needs one).')
		]);

		$inputfields->add([
			'type' => 'text',
			'name' => 'tileAttribution',
			'label' => __('Map tile attribution'),
			'description' => __('Attribution shown in the bottom-right corner of the map preview. Most tile providers require this by their terms of use - check the provider\'s documentation for the exact wording. HTML is allowed.')
		]);

		return $inputfields;
	}
}