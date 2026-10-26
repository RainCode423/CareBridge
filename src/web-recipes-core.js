/** Live recipes from TheMealDB's documented public V1 API. No generated recipes. */
export const RECIPE_API = 'https://www.themealdb.com/api/json/v1/1/';
const FIRST_PAGE_SIZE = 12;
const SOFT_LIMIT = 16;
const clean = value => String(value ?? '').trim();
const alias = {eggs:'egg',tomatoes:'tomato',potatoes:'potato',onions:'onion',carrots:'carrot',peppers:'pepper',beans:'bean',chickpeas:'chickpea',noodles:'noodle',berries:'berry'};
export function canonicalIngredient(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9 -]/g,' ').replace(/\s+/g,' ').trim()
    .split(' ').map(word => alias[word] || (word.endsWith('s') && !word.endsWith('ss') && word.length > 4 ? word.slice(0,-1) : word)).join(' ');
}
export function ingredientList(value) {
  return [...new Set(clean(value).split(/[,;\n]+/).map(canonicalIngredient).filter(Boolean))].slice(0,25);
}
export function safeHttps(value) {
  try { const u = new URL(clean(value)); return u.protocol === 'https:' ? u.href : ''; }
  catch (_) { return ''; }
}
export function normalizeMeal(raw) {
  const id = clean(raw?.idMeal), title = clean(raw?.strMeal), instructions = clean(raw?.strInstructions);
  if (!/^\d+$/.test(id) || !title || !instructions) return null;
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = clean(raw['strIngredient' + i]);
    if (name) ingredients.push({name, amount: clean(raw['strMeasure' + i])});
  }
  if (!ingredients.length) return null;
  const category=clean(raw.strCategory), cuisine=clean(raw.strArea);
  return {
    id, title, category, cuisine, ingredients, instructions,
    thumbnail: safeHttps(raw.strMealThumb),
    originalUrl: safeHttps(raw.strSource),
    mealUrl: 'https://www.themealdb.com/meal/' + id,
    vegetarianCategory: /^(Vegetarian|Vegan)$/i.test(category)
  };
}
export function pantryMatch(recipe, pantry) {
  const items = Array.isArray(pantry) ? pantry.map(canonicalIngredient) : ingredientList(pantry);
  const have=[], missing=[];
  for (const ingredient of recipe.ingredients) {
    const norm=canonicalIngredient(ingredient.name);
    const matches=items.some(item=>item===norm || (item.length>=4 && (' '+norm+' ').includes(' '+item+' ')) || (norm.length>=4 && (' '+item+' ').includes(' '+norm+' ')));
    (matches ? have : missing).push(ingredient);
  }
  return {have, missing, fraction: have.length / recipe.ingredients.length};
}
export function rankMeals(meals, options={}) {
  const pantry=ingredientList(options.pantry||'');
  const avoid=ingredientList(options.avoid||'');
  const area=clean(options.cuisine);
  return meals
    .filter(r=> !options.vegetarian || r.vegetarianCategory)
    .filter(r=> !area || r.cuisine.toLowerCase()===area.toLowerCase())
    // Keyword exclusions are convenience filters, NOT reliable allergy screening.
    .filter(r=> !avoid.some(a=>r.ingredients.some(i=>{
      const name=canonicalIngredient(i.name);
      return name===a || (' '+name+' ').includes(' '+a+' ');
    })))
    .map(r=>({...r,...pantryMatch(r,pantry)}))
    .sort((a,b)=>b.fraction-a.fraction || a.missing.length-b.missing.length || a.title.localeCompare(b.title));
}
async function getJson(fetcher, endpoint, params={}) {
  const url = new URL(endpoint, RECIPE_API);
  for (const [key,value] of Object.entries(params)) url.searchParams.set(key,value);
  const response = await fetcher(url.href);
  if (!response.ok) throw new Error('Recipe website returned HTTP ' + response.status);
  const data=await response.json();
  if (!data || typeof data !== 'object') throw new Error('Invalid recipe website response');
  return Array.isArray(data.meals) ? data.meals : [];
}
/** Uses free V1 single-ingredient search, then fetches full source recipes by ID. */
export async function discoverRecipes(options={}, fetcher=fetch) {
  const query=clean(options.query).slice(0,80), pantry=ingredientList(options.pantry||'');
  const cuisine=clean(options.cuisine);
  if (options.random) {
    return rankMeals((await getJson(fetcher,'random.php')).map(normalizeMeal).filter(Boolean),options);
  }
  let candidate=[];
  if (query) {
    candidate=await getJson(fetcher,'search.php',{s:query});
  } else if (pantry.length) {
    // Free V1 allows only ONE main ingredient per request. Combine up to two searches.
    const responses=await Promise.all(pantry.slice(0,2).map(async ingredient => {
      try { return await getJson(fetcher,'filter.php',{i:ingredient.replace(/\s+/g,'_')}); }
      catch (_) { return []; }
    }));
    candidate=responses.flat();
  } else if (cuisine) {
    candidate=await getJson(fetcher,'filter.php',{a:cuisine});
  } else if (options.vegetarian) {
    candidate=await getJson(fetcher,'filter.php',{c:'Vegetarian'});
  } else {
    // Browsing a documented first-letter endpoint requires only one API request.
    candidate=await getJson(fetcher,'search.php',{f:'a'});
  }
  const seen=new Set();
  candidate=candidate.filter(item=>{
    const id=clean(item?.idMeal);
    if (!/^\d+$/.test(id) || seen.has(id)) return false;
    seen.add(id);return true;
  });
  if (!candidate.length) return [];
  const detailed=candidate.slice(0,SOFT_LIMIT);
  const results=[];
  for (let i=0; i<detailed.length; i+=4) {
    const batch=await Promise.all(detailed.slice(i,i+4).map(async item=>{
      if (clean(item.strInstructions)) return normalizeMeal(item);
      try {
        const found=await getJson(fetcher,'lookup.php',{i:clean(item.idMeal)});
        return normalizeMeal(found[0]);
      } catch (_) { return null; }
    }));
    results.push(...batch.filter(Boolean));
  }
  return rankMeals(results, options).slice(0,FIRST_PAGE_SIZE);
}
