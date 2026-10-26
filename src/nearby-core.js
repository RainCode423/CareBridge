/** Pure helpers for an OpenStreetMap / Leaflet nearby-place finder. */
export const PLACE_CATEGORIES=Object.freeze({
  "pharmacy": {
    "label": "Pharmacies",
    "icon": "💊",
    "selectors": [
      "[\"amenity\"=\"pharmacy\"]",
      "[\"healthcare\"=\"pharmacy\"]"
    ],
    "query": "pharmacies"
  },
  "clinic": {
    "label": "Doctors & clinics",
    "icon": "🩺",
    "selectors": [
      "[\"amenity\"~\"^(doctors|clinic|hospital)$\"]",
      "[\"healthcare\"~\"^(doctor|clinic)$\"]"
    ],
    "query": "medical clinics"
  },
  "groceries": {
    "label": "Groceries",
    "icon": "🛒",
    "selectors": [
      "[\"shop\"~\"^(supermarket|convenience|greengrocer)$\"]"
    ],
    "query": "grocery stores"
  },
  "parks": {
    "label": "Parks",
    "icon": "🌳",
    "selectors": [
      "[\"leisure\"~\"^(park|garden)$\"]"
    ],
    "query": "parks"
  },
  "library": {
    "label": "Libraries",
    "icon": "📚",
    "selectors": [
      "[\"amenity\"=\"library\"]"
    ],
    "query": "public libraries"
  },
  "community": {
    "label": "Community centers",
    "icon": "🤝",
    "selectors": [
      "[\"amenity\"=\"community_centre\"]",
      "[\"community_centre\"=\"senior\"]"
    ],
    "query": "senior and community centers"
  },
  "cafe": {
    "label": "Cafés",
    "icon": "☕",
    "selectors": [
      "[\"amenity\"=\"cafe\"]"
    ],
    "query": "cafes"
  }
});
export function validCoords(loc){
 return !!loc&&Number.isFinite(loc.lat)&&Number.isFinite(loc.lng)&&Math.abs(loc.lat)<=90&&Math.abs(loc.lng)<=180;
}

export function distanceMiles(origin,destination){
 if(!validCoords(origin)||!validCoords(destination))return null;
 const rad=n=>n*Math.PI/180;
 const a=Math.sin(rad(destination.lat-origin.lat)/2)**2+Math.cos(rad(origin.lat))*Math.cos(rad(destination.lat))*Math.sin(rad(destination.lng-origin.lng)/2)**2;
 return 3958.7613*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
}

export function buildOverpassQuery(category,origin,radius=5000){
 const entry=PLACE_CATEGORIES[category];
 if(!entry||!validCoords(origin))throw new Error('Choose a category and a valid location.');
 const meters=Math.min(6000,Math.max(1000,Math.round(radius)));
 const position=`(around:${meters},${origin.lat.toFixed(5)},${origin.lng.toFixed(5)})`;
 return `[out:json][timeout:20];(\n${entry.selectors.map(tag=>`  nwr${position}${tag};`).join('\n')}\n);out center 100;`;
}

function formatAddress(tags){
 const street=[tags['addr:housenumber'],tags['addr:street']].filter(Boolean).join(' ');
 const city=[tags['addr:city'],tags['addr:state']].filter(Boolean).join(', ');
 return [street||tags['addr:full'],city].filter(Boolean).join(' · ')||'Street address not listed';
}

export function normalizePlace(element){
 const coords=element?.center||element;
 const loc={lat:Number(coords?.lat),lng:Number(coords?.lon)};
 if(!validCoords(loc))return null;
 const tags=element.tags||{};
 return {id:`${element.type}/${element.id}`,name:String(tags.name||tags['name:en']||tags.operator||'Unnamed place').slice(0,180),address:formatAddress(tags),lat:loc.lat,lng:loc.lng,rating:null,reviewCount:null};
}

export function getPlacesFromOverpass(data,origin,max=15){
 if(data?.remark)throw new Error('The places service is busy. Please try again in a minute.');
 if(!Array.isArray(data?.elements))throw new Error('The places service returned an unexpected response.');
 const unique=new Map();
 for(const raw of data.elements){const place=normalizePlace(raw);if(place&&distanceMiles(origin,place)<=5.5)unique.set(place.id,place)}
 return [...unique.values()].sort((a,b)=>distanceMiles(origin,a)-distanceMiles(origin,b)).slice(0,max);
}

export function directionsUrl(place,travelMode='driving'){
 const params=new URLSearchParams({api:'1',destination:`${place.lat},${place.lng}`,travelmode:travelMode});
 return `https://www.google.com/maps/dir/?${params}`;
}

export function placeMapUrl(place){
 const [kind,id]=String(place.id||'').split('/');
 if(['node','way','relation'].includes(kind)&&/^\d+$/.test(id||''))return `https://www.openstreetmap.org/${kind}/${id}`;
 return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(place.lat)}&mlon=${encodeURIComponent(place.lng)}#map=16/${place.lat}/${place.lng}`;
}

export function normalizeGeocodedCity(data){
 const result=data?.results?.find(item=>Number.isFinite(item.latitude)&&Number.isFinite(item.longitude));
 if(!result)return null;
 const origin={lat:result.latitude,lng:result.longitude};
 if(!validCoords(origin))return null;
 return {origin,label:[result.name,result.admin1,result.country].filter(Boolean).join(', ')};
}
