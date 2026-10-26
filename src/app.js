import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_URL.startsWith('https://')) {
  document.getElementById('app').innerHTML = '<section class="panel auth-container"><h1>Complete Supabase setup</h1><p>Open <code>src/config.js</code> and enter your Supabase project URL and publishable key, then refresh.</p></section>';
} else {
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

(function(){
'use strict';
const STORE='carebridge-accessibility-v2';
const todayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dateMinus=n=>{const d=new Date();d.setDate(d.getDate()-n);return d};
const escapeHTML=str=>String(str??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=time=>time?new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(new Date(time)):'—';
const longDate=()=>new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric'}).format(new Date());
const initialPrefs={elderName:'Your loved one',familyName:'Family',hour:20,font:'normal',contrast:false};
let uiPrefs={};
try{uiPrefs=JSON.parse(localStorage.getItem(STORE))||{}}catch(_){uiPrefs={}}
let state={checkins:{},notes:{},reminders:[],tasks:[],completions:[],prefs:{...initialPrefs,font:uiPrefs.font||'normal',contrast:!!uiPrefs.contrast},demoScenario:false};
let user=null,role=null,elderId=null,links=[],busy=false,authMode='signin',infoText='',accountError='';
let view='home', modalType=null,needReason='Just want a call',toastTimer=null,invitationCode='';
let plannerMode='today',plannerCategory='all',plannerDate=todayKey(),plannerMonth=todayKey().slice(0,7),editingTaskId=null;
const save=()=>{localStorage.setItem(STORE,JSON.stringify({font:state.prefs.font,contrast:state.prefs.contrast}))};
async function request(query){const {data,error}=await query;if(error)throw error;return data}
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
const tabItems=()=>role==='family'?[['family','♡','Family'],['planner','▦','Care planner'],['settings','⚙','Settings']]:[['home','⌂','Today'],['planner','▦','My planner'],['routine','☑','Wellness'],['settings','⚙','Settings']];
const intro=(title,description)=>`<section class="intro"><h1>${title}</h1><p>${description}</p></section>`;
function renderNav(){
  document.getElementById('desktop-nav').innerHTML=tabItems().map(([id,icon,name])=>`<button type="button" class="nav-btn" data-view="${id}" ${id===view?'aria-current="page"':''}><span class="nav-ico" aria-hidden="true">${icon}</span>${name}</button>`).join('');
  document.getElementById('mobile-nav').innerHTML=tabItems().map(([id,icon,name])=>`<button type="button" data-view="${id}" ${id===view?'aria-current="page"':''}><b aria-hidden="true">${icon}</b>${name}</button>`).join('');

}
function checkCard(){
  const record=todays();
  if(!record){return `<div class="panel primary-panel"><div class="tiny-heading">✦ Today's check-in</div><h2>How are you feeling today?</h2><p>One little tap lets your loved ones know you've checked in. Choose the option that feels right to you.</p><div class="primary-actions"><button class="action-btn primary" data-action="check-okay"><span class="btn-symbol" aria-hidden="true">✓</span>I'm okay today</button><button class="action-btn secondary" data-action="open-help"><span class="btn-symbol" aria-hidden="true">♡</span>I could use help</button></div><div class="privacy-note">🔒 Just one tap. No complicated forms.</div></div>`}
  const help=record.status==='help';
  return `<section class="panel primary-panel"><div class="status-pill ${help?'alert':''}">${help?'♡ Help requested':'✓ Checked in today'}</div><h2>${help?'You spoke up. That matters.':'Thank you for checking in!'}</h2><p>${help?'Your request is saved securely and visible to linked caregivers who open CareBridge. No automatic alert is sent.':'You checked in at '+clock(record.at)+'. A small habit that helps you stay connected.'}</p><div class="inline-actions"><button class="btn ${help?'warning':'outline'}" data-action="${help?'open-help':'speak'}">${help?'Update help request':'🔊 Read this aloud'}</button>${!help?'<button class="btn outline" data-action="open-help">I need help instead</button>':''}</div>${!help?`<div style="margin-top:24px"><strong style="display:block;font-size:1.04rem">How are you feeling? <span class="mini-caption">(optional)</span></strong><div class="mood-options">${[['great','😊','Good'],['okay','😐','So-so'],['low','😟','Not great']].map(([id,e,label])=>`<button class="mood-btn" data-mood="${id}" aria-pressed="${String(record.mood===id)}"><span aria-hidden="true">${e}</span>${label}</button>`).join('')}</div></div>`:''}</section>`;
}
function miniReminders(limit=3){
  return state.reminders.slice(0,limit).map(r=>{const done=r.dates.includes(todayKey());return `<div class="reminder-row"><div class="task-icon" aria-hidden="true">${escapeHTML(r.icon)}</div><div class="task-copy"><strong>${escapeHTML(r.title)}</strong><small>${done?'Completed today':escapeHTML(r.subtitle)}</small></div><button type="button" class="round-check ${done?'done':''}" data-task="${escapeHTML(r.id)}" aria-label="${done?'Mark '+escapeHTML(r.title)+' as not done':'Mark '+escapeHTML(r.title)+' as done'}" aria-pressed="${String(done)}">${done?'✓':'○'}</button></div>`}).join('');
}
function history(){
  const entries=[];for(let i=6;i>=0;i--){const d=dateMinus(i),k=todayKey(d),r=state.checkins[k],mark=r?(r.status==='help'?'help':'ok'):(i===0?'waiting':'missed');const ch=r?(r.status==='help'?'!':'✓'):(i===0?'·':'—');entries.push(`<div class="day-cell"><div class="day-name">${new Intl.DateTimeFormat('en-US',{weekday:'short'}).format(d)}</div><div class="day-dot ${mark} ${i===0?'today':''}" title="${k}: ${r?`${r.status==='help'?'Help requested':'Checked in'}${r.demo?' (sample)':''}`:i===0?'Not yet checked in':'No check-in'}" aria-label="${k}: ${r?`${r.status==='help'?'Help requested':'Checked in'}${r.demo?' sample':''}`:i===0?'Not yet checked in':'No check-in'}">${ch}</div></div>`)}
  return `<div class="history-row" role="group" aria-label="Check-in history for the past seven days">${entries.join('')}</div><div class="legend"><span><i style="background:#87cc9d"></i>Checked in</span><span><i style="background:#e7b38f"></i>Help request</span><span><i style="background:#cad7ce"></i>No check-in</span></div><p class="mini-caption" style="margin-top:12px">These records come from your private Supabase account. Blank days mean no recorded check-in.</p>`;
}
function viewHome(){return `${intro(`Good ${greeting()}, ${escapeHTML(state.prefs.elderName)}. 👋`,'Your day, made a little easier. We’re happy you’re here.')}
  <div class="columns"><div class="stack">${checkCard()}<section class="panel"><div class="section-head"><div><h2>Your gentle reminders</h2><p>A few things for today, at your pace.</p></div><button class="panel-link" data-view="routine">See all</button></div><div class="reminder-list">${miniReminders()}</div></section></div>
  <div class="stack"><section class="panel"><div class="section-head"><div><div class="eyebrow">Your care planner</div><h2>Things to do today</h2><p>Tasks shared with your care circle.</p></div><button class="panel-link" data-view="planner">Open planner</button></div>${taskPreview()}<button class="btn outline" style="margin-top:16px" data-action="new-care-task">＋ Add a task</button></section><section class="panel"><div class="little-illustration" aria-hidden="true">💌</div><h2>A note to your family</h2><p>Share a little message about your day, whenever you like.</p><div class="field"><label for="family-note">What's on your mind?</label><textarea id="family-note" maxlength="280" placeholder="Today I enjoyed a walk in the garden…">${escapeHTML(state.notes[todayKey()]||todays()?.note||'')}</textarea></div><button class="btn green wide" data-action="save-note">Save note for family</button><div class="connection-note">🌼 “Every small connection counts.”</div></section>
  <section class="panel"><div class="section-head"><div><h2>Your last 7 days</h2><p>Every check-in is a small win.</p></div></div>${history()}</section></div></div>`}
function greeting(){let h=new Date().getHours();return h<12?'morning':h<17?'afternoon':'evening'}
// Shared planner — designed around large, readable actions and caregiver-created tasks.
const taskCategories={medication:['💊','Medication'],appointment:['🩺','Appointment'],event:['📅','Important event'],wellness:['🌿','Wellness'],other:['✅','Other']};
const parseDay=iso=>{const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d)};
const addDay=(iso,n)=>{const d=parseDay(iso);d.setDate(d.getDate()+n);return todayKey(d)};
const deltaDay=(a,b)=>Math.round((Date.UTC(...a.split('-').map((v,i)=>i===1?Number(v)-1:Number(v)))-Date.UTC(...b.split('-').map((v,i)=>i===1?Number(v)-1:Number(v))))/86400000);
const shortDay=iso=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',weekday:'short'}).format(parseDay(iso));
const longDay=iso=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(parseDay(iso));
const formatTaskTime=v=>{if(!v)return'Any time';let [h,m]=v.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`};
function scheduled(t,day){const d=deltaDay(day,t.due_date);return d>=0&&(t.recurrence==='daily'||(t.recurrence==='weekly'&&d%7===0)||(t.recurrence==='none'&&d===0))}
const taskDone=(t,d)=>state.completions.some(c=>c.task_id===t.id&&c.scheduled_for===d);
const canManageTask=t=>!!t&&(role==='senior'||t.created_by===user?.id);
function dayTasks(day,{includeOverdue=false}={}){
  const matches=state.tasks.filter(t=>scheduled(t,day)).map(t=>({task:t,day,overdue:false}));
  if(includeOverdue&&day===todayKey()){
    matches.push(...state.tasks.filter(t=>t.recurrence==='none'&&t.due_date<day&&!taskDone(t,t.due_date)).map(t=>({task:t,day:t.due_date,overdue:true})));
  }
  return matches.sort((a,b)=>Number(a.overdue)-Number(b.overdue)||Number(taskDone(a.task,a.day))-Number(taskDone(b.task,b.day))||(a.task.due_time||'99').localeCompare(b.task.due_time||'99')||a.task.title.localeCompare(b.task.title));
}
function taskRow({task:t,day,overdue=false},compact=false){
 const done=taskDone(t,day),[symbol,category]=taskCategories[t.category]||taskCategories.other;
 const canEdit=canManageTask(t);
 return `<article class="care-task-row ${done?'care-task-done':''}" data-task-id="${escapeHTML(t.id)}">
 <div class="care-task-symbol" aria-hidden="true">${symbol}</div>
 <div class="care-task-body"><strong>${escapeHTML(t.title)}</strong><div class="care-task-metadata"><span>${overdue?'⚠ Overdue · '+shortDay(day):formatTaskTime(t.due_time)}</span><span class="care-category">${category}</span>${t.recurrence!=='none'?`<span>↻ ${t.recurrence==='daily'?'Daily':'Weekly'}</span>`:''}</div>${!compact&&t.details?`<p class="task-details">${escapeHTML(t.details)}</p>`:''}${role==='family'&&!compact?`<small class="task-from">${done?'✓ Completed by your loved one':'Awaiting completion by your loved one'}</small>`:''}</div>
 <div class="care-task-buttons">${role==='senior'?`<button type="button" class="care-complete ${done?'is-complete':''}" data-care-complete="${escapeHTML(t.id)}" data-day="${day}" aria-pressed="${done}" aria-label="${done?'Undo completion of':'Complete'} ${escapeHTML(t.title)}">${done?'✓':'○'}</button>`:`<span class="care-status ${done?'checked':''}" title="${done?'Completed':'Not yet done'}">${done?'✓ Done':'Pending'}</span>`}${!compact&&canEdit?`<button class="care-edit" data-care-edit="${escapeHTML(t.id)}" aria-label="Edit ${escapeHTML(t.title)}">✎</button>`:''}</div></article>`;
}
function taskPreview(max=3){const matches=dayTasks(todayKey(),{includeOverdue:true}).filter(i=>!taskDone(i.task,i.day));return `<div class="care-task-list">${matches.length?matches.slice(0,max).map(i=>taskRow(i,true)).join(''):`<div class="task-empty"><span aria-hidden="true">🌼</span><strong>All caught up!</strong><p>No outstanding tasks for today.</p></div>`}</div>`}
function plannerCalendar(){
 const [year,month]=plannerMonth.split('-').map(Number),first=new Date(year,month-1,1),lastDay=new Date(year,month,0).getDate(),offset=first.getDay();
 const caption=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(first);
 let cells=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="calendar-dow">${d}</div>`).join('');
 for(let i=0;i<offset;i++)cells+=`<div class="calendar-blank"></div>`;
 for(let day=1;day<=lastDay;day++){
   const iso=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
   const has=state.tasks.some(t=>scheduled(t,iso));
   cells+=`<button type="button" class="calendar-day ${iso===todayKey()?'is-today':''} ${iso===plannerDate?'is-selected':''}" data-planner-date="${iso}" aria-pressed="${iso===plannerDate}" aria-label="View tasks for ${longDay(iso)}${has?', has tasks':''}">${day}${has?'<i aria-hidden="true"></i>':''}</button>`;
 }
 return `<section class="panel planner-calendar"><div class="calendar-header"><div><div class="eyebrow">Care calendar</div><h2>${caption}</h2></div><div class="calendar-switch"><button data-calendar-shift="-1" aria-label="Previous month">‹</button><button data-calendar-shift="1" aria-label="Next month">›</button></div></div><div class="calendar-grid">${cells}</div><p class="mini-caption">Tap a date to view upcoming tasks and events. A dot means a task is scheduled.</p></section>`;
}
function viewPlanner(){
 const today=todayKey(),allToday=dayTasks(today,{includeOverdue:true}),doneToday=allToday.filter(i=>taskDone(i.task,i.day)).length;
 let rows=[],head='Today’s tasks',desc=longDay(today);
 if(plannerMode==='today'){rows=allToday}
 if(plannerMode==='calendar'){rows=dayTasks(plannerDate);head=`Tasks for ${shortDay(plannerDate)}`;desc='Appointments, medicines and events for this day.'}
 if(plannerMode==='upcoming'){head='Coming up';desc='The next 21 days, all in one place.';for(let i=0;i<21;i++)rows.push(...dayTasks(addDay(today,i)));rows=rows.sort((a,b)=>a.day.localeCompare(b.day)||(a.task.due_time||'99').localeCompare(b.task.due_time||'99'))}
 if(plannerCategory!=='all')rows=rows.filter(i=>i.task.category===plannerCategory);
 return `${intro(role==='senior'?'My day planner 📅':`${escapeHTML(state.prefs.elderName)}’s care planner 📅`,role==='senior'?'Your important plans, all in one calm place. Your family can add tasks to help you stay organized.':'Schedule medications, appointments and important events for your loved one. They can mark tasks done when ready.')}
 <div class="planner-summary"><div class="planner-stat"><span>Tasks today</span><strong>${allToday.length}</strong></div><div class="planner-stat"><span>Completed</span><strong>${doneToday}</strong></div><div class="planner-stat"><span>Still to do</span><strong>${allToday.length-doneToday}</strong></div><button type="button" class="btn green planner-new" data-action="new-care-task">＋ Add a task</button></div>
 <div class="planner-layout"><div class="stack"><section class="panel"><div class="planner-toolbar"><div class="planner-pills">${[['today','Today'],['upcoming','Upcoming'],['calendar','Selected day']].map(([v,label])=>`<button data-planner-mode="${v}" aria-pressed="${plannerMode===v}">${label}</button>`).join('')}</div></div><div class="planner-filters">${[['all','All'],...Object.entries(taskCategories).map(([k,v])=>[k,v[0]+' '+v[1]])].map(([k,l])=>`<button data-planner-filter="${k}" aria-pressed="${plannerCategory===k}">${l}</button>`).join('')}</div><div class="planner-list-heading"><div><h2>${head}</h2><p>${desc}</p></div><span class="badge">${rows.length} ${rows.length===1?'task':'tasks'}</span></div><div class="care-task-list">${rows.length?rows.slice(0,50).map(item=>`${plannerMode==='upcoming'?`<div class="planner-date-label">${shortDay(item.day)}</div>`:''}${taskRow(item)}`).join(''):`<div class="task-empty"><span aria-hidden="true">✨</span><strong>Nothing scheduled here</strong><p>Choose another date or add a task when you're ready.</p></div>`}</div>${rows.length>50?'<p class="mini-caption">Showing the first 50 tasks.</p>':''}</section></div>
 <div class="stack">${plannerCalendar()}<section class="panel planner-tip"><div class="little-illustration" aria-hidden="true">💚</div><h2>${role==='family'?'Plan together':'One thing at a time'}</h2><p>${role==='family'?'Tasks you add appear on your loved one’s planner after they refresh or reopen the app. Only they can mark them complete.':'You can tick off tasks at your own pace. Completing a medication reminder is only an acknowledgment, not confirmation that medicine was taken.'}</p><div class="notice">This planner does not send automatic push alerts or medical instructions.</div></section></div></div>`;
}
function openTaskModal(id=null){editingTaskId=id;modalType='care-task';renderModal()}
function taskModalHTML(){
 const t=state.tasks.find(x=>x.id===editingTaskId),cat=t?.category||'medication',date=t?.due_date||(plannerMode==='calendar'?plannerDate:todayKey());
 return `<div class="modal-backdrop" id="modal-backdrop"><section class="modal task-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><div class="eyebrow">Shared care planner</div><h2 id="modal-title">${t?'Edit task':'Add something important'}</h2><p>${role==='family'?`For ${escapeHTML(state.prefs.elderName)} — it will appear on their planner.`:'Your family will see your shared plans.'}</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div><form id="care-task-form"><div class="field"><label for="care-title">What needs doing?</label><input id="care-title" maxlength="100" required placeholder="Take morning medicine" value="${escapeHTML(t?.title||'')}"></div><div class="field"><label for="care-category">Category</label><select id="care-category">${Object.entries(taskCategories).map(([k,v])=>`<option value="${k}" ${cat===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select></div><div class="task-form-row"><div class="field"><label for="care-due-date">Date</label><input id="care-due-date" type="date" value="${date}" required></div><div class="field"><label for="care-time">Time (optional)</label><input id="care-time" type="time" value="${t?.due_time?.slice(0,5)||''}"></div></div><div class="field"><label for="care-repeat">Repeat</label><select id="care-repeat">${[['none','Only once'],['daily','Every day'],['weekly','Every week']].map(([k,v])=>`<option value="${k}" ${t?.recurrence===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label for="care-details">Notes (optional)</label><textarea id="care-details" maxlength="500" rows="3" placeholder="Anything helpful to remember…">${escapeHTML(t?.details||'')}</textarea></div><div class="notice">Use this for reminders only; CareBridge does not verify medication doses or send notifications.</div><div class="task-modal-buttons"><button type="submit" class="btn green">${t?'Save changes':'Add to care planner'}</button>${t&&canManageTask(t)?`<button type="button" class="btn warning" data-care-delete="${escapeHTML(t.id)}">Delete task</button>`:''}</div></form></section></div>`;
}

function viewRoutine(){const done=state.reminders.filter(r=>r.dates.includes(todayKey())).length;return `${intro('Your daily routine 🌱','Small, comfortable steps to help you feel organized. You can choose which reminders to keep.')}
  <div class="wide-grid"><section class="panel"><div class="section-head"><div><h2>Today’s reminders</h2><p>${done} of ${state.reminders.length} completed · Checking a reminder never sends a notification.</p></div><span class="badge">Optional</span></div><div class="reminder-list">${state.reminders.map(r=>{const done=r.dates.includes(todayKey());return `<div class="reminder-row"><span class="task-icon" aria-hidden="true">${escapeHTML(r.icon)}</span><div class="task-copy"><strong>${escapeHTML(r.title)}</strong><small>${done?'Completed today':escapeHTML(r.subtitle)}</small></div><button class="round-check ${done?'done':''}" data-task="${escapeHTML(r.id)}" aria-pressed="${String(done)}" aria-label="${done?'Uncheck':'Complete'} ${escapeHTML(r.title)}">${done?'✓':'○'}</button>${!['medicine','water','walk'].includes(r.id)?`<button class="small-btn" data-remove-task="${escapeHTML(r.id)}" aria-label="Remove ${escapeHTML(r.title)}">✕</button>`:''}</div>`}).join('')}</div></section>
  <section class="stack"><div class="panel"><h2>Add a reminder</h2><p>Create a simple daily reminder of your own.</p><form id="add-task-form" class="add-reminder"><div class="field"><label for="task-title">Reminder name</label><input id="task-title" name="task-title" maxlength="55" required placeholder="Call a friend"></div><button type="submit" class="btn green">+ Add</button></form></div><div class="panel"><div class="little-illustration" aria-hidden="true">🌤️</div><h2>Go at your pace</h2><p>These are just reminders, not a scorecard. It's okay if you don't complete every task.</p><div class="notice">Medication reminders are examples only, not medical advice or a medication-management service.</div></div></section></div>`}
function familyStatus(){
  if(state.demoScenario)return {style:'needs-help',label:'Missed check-in scenario',body:`In this simulated example, ${escapeHTML(state.prefs.elderName)} has not checked in by the chosen time. A real app could notify a trusted contact after a grace period. No alert was sent.`};
  const c=todays();if(c?.status==='help')return {style:'needs-help',label:`${escapeHTML(state.prefs.elderName)} asked for support`,body:`${escapeHTML(c.reason||'Wants to connect')} · Request saved at ${clock(c.at)}. ${c.followedUp?'A caregiver has recorded a follow-up.':'Consider reaching out directly.'}`};
  if(c?.status==='okay')return {style:'',label:`${escapeHTML(state.prefs.elderName)} checked in today ✓`,body:`Checked in at ${clock(c.at)}${c.mood?` · Feeling ${c.mood==='great'?'good':c.mood==='okay'?'so-so':'not great'}`:''}. You can see today's update below.`};
  const late=new Date().getHours()>=Number(state.prefs.hour);
  return {style:'pending',label:late?'No check-in by the selected time':'Still waiting for today’s check-in',body:late?`It's past the ${formatHour(state.prefs.hour)} target. In a real app, this would begin a gentle follow-up. CareBridge does not send automated alerts yet.`:`${escapeHTML(state.prefs.elderName)} hasn't checked in today. The reminder time is ${formatHour(state.prefs.hour)}.`};
}
const formatHour=h=>new Intl.DateTimeFormat('en-US',{hour:'numeric'}).format(new Date(2026,1,1,Number(h)));
function viewFamily(){const c=todays(),s=familyStatus();const count=Array.from({length:7},(_,i)=>state.checkins[todayKey(dateMinus(i))]).filter(r=>r&&r.status==='okay').length;return `${intro(`Hello, ${escapeHTML(state.prefs.familyName)}. 💚`,'A gentle way to stay connected with someone you love — without needing to call constantly.')}
  <div class="wide-grid"><section class="stack"><div class="panel"><div class="section-head"><div><div class="eyebrow">Today’s status</div><h2 style="margin-top:8px">${escapeHTML(state.prefs.elderName)}’s daily check-in</h2></div><span class="badge">${state.demoScenario?'Simulation':'Synced from Supabase'}</span></div><div class="family-summary ${s.style}"><h3>${s.label}</h3><p>${s.body}</p></div>${c?.status==='help'&&!state.demoScenario?`<div class="inline-actions"><button class="btn green" data-action="follow-up">${c.followedUp?'✓ Follow-up recorded':'Mark as followed up'}</button></div>`:''}${(state.notes[todayKey()]||c?.note)&&!state.demoScenario?`<div class="list-separator"></div><h3>💌 A note from ${escapeHTML(state.prefs.elderName)}</h3><p style="overflow-wrap:anywhere">“${escapeHTML(state.notes[todayKey()]||c.note)}”</p>`:''}</div><div class="panel"><div class="section-head"><div><h2>7-day check-in activity</h2><p>View the rhythm of daily check-ins.</p></div></div>${history()}</div></section>
  <section class="stack"><div class="panel"><div class="section-head"><div><h2>Shared care planner</h2><p>What ${escapeHTML(state.prefs.elderName)} has coming up.</p></div><button class="panel-link" data-view="planner">See all</button></div>${taskPreview()}<button class="btn green wide" style="margin-top:16px" data-action="new-care-task">＋ Add a task for ${escapeHTML(state.prefs.elderName)}</button></div><div class="panel"><h2>At a glance</h2><div class="metric-row" style="margin-top:18px"><div class="metric"><div class="num">${count}<span style="font-size:1rem"> / 7</span></div><small>Check-ins this week</small></div><div class="metric"><div class="num">${c?'Today':'—'}</div><small>Latest update</small></div></div><div class="notice">A check-in indicates a response, not a medical or safety assessment.</div></div><div class="panel"><h2>What happens if a check-in is missed?</h2><p>The planned full version would send a gentle reminder, wait for a grace period, then alert a chosen family member.</p><div class="inline-actions"><button class="btn outline" data-action="toggle-scenario">${state.demoScenario?'Return to real demo state':'Preview missed check-in'}</button></div><p class="mini-caption" style="margin-top:12px">Preview only — no messages are sent.</p></div><div class="panel"><h2>Family connection</h2><ul class="info-bullets"><li>☎️ Talk directly with your loved one if you are worried.</li><li>🫶 Ask how they're doing without pressuring them.</li><li>🔐 Only authorized caregivers should view private updates in the full app.</li></ul></div></section></div>`}
function viewSettings(){
  const accessibility=`<section class="panel"><h2>Accessibility</h2><div class="settings-row"><div><strong>Text size</strong><p>Make everything easier to read.</p></div><div class="segmented"><button data-font="normal" aria-pressed="${state.prefs.font==='normal'}" aria-label="Normal text size">A</button><button data-font="large" aria-pressed="${state.prefs.font==='large'}" aria-label="Large text size">A+</button></div></div><div class="settings-row"><div><strong>High contrast</strong><p>Stronger colors and borders.</p></div><button class="switch" role="switch" aria-label="High contrast" aria-checked="${String(state.prefs.contrast)}" data-action="contrast"></button></div><button class="small-btn" data-action="speak">🔊 Read page aloud</button></section>`;
  const settings=role==='senior'?`<section class="panel"><h2>Profile & daily routine</h2><form id="settings-form"><div class="field"><label for="elder-name">Older adult's first name</label><input id="elder-name" maxlength="35" required value="${escapeHTML(state.prefs.elderName)}"></div><div class="field"><label for="family-name">Family member's display name</label><input id="family-name" maxlength="35" required value="${escapeHTML(state.prefs.familyName)}"></div><div class="field"><label for="checkin-hour">Daily check-in target</label><select id="checkin-hour">${Array.from({length:16},(_,i)=>i+7).map(h=>`<option value="${h}" ${Number(state.prefs.hour)===h?'selected':''}>${formatHour(h)}</option>`).join('')}</select><small class="mini-caption">A family dashboard target time, not an automatic alert.</small></div><button class="btn green" type="submit">Save settings</button></form></section><section class="panel"><h2>Invite a trusted caregiver</h2><p>Use a temporary, one-time code with a family member who creates their own CareBridge account. It expires after 20 minutes.</p><div class="inline-actions"><button class="btn green" data-action="create-code">Create invitation code</button></div>${invitationCode?`<p class="mini-caption" style="margin-top:14px">Share this code privately:</p><div class="code-display">${escapeHTML(invitationCode)}</div><button class="small-btn" data-action="copy-code">Copy code</button>`:''}<p class="mini-caption" style="margin-top:16px">${links.length} linked caregiver${links.length===1?'':'s'}. Only share codes with people you trust.</p></section>`
  :`<section class="panel"><h2>Family connections</h2><p>You are viewing ${escapeHTML(state.prefs.elderName)}'s check-in updates, with their permission.</p><form id="redeem-form"><div class="field"><label for="invite-code">Connect to another older adult</label><input id="invite-code" required placeholder="Invitation code" autocomplete="off"></div><button class="btn green" type="submit">Link account</button></form><button class="btn warning" data-action="unlink">Disconnect from ${escapeHTML(state.prefs.elderName)}</button></section>`;
  return `${intro('Make it yours ⚙️','Manage your account, privacy, and accessibility preferences.')}<div class="wide-grid"><section class="stack">${settings}</section><section class="stack">${accessibility}<div class="panel"><h2>About CareBridge</h2><p>Cloud data is available only to the older adult and caregivers they explicitly link. This app does not send automatic alerts or dispatch emergency help.</p></div></section></div>`;
}
function authUI(){
  const signup=authMode==='signup';
  return `<section class="panel auth-container"><div class="little-illustration">💚</div><h1>${signup?'Create your CareBridge account':'Welcome to CareBridge'}</h1><p>${signup?'Both older adults and caregivers need their own accounts.':'Sign in to see your private check-ins and linked family updates.'}</p>${infoText?`<div class="success-notice" role="status">${escapeHTML(infoText)}</div>`:''}<form id="auth-form"><div class="field"><label for="auth-email">Email</label><input id="auth-email" type="email" autocomplete="email" required></div><div class="field"><label for="auth-password">Password</label><input id="auth-password" type="password" minlength="8" autocomplete="${signup?'new-password':'current-password'}" required></div><div class="auth-actions"><button class="btn green wide" type="submit">${signup?'Create account':'Sign in'}</button><button class="auth-switch" type="button" data-action="toggle-auth">${signup?'Already have an account? Sign in':'New here? Create an account'}</button></div></form><p class="mini-caption">Hosted Supabase projects generally require email verification for new accounts.</p></section>`;
}
function setupUI(){return `<section class="panel auth-container"><h1>How will you use CareBridge?</h1><p>Choose an account type. An older adult records check-ins; a trusted family member views updates after receiving an invitation.</p><div class="stack" style="margin-top:24px"><form id="senior-form"><div class="field"><label for="senior-name">I'm an older adult. My first name is:</label><input id="senior-name" required maxlength="35" placeholder="Evelyn"></div><button class="btn green wide" type="submit">Set up daily check-ins</button></form><div class="list-separator"></div><form id="redeem-form"><div class="field"><label for="invite-code">I'm a family member. Enter my invitation code:</label><input id="invite-code" required placeholder="Ask the older adult for their code" autocomplete="off"></div><button class="btn outline wide" type="submit">Connect to my loved one</button></form><p class="mini-caption">For the demo, create two separate accounts and use a different browser or private window for the caregiver.</p></div></section>`}
function render({focus=false}={}){
  document.documentElement.style.setProperty('--font-scale',state.prefs.font==='large'?'1.13':'1');
  document.body.classList.toggle('high-contrast',!!state.prefs.contrast);
  document.getElementById('header-date').textContent=longDate();
  document.getElementById('signout-btn').hidden=!user;
  document.getElementById('refresh-btn').hidden=!elderId;
  document.getElementById('account-role').textContent=user?(role==='senior'?'OLDER ADULT ACCOUNT':role==='family'?'FAMILY ACCOUNT':'ACCOUNT SETUP'):'SECURE SIGN IN';
  if(user&&elderId&&role){renderNav();document.getElementById('app').innerHTML=({home:viewHome,planner:viewPlanner,routine:viewRoutine,family:viewFamily,settings:viewSettings})[view]();}
  else{document.getElementById('desktop-nav').innerHTML='';document.getElementById('mobile-nav').innerHTML='';document.getElementById('app').innerHTML=user?setupUI():authUI()}
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

async function signOut(){await supabase.auth.signOut();user=null;role=null;elderId=null;links=[];invitationCode='';state.checkins={};state.notes={};state.reminders=[];state.tasks=[];state.completions=[];authMode='signin';view='home';infoText='';render()}
async function initialize(){try{const {data:{user:current},error}=await supabase.auth.getUser();if(error)throw error;user=current;if(user)await loadAccount();else render()}catch(err){if(err.name==='AuthSessionMissingError'){user=null;render()}else{accountError=err.message;render()}}}
async function recordHelp(){const previous=todays();await request(supabase.from('check_ins').upsert({elder_id:elderId,day:todayKey(),status:'help',checked_at:new Date().toISOString(),reason:needReason,mood:previous?.mood||null},{onConflict:'elder_id,day'}))}
document.addEventListener('click',async e=>{
 const v=e.target.closest('[data-view]');if(v){const permitted=tabItems().some(item=>item[0]===v.dataset.view);if(permitted)setView(v.dataset.view);return}
 const mode=e.target.closest('[data-planner-mode]');if(mode){plannerMode=mode.dataset.plannerMode;render();return}
 const filter=e.target.closest('[data-planner-filter]');if(filter){plannerCategory=filter.dataset.plannerFilter;render();return}
 const cal=e.target.closest('[data-planner-date]');if(cal){plannerDate=cal.dataset.plannerDate;plannerMode='calendar';render();return}
 const shift=e.target.closest('[data-calendar-shift]');if(shift){const [y,m]=plannerMonth.split('-').map(Number);const d=new Date(y,m-1+Number(shift.dataset.calendarShift),1);plannerMonth=todayKey(d).slice(0,7);render();return}
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