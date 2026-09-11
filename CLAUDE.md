# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`FieldtypeGeocoder` is a [ProcessWire](https://processwire.com) CMS module (not a standalone app). It defines a custom field type that geocodes an address (or reverse-geocodes coordinates) via [geocoder-php](https://github.com/geocoder-php/Geocoder) and stores the normalized result. There is no build step, bundler, test suite, or linter in this repo — it's plain PHP (loaded by ProcessWire's module system) and vanilla jQuery JS, installed directly into a ProcessWire site's `site/modules/` directory.

## Commands

- Install PHP deps: `composer install` (or `composer update` if you hit a PHP version mismatch — the composer.json requires PHP >= 7.4 at runtime but only Geocoder-PHP's own sub-dependencies are pulled in; there's no `require-dev`, no test/lint scripts defined).
- There is no automated test suite, linter, or build/watch command for the JS/CSS — changes are verified manually by installing/refreshing the module in a running ProcessWire admin (`Modules > Refresh`) and exercising a field of type Geocoder on a page.
- Module version bumps: update `version` in `getModuleInfo()` in **both** `FieldtypeGeocoder.module` and `InputfieldGeocoder.module` (kept in sync, e.g. `106` = 1.0.6), and add an `___upgrade($fromVersion, $toVersion)` step in `FieldtypeGeocoder.module` when the DB schema changes.

## Conventions

- Code comments: English only, as short as possible.

## Architecture

Everything lives in the `ProcessWire` namespace and follows the standard ProcessWire Fieldtype/Inputfield split:

- **`Geocoder.php`** — the runtime value object (`Geocoder extends WireData`). Holds `query`, `formatted`, `geodata` (GeoJSON-ish array from geocoder-php's `GeoArray` dumper), `lat`, `lng`, `provider`, and a bitmask `status`. Status flags (`statusOn`, `statusSingleResult`, `statusMultipleResults`, `statusSkipGeocoding`, `statusNotFound`, `statusError`) are combined with `addStatus()`/`removeStatus()`/`hasStatus()`. `statusSkipGeocoding` is transient: it's set right before `sleepValue()` returns to prevent re-geocoding data that was just fetched, and stripped again afterwards — never persisted.

- **`FieldtypeGeocoder.module`** — the Fieldtype. Key responsibilities:
  - `getDatabaseSchema()` defines the DB columns: `data` (query, FULLTEXT + prefix-indexed), `formatted` (TEXT), `geodata` (JSON), `lat`/`lng` (DECIMAL), `provider`, `status`.
  - `sleepValue()`/`wakeupValue()` convert between the `Geocoder` object and the DB row. `sleepValue()` contains the core geocoding-trigger logic: it decides whether to skip geocoding (result already present and only the `query`/`geodata` didn't meaningfully change), forward-geocode (query text changed), or reverse-geocode (lat/lng changed), by inspecting `$geocoder->getChanges()`/`isChanged()`.
  - `getMatchQuery()` implements the custom `$pages->find()` selector support — fulltext search on `data`/`formatted`/`provider`, direct comparison on `lat`/`lng`, bitwise search on `status`, a haversine-distance `proximity` search (joins the field table and orders by computed distance), and a default branch that does JSON-path (`JSON_EXTRACT`) comparisons against `geodata.*` properties (e.g. `geocoder.properties.timezone=...`). See README.md for selector examples.
  - `update()` is the actual geocoding call: builds the HTTP adapter → provider → `StatefulGeocoder`, runs `geocodeQuery()` or `reverseQuery()`, and maps the first result back onto the `Geocoder` object.
  - Provider/adapter/language/query-filtering/address-formatting are all `___`-prefixed **hookable** methods (`getAdapter()`, `getProvider()`, `getGeocoder()`, `filterQuery()`, `getLanguage()`, `formatAddress()`) — this is the officially documented extension point for swapping the geocoding provider (default: OpenCage) or customizing formatting/queries. See the "Hooks / Change provider" section in README.md for the `addHookBefore('FieldtypeGeocoder::getProvider', ...)` pattern and real provider examples (Google Maps, Mapbox).
  - `loadGeocoderPhp()` lazily requires `vendor/autoload.php` and errors if geocoder-php isn't installed.

- **`InputfieldGeocoder.module`** — the Inputfield (`extends InputfieldWrapper`). Renders a composite of a text query field plus several hidden fields (`_formatted`, `_provider`, `_status`, `_lat`, `_lng`, `_geojson`) that mirror the `Geocoder` object's properties, and injects a small init `<script>` that wires up `$.InputfieldGeocode` (defined in `InputfieldGeocoder.js`) on the admin page. `___processInput()` reads those hidden fields back into a `Geocoder` object. Field-level config (`getConfigInputfields()`) adds a "default center" geocoder sub-field, used by the JS to center the map.

- **`InputfieldGeocoder.js`** — jQuery plugin (`$.InputfieldGeocode`) driving the admin UI: address autocomplete (via ProcessWire's live page-search AJAX endpoint, see `ajaxurl()`), a Leaflet map with a draggable marker, and syncing the hidden fields when the user types, autocompletes, or drags the marker.

- **`FieldtypeGeocoderConfig.php`** — module-wide config (`ModuleConfig`): API key, address `formatterMapping` (geocoder-php `StringFormatter` pattern, e.g. `%S %n %z %L`), and Leaflet asset loading toggles/paths (CSS/JS URLs, defaulting to the bundled `assets/leaflet@1.9.4/`).

- **`GraphQLFieldtypeGeocoder.module`** — optional companion module (separate install, requires `ProcessGraphQL`) exposing the `Geocoder` object as a GraphQL `ObjectType` (`status`, `formatted`, `query`, `geodata`, `lat`, `lng`, `coordinates`, `provider`).

- **`vendor/`** — committed geocoder-php library and its dependencies (curl client, PSR-7, symfony/http-client, the OpenCage provider). Swapping providers per README requires manually dropping in extra provider packages under a local `providers/` folder and `require_once`-ing them from a hook, since only OpenCage ships by default.

### Data flow summary

1. User types an address (or drags the map marker) in the admin field → JS updates hidden inputs.
2. `InputfieldGeocoder::___processInput()` builds a `Geocoder` from the submitted values.
3. On page save, `FieldtypeGeocoder::___sleepValue()` inspects what changed and, unless geocoding should be skipped, calls `forwardQuery()`/`reverseQuery()` → `update()`, which hits the configured provider and repopulates `formatted`/`geodata`/`lat`/`lng`/`provider`/`status`.
4. The result is persisted via the schema in `getDatabaseSchema()`, and `___wakeupValue()` reconstructs the `Geocoder` object on read.
5. Front/back-end PHP code queries stored data through `$pages->find()` selectors handled by `getMatchQuery()` (fulltext, lat/lng, status bitmask, proximity, or arbitrary `geodata` JSON properties).
