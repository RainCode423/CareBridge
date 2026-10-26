import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlanner} from '../src/planner.js';
import {todayKey,escapeHTML} from '../src/utils.js';
const make=(role='senior')=>{const state={tasks:[],completions:[],prefs:{elderName:'Evelyn'}};return {state,planner:createPlanner({state,getRole:()=>role,getUser:()=>({id:'a'}),getEditingTaskId:()=>null})}};
test('HTML content is escaped',()=>assert.equal(escapeHTML('<script>'),'&lt;script&gt;'));
test('daily and weekly recurrence',()=>{const {planner}=make();assert.equal(planner.scheduled({due_date:'2026-10-25',recurrence:'weekly'},'2026-11-01'),true);assert.equal(planner.scheduled({due_date:'2026-10-25',recurrence:'none'},'2026-10-26'),false);assert.equal(planner.scheduled({due_date:'2026-10-25',recurrence:'daily'},'2026-10-26'),true)});
test('calendar toggle keeps tasks',()=>{const {state,planner}=make();state.tasks.push({id:'x',title:'Doctor appointment',due_date:todayKey(),recurrence:'none',category:'appointment',created_by:'a',details:''});planner.toggleCalendar();assert.equal(planner.isCalendarVisible(),false);assert.match(planner.viewPlanner(),/Show calendar/);assert.match(planner.viewPlanner(),/Doctor appointment/)});
test('caregivers edit only their own tasks',()=>{const {planner}=make('family');assert.equal(planner.canManageTask({created_by:'a'}),true);assert.equal(planner.canManageTask({created_by:'b'}),false)});
