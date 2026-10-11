const genres=['Work delivery','Communication','Learning','Health','Finance','Home','Relationships','Errands','Planning','Other'];
const domains=['Personal','Professional','Mixed','Unclear'];
let aiDraftText='',aiLoading=false,aiError='',aiReady=null;
let dumpChat=[],chatTaskIds=[];
function choiceOptions(values,current){return values.map(v=>`<option ${current===v?'selected':''}>${esc(v)}</option>`).join('')}
async function apiJSON(path,data){const response=await fetch(path,data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{});const result=await response.json().catch(()=>({error:'AI is temporarily unavailable. Your message is safe; try again shortly.'}));if(!response.ok)throw Error(result.error||'Request failed.');return result;}
async function aiStatus(){try{aiReady=await apiJSON('/api/ai/status');if($('#ai-status'))$('#ai-status').textContent=aiReady.configured?'AI ready · Included':'AI temporarily unavailable';}catch{aiReady=null;if($('#ai-status'))$('#ai-status').textContent='AI temporarily unavailable';}}
function timingText(t){return `Start: ${t.planned?dateLabel(t.planned):'not scheduled'}${t.plannedTime?' at '+t.plannedTime:''}. Deadline: ${t.due?dateLabel(t.due):'not set'}${t.dueTime?' at '+t.dueTime:''}.${t.durationMinutes?' Duration: '+t.durationMinutes+' minutes.':''}${t.timezone?' Timezone: '+t.timezone+'.':''}`;}
function taskChatDetails(t){return `${t.title}\n${timingText(t)}\nImportance: ${t.importance}. Area: ${t.domain}. Category: ${t.genre}.\n${t.explanation}${t.startNow?' I assumed you are starting now. Tell me if you want a different start.':''}`;}
renderDump=function(){
 $('#app').innerHTML=heading('TALK IT THROUGH','A thought. <em>A clear next step.</em>','Tell me what you need to do. We can work out the timing together.')+`<section class="panel dump-card chat-panel"><div class="panel-head ai-panel-head"><h2>Your task conversation</h2><span class="tag" id="ai-status">Checking AI connection…</span></div><div class="task-conversation" role="log" aria-live="polite" aria-label="Task conversation"><div class="chat-message assistant"><strong>Daylight</strong><p>What would you like to get done? Tell me the task and any timing you know. I’ll create it, explain the details here, and ask about anything missing. You can reply to change the latest tasks.</p></div>${dumpChat.map(m=>`<div class="chat-message ${m.role==='user'?'user':'assistant'}"><strong>${m.role==='user'?'You':'Daylight'}</strong><p>${esc(m.content)}</p></div>`).join('')}${aiLoading?'<div class="chat-message assistant"><p>Thinking through your task…</p></div>':''}</div><form id="dump-chat-form"><label class="sr-only" for="dumptext">Message Daylight</label><textarea id="dumptext" maxlength="6000" placeholder="I’m going to work on my presentation for 10 hours…" oninput="aiDraftText=this.value" ${aiLoading?'readonly':''}>${esc(aiDraftText)}</textarea><div class="dump-footer"><span class="subtle">Your message is sent to Groq to create or update tasks.<br>Tasks are saved in this browser. Times use your timezone.</span><button class="btn primary" ${aiLoading?'disabled':''}>${aiLoading?'Thinking…':'Create a Task'}</button></div></form><div role="alert">${aiError?`<p class="ai-error">${esc(aiError)}</p>`:''}</div><div class="chat-links"><button class="link" onclick="location.hash='projects'">View All Tasks ↗</button><button class="link" ${aiLoading?'disabled':''} onclick="newDumpConversation()">New conversation</button></div></section>`;
 $('#dump-chat-form').onsubmit=e=>{e.preventDefault();organiseWithAI()};aiStatus();const log=$('.task-conversation');log.scrollTop=log.scrollHeight;
};
function newDumpConversation(){if(aiLoading)return;dumpChat=[];chatTaskIds=[];aiDraftText='';aiError='';renderDump();}
async function organiseWithAI(){
 const text=$('#dumptext').value.trim();if(!text||aiLoading)return;
 aiDraftText=text;aiLoading=true;aiError='';renderDump();
 const active=state.tasks.filter(t=>chatTaskIds.includes(t.id));
 const context={tasks:active.map(({id,title,importance,domain,genre,planned,due,plannedTime,dueTime,durationMinutes,timezone})=>({id,title,importance,domain,genre,planned,due,plannedTime,dueTime,durationMinutes,timezone})),conversation:dumpChat.slice(-8).map(m=>({role:m.role,content:m.content.slice(0,3000)}))};
 try{
 const result=await apiJSON('/api/quick-dump',{text,today:day(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,context});
 if(!Array.isArray(result.tasks)||typeof result.reply!=='string'||!['new','update'].includes(result.mode))throw Error('The reply was incomplete. Please try again.');
 if(result.mode==='update'&&result.tasks.length&&result.tasks.length!==active.length)throw Error('I couldn’t match that change to your tasks. Please name the task and the change.');
 if(result.mode==='update'&&result.tasks.length&&(new Set(result.tasks.map(t=>t.sourceId)).size!==active.length||result.tasks.some(t=>!active.some(a=>a.id===t.sourceId))))throw Error('Please name the task you want to change.');
 const saved=[];
 for(let i=0;i<result.tasks.length;i++){
 const t=result.tasks[i];const previous=result.mode==='update'?active.find(a=>a.id===t.sourceId):null;
 const record={...t,id:previous?.id||uid(),project:previous?.project||'',status:previous?.status||'To do',done:previous?.done||null,priority:['Critical','High'].includes(t.importance),planned:t.planned||'',due:t.due||'',original:previous?.original||text,aiExplanation:t.explanation,aiConfidence:t.confidence};
 if(previous)Object.assign(previous,record);else state.tasks.push(record);saved.push(record);
 }
 if(saved.length)chatTaskIds=saved.map(t=>t.id);
 const notice=saved.length?`${result.mode==='update'?'Updated':'Created'} ${saved.length} ${saved.length===1?'task':'tasks'}.\n\n${saved.map(taskChatDetails).join('\n\n')}\n\n`:'';
 dumpChat.push({role:'user',content:text},{role:'assistant',content:notice+result.reply});aiDraftText='';persistOnly();
 }catch(e){aiError=e.message||'Something went wrong. Your message is still here.';}finally{aiLoading=false;if(location.hash==='#dump')renderDump();else toast(aiError?'Your task conversation needs attention.':'Daylight replied to your task conversation.');}
}
const beforeAITask=task;
task=function(t,review=false){let html=beforeAITask(t,review);const tags=`${t.plannedTime?`<span>Start ${esc(t.plannedTime)}</span>`:''}${t.dueTime?`<span>Finish ${esc(t.dueTime)}</span>`:''}${t.domain?`<span class="tag blue">${esc(t.domain)}</span>`:''}${t.genre?`<span class="tag purple">${esc(t.genre)}</span>`:''}`;return html.replace('<div class="meta">','<div class="meta">'+tags)};
const beforeAICard=boardCard;
boardCard=function(t){return beforeAICard(t).replace('<div class="meta">',`<div class="meta">${t.domain?`<span class="tag blue">${esc(t.domain)}</span>`:''}${t.genre?`<span>${esc(t.genre)}</span>`:''}`)};
const beforeAIEdit=editTask;
editTask=function(id,defaults={}){beforeAIEdit(id,defaults);const t=state.tasks.find(t=>t.id===id)||defaults;document.querySelector('#taskform .modal-actions').insertAdjacentHTML('beforebegin',`<div class="form-grid"><label class="field">Start time<input type="time" name="plannedTime" value="${esc(t.plannedTime||'')}"></label><label class="field">Deadline time<input type="time" name="dueTime" value="${esc(t.dueTime||'')}"></label></div><div class="form-grid"><label class="field">Area<select name="domain"><option value="">Unclassified</option>${choiceOptions(domains,t.domain)}</select></label></div><label class="field">Category<select name="genre"><option value="">Unclassified</option>${choiceOptions(genres,t.genre)}</select></label>`);};
render();

