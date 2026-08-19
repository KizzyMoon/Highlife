(()=>{
const ticketTypes=[
  {type:'Compensations',owner:'Scotteh'},
  {type:'Ban Evading',owner:'Rob'},
  {type:'Exploiting',owner:'Nomi'},
  {type:'Supporter',owner:'Kissane'}
];
function mount(){
  const dashboard=document.querySelector('[data-page="dashboard"], #dashboard, .dashboard-page, main');
  if(!dashboard||document.getElementById('ticket-routing-key')) return;
  const card=document.createElement('section');
  card.id='ticket-routing-key';
  card.className='ticket-routing-key';
  card.innerHTML=`<div class="ticket-key-head"><div><span class="ticket-key-kicker">QUICK REFERENCE</span><h3>Ticket Routing</h3></div><span class="ticket-key-note">Who handles these ticket types</span></div><div class="ticket-key-grid">${ticketTypes.map(x=>`<div class="ticket-key-row"><span>${x.type}</span><strong>${x.owner}</strong></div>`).join('')}</div>`;
  const target=dashboard.querySelector('.dashboard-grid,.grid,.cards')||dashboard;
  target.appendChild(card);
}
const css=document.createElement('style');
css.textContent=`.ticket-routing-key{background:#0d1824;border:1px solid #22364a;border-radius:14px;padding:18px;margin-top:18px}.ticket-key-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}.ticket-key-kicker{display:block;color:#7fa2c4;font-size:10px;font-weight:800;letter-spacing:.14em;margin-bottom:4px}.ticket-routing-key h3{margin:0;color:#f5f8fb;font-size:18px}.ticket-key-note{color:#7189a1;font-size:12px}.ticket-key-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.ticket-key-row{display:flex;justify-content:space-between;gap:14px;padding:11px 13px;background:#09131e;border:1px solid #1b2d3f;border-radius:9px;color:#a9c5df;font-size:13px}.ticket-key-row strong{color:#c7ff22;font-weight:700}@media(max-width:700px){.ticket-key-grid{grid-template-columns:1fr}.ticket-key-head{display:block}.ticket-key-note{display:block;margin-top:4px}}`;
document.head.appendChild(css);
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,300)); else setTimeout(mount,300);
new MutationObserver(()=>mount()).observe(document.body,{childList:true,subtree:true});
})();