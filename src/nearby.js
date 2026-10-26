/** Nearby Places: interactive OpenStreetMap + Leaflet, with no developer API key. */
import {escapeHTML,intro} from './utils.js';
import {PLACE_CATEGORIES,buildOverpassQuery,getPlacesFromOverpass,normalizeGeocodedCity,distanceMiles,directionsUrl,placeMapUrl} from './nearby-core.js';

const OSM_TILES='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OVERPASS='https://overpass-api.de/api/interpreter';
const CITY_SEARCH='https://geocoding-api.open-meteo.com/v1/search';
let leafletPromise;

function loadLeaflet(){
  if(window.L)return Promise.resolve(window.L);
  if(leafletPromise)return leafletPromise;
  leafletPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin='anonymous';script.async=true;
    script.onload=()=>window.L?resolve(window.L):reject(new Error('Map library unavailable.'));
    script.onerror=()=>reject(new Error('Could not download the map library. Please check your internet connection.'));
    document.head.appendChild(script);
  }).catch(err=>{leafletPromise=null;throw err});
  return leafletPromise;
}

async function jsonFrom(url,options={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),27000);
  try{
    const response=await fetch(url,{...options,signal:controller.signal});
    if(!response.ok){
      if([429,502,503,504].includes(response.status))throw new Error('The free places service is temporarily busy. Please try again shortly.');
      throw new Error(`The places service returned an error (${response.status}).`);
    }
    return await response.json();
  }catch(err){
    if(err.name==='AbortError')throw new Error('The search timed out. Please try again.');
    throw err;
  }finally{clearTimeout(timeout)}
}

