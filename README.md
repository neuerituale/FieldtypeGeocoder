# FieldtypeOembed


## What it does

Store, and collect geolocation data from external geocoding services. 
It used the great PHP Library [geocoder-php](https://github.com/geocoder-php/Geocoder) by William Durand and Tobias Nyholm and adds some processwire magic. 
This field is inspired on the module FieldtypeMapMarker by Ryan and the FieldtypeLeafletMapMarker by mats. Thanks!


## Features

- Fulltext search in formatted Address
- Proximity search
- Search in geojson
- Easy hookable geocoding providers ([supported providers](https://geocoder-php.org/docs/#providers))
- Normalized geocoder object from geocoder-php


## Installation

1. Copy the files for this module to /site/modules/FieldtypeGeocoder/
2. Execute the following command in the /site/modules/FieldtypeGeocoder/ directory.
   ```bash
   composer install
   ```
3. In admin: Modules > Refresh. Install Fieldtype > Geocoder.
4. Create a new field of type Geocoder, and name it whatever you would
   like. In our examples we named it simply "geocoder".
5. Add the field to a template and edit a page using that template.


## Module Configuration

`Modules` > `Configure` > `FieldtypeGeocoder`


## Field Configurtion

`Fields` > `your_field` > `input`

Each field can have a default map center


## API Reference

#### Seach in input
```php
$pages->find('geocoder*=Berl');
```

#### Search in formatted address
```php
$pages->find('geocoder.formatted*=Berlin');
```

#### Search in properties
```php
$pages->find('geocoder.properties.timezone=Europe/Berlin');
$pages->find('geocoder.properties.locality=Berlin');
$pages->find('geocoder.properties.lat>10');
```

#### Seach and order by proximity
```php
$pages->find('geocoder.proximity=52.473758|13.402580, limit=3');
```


## The Geocoder Object 

```json
ProcessWire\Geocoder Object
(
    [data] => Array
        (
            [status] => 5
            [formatted] => Berlin, Deutschland
            [query] => Berlin
            [geodata] => Array
                (
                    [type] => Feature
                    [bounds] => Array
                        (
                            [east] => 13,5488599
                            [west] => 13,2288599
                            [north] => 52,6770365
                            [south] => 52,3570365
                        )

                    [geometry] => Array
                        (
                            [type] => Point
                            [coordinates] => Array
                                (
                                    [0] => 13,3888599
                                    [1] => 52,5170365
                                )

                        )

                    [properties] => Array
                        (
                            [country] => Deutschland
                            [locality] => Berlin
                            [timezone] => Europe/Berlin
                            [postalCode] => 10117
                            [providedBy] => opencage
                            [adminLevels] => Array
                                (
                                    [1] => Array
                                        (
                                            [code] => BE
                                            [name] => Berlin
                                            [level] => 1
                                        )

                                )

                            [countryCode] => DE
                        )

                )

            [lat] => 52,517036
            [lng] => 13,38886
            [provider] => opencage
        )

)
```


## Hooks
You can Hook some methods to change or override the geocoding provider.
You can find all [supported provider here](https://github.com/geocoder-php/Geocoder#providers).

1. Download, unzip provider package.
2. Move the files in your folder struckture (```Provider.php``` and ```ProviderAddress.php```).
3. Load all files with ```require_once()``` command.


### Example 1: Google Maps Provider Package
- [Geocoding Api](https://developers.google.com/maps/documentation/geocoding/overview) Documentation and examples
- [Maps Platform](https://cloud.google.com/maps-platform/) Configure your api-key
```php
/** @global Wire $wire */
$wire->addHookBefore('FieldtypeGeocoder::getProvider', function(HookEvent $event) {

	require_once (/*NoCompile*/__DIR__ .'/providers/GoogleMaps.php');
	require_once (/*NoCompile*/__DIR__ .'/providers/GoogleAddress.php');

	$fieldtype = $event->object;
	$apiKey = $fieldtype->apiKey; // or insert the key direct
	$adapter = $event->argumentsByName('adapter');

	$event->return = new \Geocoder\Provider\GoogleMaps\GoogleMaps($adapter, null, $apiKey);
	$event->replace = true;
});
```

### Example 2: Mapbox Search Provider Package
- [Geocoding Api](https://docs.mapbox.com/api/search/geocoding/) Documentation and examples
- [Playground](https://docs.mapbox.com/api/search/geocoding/) Playground (👍)
- [Access Tokens](https://account.mapbox.com/access-tokens/) Create and manage your keys

```php
use Geocoder\Provider\Mapbox\Mapbox;
use Geocoder\Query\GeocodeQuery;
use Geocoder\Query\ReverseQuery;

/** @global Wire $wire */

$wire->addHookBefore('FieldtypeGeocoder::getProvider', function(HookEvent $event) {

	require_once (/*NoCompile*/__DIR__ .'/providers/Mapbox.php');
	require_once (/*NoCompile*/__DIR__ .'/providers/MapboxAddress.php');

	$fieldtype = $event->object;
	$adapter = $event->argumentsByName('adapter');
	
	$event->return = new Mapbox($adapter, $fieldtype->apiKey, null);
	$event->replace = true;
});


/**
 * Manipulate the query
 * For better results, add all mapbox types to the query
 */
$wire->addHookAfter('FieldtypeGeocoder::filterQuery', function(HookEvent $event) {

	/** @var GeocodeQuery|ReverseQuery $query */
	$query = $event->argumentsByName('query');
	$query = $query->withData('location_type', Mapbox::TYPES);
	$event->return = $query;
});
```

## Feedback

If you have any feedback, please reach out to us at [code@neuerituale.com](mailto:code@neuerituale.com)