(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],api=window.HighlifeAPI;if(!api)return;
const dayMs=86400000;
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const norm=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
const parseDate=s=>s?new Date(`${s}T12:00:00Z`):null;
const diffDays=(a,b)=>{const x=parseDate(a),y=parseDate(b);return x&&y?Math.max(0,Math.round((y-x)/dayMs)):0};
const fmt=s=>s?parseDate(s).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—';
let savedCases=[],matchedPlayer=null,loadTimer=null;
function ensureUI(){
 const summary=$('#punishment .summarypanel');if(!summary||$('#historyInsight'))return;
 const box=document.createElement('div');box.id='historyInsight';box.className='history-insight';
 box.innerHTML=`<div class="history-head"><div><small>HISTORY INTELLIGENCE</small><h3>Escalation context</h3></div><span id="historySource">Manual entries</span></div><div id="historyFlags" class="history-flags"></div><div id="historyTimeline" class="history-timeline"></div>`;
 const guide=summary.querySelector('.guidance');summary.insertBefore(box,guide||summary.lastElementChild);
 const profile=$('#caseProfile'),rule=$('#caseRule');
 if(profile){profile.addEventListener('input',()=>{clearTimeout(loadTimer);loadTimer=setTimeout(loadProfile,350)});profile.addEventListener('change',loadProfile)}
 if(rule){rule.addEventListener('input',recalc);rule.addEventListener('change',recalc)}
 ['currentStart','currentEnd'].forEach(id=>$('#'+id)?.addEventListener('input',recalc));
 $('#banRows')?.addEventListener('input',recalc);$('#banRows')?.addEventListener('click',()=>setTimeout(recalc,0));
 const obs=$('#banRows')?new MutationObserver(recalc):null;obs?.observe($('#banRows'),{childList:true,subtree:true});
 loadProfile();recalc();
}
async function loadProfile(){
 const profile=$('#caseProfile')?.value.trim()||'';savedCases=[];matchedPlayer=null;
 if(!profile){setSource();recalc();return}
 try{
  const d=await api.request('/players?q='+encodeURIComponent(profile));
  const p=(d.players||[]).find(x=>x.profile_url===profile);
  if(p){const detail=await api.request('/players/'+encodeURIComponent(p.id));matchedPlayer=detail.player;savedCases=detail.cases||[]}
 }catch(e){console.warn('Could not load punishment history',e)}
 setSource();recalc();
}
function setSource(){const el=$('#historySource');if(!el)return;el.textContent=matchedPlayer?`D1 + manual · ${matchedPlayer.current_name}`:'Manual entries'}
function manualPriors(){return $$('.ban-row').map(r=>({reason:r.querySelector('.breason')?.value.trim()||'',ban_start:r.querySelector('.bstart')?.value||null,ban_end:r.querySelector('.bend')?.value||null,source:'manual'})).filter(x=>x.reason||x.ban_start||x.ban_end)}
function uniqueHistory(){
 const all=[];for(const c of savedCases){all.push({reason:c.rule_name||'',ban_start:c.ban_start||null,ban_end:c.ban_end||null,source:'saved'})}
 for(const p of manualPriors())all.push(p);
 const seen=new Set();return all.filter(x=>{const k=[norm(x.reason),x.ban_start||'',x.ban_end||''].join('|');if(seen.has(k))return false;seen.add(k);return true})
}
function recalc(){
 const history=uniqueHistory(),rule=norm($('#caseRule')?.value||''),now=new Date(),ended=history.filter(x=>x.ban_end).sort((a,b)=>String(b.ban_end).localeCompare(String(a.ban_end)));
 const durations=history.map(x=>diffDays(x.ban_start,x.ban_end));const total=durations.reduce((a,b)=>a+b,0),longest=Math.max(0,...durations),last=ended[0]||null;
 const same=rule?history.filter(x=>norm(x.reason)===rule||norm(x.reason).includes(rule)||rule.includes(norm(x.reason))).length:0;
 const within=(days)=>history.filter(x=>{const e=parseDate(x.ban_end);return e&&e<=now&&now-e<=days*dayMs}).length;
 const recent90=within(90),recent180=within(180),daysSince=last?Math.max(0,Math.floor((now-parseDate(last.ban_end))/dayMs)):null;
 // Keep legacy stats synced.
 if($('#statBans'))$('#statBans').textContent=history.length;if($('#statDays'))$('#statDays').textContent=total;if($('#statLongest'))$('#statLongest').textContent=`${longest} days`;if($('#statLast'))$('#statLast').textContent=last?fmt(last.ban_end):'—';if($('#statSame'))$('#statSame').textContent=same;if($('#stat90'))$('#stat90').textContent=recent90;
 const flags=[];
 if(!history.length)flags.push(['neutral','No prior punishments','No previous bans are recorded in the saved or manual history.']);
 else{
  if(same>=2)flags.push(['high',`${same} same-rule priors`,'Repeated history for the same or closely matching rule — check repeat-offence guidance.']);
  else if(same===1)flags.push(['warn','Previous same-rule offence','There is one previous punishment matching this rule.']);
  if(recent90>=2)flags.push(['high',`${recent90} bans in 90 days`,'Multiple recent punishments suggest an active pattern rather than isolated history.']);
  else if(recent90===1)flags.push(['warn','Recent punishment','A previous ban ended within the last 90 days.']);
  if(recent180>=3&&recent90<2)flags.push(['warn',`${recent180} bans in 180 days`,'Several punishments are clustered within the last six months.']);
  if(daysSince!==null)flags.push(['neutral',`${daysSince} days since last ban`,`Most recent recorded ban ended ${fmt(last.ban_end)}.`]);
  if(longest>=30)flags.push(['neutral',`Longest prior: ${longest} days`,'The player has previously received a substantial ban length.']);
 }
 const currentLen=diffDays($('#currentStart')?.value||null,$('#currentEnd')?.value||null);if(currentLen&&longest&&currentLen<longest&&same>0)flags.push(['info','Current length below prior max',`Current proposed/issued length is ${currentLen} days versus a ${longest}-day previous maximum. This is context only, not an automatic recommendation.`]);
 renderFlags(flags);renderTimeline(history);
}
function renderFlags(flags){const box=$('#historyFlags');if(!box)return;box.innerHTML=flags.map(([tone,title,text])=>`<div class="history-flag ${tone}"><b>${esc(title)}</b><span>${esc(text)}</span></div>`).join('')}
function renderTimeline(history){const box=$('#historyTimeline');if(!box)return;if(!history.length){box.innerHTML='';return}const rows=[...history].sort((a,b)=>String(b.ban_end||b.ban_start||'').localeCompare(String(a.ban_end||a.ban_start||''))).slice(0,6);box.innerHTML=`<div class="timeline-title">Recent punishment history</div>${rows.map(x=>`<div class="timeline-row"><div><b>${esc(x.reason||'Unspecified')}</b><small>${x.source==='saved'?'Saved record':'Manual prior'}</small></div><div class="timeline-dates"><span>${fmt(x.ban_start)} → ${fmt(x.ban_end)}</span><b>${diffDays(x.ban_start,x.ban_end)} days</b></div></div>`).join('')}${history.length>6?`<div class="timeline-more">+ ${history.length-6} older record(s)</div>`:''}`}
window.addEventListener('highlife-authenticated',ensureUI);if(api.token)ensureUI();
})();