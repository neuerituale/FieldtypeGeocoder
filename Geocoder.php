<?php namespace ProcessWire;

use Geocoder\Collection;
use Geocoder\Dumper\GeoArray;
use Geocoder\Dumper\GeoJson;
use Geocoder\Formatter\StringFormatter;
use Geocoder\Http\Provider\AbstractHttpProvider;
use Geocoder\Location;
use Geocoder\Provider\OpenCage\OpenCage;
use Geocoder\Provider\Provider;
use Geocoder\Query\GeocodeQuery;
use Geocoder\Query\ReverseQuery;
use Geocoder\StatefulGeocoder;
use Http\Client\Curl\Client;
use Http\Client\HttpClient;

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
class Geocoder extends WireData implements \JsonSerializable{

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
	public function clear() {

		$this->data = array();

		$this->setArray([
			'status' => self::statusOn,
			'formatted' => '',
			'query' => '',
			'geodata' => new \stdClass(),
			'lat' => '',
			'lng' => '',
			'provider' => ''
		]);

		return $this;
	}

	/**
	 * @param string $key
	 * @param mixed $value
	 * @return Geocoder
	 */
	public function set($key, $value) {

		if($key === 'lat') {
			$value = is_numeric($value) ? $this->sanitizer->range($value, -90.0, 90.0) : '';
		} else if ($key === 'lng') {
			$value = is_numeric($value) ? $this->sanitizer->range($value, -180.0, 180.0) : '';
		}

		return parent::set($key, $value);
	}

	/**
	 * Status methods
	 * @param $status
	 */
	public function setStatus($status) { $this->status = $status; return $this; }
	public function addStatus($status) { $this->status = $this->status | $status; return $this; }
	public function removeStatus($status) { $this->status = $this->status & ~$status; return $this; }
	public function hasStatus($status) { return (bool) ($this->status & $status); }

	public function setSingleResult() { return $this->removeStatus(self::statusMultipleResults|self::statusNotFound)->addStatus(self::statusSingleResult); }
	public function setMultipleResults() { return $this->removeStatus(self::statusSingleResult|self::statusNotFound)->addStatus(self::statusMultipleResults); }

	public function hasResult() { return $this->isSingleResult() || $this->isMultipleResults(); }
	public function isSingleResult() { return $this->hasStatus(self::statusSingleResult); }
	public function isMultipleResults() { return $this->hasStatus(self::statusMultipleResults); }
	public function isNotfound() { return $this->hasStatus(self::statusNotFound); }

	/**
	 * Render
	 * @return mixed|null
	 */
	public function render() {
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
	 * @return array|mixed
	 */
	public function jsonSerialize() {
		return $this->getArray();
	}

}