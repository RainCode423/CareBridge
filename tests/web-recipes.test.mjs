import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMeal,ingredientList,pantryMatch,rankMeals,discoverRecipes,safeHttps} from '../src/web-recipes-core.js';
const raw={idMeal:'12345',strMeal:'Tomato Rice',strInstructions:'Boil rice.\nAdd tomato.',strIngredient1:'Rice',strMeasure1:'1 cup',strIngredient2:'Tomatoes',strMeasure2:'2',strCategory:'Vegetarian',strArea:'Italian',strSource:'https://example.org/recipe',strMealThumb:'https://example.org/photo.jpg'};
test('parses ingredients and keeps original published instructions and link',()=>{const r=normalizeMeal(raw);assert.equal(r.ingredients.length,2);assert.equal(r.instructions,raw.strInstructions);assert.equal(r.originalUrl,raw.strSource)});
test('does not accept unsafe external links',()=>{assert.equal(safeHttps('javascript:alert(1)'),'');assert.equal(safeHttps('http://example.com'),'')});
test('pantry match supports common plurals',()=>{assert.equal(pantryMatch(normalizeMeal(raw),'rice, tomato').have.length,2)});
test('keeps conservative vegetarian category and ingredient avoid filter',()=>{const r=normalizeMeal(raw);assert.equal(rankMeals([r],{vegetarian:true,avoid:'tomatoes'}).length,0);assert.equal(rankMeals([r],{vegetarian:true}).length,1)});
test('fetches real source data and looks up full record',async()=>{
 const urls=[];const mock=async u=>{urls.push(u);return {ok:true,json:async()=>({meals:u.includes('filter.php')?[{idMeal:'12345'}]:[raw]})}};
 const result=await discoverRecipes({pantry:'rice'},mock);
 assert.equal(result.length,1);assert.equal(result[0].title,'Tomato Rice');assert.ok(urls.some(u=>u.includes('lookup.php')));
});
