// Diffraction grating lessons for derekfuture/livebook Panel.
const panel = new Panel(document.querySelector('#sheet'));
const canvas = document.querySelector('#diagram');
const pen = canvas.getContext('2d');
const spectralLines = [
  { name: '蓝', wavelength: 435.8, color: '#99aaff' },
  { name: '绿', wavelength: 546.1, color: '#6be6a6' },
  { name: '黄一', wavelength: 577, color: '#ffe175' },
  { name: '黄二', wavelength: 579, color: '#ffd763' }
];
const definitions = {
  dispersion: {
    fig: '色散曲线', title: '两条黄线，哪一级分得更开？',
    predict: { q: '在同一光栅上比较两条黄线的角距离，一级和二级哪一个更大？', options: ['一级','二级','一样大'], answer: 1 },
    need: '分别记录一级和二级的黄双线角距离。',
    conclusion: { quote: '固定光栅与入射方向时，在本实验可见的两个正级次中，二级黄双线的角距离更大。', formula: 'dφ/dλ = k / (d cos φ)', why: '角距离描述色散。真实仪器能否分清两条线还取决于线宽、狭缝及受照刻线数。理想分辨本领 R = |k|N。', src: '正入射模型 · 角度求导采用弧度' }
  },
  unknown: {
    fig: '分光计读数', title: '用左右读数找出未知波长',
    predict: { q: '同一级谱线分布在零级两侧。左右读数相差的较小角等于什么？', options: ['一个衍射角','两个衍射角','光栅常数'], answer: 1 },
    need: '记录两个游标，并独立计算未知波长。',
    conclusion: { quote: '每个游标分别取左右角位置的较小夹角，再除以二。两个游标给出的衍射角取平均。', formula: 'λ = d sin φ / |k|', why: '示例中两个游标分别给出 15.85° 和 15.84°，平均为 15.845°，对应约 546 nm。', src: '模拟练习 · d = 2000 nm，k = 1' }
  }
};
let active;
function label(text, control) { return h('label', {}, text, control); }
function drawLines(order) {
  pen.fillStyle = '#142f2b';
  pen.fillRect(0, 0, 660, 300);
  const x = angle => 52 + angle * 14;
  pen.font = '18px sans-serif';
  pen.fillStyle = '#d3e3cf';
  pen.fillText('汞灯谱线 · 正角方向', 24, 40);
  for (let angle = 0; angle <= 40; angle += 5) {
    pen.fillStyle = '#829b91'; pen.fillText(angle + '°', x(angle) - 10, 244);
    pen.fillRect(x(angle), 210, 1, 10);
  }
  for (const line of spectralLines) {
    const angle = Math.asin(order * line.wavelength / 2000) * 180 / Math.PI;
    pen.fillStyle = line.color; pen.fillRect(x(angle), 75, 2, 135);
  }
  pen.fillStyle = '#d3e3cf'; pen.fillText('衍射角 φ（°）', 260, 285);
}
function dispersion(ui) {
  const order = h('select', {}, h('option', {value:1}, '一级'), h('option', {value:2}, '二级'));
  const record = h('button', {}, '记录这一级的角距离');
  const tableBody = h('tbody');
  ui.controls.append(label('衍射级次',order), record);
  ui.data.append(h('table', {}, h('thead', {}, h('tr',{}, ['级次','577 nm','579 nm','角距离'].map(v=>h('th',{},v)))),tableBody));
  const records = new Set();
  function angles() {return [577,579].map(w=>Math.asin(Number(order.value)*w/2000)*180/Math.PI);}
  function redraw() {
    drawLines(+order.value);
    const values=angles();
    document.querySelector('#caption').textContent='黄一 '+values[0].toFixed(3)+'°　黄二 '+values[1].toFixed(3)+'°。相近谱线在此比例下可能重合。';
  }
  order.onchange=redraw;
  record.onclick=()=>{
    if(records.has(order.value)){ui.status('这一级已有记录，请切换另一级比较。');return;}
    records.add(order.value);
    const [left,right]=angles();
    tableBody.append(h('tr',{},[order.value,left.toFixed(3)+'°',right.toFixed(3)+'°',(right-left).toFixed(3)+'°'].map(v=>h('td',{},v))));
    if(records.size===2){ui.status('比较表格最后一列，再与自己的预测核对。');ui.unlock();}
    else ui.status('已记录。改变级次，保持波长和光栅常数相同。');
  };
  redraw();ui.status('固定 d = 2000 nm，观察黄双线，分别测量两个级次。');
}
function unknown(ui) {
  const positions=[[354.15,25.85],[174.16,205.84]];
  const side=h('select',{},h('option',{value:0},'左侧谱线'),h('option',{value:1},'右侧谱线'));
  const save=h('button',{},'记录当前角位置'), answer=h('input',{type:'number',min:1,step:'any',placeholder:'波长 / nm'});
  const check=h('button',{},'核对我的计算'), body=h('tbody'), recorded=new Set();
  ui.controls.append(label('望远镜位置',side),save,label('计算未知波长（nm）',answer),check);
  ui.data.append(h('table',{},h('thead',{},h('tr',{},['侧别','游标 I','游标 II'].map(t=>h('th',{},t)))),body));
  function read() {
    const i=+side.value;
    pen.fillStyle='#142f2b';pen.fillRect(0,0,660,300);pen.fillStyle='#d3e3cf';
    pen.font='22px sans-serif';pen.fillText('模拟分光计 · '+(i?'右侧':'左侧'),28,54);
    positions.forEach((v,j)=>{pen.font='17px sans-serif';pen.fillText(j?'游标 II':'游标 I',36+325*j,119);pen.font='42px monospace';pen.fillText(v[i].toFixed(2)+'°',36+325*j,182);});
    document.querySelector('#caption').textContent='角位置以十进制度显示。仪器零级靠近 10°，游标 II 与游标 I 相隔约 180°。';
  }
  side.onchange=read;
  save.onclick=()=>{
    const i=+side.value;
    if(recorded.has(i)){ui.status('这一侧已有记录。');return;}
    recorded.add(i);body.append(h('tr',{},[i?'右':'左',...positions.map(p=>p[i].toFixed(2)+'°')].map(v=>h('td',{},v))));
    ui.status(recorded.size===2?'先分别求两个游标的半夹角，再取平均并反算波长。':'转向另一侧，记录同一级谱线。');
  };
  check.onclick=()=>{
    if(recorded.size<2){ui.status('还需要左右两侧的记录。');return;}
    const expected=2000*Math.sin(15.845*Math.PI/180);
    if(!answer.value||Math.abs(+answer.value-expected)>1){ui.status('请检查跨零读数、半夹角及计算器角度单位。允许误差为 1 nm。');return;}
    ui.status('计算与模拟读数相符。掀开结论检查计算过程。');ui.unlock();
  };
  read();ui.status('光栅常数 2000 nm，正入射，取一级。读取两侧并计算 λ。');
}
function openLeaf(){
  if(active)panel.close();
  active=location.hash==='#unknown'?'unknown':'dispersion';
  const first=active==='dispersion';
  document.querySelector('#reading').textContent=first?'汞灯给出波长相近的两条黄线。切换级次，观察谱线，记录它们之间的角距离。':'将同一条谱线分别移到望远镜视场中心。两侧刻度可能跨越 0°，请用双游标记录还原衍射角。';
  document.querySelector('#turn').replaceChildren(h('a',{href:first?'#unknown':'#dispersion'},first?'翻到下一张活页 →':'← 翻回色散活页'));
  document.querySelectorAll('nav a').forEach(a=>{if(a.hash==='#'+active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  const ui=panel.open({...definitions[active],id:'grating-university-'+active},{pageLabel:first?'第 1 张':'第 2 张',onClose:()=>{location.href='../index.html';}});
  (first?dispersion:unknown)(ui);
  panel.flapFront.tabIndex=0;
  panel.flapFront.setAttribute('role','button');
  panel.flapFront.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();panel.flapFront.click();}};
}
window.addEventListener('hashchange',openLeaf);
window.addEventListener('pagehide',()=>panel._save());
openLeaf();
