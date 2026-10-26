import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const code=(await fs.readFile(new URL('../src/i18n.js',import.meta.url),'utf8')).replace(/^export /gm,'');
function api(stored){
 const values=new Map(stored?[['seniorcare-language',stored]]:[]);
 const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
 const document={documentElement:{lang:''}};
 return (new Function('localStorage','document','NodeFilter',code+'\nreturn {getLanguage,setLanguage,translate,getLocale};'))(storage,document,{});
}
test('supports all three languages and persistent initial choice',()=>{
 assert.equal(api('zh').getLanguage(),'zh');
 assert.equal(api('es').getLanguage(),'es');
 assert.equal(api('xx').getLanguage(),'en');
});
test('translates common navigation and support text',()=>{
 const a=api();
 a.setLanguage('zh');
 assert.equal(a.translate('Settings'),'设置');
 assert.equal(a.translate('What would help today?'),'今天需要什么帮助？');
 assert.equal(a.translate('Good evening, Evelyn.'),'Evelyn，晚上好。');
 a.setLanguage('es');
 assert.equal(a.translate('Sign out'),'Cerrar sesión');
 assert.equal(a.translate('☎️ Call your family'),'☎️ Llamar a su familia');
});
test('preserves unknown personal notes and recipe content',()=>{
 const a=api();
 a.setLanguage('es');
 assert.equal(a.translate('My personal task: water the orchids'),'My personal task: water the orchids');
 a.setLanguage('en');
 assert.equal(a.translate('Settings'),'Settings');
});
