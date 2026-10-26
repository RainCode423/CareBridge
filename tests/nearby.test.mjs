import test from 'node:test';
import assert from 'node:assert/strict';
import {PLACE_CATEGORIES,normalizePlace,distanceMiles,directionsUrl,isMapsKeyConfigured,placeMapUrl} from '../src/nearby-core.js';

test('elderly-focused categories include health and community places',()=>{
  for(const type of ['pharmacy','clinic','groceries','parks','library','community']){
    assert.ok(PLACE_CATEGORIES[type]);
  }
});
test('place coordinates are validated and normalized',()=>{
  const obj=normalizePlace({id:'abc',displayName:'My Clinic',formattedAddress:'Main Street',location:{lat:()=>34,lng:()=>-117}});
  assert.equal(obj.name,'My Clinic');
  assert.equal(obj.lat,34);
  assert.equal(normalizePlace({location:{lat:120,lng:0}}),null);
});
test('Google Maps directions URLs use safe URL encoding and place IDs',()=>{
  const url=new URL(directionsUrl({lat:34.1,lng:-117.7,id:'ChIJ & place'},'walking'));
  assert.equal(url.hostname,'www.google.com');
  assert.equal(url.searchParams.get('travelmode'),'walking');
  assert.equal(url.searchParams.get('destination_place_id'),'ChIJ & place');
  assert.equal(new URL(placeMapUrl({lat:34,lng:-117,id:'xyz'})).searchParams.get('query_place_id'),'xyz');
});
test('distance displays a sensible distance in miles',()=>{
  assert.ok(distanceMiles({lat:34,lng:-117},{lat:34.01,lng:-117})>.6);
  assert.equal(distanceMiles(null,{lat:34,lng:-117}),null);
});
test('an unconfigured Google Maps key is rejected',()=>{
  assert.equal(isMapsKeyConfigured('YOUR_GOOGLE_MAPS_BROWSER_KEY'),false);
  assert.equal(isMapsKeyConfigured('abc'),false);
  assert.equal(isMapsKeyConfigured('AIzaSyExampleExampleExampleExample'),true);
});