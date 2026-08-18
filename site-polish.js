(()=>{
const $=s=>document.querySelector(s);
function text(sel,value){const el=$(sel);if(el)el.textContent=value}
function addLogout(){const header=document.querySelector('header');if(!header||$('#logoutBtn'))return;const b=document.createElement('button');b.id='logoutBtn';b.className='logout-btn';b.type='button';b.textContent='Sign out';b.onclick=()=>window.HighlifeLogout?.();header.appendChild(b)}
function cleanCopy(){const privacy=$('.privacy');if(privacy){const strong=privacy.querySelector('strong'),small=privacy.querySelector('small');if(strong)strong.textContent='Private workspace';if(small)small.textContent='Confidential records, compensation values and staff guidance are stored outside the public GitHub repository.'}
 const saved=$('.dashboard-grid .panel:nth-child(2) .panelhead span');if(saved)saved.textContent='Cloudflare D1';const note=$('.prototype-note');if(note)note.textContent='Player records, cases and appeal reviews sync privately across your devices.';
 const compIntro=$('#comp .sectionintro p:not(.eyebrow)');if(compIntro)compIntro.textContent='Add lost items and cash using your private compensation price database.';
 const status=document.querySelector('header .status');if(status)status.innerHTML='Authenticated <span>●</span>';
}
function loadingStates(){const lists=['#playerList','#appealPlayerResults','#ruleResults'];lists.forEach(s=>{const el=$(s);if(el&&el.textContent.trim()==='')el.innerHTML='<div class="empty compact">Nothing to show yet.</div>'})}
function bind(){addLogout();cleanCopy();loadingStates()}
window.addEventListener('highlife-authenticated',bind);document.addEventListener('DOMContentLoaded',bind);setTimeout(bind,600);
})();