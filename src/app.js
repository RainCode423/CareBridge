/** App bootstrap: session lifecycle, UI events and persistence. */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';
import { todayKey, dateMinus, escapeHTML, clock, longDate } from './utils.js';
import { request } from './data.js';
import { createPlanner } from './planner.js';
import { createScreens } from './screens.js';
import { createNearby } from './nearby.js';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_URL.startsWith('https://')) {
  document.getElementById('app').innerHTML = '<section class="panel auth-container"><h1>Complete Supabase setup</h1><p>Open <code>src/config.js</code> and enter your Supabase project URL and publishable key, then refresh.</p></section>';
} else {
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

(function(){
const STORE='carebridge-accessibility-v2';
const initialPrefs={elderName:'Your loved one',familyName:'Family',hour:20,font:'normal',contrast:false};
let uiPrefs={};
try{uiPrefs=JSON.parse(localStorage.getItem(STORE))||{}}catch(_){uiPrefs={}}
let state={checkins:{},notes:{},reminders:[],tasks:[],completions:[],prefs:{...initialPrefs,font:uiPrefs.font||'normal',contrast:!!uiPrefs.contrast},demoScenario:false};
let user=null,role=null,elderId=null,links=[],busy=false,authMode='signin',infoText='',accountError='';
let view='home', modalType=null,needReason='Just want a call',toastTimer=null,invitationCode='';
let editingTaskId=null;
let planner;
const save=()=>{localStorage.setItem(STORE,JSON.stringify({font:state.prefs.font,contrast:state.prefs.contrast,calendarVisible:planner.isCalendarVisible()}))};
async function loadAccount(){
  if(!user)return;
  accountError='';
  try{
    const own=await request(supabase.from('care_profiles').select('*').eq('user_id',user.id).maybeSingle());
    if(own){role='senior';elderId=user.id;links=await request(supabase.from('caregiver_links').select('caregiver_id').eq('elder_id',user.id));}
    else{
      links=await request(supabase.from('caregiver_links').select('elder_id').eq('caregiver_id',user.id));
      role=links.length?'family':null;
      elderId=links.length?links[0].elder_id:null;
      if (role==='family' && view!=='family' && view!=='settings') view='family';
    }
    if(elderId)await reloadData();
    else render();
  }catch(err){accountError=err.message||'Could not load account';render()}
}
async function reloadData(){
  if(!elderId)return;
  try{
    const [profile,checkins,notes,reminders,followups,tasks,completions]=await Promise.all([
      request(supabase.from('care_profiles').select('*').eq('user_id',elderId).single()),
      request(supabase.from('check_ins').select('*').eq('elder_id',elderId).gte('day',todayKey(dateMinus(30))).order('day',{ascending:false})),
      request(supabase.from('daily_notes').select('*').eq('elder_id',elderId).gte('day',todayKey(dateMinus(30)))),
      request(supabase.from('reminders').select('*').eq('elder_id',elderId).order('created_at',{ascending:true})),
      request(supabase.from('followups').select('*').eq('elder_id',elderId).gte('day',todayKey(dateMinus(30)))),
      request(supabase.from('care_tasks').select('*').eq('elder_id',elderId).order('due_date',{ascending:true})),
      request(supabase.from('care_task_completions').select('*').gte('scheduled_for',todayKey(dateMinus(90))))
    ]);
    const followSet=new Set(followups.map(f=>f.day));
    state.checkins=Object.fromEntries(checkins.map(c=>[c.day,{status:c.status,at:c.checked_at,mood:c.mood,reason:c.reason,followedUp:followSet.has(c.day)}]));
    state.notes=Object.fromEntries(notes.map(n=>[n.day,n.note]));
    state.reminders=reminders.map(r=>({id:r.id,title:r.title,subtitle:r.subtitle,icon:r.icon,dates:r.done_dates||[]}));
    state.tasks=tasks;state.completions=completions;
    state.prefs={...state.prefs,elderName:profile.elder_name,familyName:profile.family_name,hour:profile.checkin_hour};
    accountError='';render();
  }catch(err){accountError=err.message||'Could not load your information';render();throw err}
}
const mutate=async(fn,success)=>{if(busy)return;busy=true;try{await fn();await reloadData();flash(success)}catch(err){flash(`Could not save: ${err.message||'unknown error'}`)}finally{busy=false}};
const todays=()=>state.checkins[todayKey()]||null;
const tabItems=()=>role==='family'?[['family','♡','Family'],['planner','▦','Care planner'],['settings','⚙','Settings']]:[['home','⌂','Today'],['planner','▦','My planner'],['nearby','📍','Nearby'],['routine','☑','Wellness'],['settings','⚙','Settings']];
planner=createPlanner({
  state,
  getRole:()=>role, getUser:()=>user,
  getEditingTaskId:()=>editingTaskId,
  initialCalendarVisible:uiPrefs.calendarVisible!==false
});
const {viewPlanner,taskPreview,taskModalHTML,scheduled,taskDone,canManageTask}=planner;
const screens=createScreens({
  state,todays,taskPreview,
  getRole:()=>role,getLinks:()=>links,getInvitationCode:()=>invitationCode,
  getAuthMode:()=>authMode,getInfoText:()=>infoText
});
const {viewHome,viewRoutine,viewFamily,viewSettings,authUI,setupUI,familyStatus}=screens;
const nearby=createNearby({isActive:()=>view==='nearby',update:()=>{if(view==='nearby')render()},supabase,getUser:()=>user});
function renderNav(){
  document.getElementById('desktop-nav').innerHTML=tabItems().map(([id,icon,name])=>`<button type="button" class="nav-btn" data-view="${id}" ${id===view?'aria-current="page"':''}><span class="nav-ico" aria-hidden="true">${icon}</span>${name}</button>`).join('');
  document.getElementById('mobile-nav').innerHTML=tabItems().map(([id,icon,name])=>`<button type="button" data-view="${id}" ${id===view?'aria-current="page"':''}><b aria-hidden="true">${icon}</b>${name}</button>`).join('');

}
function openTaskModal(id=null){editingTaskId=id;modalType='care-task';renderModal()}
function render({focus=false}={}){
  document.documentElement.style.setProperty('--font-scale',state.prefs.font==='large'?'1.13':'1');
  document.body.classList.toggle('high-contrast',!!state.prefs.contrast);
  document.getElementById('header-date').textContent=longDate();
  document.getElementById('signout-btn').hidden=!user;
  document.getElementById('refresh-btn').hidden=!elderId;
  document.getElementById('account-role').textContent=user?(role==='senior'?'OLDER ADULT ACCOUNT':role==='family'?'FAMILY ACCOUNT':'ACCOUNT SETUP'):'SECURE SIGN IN';
  if(user&&elderId&&role){renderNav();document.getElementById('app').innerHTML=({home:viewHome,planner:viewPlanner,nearby:nearby.viewNearby,routine:viewRoutine,family:viewFamily,settings:viewSettings})[view]();}
  else{document.getElementById('desktop-nav').innerHTML='';document.getElementById('mobile-nav').innerHTML='';document.getElementById('app').innerHTML=user?setupUI():authUI()}
  if(view==='nearby'&&user&&elderId&&role==='senior')nearby.afterRender();
  if(accountError)document.getElementById('app').insertAdjacentHTML('afterbegin',`<div class="error-notice" role="alert">${escapeHTML(accountError)} <button class="small-btn" data-action="retry">Retry</button></div>`);
  if(focus)document.getElementById('app').focus({preventScroll:true});
}
function flash(message){document.getElementById('live-region').textContent=message;document.querySelector('.toast')?.remove();const t=document.createElement('div');t.className='toast';t.textContent=message;t.setAttribute('role','status');document.body.append(t);clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.remove(),4200)}
function setView(next){view=next;state.demoScenario=false;render({focus:true});window.scrollTo({top:0,behavior:'instant'})}
function openHelp(){needReason='Just want a call';modalType='help';renderModal()}
function renderModal(){const host=document.getElementById('modal-host');if(!modalType){host.innerHTML='';return}
  if(modalType==='care-task'){host.innerHTML=taskModalHTML();host.querySelector('#care-title').focus();return}
  host.innerHTML=`<div class="modal-backdrop" id="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><div class="eyebrow">CareBridge support</div><h2 id="modal-title">What would help today?</h2><p>It's okay to ask for a hand. Choose one option.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div><div class="help-choice-list">${[['Just want a call','☎️ A friendly call'],['Help with errands','🛍️ Help with errands'],['Not feeling well','🤒 Not feeling well'],['Something else','💬 Something else']].map(([reason,label])=>`<button class="help-choice" data-reason="${escapeHTML(reason)}" aria-pressed="${String(needReason===reason)}">${label}</button>`).join('')}</div><div class="notice warning">This request is stored in Supabase for linked caregivers to view. It will NOT send texts, calls, or contact emergency services. If you need immediate assistance, contact local emergency services directly.</div><div class="inline-actions"><button class="btn green" data-action="save-help">Save help request</button><button class="btn outline" data-action="close-modal">Cancel</button></div></section></div>`;
  host.querySelector('[data-action="close-modal"]').focus();
}
function speak(){if(!('speechSynthesis' in window)){flash('Speech playback is unavailable in this browser.');return}window.speechSynthesis.cancel();const text=view==='home'?(todays()?.status==='okay'?`You've checked in today, ${state.prefs.elderName}. Thank you.`:`Hello, ${state.prefs.elderName}. Press I'm okay today to check in, or I could use help if you need support.`):view==='family'?`${state.prefs.elderName}'s family check-in status. ${familyStatus().label.replace(/<[^>]*>/g,'')}.`:view==='routine'?'Your daily routine. Check off any reminders you finish today.': 'Settings. Adjust font size, contrast, and your check-in time.';const utterance=new SpeechSynthesisUtterance(text);utterance.rate=.88;window.speechSynthesis.speak(utterance)}

async function signOut(){nearby.reset();await supabase.auth.signOut();user=null;role=null;elderId=null;links=[];invitationCode='';state.checkins={};state.notes={};state.reminders=[];state.tasks=[];state.completions=[];authMode='signin';view='home';infoText='';render()}
async function initialize(){try{const {data:{user:current},error}=await supabase.auth.getUser();if(error)throw error;user=current;if(user)await loadAccount();else render()}catch(err){if(err.name==='AuthSessionMissingError'){user=null;render()}else{accountError=err.message;render()}}}
async function recordHelp(){const previous=todays();await request(supabase.from('check_ins').upsert({elder_id:elderId,day:todayKey(),status:'help',checked_at:new Date().toISOString(),reason:needReason,mood:previous?.mood||null},{onConflict:'elder_id,day'}))}
document.addEventListener('click',async e=>{
 const v=e.target.closest('[data-view]');if(v){const permitted=tabItems().some(item=>item[0]===v.dataset.view);if(permitted)setView(v.dataset.view);return}
 if(view==='nearby' && e.target.closest('[data-nearby-action], [data-nearby-category], [data-nearby-select], [data-nearby-delete]')){await nearby.handleClick(e.target);return}
 const calToggle=e.target.closest('[data-calendar-toggle]');if(calToggle){planner.toggleCalendar();save();render();document.querySelector('[data-calendar-toggle]')?.focus();return}
 const mode=e.target.closest('[data-planner-mode]');if(mode){planner.setMode(mode.dataset.plannerMode);render();return}
 const filter=e.target.closest('[data-planner-filter]');if(filter){planner.setCategory(filter.dataset.plannerFilter);render();return}
 const cal=e.target.closest('[data-planner-date]');if(cal){planner.selectDate(cal.dataset.plannerDate);render();return}
 const shift=e.target.closest('[data-calendar-shift]');if(shift){planner.shiftMonth(shift.dataset.calendarShift);render();return}
 const edit=e.target.closest('[data-care-edit]');if(edit&&canManageTask(state.tasks.find(t=>t.id===edit.dataset.careEdit))){openTaskModal(edit.dataset.careEdit);return}
 const removeCare=e.target.closest('[data-care-delete]');if(removeCare){const t=state.tasks.find(t=>t.id===removeCare.dataset.careDelete);if(t&&canManageTask(t)&&window.confirm(`Delete "${t.title}" from the shared care planner?`)){await mutate(()=>request(supabase.from('care_tasks').delete().eq('id',t.id).eq('elder_id',elderId)),'Task deleted.');modalType=null;renderModal()}return}
 const care=e.target.closest('[data-care-complete]');if(care&&role==='senior'){
   const t=state.tasks.find(x=>x.id===care.dataset.careComplete),day=care.dataset.day;
   if(t&&scheduled(t,day)){
     await mutate(()=>taskDone(t,day)?request(supabase.from('care_task_completions').delete().eq('task_id',t.id).eq('scheduled_for',day)):request(supabase.from('care_task_completions').insert({task_id:t.id,scheduled_for:day,completed_by:user.id})),'Task status synced with family.');
   }return;
 }
 const task=e.target.closest('[data-task]');if(task&&role==='senior'){const r=state.reminders.find(x=>x.id===task.dataset.task);if(r){const dates=r.dates.includes(todayKey())?r.dates.filter(x=>x!==todayKey()):[...r.dates,todayKey()];await mutate(()=>request(supabase.from('reminders').update({done_dates:dates}).eq('id',r.id).eq('elder_id',elderId)),'Reminder updated in Supabase.')}return}
 const mood=e.target.closest('[data-mood]');if(mood&&role==='senior'&&todays()){await mutate(()=>request(supabase.from('check_ins').update({mood:mood.dataset.mood}).eq('elder_id',elderId).eq('day',todayKey())),'Mood saved to Supabase.');return}
 const reason=e.target.closest('[data-reason]');if(reason){needReason=reason.dataset.reason;renderModal();return}
 const font=e.target.closest('[data-font]');if(font){state.prefs.font=font.dataset.font;save();render();flash('Text size updated on this device.');return}
 const remove=e.target.closest('[data-remove-task]');if(remove&&role==='senior'){await mutate(()=>request(supabase.from('reminders').delete().eq('id',remove.dataset.removeTask).eq('elder_id',elderId)),'Reminder removed.');return}
 const a=e.target.closest('[data-action]');if(!a)return;
 const action=a.dataset.action;
 if(action==='new-care-task'&&elderId){openTaskModal();return}
 if(action==='toggle-auth'){authMode=authMode==='signin'?'signup':'signin';infoText='';render()}
 if(action==='signout')await signOut();
 if(action==='retry')await loadAccount();
 if(action==='refresh')await mutate(async()=>{},'Latest records loaded.');
 if(action==='check-okay'&&role==='senior')await mutate(()=>request(supabase.from('check_ins').upsert({elder_id:elderId,day:todayKey(),status:'okay',checked_at:new Date().toISOString(),reason:null,mood:todays()?.mood||null},{onConflict:'elder_id,day'})),'Your check-in is saved to Supabase.');
 if(action==='open-help'&&role==='senior')openHelp();
 if(action==='close-modal'){modalType=null;renderModal()}
 if(action==='save-help'&&role==='senior'){await mutate(recordHelp,'Help request saved for linked caregivers to view. No alert was sent.');modalType=null;renderModal()}
 if(action==='save-note'&&role==='senior'){const note=document.getElementById('family-note')?.value.trim().slice(0,280)||'';await mutate(()=>request(supabase.from('daily_notes').upsert({elder_id:elderId,day:todayKey(),note,updated_at:new Date().toISOString()},{onConflict:'elder_id,day'})),'Your note was saved for linked caregivers.');}
 if(action==='follow-up'&&role==='family'){const c=todays();if(c?.status==='help'){await mutate(()=>c.followedUp?request(supabase.from('followups').delete().eq('elder_id',elderId).eq('day',todayKey()).eq('caregiver_id',user.id)):request(supabase.from('followups').insert({elder_id:elderId,day:todayKey(),caregiver_id:user.id})),'Follow-up updated.')}}
 if(action==='toggle-scenario'&&role==='family'){state.demoScenario=!state.demoScenario;render();flash('Only a visual preview — no alerts sent.')}
 if(action==='contrast'){state.prefs.contrast=!state.prefs.contrast;save();render();flash('Contrast updated on this device.')}
 if(action==='speak')speak();
 if(action==='create-code'&&role==='senior')await mutate(async()=>{invitationCode=await request(supabase.rpc('create_pairing_code'))},'One-time code created. It expires in 20 minutes.');
 if(action==='copy-code'&&invitationCode){try{await navigator.clipboard.writeText(invitationCode);flash('Invitation code copied.')}catch(_){flash('Select the code and copy it manually.')}}
 if(action==='unlink'&&role==='family'&&window.confirm('Disconnect from this older adult? You will lose access to their updates.')){await mutate(async()=>{await request(supabase.from('caregiver_links').delete().eq('elder_id',elderId).eq('caregiver_id',user.id));elderId=null;role=null;await loadAccount()},'Connection removed.');}
});
document.addEventListener('submit',async e=>{
 if(e.target.id==='nearby-city-form'&&view==='nearby'){e.preventDefault();await nearby.handleCitySubmit(e.target);return}
 if(e.target.id==='nearby-save-form'&&view==='nearby'){e.preventDefault();await nearby.handleSaveSubmit(e.target);return}
 if(e.target.id==='nearby-filter-form'&&view==='nearby'){e.preventDefault();await nearby.handleFilterSubmit(e.target);return}
 if(e.target.id==='auth-form'){
  e.preventDefault();if(busy)return;busy=true;
  const email=document.getElementById('auth-email').value.trim(),password=document.getElementById('auth-password').value;
  try{
    if(authMode==='signup'){
      const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+window.location.pathname}});
      if(error)throw error;
      if(data.session){user=data.user;await loadAccount()}else{infoText='Check your email for a confirmation link. Then come back and sign in.';authMode='signin';render()}
    }else{
      const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;
      user=data.user;await loadAccount();
    }
  }catch(err){flash(`Authentication failed: ${err.message}`)}finally{busy=false}
 }
 if(e.target.id==='senior-form'){
  e.preventDefault();if(busy)return;busy=true;
  try{const elder_name=document.getElementById('senior-name').value.trim().slice(0,35);await request(supabase.from('care_profiles').insert({user_id:user.id,elder_name}));await request(supabase.from('reminders').insert([
    {elder_id:user.id,title:'Drink some water',subtitle:'A gentle reminder',icon:'💧'},
    {elder_id:user.id,title:'Get a little movement',subtitle:'At your own pace',icon:'🌿'}
  ]));view='home';await loadAccount();flash('Your CareBridge account is ready!')}
  catch(err){flash(`Could not create profile: ${err.message}`);await loadAccount()}
  finally{busy=false}
 }
 if(e.target.id==='redeem-form'){
   e.preventDefault();if(busy)return;busy=true;
   try{const code=document.getElementById('invite-code').value.trim();await request(supabase.rpc('redeem_pairing_code',{invite_code:code}));view='family';await loadAccount();flash('You are connected to your loved one!')}
   catch(err){flash(`Could not link accounts: ${err.message}`)}finally{busy=false}
 }
 if(e.target.id==='care-task-form'&&elderId&&(role==='family'||role==='senior')){
   e.preventDefault();if(busy)return;
   const title=document.getElementById('care-title').value.trim(),category=document.getElementById('care-category').value,
     due_date=document.getElementById('care-due-date').value,due_time=document.getElementById('care-time').value||null,
     recurrence=document.getElementById('care-repeat').value,details=document.getElementById('care-details').value.trim();
   if(!title||!due_date)return;busy=true;
   try{
     const payload={title,category,due_date,due_time,recurrence,details};
     if(editingTaskId){const t=state.tasks.find(x=>x.id===editingTaskId);if(!t||!canManageTask(t))throw Error('You cannot edit this task.');await request(supabase.from('care_tasks').update(payload).eq('id',t.id).eq('elder_id',elderId))}
     else await request(supabase.from('care_tasks').insert({...payload,elder_id:elderId,created_by:user.id}));
     modalType=null;editingTaskId=null;renderModal();await reloadData();flash('Care planner saved and shared with your care circle.');
   }catch(err){flash('Could not save task: '+(err.message||'unknown error'))}finally{busy=false}
 }
 if(e.target.id==='add-task-form'&&role==='senior'){
  e.preventDefault();const title=document.getElementById('task-title')?.value.trim().slice(0,55);if(!title)return;
  await mutate(()=>request(supabase.from('reminders').insert({elder_id:elderId,title,subtitle:'Your personal reminder',icon:'🔔'})),'Your reminder was added.');
 }
 if(e.target.id==='settings-form'&&role==='senior'){
  e.preventDefault();const elder_name=document.getElementById('elder-name').value.trim().slice(0,35)||'My Profile';const family_name=document.getElementById('family-name').value.trim().slice(0,35)||'Family';const checkin_hour=Number(document.getElementById('checkin-hour').value);
  await mutate(()=>request(supabase.from('care_profiles').update({elder_name,family_name,checkin_hour}).eq('user_id',user.id)),'Profile saved securely.');
 }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalType){modalType=null;renderModal()}});
document.getElementById('modal-host').addEventListener('click',e=>{if(e.target.id==='modal-backdrop'){modalType=null;renderModal()}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user&&elderId)reloadData()});
// This is a browser-based project. Supabase credentials contain only the public publishable key.
initialize();
})();
}