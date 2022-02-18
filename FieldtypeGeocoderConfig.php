<?php
/**
 * COPYRIGHT NOTICE
 * Copyright (c) 2021 Neue Rituale GbR
 * @author NR <code@neuerituale.com>
 */

namespace ProcessWire;


class FieldtypeGeocoderConfig extends ModuleConfig
{
	/**
	 * @return array
	 * @throws WireException
	 */
	public function getDefaults() {

		return [
			'apiKey' => '',
			'formatterMapping' => 'native',
			'css' => '',
			'script' => '',
			'loadLeafletCss' => true,
			'loadLeafletScript' => true,

			'libCss' => $this->config->urls->InputfieldGeocoder . 'assets/leaflet@1.7.1/leaflet.css',
			'libScript' => $this->config->urls->InputfieldGeocoder . 'assets/leaflet@1.7.1/leaflet.js'
		];
	}

	/**
	 * @return InputfieldWrapper
	 */
	public function getInputfields() {

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

		$inputfields->add([
			'type' => 'text',
			'name' => 'css',
			'label' => __('CSS File for Inputfield'),
			'notes' => __('When blank, the default file used'),
			'description' => __('Enter path relative to homepage URL'),
			'columnWidth' => 50
		]);

		$inputfields->add([
			'type' => 'text',
			'name' => 'script',
			'label' => __('Script File for Inputfield'),
			'notes' => __('When blank, the default file used'),
			'description' => __('Enter path relative to homepage URL'),
			'columnWidth' => 50
		]);

		$inputfields->add([
			'type' => 'checkbox',
			'name' => 'loadLeafletCss',
			'label' => __('Load leaflet css file'),
			'notes' => $this->libCss,
			'columnWidth' => 50
		]);

		$inputfields->add([
			'type' => 'checkbox',
			'name' => 'loadLeafletScript',
			'label' => __('Load leaflet script file'),
			'notes' => $this->libScript,
			'columnWidth' => 50
		]);

		return $inputfields;
	}
}