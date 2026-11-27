(()=>{
const el=id=>document.getElementById(id);
let data;
const recordFields=['instrument','grating','major','labDate','width','procedurePlan','work','note','phi','spacing','pick'];
function key(){return measurementKey(el('mode').value)}
function persist(){
 try{localStorage.setItem(key(),JSON.stringify(data));showSaveStatus(true)}
 catch{showSaveStatus(false)}
}
function readForm(){
  for(const id of recordFields)data[id]=el(id).value;
  Array.from(el('record').querySelector('tbody').rows).forEach((row,i)=>{
    row.querySelectorAll('input').forEach((input,j)=>{data.raw[i][j]=input.value});
  });
}
function calculationIssue(){
  const point=measuredLine(data,+data.pick);
  if(!point)return '待核对谱线需要四个有效且左右不重合的读数。';
  if(!data.phi||!data.spacing)return '请填写待核对行的 φ（°）和 d（nm）。';
  if(Math.abs(+data.phi-point.phi)>0.02||Math.abs(+data.spacing-point.d)>Math.max(2,point.d*.002)){
    return '所选谱线的 φ 或 d 未吻合。请复查待核对行、度与弧度，以及跨零角差是否取半。';
  }
  return '';
}
window.validateMeasurement=function(){
  if(el('mode').value!=='real')return ['数据来源当前为「模拟练习」，请切换到「课堂实测」填写。'];
  readForm();
  const problems=[];
  const labels={labDate:'实验日期',major:'专业',instrument:'仪器组号',grating:'光栅编号',work:'一行计算过程',note:'观察记录与分析'};
  const missing=Object.entries(labels).filter(([id])=>!data[id].trim()).map(([,label])=>label);
  if(missing.length)problems.push('请填写：'+missing.join('、')+'。');
  if(!(Number(data.width)>0))problems.push('有效受照宽度 L 必须大于 0 mm。');
  const columns=['左Ⅰ','左Ⅱ','右Ⅰ','右Ⅱ'];
  rows.forEach(([k,name,w],i)=>{
    const label=k?k+' 级 '+name+' '+w+' nm':'零级中央像';
    const readings=data.raw[i].slice(0,k?4:2);
    const empty=readings.flatMap((v,j)=>v.trim()?[]:[columns[j]]);
    const invalid=readings.flatMap((v,j)=>v.trim()&&!Number.isFinite(parseAngle(v))?[columns[j]]:[]);
    if(empty.length)problems.push(label+' 缺少 '+empty.join('、')+'。');
    if(invalid.length)problems.push(label+' 的 '+invalid.join('、')+' 读数无效。');
    if(k&&!empty.length&&!invalid.length&&!measuredLine(data,i))problems.push(label+' 的左右读数重合，请核对角位置。');
  });
  const issue=calculationIssue();
  if(issue)problems.push(issue);
  data.checked=!issue;
  persist();
  if(data.checked){render();el('mathFeedback').textContent='所选谱线的计算已核对。'}
  return problems;
};
function invalidate(){
  document.querySelectorAll('.computed').forEach(cell=>cell.textContent='—');
  el('plot').textContent='完成一组独立计算后显示本次数据。';
  el('stats').textContent='';el('mathFeedback').textContent='';
}
function load(){
  const demo=el('mode').value==='demo';
  const raw=rows.map(([k,,w])=>{
    const a=Math.asin(k*w/2000)*180/Math.PI;
    return demo?[10-a,190-a,10+a,190+a].map(n=>((n+360)%360).toFixed(3)):['','','',''];
  });
  data=JSON.parse(localStorage.getItem(key())||'null')||{raw,instrument:'',grating:'',note:''};
  const body=el('record').querySelector('tbody');body.replaceChildren();
  for(const id of ['instrument','grating','major','labDate','width','procedurePlan','work','note'])el(id).value=data[id]??'';
  rows.forEach(([k,name,w],i)=>{
    const row=body.insertRow();row.insertCell().textContent=k;row.insertCell().textContent=w?name+' '+w:name;
    data.raw[i].forEach((v,j)=>{if(!k && j>=2){row.insertCell().textContent='—';return}const field=document.createElement('input');field.value=v;
      field.setAttribute('aria-label',k+'级'+name+['左 I','左 II','右 I','右 II'][j]);field.oninput=()=>{data.checked=false;data.raw[i][j]=field.value;persist();invalidate()};row.insertCell().append(field)});
    for(let j=0;j<4;j++)row.insertCell().className='computed';
  });
  el('phi').value=data.phi||'';el('spacing').value=data.spacing||'';el('pick').value=data.pick||'1';invalidate();if(data.checked)render();
}
function render(){
  const points=[];let invalid=0;
  rows.forEach((row,i)=>{const p=measuredLine(data,i);if(!p){if(i&&data.raw[i].some(v=>v.trim()))invalid++;return}
    points.push(p);const cells=el('record').querySelector('tbody').rows[i].cells;cells[6].textContent=p.phiI.toFixed(3);cells[7].textContent=p.phiII.toFixed(3);cells[8].textContent=p.phi.toFixed(3);cells[9].textContent=p.d.toFixed(1)});
  drawDispersion(el('plot'),points);
  const summaries=gratingSummary(data);
  if(invalid)summaries.push('有 '+invalid+' 行不完整或角度无效，未绘制。'); el('stats').replaceChildren(...summaries.map(text=>{const p=document.createElement('p');p.textContent=text;return p}));
}
rows.slice(1).forEach(([k,n],i)=>el('pick').add(new Option(k+' 级 '+n,i+1)));
el('check').onclick=()=>{
  readForm();
  const issue=calculationIssue();
  data.checked=!issue;
  persist();
  invalidate();
  if(data.checked)render();
  el('mathFeedback').textContent=issue||'本行计算吻合，所有完整有效行已显示。';
};
for(const id of ['instrument','grating','major','labDate','width','procedurePlan','work','note'])el(id).oninput=()=>{data[id]=el(id).value;persist();if(id==='width'&&el('plot').querySelector('svg'))render()};
for(const id of ['phi','spacing','pick'])el(id).oninput=()=>{data[id]=el(id).value;data.checked=false;persist();invalidate()};
el('mode').value=draft.measurementMode||'real';
el('mode').onchange=()=>{draft.measurementMode=el('mode').value;save();load()};
load();





})();
