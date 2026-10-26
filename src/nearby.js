/** Elder-friendly place finder. Google Maps is loaded only after an explicit search. */
import {escapeHTML,intro} from './utils.js';
import {PLACE_CATEGORIES,normalizePlace,distanceMiles,directionsUrl,placeMapUrl,isMapsKeyConfigured} from './nearby-core.js';

const showError=err=>err?.message||'Please try your search again.';
const fields=['id','displayName','formattedAddress','location','rating','userRatingCount'];
let mapsReadyPromise=null;
async function loadGoogleMaps(){
  if(mapsReadyPromise)return mapsReadyPromise;
  mapsReadyPromise=(async()=>{
    let key='',mapId='DEMO_MAP_ID';
    try{
      const config=await import('./maps-config.js');
      key=config.GOOGLE_MAPS_BROWSER_KEY;
      mapId=config.GOOGLE_MAP_ID||mapId;
    }catch(_){throw new Error('Add src/maps-config.js using the Google Maps setup instructions to enable nearby searches.');}
    if(!isMapsKeyConfigured(key))throw new Error('Add a valid Google Maps browser API key to src/maps-config.js.');
    if(!window.google?.maps?.importLibrary){
      await new Promise((resolve,reject)=>{
        const callback='__carebridgeGoogleMapsReady';
        const script=document.createElement('script');
        const timeout=setTimeout(()=>{cleanup();reject(new Error('Google Maps took too long to load. Check your network and API settings.'))},20000);
        const cleanup=()=>{clearTimeout(timeout);delete window[callback];};
        window[callback]=()=>{cleanup();resolve();};
        script.async=true;
        script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=${callback}`;
        script.onerror=()=>{cleanup();script.remove();reject(new Error('Could not load Google Maps. Check your API key and allowed website addresses.'))};
        document.head.appendChild(script);
      });
    }
    const [{Map,InfoWindow},{Place,SearchNearbyRankPreference},{AdvancedMarkerElement}]=await Promise.all([
      window.google.maps.importLibrary('maps'),window.google.maps.importLibrary('places'),window.google.maps.importLibrary('marker')
    ]);
    return {Map,InfoWindow,Place,SearchNearbyRankPreference,AdvancedMarkerElement,mapId};
  })();
  try{return await mapsReadyPromise}catch(error){mapsReadyPromise=null;throw error}
}

export function createNearby({isActive,update}){
  let category='pharmacy',city='',mode=null,origin=null,results=[],busy=false,message='',searched=false,mapShown=true;
  let queryId=0,instance=null;
  const refresh=()=>{if(isActive())update()};
  const buttons=()=>Object.entries(PLACE_CATEGORIES).map(([key,item])=>`<button type="button" class="nearby-category" data-nearby-category="${key}" aria-pressed="${category===key}" ${busy?'disabled':''}><span aria-hidden="true">${item.icon}</span>${item.label}</button>`).join('');
  const resultItem=(place,i)=>{
    const distance=mode==='gps'&&origin?distanceMiles(origin,place):null;
    return `<article class="nearby-place" aria-label="${escapeHTML(place.name)}">
      <div class="nearby-number" aria-hidden="true">${i+1}</div>
      <div class="nearby-place-main"><h3>${escapeHTML(place.name)}</h3><p>${escapeHTML(place.address)}</p><div class="nearby-place-details">${distance!==null?`<span>📍 About ${distance<0.1?'0.1':distance.toFixed(1)} miles away</span>`:''}${place.rating!==null?`<span>⭐ ${place.rating.toFixed(1)}${place.reviewCount!==null?` (${place.reviewCount})`:''}</span>`:''}</div>
        <div class="nearby-place-actions"><a href="${escapeHTML(directionsUrl(place))}" rel="noopener noreferrer" target="_blank">↗ Directions</a><a class="nearby-secondary-link" href="${escapeHTML(placeMapUrl(place))}" rel="noopener noreferrer" target="_blank">Place details</a></div>
      </div></article>`;
  };
  function viewNearby(){
    const title=PLACE_CATEGORIES[category].label.toLowerCase();
    return `${intro('Explore nearby places 📍','Find helpful places around you, from pharmacies and clinics to parks and community spaces.')}
    <section class="panel nearby-start">
      <div class="nearby-headline"><div><div class="eyebrow">Your neighborhood, made easier</div><h2>Where would you like to go?</h2><p>Choose a place type and find options close by. Your location is only used when you choose to share it.</p></div><div class="nearby-headline-icon" aria-hidden="true">🗺️</div></div>
      <div class="nearby-categories" role="group" aria-label="Place categories">${buttons()}</div>
      <div class="nearby-find-options"><button type="button" class="btn green nearby-locate" data-nearby-action="locate" ${busy?'disabled':''}>${busy?'Searching…':'◎ Use my location'}</button><span class="nearby-or">or search by city</span><form id="nearby-city-form" class="nearby-city-form"><label class="visually-hidden" for="nearby-city">City or ZIP code</label><input id="nearby-city" name="city" placeholder="City or ZIP code" maxlength="80" value="${escapeHTML(city)}" autocomplete="address-level2" required ${busy?'disabled':''}><button type="submit" class="btn outline" ${busy?'disabled':''}>Find places</button></form></div>
      <div class="nearby-privacy-note">🔒 CareBridge does not save your GPS location or search history to Supabase. Google receives searches when you use the map.</div>
    </section>
    <div class="nearby-toolbar"><div><h2>${searched?`Nearby ${title}`:'Your nearby places'}</h2><p>${busy?'Finding places…':message||'Choose a category and search to see places.'}</p></div>${searched?`<button class="btn outline nearby-map-toggle" type="button" data-nearby-action="toggle-map" aria-pressed="${mapShown}">${mapShown?'Hide map':'Show map'}</button>`:''}</div>
    <div class="nearby-grid ${mapShown?'':'nearby-no-map'}">
      <section class="nearby-results panel" aria-label="Nearby place results" aria-live="polite">
        ${busy?'<div class="nearby-empty"><span aria-hidden="true">🔎</span><strong>Looking for places…</strong><p>Results will appear here.</p></div>':results.length?`<div class="nearby-results-list">${results.map(resultItem).join('')}</div>`:`<div class="nearby-empty"><span aria-hidden="true">${searched?'🌱':'📍'}</span><strong>${searched?'No places found for this search':'Discover helpful places'}</strong><p>${escapeHTML(message||'Tap Use my location or search for a city to get started.')}</p></div>`}
      </section>
      ${mapShown?`<section class="nearby-map-panel panel" aria-label="Google Map"><div id="carebridge-google-map" class="nearby-map" role="application" aria-label="Interactive map showing search results">${results.length?'':'<div class="nearby-map-placeholder">🗺️<span>Map appears after you find places</span></div>'}</div><p class="nearby-map-caption">Select a map pin to see a place. Directions open in Google Maps.</p></section>`:''}
    </div>
    <p class="nearby-disclaimer">Please confirm opening hours, transportation options, and accessibility with a destination before traveling. CareBridge is not an emergency locator.</p>`;
  }
  async function searchByLocation(){
    if(busy)return;busy=true;message='Preparing Google Maps…';refresh();
    try{
      await loadGoogleMaps();
      message='Waiting for location permission…';refresh();
      if(!navigator.geolocation)throw new Error('This browser does not support location services. Try searching by city.');
      const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:120000}));
      origin={lat:position.coords.latitude,lng:position.coords.longitude};mode='gps';city='';
      await searchPlaces();
    }catch(err){busy=false;message=err?.code===1?'Location permission was not granted. You can search by city instead.':showError(err);refresh()}
  }
  async function handleCitySubmit(form){
    if(busy)return;
    city=String(new FormData(form).get('city')||'').trim().slice(0,80);
    if(!city){message='Enter a city or ZIP code.';refresh();return}
    mode='city';origin=null;busy=true;await searchPlaces();
  }
  async function searchPlaces(){
    busy=true;searched=false;results=[];message='Searching Google Maps…';refresh();
    const id=++queryId;
    try{
      const {Place,SearchNearbyRankPreference}=await loadGoogleMaps();
      const item=PLACE_CATEGORIES[category];
      const request={fields,maxResultCount:10};
      const response=mode==='gps'&&origin&&item.types.length?
        await Place.searchNearby({...request,includedPrimaryTypes:item.types,locationRestriction:{center:origin,radius:6000},rankPreference:SearchNearbyRankPreference.DISTANCE}):
        await Place.searchByText({...request,textQuery:mode==='gps'?`${item.query} near me`:`${item.query} in ${city}`, ...(mode==='gps'&&origin?{locationBias:{center:origin,radius:6000}}:{})});
      if(id!==queryId)return;
      const unique=new Map();
      for(const raw of response.places||[]){const place=normalizePlace(raw);if(place)unique.set(place.id||`${place.lat},${place.lng}`,place)}
      results=[...unique.values()];searched=true;
      message=results.length?`${results.length} places found${mode==='city'?` around ${city}`:' near your location'}. Select Directions to open Google Maps.`:'Try another category or a nearby city.';
    }catch(err){if(id!==queryId)return;message=showError(err);searched=true;results=[];}
    finally{if(id===queryId){busy=false;refresh()}}
  }
  function afterRender(){
    const node=document.getElementById('carebridge-google-map');
    if(!node||!results.length||!mapShown||!window.google?.maps?.importLibrary)return;
    const localNode=node,localResults=[...results];
    void (async()=>{
      try{
        const {Map,InfoWindow,AdvancedMarkerElement,mapId}=await loadGoogleMaps();
        if(!localNode.isConnected||!isActive())return;
        const c=mode==='gps'?origin:{lat:localResults[0].lat,lng:localResults[0].lng};
        instance=new Map(localNode,{center:c,zoom:13,mapId,mapTypeControl:false,streetViewControl:false,fullscreenControl:true});
        const bounds=new google.maps.LatLngBounds();
        const popup=new InfoWindow();
        if(origin){bounds.extend(origin);new AdvancedMarkerElement({map:instance,position:origin,title:'Your approximate location'})}
        localResults.forEach(place=>{
          const point={lat:place.lat,lng:place.lng};bounds.extend(point);
          const marker=new AdvancedMarkerElement({map:instance,position:point,title:place.name});
          marker.addListener('click',()=>{
            popup.setContent(`<div class="nearby-popup"><strong>${escapeHTML(place.name)}</strong><p>${escapeHTML(place.address)}</p><a target="_blank" rel="noopener noreferrer" href="${escapeHTML(directionsUrl(place))}">Get directions ↗</a></div>`);
            popup.open({map:instance,anchor:marker});
          });
        });
        if(localResults.length>1||origin)instance.fitBounds(bounds,45);
      }catch(err){if(localNode.isConnected)localNode.textContent=`Map unavailable: ${showError(err)}`;}
    })();
  }
  async function handleClick(target){
    const categoryButton=target.closest('[data-nearby-category]');
    if(categoryButton&&!busy){category=categoryButton.dataset.nearbyCategory;if(mode==='gps'&&origin||mode==='city'&&city){await searchPlaces()}else refresh();return;}
    const button=target.closest('[data-nearby-action]');if(!button)return;
    if(button.dataset.nearbyAction==='locate')await searchByLocation();
    if(button.dataset.nearbyAction==='toggle-map'){mapShown=!mapShown;refresh()}
  }
  function reset(){queryId++;origin=null;mode=null;city='';category='pharmacy';results=[];busy=false;message='';searched=false;instance=null;}
  return {viewNearby,afterRender,handleClick,handleCitySubmit,reset};
}