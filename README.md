# FieldtypeGeocoder


## What it does

Retrieve, collect and store geolocation data from external geocoding services. 
Under the hood, the module uses the great PHP Library [geocoder-php](https://github.com/geocoder-php/Geocoder) by William Durand and Tobias Nyholm and adds some processwire magic. 
Thanks to Ryan (FieldtypeMapMarker) and mats (FieldtypeLeafletMapMarker), from which we drew a lot of inspiration developing this module!


## Features

- Fulltext search in formatted Address
- Proximity search
- Search in geojson
- Easily hookable geocoding providers ([supported providers](https://geocoder-php.org/docs/#providers))
- Normalized geocoder object from geocoder-php


## Installation

1. Copy the files for this module to /site/modules/FieldtypeGeocoder/
2. Execute the following command in the /site/modules/FieldtypeGeocoder/ directory.
   ```bash
   composer install
   ```
3. In processwire admin: Modules > Refresh and install Fieldtype > Geocoder.
4. Insert the api-key for your geocoding provider. The default provider is [OpenCage](https://opencagedata.com/). OpenCage use various other geocoding services. 
   You can change the provider with a processwire hook. [read more](#hook)
5. Create a new field of type Geocoder, and name it whatever you like. In our examples we named it simply "geocoder".
6. Add the field to a template and start geocoding!


## Requirements
- PHP >= 7.3
- PHP Extensions: json, curl, intl


## Module Configuration

`Modules` > `Configure` > `FieldtypeGeocoder`

Insert you api key here. The default

![Configuration](https://user-images.githubusercontent.com/11630948/121345381-13514c00-c925-11eb-85f0-f4056413f645.png)


## Field Configuration

`Fields` > `your_field` > `input`

Each field can have a default map center

![Configuration](https://user-images.githubusercontent.com/11630948/121345392-151b0f80-c925-11eb-90d7-c408348888a8.png)


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


## <a name="hook"></a>Hooks
You can hook some methods to change or override the geocoding provider.
[Here](https://github.com/geocoder-php/Geocoder#providers) you can find a full list of supported providers.

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

## Todos
- Update provider-string if you use the autocomplete function from the inputfield or move the marker.
- Refactor the inputfield javascript for other maps or mapstyles

## Feedback

If you have any feedback, please reach out to us at [code@neuerituale.com](mailto:code@neuerituale.com)