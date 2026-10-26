/** Senior-friendly Google Maps iframe, category searches, and private saved places. */
import {escapeHTML,intro} from './utils.js';
import {PLACE_CATEGORIES,categoryQuery,buildMapEmbedUrl,buildMapsSearchUrl,buildDirectionsUrl,normalizeBusiness} from './nearby-core.js';

export function createNearby({isActive,update,supabase,getUser}){
 let category='pharmacy',city='',searchTarget='',selectedId=null,filteredText='',saved=[],loaded=false,loading=false,mapShown=true;
 let busy=false,message='',savingError='',queryVersion=0;
 const refresh=()=>{if(isActive())update()};
 const selected=()=>saved.find(p=>p.id===selectedId)||null;
 const shown=()=>saved.filter(p=>[p.name,p.category,p.address].join(' ').toLowerCase().includes(filteredText.toLowerCase().trim()));
 const mapTarget=()=>selected()||searchTarget;
 const safe=(v)=>escapeHTML(v);
 const mapsLink=()=>buildMapsSearchUrl(mapTarget());
 const mapLink=()=>buildMapEmbedUrl(mapTarget());
 const categoryButtons=()=>Object.entries(PLACE_CATEGORIES).map(([key,opt])=>
   `<button type="button" class="nearby-category" data-nearby-category="${key}" aria-pressed="${category===key}"><span aria-hidden="true">${opt.icon}</span>${safe(opt.label)}</button>`).join('');
 const businessRow=p=>`<article class="nearby-saved-item ${selectedId===p.id?'is-selected':''}">
  <button type="button" class="nearby-saved-select" data-nearby-select="${safe(p.id)}" aria-pressed="${selectedId===p.id}">
   <strong>${safe(p.name)}</strong><span>${safe(PLACE_CATEGORIES[p.category]?.label||p.category||'Saved place')}</span><small>${safe(p.address||'Coordinates saved')}</small>
  </button><div class="nearby-saved-actions"><a href="${safe(buildDirectionsUrl(p))}" target="_blank" rel="noopener noreferrer">Directions ↗</a><button type="button" data-nearby-delete="${safe(p.id)}" aria-label="Remove ${safe(p.name)}">Remove</button></div></article>`;
 function viewNearby(){
  const target=mapTarget(),embed=mapLink(),lookup=mapsLink();
  const current=selected();
  const shownPlaces=shown();
  return `${intro('Explore nearby places 📍','Find pharmacies, parks, groceries, and other useful places with an easy-to-use Google Map.')}
   <section class="panel nearby-start">
    <div class="nearby-headline"><div><div class="eyebrow">Find places near your area</div><h2>What would you like to find?</h2><p>Pick a category, then enter a city or use your location to search Google Maps.</p></div><div class="nearby-headline-icon" aria-hidden="true">🗺️</div></div>
    <div class="nearby-categories" role="group" aria-label="Find a place">${categoryButtons()}</div>
    <div class="nearby-find-options"><button class="btn green nearby-locate" type="button" data-nearby-action="locate" ${busy?'disabled':''}>${busy?'Finding location…':'◎ Use my location'}</button><span class="nearby-or">or search by city</span>
     <form class="nearby-city-form" id="nearby-city-form"><label class="visually-hidden" for="nearby-city">City or ZIP code</label><input id="nearby-city" name="city" placeholder="City or ZIP code" maxlength="80" value="${safe(city)}" required><button class="btn outline" type="submit">Find on map</button></form></div>
    <div class="nearby-privacy-note">🔒 Saved places are private to your signed-in account. SeniorCare does not save your GPS location. Google receives search and map requests when you use this page.</div>
   </section>
   <div class="nearby-toolbar"><div><h2>${current?safe(current.name):target?'Explore your area':'Your nearby map'}</h2><p role="status">${safe(message|| (target?'Choose a saved place or open Google Maps to view search results.':'Choose a category, then search by city or location.'))}</p></div>
    <button type="button" class="btn outline nearby-map-toggle" data-nearby-action="toggle-map" aria-expanded="${mapShown}" aria-controls="carebridge-embedded-map">${mapShown?'Hide map':'Show map'}</button></div>
   <div class="nearby-grid ${mapShown?'':'nearby-no-map'}">
    <section class="panel nearby-results" aria-label="Saved places"><div class="nearby-section-heading"><div><h2>My saved places</h2><p>Select one to display it on the map.</p></div><button class="small-btn" type="button" data-nearby-action="reload" ${loading?'disabled':''}>↻ Refresh</button></div>
     <form id="nearby-filter-form" class="nearby-filter-form"><label class="visually-hidden" for="nearby-filter">Search saved places</label><input id="nearby-filter" name="filter" placeholder="Search saved places" maxlength="90" value="${safe(filteredText)}"><button class="btn outline" type="submit">Search</button></form>
     ${loading?'<p class="nearby-status">Loading your saved places…</p>':''}${savingError?`<p class="nearby-error" role="alert">${safe(savingError)}</p>`:''}
     ${shownPlaces.length?`<div class="nearby-saved-list">${shownPlaces.map(businessRow).join('')}</div>`:`<div class="nearby-saved-empty">${loaded?'No saved places match. Add one below or change your search.':'Your saved places will appear here.'}</div>`}
     <div class="nearby-add-box"><h3>Save a place</h3><p>Found a place in Google Maps? Save its name and address for easy access later.</p>
      <form id="nearby-save-form"><label for="nearby-place-name">Place name</label><input id="nearby-place-name" name="name" placeholder="Example: Local pharmacy" maxlength="120" required>
       <label for="nearby-place-address">Address</label><input id="nearby-place-address" name="address" placeholder="Street address, city, state" maxlength="240" required>
       <label for="nearby-place-category">Category</label><select id="nearby-place-category" name="category">${Object.entries(PLACE_CATEGORIES).map(([key,cat])=>`<option value="${key}" ${key===category?'selected':''}>${safe(cat.label)}</option>`).join('')}</select>
       <button type="submit" class="btn green" ${busy?'disabled':''}>+ Save place</button></form></div>
    </section>
    ${mapShown?`<section class="panel nearby-map-panel" id="carebridge-embedded-map" aria-label="Google Maps viewer"><div class="nearby-map-header"><div><h2>${current?safe(current.name):'Google Maps'}</h2><p>${current?safe(current.address||'Saved coordinates'):target?safe(typeof target==='string'?target:'Select a location'):'Search for a place to view a map'}</p></div></div>
     ${embed?`<iframe class="nearby-map" title="Google Maps for ${safe(current?.name||'nearby places')}" src="${safe(embed)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`:`<div class="nearby-map nearby-map-placeholder">🗺️<span>Choose a category and search to see Google Maps</span></div>`}
     <div class="nearby-iframe-actions">${lookup?`<a class="btn green" href="${safe(lookup)}" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a>`:''}${current?`<a class="btn outline" href="${safe(buildDirectionsUrl(current))}" target="_blank" rel="noopener noreferrer">Get directions ↗</a>`:''}</div>
     <p class="nearby-map-caption">If the embedded map is unavailable, use “Open in Google Maps.” Google does not guarantee this no-key iframe format.</p></section>`:''}
   </div>
   `;
 }
 async function loadSaved(){
  const user=getUser?.();if(!user?.id||loading)return;
  const qid=++queryVersion;loading=true;savingError='';refresh();
  try{
   const {data,error}=await supabase.from('businesses').select('id,name,category,address,lat,long').eq('user_id',user.id).order('name',{ascending:true});
   if(error)throw error;
   if(qid!==queryVersion)return;
   saved=(data||[]).map(normalizeBusiness).filter(Boolean);loaded=true;
   if(selectedId&&!saved.some(p=>p.id===selectedId))selectedId=null;
  }catch(err){if(qid!==queryVersion)return;savingError=`Could not load saved places: ${err.message||'Unknown error'}`;loaded=true;}
  finally{if(qid===queryVersion){loading=false;refresh()}}
 }
 function afterRender(){if(!loaded&&!loading)void loadSaved()}
 async function handleCitySubmit(form){
  const data=new FormData(form);city=String(data.get('city')||'').trim().slice(0,80);
  if(!city){message='Enter a city or ZIP code first.';refresh();return}
  searchTarget=categoryQuery(category,city);selectedId=null;message=`Showing Google Maps for ${city}.`;refresh();
 }
 async function handleSaveSubmit(form){
  if(busy)return;const values=new FormData(form);
  const name=String(values.get('name')||'').trim().slice(0,120);
  const address=String(values.get('address')||'').trim().slice(0,240);
  const chosenCategory=String(values.get('category')||'pharmacy');
  if(!name||!address){savingError='Enter a place name and address.';refresh();return}
  if(!PLACE_CATEGORIES[chosenCategory]){savingError='Choose a valid place category.';refresh();return}
  const user=getUser?.();if(!user?.id){savingError='Please sign in to save a place.';refresh();return}
  busy=true;savingError='';
  try{
   const {data,error}=await supabase.from('businesses').insert({user_id:user.id,name,address,category:chosenCategory}).select('id,name,category,address,lat,long').single();
   if(error)throw error;
   selectedId=data.id;message='Your place was saved to SeniorCare.';loaded=false;await loadSaved();
  }catch(err){savingError=`Unable to save this place: ${err.message||'Unknown error'}`;}
  finally{busy=false;refresh()}
 }
 async function handleFilterSubmit(form){filteredText=String(new FormData(form).get('filter')||'').trim().slice(0,90);refresh()}
 async function locate(){
  if(busy)return;if(!navigator.geolocation){message='This browser does not support location sharing. Search by city instead.';refresh();return}
  busy=true;message='Requesting location permission…';refresh();
  try{
   const coords=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(
    p=>resolve(p.coords),reject,{enableHighAccuracy:false,timeout:12000,maximumAge:120000}));
   const position=`${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`;
   searchTarget=categoryQuery(category,position);selectedId=null;message='Your approximate location is being used for this Google Maps search.';city='';
  }catch(err){message=err.code===1?'Location permission was denied. You can search by city instead.':`Could not get your location: ${err.message||'Please try again.'}`}
  finally{busy=false;refresh()}
 }
 async function handleClick(target){
  const cat=target.closest('[data-nearby-category]');if(cat){category=PLACE_CATEGORIES[cat.dataset.nearbyCategory]?cat.dataset.nearbyCategory:category;selectedId=null;if(searchTarget){const loc=city||searchTarget.replace(/^.+? near /,'');searchTarget=categoryQuery(category,loc)}refresh();return;}
  const select=target.closest('[data-nearby-select]');if(select){selectedId=select.dataset.nearbySelect;message='Showing your saved place.';refresh();return;}
  const remove=target.closest('[data-nearby-delete]');if(remove){
   const id=remove.dataset.nearbyDelete;const p=saved.find(s=>s.id===id);if(!p||!window.confirm(`Remove ${p.name} from your saved places?`))return;
   const user=getUser?.();if(!user?.id)return;
   const {error}=await supabase.from('businesses').delete().eq('id',id).eq('user_id',user.id);
   if(error){savingError=`Could not remove the place: ${error.message}`;refresh();return}
   if(selectedId===id)selectedId=null;loaded=false;await loadSaved();return;
  }
  const action=target.closest('[data-nearby-action]');if(!action)return;
  if(action.dataset.nearbyAction==='locate')await locate();
  else if(action.dataset.nearbyAction==='reload'){loaded=false;await loadSaved()}
  else if(action.dataset.nearbyAction==='toggle-map'){mapShown=!mapShown;refresh()}
 }
 function reset(){queryVersion++;city='';category='pharmacy';searchTarget='';selectedId=null;filteredText='';saved=[];loaded=false;loading=false;busy=false;message='';savingError='';mapShown=true}
 return {viewNearby,afterRender,handleClick,handleCitySubmit,handleSaveSubmit,handleFilterSubmit,reset};
}