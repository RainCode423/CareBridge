/** Key-free Google Maps URL helpers for CareBridge's saved places and categories. */
export const PLACE_CATEGORIES=Object.freeze({
 pharmacy:{label:'Pharmacies',icon:'💊',query:'pharmacies'},
 clinic:{label:'Doctors & clinics',icon:'🩺',query:'doctors and medical clinics'},
 groceries:{label:'Groceries',icon:'🛒',query:'grocery stores'},
 parks:{label:'Parks',icon:'🌳',query:'parks'},
 library:{label:'Libraries',icon:'📚',query:'public libraries'},
 community:{label:'Senior centers',icon:'🤝',query:'senior centers'},
 cafe:{label:'Cafés',icon:'☕',query:'cafes'}
});
export function hasCoordinates(b){
 const lat=Number(b?.lat),lng=Number(b?.long);
 return b?.lat!==null&&b?.lat!==undefined&&b?.lat!==''&&b?.long!==null&&b?.long!==undefined&&b?.long!==''&&Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180;
}
export function placeQuery(b){
 if(hasCoordinates(b))return `${Number(b.lat)},${Number(b.long)}`;
 return String(b?.address||b?.name||'').trim();
}
export function categoryQuery(category,location=''){
 const c=PLACE_CATEGORIES[category]||PLACE_CATEGORIES.pharmacy;
 const base=c.query;
 return location?.trim()?`${base} near ${location.trim()}`:base;
}
export function buildMapEmbedUrl(input){
 const query=typeof input==='string'?input.trim():placeQuery(input);
 if(!query)return '';
 // A lightweight Google Maps iframe URL. Unlike the supported Maps Embed API,
 // this unkeyed URL format is not officially guaranteed by Google.
 return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
}
export function buildMapsSearchUrl(input){
 const query=typeof input==='string'?input.trim():placeQuery(input);
 return query?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`:'';
}
export function buildDirectionsUrl(business){
 const destination=placeQuery(business);
 return destination?`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`:'';
}
export function normalizeBusiness(b){
 if(!b||!b.id||!b.name||!(hasCoordinates(b)||String(b.address||'').trim()))return null;
 return {id:String(b.id),name:String(b.name).slice(0,120),category:String(b.category||'other').slice(0,48),address:String(b.address||'').slice(0,240),lat:hasCoordinates(b)?Number(b.lat):null,long:hasCoordinates(b)?Number(b.long):null};
}