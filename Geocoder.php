<?php
/**
 * COPYRIGHT NOTICE
 * Copyright (c) 2023 Neue Rituale GbR
 * @author NR <code@neuerituale.com>
 */

namespace ProcessWire;

use Geocoder\Http\Provider\AbstractHttpProvider;
use Geocoder\Location;
use Geocoder\StatefulGeocoder;
use Http\Client\Curl\Client;

/**
 * FieldtypeGeocoder: Geocoder
 *
 * @method loadGeocoderPhp
 * @method Client getAdapter()
 * @method AbstractHttpProvider getProvider(Client $adapter)
 * @method StatefulGeocoder getGeocoder(AbstractHttpProvider $provider)
 * @method string formatAddress(Location $location)
 * @method string getLanguage(string $fallback = 'en')
 */
class Geocoder extends WireData implements \JsonSerializable {

	const statusOn = 1;
	const statusSingleResult = 2;
	const statusMultipleResults = 4;

	/** @var int Skip geocoding on sleep. Status will remove on sleep */
	const statusSkipGeocoding = 8;
	const statusNotFound = 16;
	const statusError = 128; /* max mysql field */

	public function __construct() {

		// reset
		$this->clear();
		parent::__construct();
	}

	/**
	 * Clear Wire Data
	 * @return $this
	 */
	public function clear($trackChanges = true): Geocoder {

		if(!$trackChanges) { $this->setTrackChanges(false); }

		$this->data = array();
		$this->setArray([
			'status' => self::statusOn,
			'formatted' => '',
			'query' => '',
			'geodata' => [],
			'lat' => '',
			'lng' => '',
			'provider' => ''
		]);

		$this->setTrackChanges();

		return $this;
	}

	/**
	 * @param string $key
	 * @param mixed $value
	 * @return Geocoder
	 */
	public function set($key, $value): Geocoder {

		if($key === 'lat') {
			$value = is_numeric($value) ? $this->sanitizer->range($value, -90.0, 90.0) : '';
		} else if ($key === 'lng') {
			$value = is_numeric($value) ? $this->sanitizer->range($value, -180.0, 180.0) : '';
		}

		return parent::set($key, $value);
	}

	public function get($key) {
		if($key === 'coordinates') return [$this->lng, $this->lat];
		return parent::get($key);
	}

	/**
	 * Status methods
	 * @param $status
	 * @return Geocoder
	 */
	public function setStatus($status): Geocoder { $this->status = $status; return $this; }
	public function addStatus($status): Geocoder { $this->status = $this->status | $status; return $this; }
	public function removeStatus($status): Geocoder { $this->status = $this->status & ~$status; return $this; }
	public function hasStatus($status): bool { return (bool) ($this->status & $status); }

	public function setSingleResult(): Geocoder { return $this->removeStatus(self::statusMultipleResults|self::statusNotFound)->addStatus(self::statusSingleResult); }
	public function setMultipleResults(): Geocoder { return $this->removeStatus(self::statusSingleResult|self::statusNotFound)->addStatus(self::statusMultipleResults); }

	public function hasResult(): bool { return $this->isSingleResult() || $this->isMultipleResults(); }
	public function isSingleResult(): bool { return $this->hasStatus(self::statusSingleResult); }
	public function isMultipleResults(): bool { return $this->hasStatus(self::statusMultipleResults); }
	public function isNotfound(): bool { return $this->hasStatus(self::statusNotFound); }

	/**
	 * Render
	 * @return mixed|null
	 */
	public function render(): mixed {
		return $this->get('formatted');
	}

	/**
	 * Return the rendered output
	 * @return string
	 */
	public function __toString() {
		return $this->render();
	}

	/**
	 * @return array
	 */
	#[ReturnTypeWillChange]
	public function jsonSerialize(): array {
		return $this->getArray();
	}

}