"use strict";
const lines=[['蓝',435.8],['绿',546.1],['黄一',577],['黄二',579]];
const rows=[[0,'中央像',0],...[1,2].flatMap(k=>lines.map(([name,w])=>[k,name,w]))];
const radians=Math.PI/180;

function parseAngle(value){
  const text=String(value??'').trim();
  if(!/^\d+(?:\.\d+)?(?:\s+\d+(?:\.\d+)?)?$/.test(text))return NaN;
  const [deg,min=0]=text.split(/\s+/).map(Number);
  if((text.includes(' ')&&!Number.isInteger(deg))||min>=60||deg+min/60>=360)return NaN;
  return deg+min/60;
}
function half(a,b){const gap=Math.abs(a-b);return Math.min(gap,360-gap)/2}
function measuredLine(record,i){
  const [k,,w]=rows[i],v=record.raw[i].map(parseAngle);
  if(!k||v.some(Number.isNaN))return null;
  const phiI=half(v[0],v[2]),phiII=half(v[1],v[3]);
  const phi=(phiI+phiII)/2;
  return phi>0?{k,w,phiI,phiII,phi,d:k*w/Math.sin(phi*radians)}:null;
}
function gratingSummary(record){
  const points=rows.map((_,i)=>measuredLine(record,i)).filter(Boolean);
  if(!points.length)return [];
  const mean=points.reduce((sum,p)=>sum+p.d,0)/points.length;
  const summary=['平均光栅常数 d̄ = '+mean.toFixed(1)+' nm（'+points.length+' 行有效测量）'];
  for(const k of [1,2]){
    const yellow=points.filter(p=>p.k===k&&p.w>=577);
    if(yellow.length!==2)continue;
    const empirical=(yellow[1].phi-yellow[0].phi)*radians/(yellow[1].w-yellow[0].w);
    const angle=(yellow[0].phi+yellow[1].phi)*radians/2;
    const theory=k/(mean*Math.cos(angle));
    summary.push(k+' 级黄双线：ψ实 = '+empirical.toExponential(4)+' rad/nm；ψ理 = '+theory.toExponential(4)+' rad/nm。');
  }
  const width=Number(record.width);
  if(Number.isFinite(width)&&width>0){
    const n=width*1e6/mean;
    summary.push('受照宽度 L = '+width+' mm，N ≈ '+n.toFixed(0)+'；一级 R ≈ '+n.toFixed(0)+'，二级 R ≈ '+(2*n).toFixed(0)+'。');
    summary.push('黄双线所需 R ≈ 578/2 = 289。按理想光栅估算，一级'+(n>=289?'达到':'未达到')+'该值；结合实测线宽判断实际可辨程度。');
  }else summary.push('填写有效受照宽度 L 后可计算 N 与 R。');
  return summary;
}

function drawDispersion(target,points){
  if(!points.length){target.textContent="取得有效谱线读数后显示色散曲线。";return}
  const max=Math.max(5,Math.ceil(Math.max(...points.map(p=>p.phi))/5)*5);
  const x=w=>65+(w-430)*3.4,y=a=>220-a*185/max;
  let svg='<svg viewBox="0 0 660 275" role="img" aria-label="一级和二级的波长衍射角曲线"><path d="M60 25V220H620" fill="none" stroke="#485b53"/><text x="8" y="20">φ / °</text><text x="500" y="267">波长 λ / nm</text>';
  for(let j=0;j<=4;j++){const a=max*j/4;svg+='<text x="10" y="'+(y(a)+5)+'">'+a+'</text>'}
  for(const w of [440,480,520,560,580])svg+='<text x="'+(x(w)-12)+'" y="244">'+w+'</text>';

  for(const k of [1,2]){
    const line=points.filter(p=>p.k===k),c=k===1?'#19715b':'#965619';
    svg+='<polyline fill="none" stroke="'+c+'" points="'+line.map(p=>x(p.w)+','+y(p.phi)).join(' ')+'"/>';
    for(const p of line)svg+='<circle cx="'+x(p.w)+'" cy="'+y(p.phi)+'" r="4" fill="'+c+'"/>';

  }
  target.innerHTML=svg+'</svg><p>绿色为一级，棕色为二级。点为输入数据，连线仅供观察趋势。</p>';
}
