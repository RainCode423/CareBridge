/** Content-based recommendation model with small online feedback learning. No external AI service. */
import {RECIPES,ALLERGENS} from './recipes-data.js';
export const DEFAULT_PROFILE=Object.freeze({pantry:[],cuisines:[],meal:'any',flavor:'any',maxMinutes:60,vegetarian:false,allergies:[],otherAllergies:''});
const swaps={tomatoes:'tomato',eggs:'egg',potatoes:'potato',berries:'berry',peas:'pea',onions:'onion',lentils:'lentil',beans:'bean',noodles:'noodle',tortillas:'tortilla',carrots:'carrot',chickpeas:'chickpea',oats:'oat',garlics:'garlic',peppers:'pepper',greens:'green'};
export function canonical(text){return String(text||'').toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,' ').split(' ').map(w=>swaps[w]||w).join(' ');}
export function pantryItems(text){return [...new Set(String(text||'').split(/[,;\n]+/).map(v=>canonical(v.trim().slice(0,60))).filter(Boolean))].slice(0,80)}
export function hasIngredient(pantry,name){
 const norm=x=>canonical(x).replace(/^(cooked|canned|fresh|frozen|red|black|kidney|large|dry) /,'');
 const target=norm(name);
 return pantry.some(raw=>norm(raw)===target||canonical(raw)===canonical(name)||(target==='olive oil'&&canonical(raw)==='oil'));
}
const mapped={
 milk:['milk','butter','yogurt','cheese','mozzarella','feta','cream','whey','casein'],
 eggs:['egg','mayonnaise','mayo'],
 fish:['tuna','salmon','anchovy','fish'],
 shellfish:['shrimp','crab','lobster','shellfish','prawn'],
 'tree nuts':['almond','walnut','pecan','cashew','pistachio','hazelnut','macadamia','pine nut'],
 peanuts:['peanut','groundnut'],
 wheat:['bread','pasta','noodle','tortilla','flour','wheat','soy sauce'],
 soy:['tofu','soy','edamame','miso'],
 sesame:['tahini','sesame']
};
const containsPhrase=(s,term)=>(' '+canonical(s)+' ').includes(' '+canonical(term)+' ');
export function allergenReasons(recipe,profile={}){
 const selected=(Array.isArray(profile.allergies)?profile.allergies:[]).filter(a=>ALLERGENS.includes(a));
 const ingredients=(recipe.ingredients||[]).map(x=>canonical(x.name));
 const inferred=new Set(recipe.allergens||[]);
 for(const [allergen,aliases] of Object.entries(mapped))if(ingredients.some(i=>aliases.some(a=>containsPhrase(i,a))))inferred.add(allergen);
 const matches=selected.filter(a=>inferred.has(a));
 const custom=String(profile.otherAllergies||'').split(/[,;\n]/).map(canonical).filter(Boolean);
 for(const value of custom){if(ingredients.some(i=>containsPhrase(i,value)))matches.push(value)}
 return [...new Set(matches)];
}
const features=r=>['cuisine:'+r.cuisine,'meal:'+r.meal,'flavor:'+r.flavor,'vegetarian:'+r.vegetarian];
export function learnWeights(feedback={},catalog=RECIPES){
 const byId=new Map(catalog.map(r=>[r.id,r])),weights={};
 for(const [id,value] of Object.entries(feedback)){
  const r=byId.get(id);if(!r||![1,-1].includes(value))continue;
  for(const f of features(r))weights[f]=Math.max(-3,Math.min(3,(weights[f]||0)+value*.65));
 }
 return weights;
}
export function recommendations(profile={},feedback={},catalog=RECIPES){
 const pantry=(Array.isArray(profile.pantry)?profile.pantry:[]).map(canonical);
 const weights=learnWeights(feedback,catalog),preferred=Array.isArray(profile.cuisines)?profile.cuisines:[],results=[];
 for(const r of catalog){
  if(allergenReasons(r,profile).length)continue;
  if(profile.vegetarian&&!r.vegetarian)continue;
  const have=r.ingredients.filter(i=>hasIngredient(pantry,i.name));
  const missing=r.ingredients.filter(i=>!hasIngredient(pantry,i.name));
  const match=have.length/r.ingredients.length;
  let score=match*115-missing.length*3;
  if(preferred.includes(r.cuisine))score+=15;
  if(profile.meal&&profile.meal!=='any'&&profile.meal===r.meal)score+=8;
  if(profile.flavor&&profile.flavor!=='any'&&profile.flavor===r.flavor)score+=7;
  const max=Number(profile.maxMinutes)||60;
  if(r.minutes<=max)score+=12;else score-=Math.min(30,(r.minutes-max)*1.2);
  for(const f of features(r))score+=(weights[f]||0)*8;
  if(feedback[r.id]===1)score+=15;
  if(feedback[r.id]===-1)score-=45;
  results.push({...r,have,missing,match,score:Math.round(score),liked:feedback[r.id]||0});
 }
 return results.sort((a,b)=>b.score-a.score||b.match-a.match||a.minutes-b.minutes||a.title.localeCompare(b.title));
}
export function normalizeProfile(profile={}){
 const allowedCuisines=new Set(RECIPES.map(r=>r.cuisine));
 return {
  pantry:[...new Set((Array.isArray(profile.pantry)?profile.pantry:[]).map(canonical).filter(Boolean))].slice(0,80),
  cuisines:[...new Set((Array.isArray(profile.cuisines)?profile.cuisines:[]).filter(c=>allowedCuisines.has(c)))],
  meal:['any','breakfast','lunch','dinner','snack'].includes(profile.meal)?profile.meal:'any',
  flavor:['any','savory','sweet','fresh'].includes(profile.flavor)?profile.flavor:'any',
  maxMinutes:[15,30,45,60].includes(Number(profile.maxMinutes))?Number(profile.maxMinutes):60,
  vegetarian:!!profile.vegetarian,
  allergies:[...new Set((Array.isArray(profile.allergies)?profile.allergies:[]).filter(a=>ALLERGENS.includes(a)))],
  otherAllergies:String(profile.otherAllergies||'').slice(0,200)
 };
}
