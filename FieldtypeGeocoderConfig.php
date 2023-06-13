<?php
/**
 * COPYRIGHT NOTICE
 * Copyright (c) 2023 Neue Rituale GbR
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
			'description' => __('ApiKey for your geocode provider. Default geocoder is [OpenCache](https://opencagedata.com/users/sign_up)')
		]);

		$inputfields->add([
			'type' => 'text',
			'name' => 'formatterMapping',
			'notes' => __('e.g. %S %n %z %L'),
			'label' => __('Format'),
			'description' => __('Format the geocoded data. Leave empty or "native" for default formatting. Here is the mapping: [Geocoder-PHP Formatter](https://geocoder-php.org/docs/#formatters)')
		]);

		return $inputfields;
	}
}