export function createNearby({isActive,update}){
  let category='pharmacy',city='',resolvedCity='',mode=null,origin=null,results=[],busy=false,message='',searched=false,mapShown=true;
  let queryId=0,mapInstance=null,mapVersion=0;
  const cache=new Map();
  const refresh=()=>{if(isActive())update()};
  const buttons=()=>Object.entries(PLACE_CATEGORIES).map(([key,item])=>`<button type="button" class="nearby-category" data-nearby-category="${key}" aria-pressed="${category===key}" ${busy?'disabled':''}><span aria-hidden="true">${item.icon}</span>${item.label}</button>`).join('');
  const resultItem=(place,i)=>{
    const dist=origin?distanceMiles(origin,place):null;
    const measure=dist!==null?`<span>📍 ${dist<0.1?'Under 0.1':dist.toFixed(1)} mi ${mode==='gps'?'away':'from city center'} · straight line</span>`:'';
    return `<article class="nearby-place" aria-label="${escapeHTML(place.name)}">
      <div class="nearby-number" aria-hidden="true">${i+1}</div>
      <div class="nearby-place-main"><h3>${escapeHTML(place.name)}</h3><p>${escapeHTML(place.address)}</p><div class="nearby-place-details">${measure}</div>
        <div class="nearby-place-actions"><a href="${escapeHTML(directionsUrl(place))}" rel="noopener noreferrer" target="_blank">↗ Directions</a><a class="nearby-secondary-link" href="${escapeHTML(placeMapUrl(place))}" rel="noopener noreferrer" target="_blank">OpenStreetMap details</a></div>
      </div></article>`;
  };
  function viewNearby(){
    const title=PLACE_CATEGORIES[category].label.toLowerCase();
    const alternateQuery=encodeURIComponent(`${PLACE_CATEGORIES[category].query}${mode==='city'&&resolvedCity?` near ${resolvedCity}`:''}`);
    return `${intro('Explore nearby places 📍','Find helpful places around you, from pharmacies and clinics to parks and community spaces.')}
    <section class="panel nearby-start">
      <div class="nearby-headline"><div><div class="eyebrow">Your neighborhood, made easier</div><h2>Where would you like to go?</h2><p>Choose a category, then use your location or enter a city. No Google Maps API key needed.</p></div><div class="nearby-headline-icon" aria-hidden="true">🗺️</div></div>
      <div class="nearby-categories" role="group" aria-label="Place categories">${buttons()}</div>
      <div class="nearby-find-options"><button type="button" class="btn green nearby-locate" data-nearby-action="locate" ${busy?'disabled':''}>${busy?'Searching…':'◎ Use my location'}</button><span class="nearby-or">or search by city</span><form id="nearby-city-form" class="nearby-city-form"><label class="visually-hidden" for="nearby-city">City or town</label><input id="nearby-city" name="city" placeholder="City or town (e.g. Diamond Bar)" maxlength="80" value="${escapeHTML(city)}" autocomplete="address-level2" required ${busy?'disabled':''}><button type="submit" class="btn outline" ${busy?'disabled':''}>Find places</button></form></div>
      <div class="nearby-privacy-note">🔒 No GPS location or search history is saved to CareBridge or Supabase. Searches contact OpenStreetMap community services; clicking Directions opens Google Maps separately.</div>
    </section>
    <div class="nearby-toolbar"><div><h2>${searched?`Nearby ${title}`:'Your nearby places'}</h2><p role="status">${busy?'Finding places…':escapeHTML(message||'Choose a category and search to see places.')}</p></div>${searched||origin?`<button class="btn outline nearby-map-toggle" type="button" data-nearby-action="toggle-map" aria-pressed="${mapShown}">${mapShown?'Hide map':'Show map'}</button>`:''}</div>
    <div class="nearby-grid ${mapShown?'':'nearby-no-map'}">
      <section class="nearby-results panel" aria-label="Nearby place results" aria-live="polite">
        ${busy?'<div class="nearby-empty"><span aria-hidden="true">🔎</span><strong>Looking for places…</strong><p>Results will appear here.</p></div>':results.length?`<div class="nearby-results-list">${results.map(resultItem).join('')}</div>`:`<div class="nearby-empty"><span aria-hidden="true">${searched?'🌱':'📍'}</span><strong>${searched?'No places found for this search':'Discover helpful places'}</strong><p>${escapeHTML(message||'Tap Use my location or search for a city to get started.')}</p>${searched?`<a class="nearby-fallback-link" href="https://www.google.com/maps/search/?api=1&query=${alternateQuery}" target="_blank" rel="noopener noreferrer">Search Google Maps instead ↗</a>`:''}</div>`}
      </section>
      ${mapShown?`<section class="nearby-map-panel panel" aria-label="OpenStreetMap"><div id="carebridge-osm-map" class="nearby-map" aria-label="Interactive OpenStreetMap with nearby places">${!busy&&origin?'':'<div class="nearby-map-placeholder">🗺️<span>Map appears after you find places</span></div>'}</div><p class="nearby-map-caption">Choose a map pin to see a place. © <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer" target="_blank">OpenStreetMap contributors</a>.</p></section>`:''}
    </div>
    <p class="nearby-disclaimer">Place information comes from volunteer-maintained OpenStreetMap data. Locations and addresses may be incomplete; distance is straight-line, not travel time. Check accessibility and hours before visiting. City lookup provided by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>. Not an emergency locator.</p>`;
  }
  async function searchByLocation(){
    if(busy)return;busy=true;message='Waiting for location permission…';refresh();
    try{
      if(!navigator.geolocation)throw new Error('Location is not supported in this browser. Search by city instead.');
      const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:120000}));
      origin={lat:position.coords.latitude,lng:position.coords.longitude};mode='gps';city='';resolvedCity='';
      await searchPlaces();
    }catch(err){busy=false;message=err?.code===1?'Location permission was not granted. You can search by city instead.':err.message||'Could not get your location.';refresh()}
  }
  async function handleCitySubmit(form){
    if(busy)return;
    const value=String(new FormData(form).get('city')||'').trim().slice(0,80);
    city=value;
    if(!city){message='Enter a city or town.';refresh();return}
    busy=true;message='Finding your city…';refresh();
    try{
      const cityName=city.split(',')[0].trim();
      if(cityName.length<2)throw new Error('Please enter a city name, such as Diamond Bar.');
      const params=new URLSearchParams({name:cityName,count:'8',language:'en',format:'json'});
      const data=await jsonFrom(`${CITY_SEARCH}?${params}`);
      const geocoded=normalizeGeocodedCity(data);
      if(!geocoded)throw new Error('City not found. Try including a nearby larger city.');
      origin=geocoded.origin;resolvedCity=geocoded.label;mode='city';
      await searchPlaces();
    }catch(err){busy=false;message=err.message||'Could not find the city.';refresh()}
  }
  async function searchPlaces(){
    const id=++queryId;
    busy=true;searched=false;results=[];message='Searching OpenStreetMap places…';refresh();
    try{
      if(!origin)throw new Error('Choose a location or city first.');
      const key=`${category}:${origin.lat.toFixed(3)}:${origin.lng.toFixed(3)}`;
      const saved=cache.get(key);
      if(saved&&Date.now()-saved.at<300000){results=saved.results;}
      else{
        const query=buildOverpassQuery(category,origin);
        const data=await jsonFrom(OVERPASS,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams({data:query}).toString()});
        if(id!==queryId)return;
        results=getPlacesFromOverpass(data,origin);
        cache.set(key,{at:Date.now(),results});
      }
      if(id!==queryId)return;
      searched=true;message=results.length?`${results.length} places found ${mode==='city'?`near ${resolvedCity}`:'near your location'}. Choose Directions to open Google Maps.`:'Try a different category, city, or a Google Maps search.';
    }catch(err){if(id!==queryId)return;message=err.message||'Could not load places. Please try again.';searched=true;results=[];}
    finally{if(id===queryId){busy=false;refresh()}}
  }
  function afterRender(){
    const node=document.getElementById('carebridge-osm-map');
    if(!node||!origin||busy||!mapShown)return;
    const version=++mapVersion;
    void (async()=>{
      try{
        const L=await loadLeaflet();
        if(!node.isConnected||!isActive()||version!==mapVersion)return;
        if(mapInstance){mapInstance.remove();mapInstance=null;}
        mapInstance=L.map(node,{scrollWheelZoom:false}).setView([origin.lat,origin.lng],13);
        L.tileLayer(OSM_TILES,{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(mapInstance);
        const bounds=L.latLngBounds([[origin.lat,origin.lng]]);
        if(mode==='gps')L.circleMarker([origin.lat,origin.lng],{radius:9,color:'#0b679a',fillColor:'#1d84cb',fillOpacity:0.75,weight:2}).bindPopup('Your approximate location').addTo(mapInstance);
        for(const place of results){
          const marker=L.marker([place.lat,place.lng],{title:place.name}).addTo(mapInstance);
          const popup=document.createElement('div');popup.className='nearby-popup';
          const title=document.createElement('strong');title.textContent=place.name;
          const address=document.createElement('p');address.textContent=place.address;
          const link=document.createElement('a');link.href=directionsUrl(place);link.target='_blank';link.rel='noopener noreferrer';link.textContent='Directions ↗';
          popup.append(title,address,link);marker.bindPopup(popup);bounds.extend([place.lat,place.lng]);
        }
        if(results.length>1)mapInstance.fitBounds(bounds.pad(.12),{maxZoom:14});
        else if(results.length===1)mapInstance.setView([results[0].lat,results[0].lng],14);
        requestAnimationFrame(()=>{if(node.isConnected)mapInstance?.invalidateSize()});
      }catch(err){if(node.isConnected)node.textContent=`Map unavailable: ${err.message||'Please check your connection.'}`;}
    })();
  }
  async function handleClick(target){
    const chosen=target.closest('[data-nearby-category]');
    if(chosen&&!busy){category=chosen.dataset.nearbyCategory;if(origin)await searchPlaces();else refresh();return;}
    const button=target.closest('[data-nearby-action]');if(!button)return;
    if(button.dataset.nearbyAction==='locate')await searchByLocation();
    else if(button.dataset.nearbyAction==='toggle-map'){mapShown=!mapShown;mapVersion++;if(mapInstance){mapInstance.remove();mapInstance=null;}refresh();}
  }
  function reset(){queryId++;mapVersion++;if(mapInstance)mapInstance.remove();mapInstance=null;origin=null;mode=null;city='';resolvedCity='';category='pharmacy';results=[];busy=false;message='';searched=false;}
  return {viewNearby,afterRender,handleClick,handleCitySubmit,reset};
}