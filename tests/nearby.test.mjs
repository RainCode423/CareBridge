import test from 'node:test';
import assert from 'node:assert/strict';
import {PLACE_CATEGORIES,hasCoordinates,placeQuery,categoryQuery,buildMapEmbedUrl,buildMapsSearchUrl,buildDirectionsUrl,normalizeBusiness} from '../src/nearby-core.js';

test('senior-friendly search categories exist',()=>{
 for(const key of ['pharmacy','clinic','groceries','parks','library','community','cafe'])assert.ok(PLACE_CATEGORIES[key]);
});
test('coordinates require a valid numeric pair',()=>{
 assert.equal(hasCoordinates({lat:34.02,long:-117.81}),true);
 assert.equal(hasCoordinates({lat:null,long:0}),false);
 assert.equal(hasCoordinates({lat:999,long:0}),false);
 assert.equal(hasCoordinates({lat:'',long:''}),false);
});
test('saved place URL prefers coordinates, falls back to address',()=>{
 assert.equal(placeQuery({name:'My Cafe',address:'100 Main St',lat:34,long:-117}),'34,-117');
 assert.equal(placeQuery({name:'My Cafe',address:'100 Main St'}),'100 Main St');
 assert.equal(placeQuery({name:'My Cafe'}),'My Cafe');
});
test('category searches and iframe query encode spaces safely',()=>{
 assert.equal(categoryQuery('pharmacy','Diamond Bar, CA'),'pharmacies near Diamond Bar, CA');
 const url=new URL(buildMapEmbedUrl('pharmacies near Diamond Bar, CA'));
 assert.equal(url.hostname,'www.google.com');
 assert.equal(url.searchParams.get('q'),'pharmacies near Diamond Bar, CA');
 assert.equal(url.searchParams.get('output'),'embed');
});
test('Google Maps links do not require a developer API key',()=>{
 const url=new URL(buildMapsSearchUrl('parks near Diamond Bar'));
 assert.equal(url.searchParams.get('api'),'1');
 assert.equal(url.searchParams.get('query'),'parks near Diamond Bar');
 const directions=new URL(buildDirectionsUrl({address:'101 Main St, CA'}));
 assert.equal(directions.searchParams.get('destination'),'101 Main St, CA');
});
test('invalid saved business is excluded',()=>{
 assert.equal(normalizeBusiness({id:'1',name:'No location'}),null);
 assert.equal(normalizeBusiness({id:'1',name:'Place',address:'100 Main St'}).name,'Place');
});