import {getLocale} from './i18n.js';
/** Reusable safe formatting and date helpers. */
export const todayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const dateMinus=n=>{const d=new Date();d.setDate(d.getDate()-n);return d};
export const escapeHTML=str=>String(str??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const clock=time=>time?new Intl.DateTimeFormat(getLocale(),{hour:'numeric',minute:'2-digit'}).format(new Date(time)):'—';
export const longDate=()=>new Intl.DateTimeFormat(getLocale(),{weekday:'long',month:'long',day:'numeric'}).format(new Date());
export const intro=(title,description)=>`<section class="intro"><h1>${title}</h1><p>${description}</p></section>`;
export const formatHour=h=>new Intl.DateTimeFormat(getLocale(),{hour:'numeric'}).format(new Date(2026,1,1,Number(h)));
export function greeting(){let h=new Date().getHours();return h<12?'morning':h<17?'afternoon':'evening'}
// Shared planner — designed around large, readable actions and caregiver-created tasks.
