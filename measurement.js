const el=id=>document.getElementById(id);
let data;
function key(){return 'grating-measure-v1-'+el('mode').value}
function persist(){localStorage.setItem(key(),JSON.stringify(data))}
function invalidate(){
  document.querySelectorAll('.computed').forEach(cell=>cell.textContent='—');
  el('plot').textContent='完成一组独立计算后显示本次数据。';
  el('stats').textContent='';el('feedback').textContent='';
}
function load(){
  const demo=el('mode').value==='demo';
  const raw=rows.map(([k,,w])=>{
    const a=Math.asin(k*w/2000)*180/Math.PI;
    return demo?[10-a,190-a,10+a,190+a].map(n=>((n+360)%360).toFixed(3)):['','','',''];
  });
  data=JSON.parse(localStorage.getItem(key())||'null')||{raw,instrument:'',grating:'',note:''};
  const body=document.querySelector('tbody');body.replaceChildren();
  for(const id of ['instrument','grating','width','procedurePlan','work','note'])el(id).value=data[id]??'';
  rows.forEach(([k,name,w],i)=>{
    const row=body.insertRow();row.insertCell().textContent=k;row.insertCell().textContent=w?name+' '+w:name;
    data.raw[i].forEach((v,j)=>{if(!k && j>=2){row.insertCell().textContent='—';return}const field=document.createElement('input');field.value=v;
      field.setAttribute('aria-label',k+'级'+name+['左 I','左 II','右 I','右 II'][j]);field.oninput=()=>{data.raw[i][j]=field.value;persist();invalidate()};row.insertCell().append(field)});
    for(let j=0;j<4;j++)row.insertCell().className='computed';
  });
  el('phi').value=el('spacing').value='';invalidate();
}
function render(){
  const points=[];let invalid=0;
  rows.forEach((row,i)=>{const p=measuredLine(data,i);if(!p){if(i&&data.raw[i].some(v=>v.trim()))invalid++;return}
    points.push(p);const cells=document.querySelector('tbody').rows[i].cells;cells[6].textContent=p.phiI.toFixed(3);cells[7].textContent=p.phiII.toFixed(3);cells[8].textContent=p.phi.toFixed(3);cells[9].textContent=p.d.toFixed(1)});
  drawDispersion(el('plot'),points);
  const summaries=gratingSummary(data);
  if(invalid)summaries.push('有 '+invalid+' 行不完整或角度无效，未绘制。'); el('stats').replaceChildren(...summaries.map(text=>{const p=document.createElement('p');p.textContent=text;return p}));
}
rows.slice(1).forEach(([k,n],i)=>el('pick').add(new Option(k+' 级 '+n,i+1)));
el('check').onclick=()=>{
  const p=measuredLine(data,+el('pick').value);
  if(!p){el('feedback').textContent='该行需要四个有效角位置，且左右谱线不能重合。';return}
  if(!el('phi').value||!el('spacing').value||Math.abs(+el('phi').value-p.phi)>0.02||Math.abs(+el('spacing').value-p.d)>Math.max(2,p.d*.002)){
    el('feedback').textContent='尚未吻合。检查左右是否来自同一游标、是否跨零，以及是否已将夹角除以二。';return}
  render();el('feedback').textContent='本行计算吻合，所有完整有效行已显示。';
};
for(const id of ['instrument','grating','width','procedurePlan','work','note'])el(id).oninput=()=>{data[id]=el(id).value;persist();if(id==='width'&&el('plot').querySelector('svg'))render()};
el('mode').onchange=load;load();




