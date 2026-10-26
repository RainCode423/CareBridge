import test from 'node:test';
import assert from 'node:assert/strict';
import {PLACE_CATEGORIES,normalizePlace,getPlacesFromOverpass,buildOverpassQuery,normalizeGeocodedCity,distanceMiles,directionsUrl,placeMapUrl} from '../src/nearby-core.js';

test('categories include pharmacies, clinics, groceries, parks, libraries, community and cafés',()=>{
  for(const cat of ['pharmacy','clinic','groceries','parks','library','community','cafe'])assert.ok(PLACE_CATEGORIES[cat]);
});
test('targeted Overpass queries use bounded radius and category tags',()=>{
  const q=buildOverpassQuery('pharmacy',{lat:34.01,lng:-117.81});
  assert.match(q,/nwr\(around:5000,34.01000,-117.81000\)\["amenity"="pharmacy"\]/);
  assert.match(q,/out center 100;/);
  assert.throws(()=>buildOverpassQuery('invalid',{lat:34,lng:-118}));
});
test('normalize node and way coordinates with address and safe fallback',()=>{
  const node=normalizePlace({type:'node',id:22,lat:34,lon:-117,tags:{name:'My Clinic','addr:housenumber':'42','addr:street':'Main St'}});
  assert.equal(node.name,'My Clinic');assert.equal(node.address,'42 Main St');
  assert.equal(node.id,'node/22');
  const way=normalizePlace({type:'way',id:12,center:{lat:34.12,lon:-117.23},tags:{name:'Library'}});
  assert.equal(way.lat,34.12);
  assert.equal(normalizePlace({type:'node',lat:181,lon:5}),null);
});
test('deduplicate and sort results by distance and reject Overpass incomplete response',()=>{
  const pos={lat:34,lng:-117};
  const near={type:'node',id:1,lat:34.001,lon:-117,tags:{name:'Near'}};
  const far={type:'node',id:2,lat:34.05,lon:-117,tags:{name:'Far'}};
  const out=getPlacesFromOverpass({elements:[far,near,near,{type:'node',id:3,lat:55,lon:10}]},pos);
  assert.deepEqual(out.map(x=>x.name),['Near','Far']);
  assert.throws(()=>getPlacesFromOverpass({remark:'timed out',elements:[]},pos));
});
test('city geocoding result conversion',()=>{
  assert.deepEqual(normalizeGeocodedCity({results:[{name:'Diamond Bar',admin1:'California',country:'United States',latitude:34.03,longitude:-117.81}]}),{origin:{lat:34.03,lng:-117.81},label:'Diamond Bar, California, United States'});
  assert.equal(normalizeGeocodedCity({results:[]}),null);
});
test('link handling: no Google API key needed for directions, OSM for place details',()=>{
  const place={id:'way/12345',lat:34.1,lng:-117.7};
  const url=new URL(directionsUrl(place,'walking'));
  assert.equal(url.hostname,'www.google.com');
  assert.equal(url.searchParams.get('travelmode'),'walking');
  assert.equal(url.searchParams.has('destination_place_id'),false);
  assert.equal(placeMapUrl(place),'https://www.openstreetmap.org/way/12345');
});
test('straight-line distance is in miles',()=>{
  assert.ok(distanceMiles({lat:34,lng:-117},{lat:34.01,lng:-117})>.6);
  assert.equal(distanceMiles(null,{lat:34,lng:-117}),null);
});