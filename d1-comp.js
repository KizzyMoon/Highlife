(()=>{
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], api=window.HighlifeAPI;if(!api)return;
let catalog=[];
const money=n=>'$'+Number(n||0).toLocaleString('en-US');
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function polishCopy(){
 const intro=$('#comp .sectionintro');
 if(intro){const p=intro.querySelector('p:not(.eyebrow)');if(p)p.textContent='Search lost items, add quantities and cash, then generate the compensation total.';}
 const privacy=$('.privacy');if(privacy){const strong=privacy.querySelector('strong'),small=privacy.querySelector('small');if(strong)strong.textContent='Private staff workspace';if(small)small.textContent='Confidential records and compensation values stay outside the public GitHub repository.';}
}

function injectImport(){
 const intro=$('#comp .sectionintro');if(!intro||$('#compImportBtn'))return;
 const controls=document.createElement('div');controls.className='comp-head-actions';
 const clear=$('#clearComp');if(clear)controls.append(clear);
 const b=document.createElement('button');b.id='compImportBtn';b.className='comp-maintenance';b.type='button';b.textContent='Update prices';b.title='Replace the private D1 compensation price list';
 const input=document.createElement('input');input.type='file';input.accept='.csv,text/csv';input.hidden=true;input.id='compImportFile';
 controls.append(b,input);intro.append(controls);b.onclick=()=>input.click();input.onchange=importCsv;
}

async function loadCatalog(){
 try{
  const d=await api.request('/compensation/items');catalog=d.items||[];renderRows();
  const notice=$('#comp .notice');if(notice){notice.classList.add('comp-connected');notice.innerHTML=catalog.length?`<span class="comp-connected-dot"></span><span><strong>${catalog.length} items connected</strong><small>Values are loaded securely from the private staff database.</small></span>`:`<span>Private price data has not been loaded yet.</span>`;}
 }catch(e){console.error(e)}
}

function closeAllPickers(except=null){$$('.comp-picker.open').forEach(p=>{if(p!==except)p.classList.remove('open')});}
function pickerMatches(query){const q=query.trim().toLowerCase();return (q?catalog.filter(x=>x.item_name.toLowerCase().includes(q)):catalog).slice(0,10)}
function renderPicker(row){
 const input=row.querySelector('.compItem'),picker=row.querySelector('.comp-picker'),matches=pickerMatches(input.value);row._pickerIndex=-1;
 picker.innerHTML=matches.length?matches.map((x,i)=>`<button type="button" class="comp-pick-option" data-id="${esc(x.id)}" data-index="${i}">${esc(x.item_name)}</button>`).join(''):'<div class="comp-pick-empty">No matching items</div>';
 picker.classList.add('open');closeAllPickers(picker);
 picker.querySelectorAll('.comp-pick-option').forEach(btn=>btn.onclick=()=>selectItem(row,btn.dataset.id));
}
function selectItem(row,id){const item=catalog.find(x=>x.id===id);if(!item)return;row.dataset.itemId=item.id;row.querySelector('.compItem').value=item.item_name;row.querySelector('.comp-picker').classList.remove('open');calculate();}
function handlePickerKey(e,row){
 const picker=row.querySelector('.comp-picker'),opts=[...picker.querySelectorAll('.comp-pick-option')];
 if(e.key==='ArrowDown'){e.preventDefault();if(!picker.classList.contains('open'))renderPicker(row);row._pickerIndex=Math.min((row._pickerIndex??-1)+1,opts.length-1);}
 else if(e.key==='ArrowUp'){e.preventDefault();row._pickerIndex=Math.max((row._pickerIndex??0)-1,0);}
 else if(e.key==='Enter'&&picker.classList.contains('open')){e.preventDefault();const hit=opts[row._pickerIndex]||opts[0];if(hit)selectItem(row,hit.dataset.id);return;}
 else if(e.key==='Escape'){picker.classList.remove('open');return;} else return;
 opts.forEach((o,i)=>o.classList.toggle('active',i===row._pickerIndex));opts[row._pickerIndex]?.scrollIntoView({block:'nearest'});
}

function rowTemplate(itemId='',qty=1){
 const d=document.createElement('div');d.className='comp-row private-comp-row';d.dataset.itemId=itemId;
 d.innerHTML=`<div class="comp-item-field"><label>Item</label><div class="comp-input-wrap"><input class="compItem" placeholder="Search item..." autocomplete="off" spellcheck="false"><span class="comp-caret">⌄</span><div class="comp-picker" role="listbox"></div></div></div><label class="comp-qty-field">Quantity<input class="compQty" type="number" min="1" value="${qty}"></label><div class="compUnit"><small>Unit value</small><b>—</b></div><div class="compSub"><small>Line total</small><b>—</b></div><button class="comp-remove" title="Remove item" aria-label="Remove item">×</button>`;
 const item=catalog.find(x=>x.id===itemId);if(item)d.querySelector('.compItem').value=item.item_name;
 const input=d.querySelector('.compItem');
 input.addEventListener('focus',()=>renderPicker(d));
 input.addEventListener('click',()=>renderPicker(d));
 input.addEventListener('input',()=>{d.dataset.itemId='';renderPicker(d);calculate()});
 input.addEventListener('keydown',e=>handlePickerKey(e,d));
 d.querySelector('.compQty').addEventListener('input',calculate);
 d.querySelector('.comp-remove').onclick=()=>{d.remove();if(!$('#compRows').children.length)$('#compRows').append(rowTemplate());calculate()};
 return d;
}

function renderRows(){
 const box=$('#compRows');if(!box)return;
 if(!box.querySelector('.private-comp-row')){box.innerHTML='';box.append(rowTemplate())}
 $('#addComp').onclick=()=>{const row=rowTemplate();box.append(row);row.querySelector('.compItem').focus()};
 $('#clearComp').onclick=()=>{box.innerHTML='';box.append(rowTemplate());$('#cashLost').value=0;calculate()};
 $('#cashLost').oninput=calculate;calculate();
}
function selectedRows(){return $$('.private-comp-row').map(r=>{let item=catalog.find(x=>x.id===r.dataset.itemId);if(!item){const name=r.querySelector('.compItem').value.trim();item=catalog.find(x=>x.item_name.toLowerCase()===name.toLowerCase());if(item)r.dataset.itemId=item.id;}const quantity=Math.max(1,Number(r.querySelector('.compQty').value||1));return item?{id:item.id,quantity,row:r,name:item.item_name}:null}).filter(Boolean)}
async function calculate(){
 const rows=selectedRows(),cash=Math.max(0,Number($('#cashLost').value||0));
 $$('.private-comp-row').forEach(r=>{r.querySelector('.compUnit b').textContent='—';r.querySelector('.compSub b').textContent='—'});
 if(!rows.length&&!cash){$('#compTotal').textContent='$0';$('#compMessage').textContent='Add an item or cash loss to calculate compensation.';return}
 try{
  const d=await api.request('/compensation/calculate',{method:'POST',body:JSON.stringify({cash_lost:cash,items:rows.map(x=>({id:x.id,quantity:x.quantity}))})});
  (d.lines||[]).forEach(line=>{const hit=rows.find(x=>x.id===line.id&&!x.done)||rows.find(x=>x.name===line.item_name&&!x.done);if(hit){hit.done=true;hit.row.querySelector('.compUnit b').textContent=money(line.unit_value);hit.row.querySelector('.compSub b').textContent=money(line.subtotal)}});
  $('#compTotal').textContent=money(d.total);
  const msg=[];(d.lines||[]).forEach(x=>msg.push(`${x.quantity} ${x.item_name}`));if(cash>0)msg.push(`${money(cash)} Cash`);msg.push(`Total Value: ${money(d.total)}`);$('#compMessage').textContent=msg.join('\n');
 }catch(e){$('#compTotal').textContent='Error';$('#compMessage').textContent='Could not calculate: '+e.message}
}
function parseCsv(text){const out=[];for(const raw of text.replace(/^\uFEFF/,'').split(/\r?\n/)){if(!raw.trim())continue;let cells=[],cur='',quote=false;for(let i=0;i<raw.length;i++){const ch=raw[i];if(ch==='"'){if(quote&&raw[i+1]==='"'){cur+='"';i++}else quote=!quote}else if(ch===','&&!quote){cells.push(cur);cur=''}else cur+=ch}cells.push(cur);out.push(cells)}return out}
async function importCsv(e){const file=e.target.files?.[0];if(!file)return;try{const rows=parseCsv(await file.text());const head=rows.shift().map(x=>x.trim().toLowerCase()),ni=head.indexOf('item_name'),vi=head.indexOf('unit_value');if(ni<0||vi<0)throw new Error('CSV must contain item_name and unit_value columns.');const items=rows.map(r=>({item_name:(r[ni]||'').trim(),unit_value:Number(r[vi])})).filter(x=>x.item_name&&Number.isFinite(x.unit_value));if(!items.length)throw new Error('No valid item rows found.');if(!confirm(`Replace the private compensation list with ${items.length} items?`))return;const d=await api.request('/admin/compensation/import',{method:'POST',body:JSON.stringify({items})});alert(`Updated ${d.imported} private compensation items.`);await loadCatalog()}catch(err){alert('Could not import price data: '+err.message)}finally{e.target.value=''}}
$('#copyComp').onclick=async()=>{try{await navigator.clipboard.writeText($('#compMessage').textContent);$('#copyComp').textContent='Copied ✓';setTimeout(()=>$('#copyComp').textContent='Copy message',1200)}catch{}};
document.addEventListener('click',e=>{if(!e.target.closest('.comp-input-wrap'))closeAllPickers()});
function bind(){polishCopy();injectImport();loadCatalog()}
window.addEventListener('highlife-authenticated',bind);if(api.token)bind();
})();