/** Pure helpers for the nearby-place explorer; safe to test without Google Maps. */
export const PLACE_CATEGORIES = Object.freeze({
  pharmacy: {label:'Pharmacies',icon:'💊',types:['pharmacy'],query:'pharmacies'},
  clinic: {label:'Doctors & clinics',icon:'🩺',types:['doctor'],query:'medical clinics'},
  groceries: {label:'Groceries',icon:'🛒',types:['grocery_store'],query:'grocery stores'},
  parks: {label:'Parks',icon:'🌳',types:['park'],query:'parks'},
  library: {label:'Libraries',icon:'📚',types:['library'],query:'public libraries'},
  community: {label:'Senior centers',icon:'🤝',types:[],query:'senior community centers'},
  cafe: {label:'Cafés',icon:'☕',types:['cafe'],query:'cafes'}
});

/** Accept both Google PlacesService (Legacy) results and newer Place objects. */
export function normalizePlace(place) {
  const loc=place?.geometry?.location||place?.location;
  const lat=typeof loc?.lat==='function'?loc.lat():Number(loc?.lat);
  const lng=typeof loc?.lng==='function'?loc.lng():Number(loc?.lng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return null;
  const rating=Number(place?.rating);
  const count=Number(place?.user_ratings_total??place?.userRatingCount);
  return {
    id:String(place.place_id||place.id||''),
    name:String(place.name||place.displayName||'Unnamed place'),
    address:String(place.vicinity||place.formatted_address||place.formattedAddress||'Address not available'),
    lat,lng,
    rating:Number.isFinite(rating)&&place.rating!=null?rating:null,
    reviewCount:Number.isFinite(count)&&(place.user_ratings_total!=null||place.userRatingCount!=null)?count:null
  };
}

export function distanceMiles(origin, destination){
  if(!origin) return null;
  const radians=n=>n*Math.PI/180;
  const latDelta=radians(destination.lat-origin.lat),lonDelta=radians(destination.lng-origin.lng);
  const a=Math.sin(latDelta/2)**2+Math.cos(radians(origin.lat))*Math.cos(radians(destination.lat))*Math.sin(lonDelta/2)**2;
  return 3958.7613*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
}

export function directionsUrl(place,travelMode='driving'){
  const params=new URLSearchParams({api:'1',destination:`${place.lat},${place.lng}`,travelmode:travelMode});
  if(place.id) params.set('destination_place_id',place.id);
  return `https://www.google.com/maps/dir/?${params}`;
}
export function placeMapUrl(place){
  const params=new URLSearchParams({api:'1',query:`${place.lat},${place.lng}`});
  if(place.id)params.set('query_place_id',place.id);
  return `https://www.google.com/maps/search/?${params}`;
}
export const isMapsKeyConfigured=value=>typeof value==='string'&&value.trim().length>10&&!value.includes('YOUR_');