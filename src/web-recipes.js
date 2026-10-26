import {discoverRecipes,ingredientList} from './web-recipes-core.js';
import {escapeHTML} from './utils.js';
const h=escapeHTML;
const STORE='carebridge-recipe-preferences';
const CUISINES=['','American','British','Canadian','Chinese','French','Greek','Indian','Italian','Japanese','Mexican','Moroccan','Thai','Turkish','Vietnamese'];
export function createWebRecipes(){
 let prefs={pantry:'',query:'',cuisine:'',avoid:'',vegetarian:false};
 try {prefs={...prefs,...JSON.parse(localStorage.getItem(STORE)||'{}')};} catch (_) {}
 let recipes=[],selected=null,loading=false,error='',searched=false,runId=0;
 function persist(){try{localStorage.setItem(STORE,JSON.stringify(prefs))}catch(_){}}
 const safeLink=url=>/^https:\/\//.test(url)?url:'#';
 function recipeCard(r){
  const pct=Math.round(r.fraction*100);
  return '<article class="recipe-card">'+(r.thumbnail?'<img src="'+h(r.thumbnail)+'" alt="" loading="lazy">':'')+
  '<div class="recipe-card-copy"><div class="recipe-small">'+h(r.cuisine||'World cuisine')+' · '+h(r.category||'Meal')+'</div>'+
  '<h3>'+h(r.title)+'</h3><p><strong>'+r.have.length+' of '+r.ingredients.length+'</strong> listed ingredients in your kitchen · '+pct+'% match</p>'+
  '<button type="button" class="btn green" data-recipe-id="'+h(r.id)+'">View recipe and instructions</button></div></article>';
 }
 function detail(){
  if(!selected)return '';
  const r=selected,source=safeLink(r.originalUrl||r.mealUrl);
  return '<section class="panel recipe-detail" aria-labelledby="recipe-detail-title"><button type="button" class="btn outline" data-recipe-back>← Back to recipes</button>'+
    '<div class="recipe-small">Recipe from TheMealDB'+(r.originalUrl?' · Original website linked below':'')+'</div>'+
    '<h2 id="recipe-detail-title">'+h(r.title)+'</h2><p>'+h(r.cuisine)+' · '+h(r.category)+'</p>'+
    (r.thumbnail?'<img class="recipe-detail-image" src="'+h(r.thumbnail)+'" alt="'+h(r.title)+'">':'')+
    '<h3>Ingredients</h3><ul class="recipe-ingredients">'+r.ingredients.map(i=>'<li>'+h((i.amount?i.amount+' ':'')+i.name)+'</li>').join('')+'</ul>'+
    '<h3>Instructions from the recipe website</h3><div class="recipe-directions">'+h(r.instructions).replace(/\r?\n/g,'<br>')+'</div>'+
    '<p class="notice warning">Allergy reminder: ingredient keyword filtering is not a reliable allergy check. Review every ingredient, product label, substitute and cross-contact risk before cooking.</p>'+
    '<a class="btn green" target="_blank" rel="noopener noreferrer" href="'+h(source)+'">Read on recipe website ↗</a></section>';
 }
 function view(){
  const controls='<div class="panel"><h2>Find something delicious</h2><p>Recipes come from real cooking websites, not AI-generated instructions.</p>'+
   '<form id="recipe-search-form" class="recipe-form">'+
   '<div class="field"><label for="recipe-pantry">What ingredients do you have?</label><textarea id="recipe-pantry" rows="2" placeholder="eggs, tomatoes, rice, chicken">'+h(prefs.pantry)+'</textarea></div>'+
   '<div class="field"><label for="recipe-query">Search for a dish (optional)</label><input id="recipe-query" placeholder="e.g. pasta or soup" maxlength="80" value="'+h(prefs.query)+'"></div>'+
   '<div class="recipe-form-row"><div class="field"><label for="recipe-cuisine">Cuisine</label><select id="recipe-cuisine">'+CUISINES.map(c=>'<option value="'+h(c)+'" '+(c===prefs.cuisine?'selected':'')+'>'+h(c||'Any cuisine')+'</option>').join('')+'</select></div>'+
   '<div class="field"><label for="recipe-avoid">Ingredients to avoid (optional)</label><input id="recipe-avoid" placeholder="peanuts, milk" value="'+h(prefs.avoid)+'"></div></div>'+
   '<label class="recipe-check"><input type="checkbox" id="recipe-vegetarian" '+(prefs.vegetarian?'checked':'')+'> Show vegetarian-category recipes only</label>'+
   '<div class="inline-actions"><button class="btn green" type="submit" '+(loading?'disabled':'')+'>'+(loading?'Searching…':'Find real recipes')+'</button><button type="button" class="btn outline" data-recipe-random '+(loading?'disabled':'')+'>Surprise me</button></div></form>'+
   '<p class="mini-caption">Ingredient search may use your first two pantry items. Matching is approximate; only the first available recipes are displayed. Cuisine labels and dietary categories come from the recipe source.</p></div>';
  return '<div class="recipe-page"><div class="intro"><div class="eyebrow">SeniorCare Kitchen</div><h1>What can we cook today? 🍳</h1><p>Use what is in your kitchen to discover recipes with clear instructions.</p></div>'+
    controls+(selected?detail():'<section class="recipe-results" aria-live="polite">'+
    (error?'<div class="error-notice" role="alert">'+h(error)+'</div>':'')+
    (loading?'<div class="panel">Looking up recipes from TheMealDB…</div>':searched&&!recipes.length?'<div class="panel"><h2>No matching recipes found</h2><p>Try a different ingredient, cuisine, or fewer restrictions.</p></div>':
    searched?'<div><h2>Recipes you can try</h2><p>Sorted by how many listed ingredients you already have.</p></div><div class="recipe-grid">'+recipes.map(recipeCard).join('')+'</div>':
    '<div class="panel"><h2>Your next meal starts here</h2><p>Enter a few ingredients, or search for a dish to see real recipes.</p></div>')+'</section>')+'</div>';
 }
 function sync(form){
  prefs={pantry:form.querySelector('#recipe-pantry').value.slice(0,300),query:form.querySelector('#recipe-query').value.trim().slice(0,80),
   cuisine:form.querySelector('#recipe-cuisine').value,avoid:form.querySelector('#recipe-avoid').value.slice(0,180),
   vegetarian:form.querySelector('#recipe-vegetarian').checked};
  persist();
 }
 async function search({random=false,update}={}){
  const id=++runId; loading=true;error='';selected=null;searched=true;update?.();
  try{
   const found=await discoverRecipes({...prefs,random});
   if(id!==runId)return;
   recipes=found;
  }catch(err){
   if(id!==runId)return;
   recipes=[];error='Could not load recipes from the website. Please check your connection and try again.';
   console.warn('Recipe fetch failed:',err);
  }finally{if(id===runId){loading=false;update?.();}}
 }
 function onClick(target,update){
  const back=target.closest('[data-recipe-back]');
  if(back){selected=null;update();return true;}
  const item=target.closest('[data-recipe-id]');
  if(item){selected=recipes.find(r=>r.id===item.dataset.recipeId)||null;update();return true;}
  const surprise=target.closest('[data-recipe-random]');
  if(surprise){const form=document.querySelector('#recipe-search-form');if(form)sync(form);search({random:true,update});return true;}
  return false;
 }
 function onSubmit(form,update){sync(form);search({update});}
 return {view,onClick,onSubmit,reset:()=>{runId++;recipes=[];selected=null;loading=false;searched=false;error='';}};
}
