/** Calendar, recurring tasks and shared planner screens. */
import {todayKey,escapeHTML,intro} from './utils.js';
export function createPlanner({state,getRole,getUser,getEditingTaskId,initialCalendarVisible=true}){
 let plannerMode='today',plannerCategory='all',plannerDate=todayKey();
 let plannerMonth=todayKey().slice(0,7),plannerCalendarVisible=initialCalendarVisible;
const taskCategories={medication:['💊','Medication'],appointment:['🩺','Appointment'],event:['📅','Important event'],wellness:['🌿','Wellness'],other:['✅','Other']};
const parseDay=iso=>{const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d)};
const addDay=(iso,n)=>{const d=parseDay(iso);d.setDate(d.getDate()+n);return todayKey(d)};
const deltaDay=(a,b)=>Math.round((Date.UTC(...a.split('-').map((v,i)=>i===1?Number(v)-1:Number(v)))-Date.UTC(...b.split('-').map((v,i)=>i===1?Number(v)-1:Number(v))))/86400000);
const shortDay=iso=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',weekday:'short'}).format(parseDay(iso));
const longDay=iso=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(parseDay(iso));
const formatTaskTime=v=>{if(!v)return'Any time';let [h,m]=v.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`};
function scheduled(t,day){const d=deltaDay(day,t.due_date);return d>=0&&(t.recurrence==='daily'||(t.recurrence==='weekly'&&d%7===0)||(t.recurrence==='none'&&d===0))}
const taskDone=(t,d)=>state.completions.some(c=>c.task_id===t.id&&c.scheduled_for===d);
const canManageTask=t=>!!t&&(getRole()==='senior'||t.created_by===getUser()?.id);
function dayTasks(day,{includeOverdue=false}={}){
  const matches=state.tasks.filter(t=>scheduled(t,day)).map(t=>({task:t,day,overdue:false}));
  if(includeOverdue&&day===todayKey()){
    matches.push(...state.tasks.filter(t=>t.recurrence==='none'&&t.due_date<day&&!taskDone(t,t.due_date)).map(t=>({task:t,day:t.due_date,overdue:true})));
  }
  return matches.sort((a,b)=>Number(a.overdue)-Number(b.overdue)||Number(taskDone(a.task,a.day))-Number(taskDone(b.task,b.day))||(a.task.due_time||'99').localeCompare(b.task.due_time||'99')||a.task.title.localeCompare(b.task.title));
}
function taskRow({task:t,day,overdue=false},compact=false){
 const role=getRole();
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
 const role=getRole();
 const today=todayKey(),allToday=dayTasks(today,{includeOverdue:true}),doneToday=allToday.filter(i=>taskDone(i.task,i.day)).length;
 let rows=[],head='Today’s tasks',desc=longDay(today);
 if(plannerMode==='today'){rows=allToday}
 if(plannerMode==='calendar'){rows=dayTasks(plannerDate);head=`Tasks for ${shortDay(plannerDate)}`;desc='Appointments, medicines and events for this day.'}
 if(plannerMode==='upcoming'){head='Coming up';desc='The next 21 days, all in one place.';for(let i=0;i<21;i++)rows.push(...dayTasks(addDay(today,i)));rows=rows.sort((a,b)=>a.day.localeCompare(b.day)||(a.task.due_time||'99').localeCompare(b.task.due_time||'99'))}
 if(plannerCategory!=='all')rows=rows.filter(i=>i.task.category===plannerCategory);
 return `${intro(role==='senior'?'Daily Planner':`${escapeHTML(state.prefs.elderName)}’s care planner 📅`,role==='senior'?'You can put your daily task below and your family can also add tasks to stay organized.':'Schedule medications, appointments and important events for your loved one. They can mark tasks done when ready.')}
 <div class="planner-summary"><div class="planner-stat"><span>Tasks today</span><strong>${allToday.length}</strong></div><div class="planner-stat"><span>Completed</span><strong>${doneToday}</strong></div><div class="planner-stat"><span>Still to do</span><strong>${allToday.length-doneToday}</strong></div><button type="button" class="btn green planner-new" data-action="new-care-task">＋ Add a task</button></div>
 <div class="planner-layout ${plannerCalendarVisible?'':'calendar-hidden'}"><div class="stack"><section class="panel"><div class="planner-toolbar"><div class="planner-pills">${[['today','Today'],['upcoming','Upcoming'],['calendar','Selected day']].map(([v,label])=>`<button data-planner-mode="${v}" aria-pressed="${plannerMode===v}">${label}</button>`).join('')}</div><button type="button" class="btn outline planner-toggle" data-calendar-toggle aria-expanded="${plannerCalendarVisible}" aria-controls="care-planner-calendar">${plannerCalendarVisible?'▣ Hide calendar':'▦ Show calendar'}</button></div><div class="planner-filters">${[['all','All'],...Object.entries(taskCategories).map(([k,v])=>[k,v[0]+' '+v[1]])].map(([k,l])=>`<button data-planner-filter="${k}" aria-pressed="${plannerCategory===k}">${l}</button>`).join('')}</div><div class="planner-list-heading"><div><h2>${head}</h2><p>${desc}</p></div><span class="badge">${rows.length} ${rows.length===1?'task':'tasks'}</span></div><div class="care-task-list">${rows.length?rows.slice(0,50).map(item=>`${plannerMode==='upcoming'?`<div class="planner-date-label">${shortDay(item.day)}</div>`:''}${taskRow(item)}`).join(''):`<div class="task-empty"><span aria-hidden="true">✨</span><strong>Nothing scheduled here</strong><p>Choose another date or add a task when you're ready.</p></div>`}</div>${rows.length>50?'<p class="mini-caption">Showing the first 50 tasks.</p>':''}</section></div>
 <div class="stack planner-aside" id="care-planner-calendar" ${plannerCalendarVisible?'':'hidden'}>${plannerCalendarVisible?plannerCalendar():''}${role==='senior'? `<section class="panel planner-tip"><div class="little-illustration" aria-hidden="true">💌</div><h2>Note to family</h2><p>If you have any concerns, you can leave a note for your family. They can read it when they open CareBridge.</p><div class="field"><label for="family-note">Your message</label><textarea id="family-note" maxlength="280" rows="3" placeholder="Write a note to your family…">${escapeHTML(state.notes[todayKey()]||'')}</textarea></div><button type="button" class="btn green" data-action="save-note">Save note</button></section>`:`<section class="panel planner-tip"><div class="little-illustration" aria-hidden="true">💚</div><h2>Plan together</h2><p>Tasks you add appear on their planner. They can mark them complete.</p></section>`}</div></div>`;
}
function taskModalHTML(){
 const role=getRole(),editingTaskId=getEditingTaskId();
 const t=state.tasks.find(x=>x.id===editingTaskId),cat=t?.category||'medication',date=t?.due_date||(plannerMode==='calendar'?plannerDate:todayKey());
 return `<div class="modal-backdrop" id="modal-backdrop"><section class="modal task-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><div class="eyebrow">Shared care planner</div><h2 id="modal-title">${t?'Edit task':'Add something important'}</h2><p>${role==='family'?`For ${escapeHTML(state.prefs.elderName)} — it will appear on their planner.`:'Your family will see your shared plans.'}</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div><form id="care-task-form"><div class="field"><label for="care-title">What needs doing?</label><input id="care-title" maxlength="100" required placeholder="Take morning medicine" value="${escapeHTML(t?.title||'')}"></div><div class="field"><label for="care-category">Category</label><select id="care-category">${Object.entries(taskCategories).map(([k,v])=>`<option value="${k}" ${cat===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select></div><div class="task-form-row"><div class="field"><label for="care-due-date">Date</label><input id="care-due-date" type="date" value="${date}" required></div><div class="field"><label for="care-time">Time (optional)</label><input id="care-time" type="time" value="${t?.due_time?.slice(0,5)||''}"></div></div><div class="field"><label for="care-repeat">Repeat</label><select id="care-repeat">${[['none','Only once'],['daily','Every day'],['weekly','Every week']].map(([k,v])=>`<option value="${k}" ${t?.recurrence===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label for="care-details">Notes (optional)</label><textarea id="care-details" maxlength="500" rows="3" placeholder="Anything helpful to remember…">${escapeHTML(t?.details||'')}</textarea></div><div class="notice">Use this for reminders only; CareBridge does not verify medication doses or send notifications.</div><div class="task-modal-buttons"><button type="submit" class="btn green">${t?'Save changes':'Add to care planner'}</button>${t&&canManageTask(t)?`<button type="button" class="btn warning" data-care-delete="${escapeHTML(t.id)}">Delete task</button>`:''}</div></form></section></div>`;
}


 return {viewPlanner,taskPreview,taskModalHTML,scheduled,taskDone,canManageTask,
 isCalendarVisible:()=>plannerCalendarVisible,
 toggleCalendar:()=>{plannerCalendarVisible=!plannerCalendarVisible},
 setMode:value=>{plannerMode=value},setCategory:value=>{plannerCategory=value},
 selectDate:value=>{plannerDate=value;plannerMode='calendar'},
 shiftMonth:delta=>{const [y,m]=plannerMonth.split('-').map(Number);plannerMonth=todayKey(new Date(y,m-1+Number(delta),1)).slice(0,7)}
 };
}
