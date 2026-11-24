"use strict";
const prepPanels=[...document.querySelectorAll("[data-panel]")];
const el = (tag, text) => Object.assign(document.createElement(tag), {textContent:text || ""});
const action = (text, fn) => {const button=el("button",text);button.onclick=fn;return button};
for(let i=1;i<=9;i++){
  const li=el("li","实验"+["一","二","三","四","五","六","七","八","九"][i-1]);
  const item=el(i===4?"a":"span",i===4?"衍射光栅及其特性 →":"未开放");
  if(i===4)item.href="#learn";li.append(item);by("catalog").append(li);
}
const spectrum=document.querySelector(".spectrum");
spectrum.querySelectorAll("i").forEach((line,i)=>line.style.setProperty("--pos",[9,70,87,89][i]));
spectrum.append(action("暂停演示",e=>{const paused=spectrum.classList.toggle("paused");e.target.textContent=paused?"继续演示":"暂停演示"}));
const instruments=document.querySelector(".instruments");
const figures=document.querySelectorAll(".apparatus-gallery figure");
instruments.querySelectorAll("dt").forEach((term,i)=>{
  const details=el("details");details.append(el("summary",term.textContent),el("p",term.nextElementSibling.textContent));
  figures[i].before(details);details.append(figures[i]);
});
instruments.remove();
for(const i of [2,3]){
  const headings=[...prepPanels[i].querySelectorAll(":scope > h3")];
  for(const h of headings){
    const details=el("details");details.className="principle-step";details.append(el("summary",h.textContent));h.before(details);
    while(h.nextElementSibling&&h.nextElementSibling.tagName!=="H3")details.append(h.nextElementSibling);
    h.remove();
  }
}

const drawing=el("section");drawing.className="card";drawing.append(el("h3","画出正入射光路"),el("p","标出光栅、法线、零级与一级出射方向。可用鼠标、触控笔或手指绘制。"));
const pad=el("canvas");pad.width=880;pad.height=300;pad.className="sketch-pad";pad.setAttribute("aria-label","光路图绘图区");drawing.append(pad);prepPanels[2].append(drawing);
const ink=pad.getContext("2d");let pointer=null,undo=[];
function repaint(image){ink.fillStyle="white";ink.fillRect(0,0,pad.width,pad.height);if(image){const im=new Image();im.onload=()=>ink.drawImage(im,0,0,pad.width,pad.height);im.src=image}}
repaint(draft.sketch);
function position(e){const box=pad.getBoundingClientRect();return [(e.clientX-box.left)*pad.width/box.width,(e.clientY-box.top)*pad.height/box.height]}
pad.onpointerdown=e=>{if(pointer!==null)return;pointer=e.pointerId;pad.setPointerCapture(pointer);undo.push(ink.getImageData(0,0,pad.width,pad.height));if(undo.length>10)undo.shift();ink.lineWidth=3;ink.lineCap="round";ink.strokeStyle="#145845";ink.beginPath();ink.moveTo(...position(e))};
pad.onpointermove=e=>{if(e.pointerId===pointer){ink.lineTo(...position(e));ink.stroke()}};
pad.onpointerup=pad.onpointercancel=e=>{if(e.pointerId===pointer){pointer=null;draft.sketch=pad.toDataURL("image/png");save()}};
drawing.append(action("撤销一笔",()=>{if(undo.length){ink.putImageData(undo.pop(),0,0);draft.sketch=pad.toDataURL("image/png");save()}}));
function renderIdentity(parent,r){writeText(parent,"p","姓名　"+r.student+"　　 学号　"+(r.identity?.number||"—"))}
function renderSketch(parent,data){if(typeof data==="string"&&/^data:image\/(png|jpeg);base64,[\w+/=]+$/.test(data)){const img=el("img");img.src=data;img.alt="学生绘图";parent.append(img)}}
function previewReport(){let report;
 try{report=currentReport()}catch(e){alert(e.message);return}
 document.querySelector(".paper")?.remove();const paper=el("article");paper.className="paper";document.body.append(paper);
 paper.append(el("h1","大学物理实验报告"),el("h2","实验四　衍射光栅及其特性"));renderIdentity(paper,draft);
 paper.append(el("p","专业　"+report.measurement.major+"　　 实验日期　"+report.measurement.labDate));
 for(const i of [0,1,3,2]){paper.append(el("h2",stageNames[i]));draft.responses[i].forEach(t=>paper.append(el("p",t)))}
 paper.append(el("h2","仿真与自测"));
 lessons.forEach((l,i)=>paper.append(el("p",l.title+"　"+(draft.attempts[i]?.at(-1)?.value??"尚未作答"))));
 paper.append(el("p",draft.responses[4]?.[0]));renderSketch(paper,draft.sketch);
 const m=report.measurement;paper.append(el("h2","表 4-1　实测记录"),el("p","仪器 "+(m.instrument||"—")+"　光栅 "+(m.grating||"—")+"　有效受照宽度 "+m.width+" mm"));const table=el("table");paper.append(table);
 const head=table.insertRow();["谱线","左Ⅰ / °","左Ⅱ / °","右Ⅰ / °","右Ⅱ / °","φⅠ / °","φⅡ / °","平均 φ / °","d / nm"].forEach(x=>head.append(el("th",x)));
 m.raw.forEach((row,i)=>{const tr=table.insertRow(),p=measuredLine(m,i);[rows[i][0]+"级 "+rows[i][1]+(i?" "+rows[i][2]+" nm":""),...row,...[p?.phiI,p?.phiII,p?.phi,p?.d].map(x=>x?.toFixed(3))].forEach(x=>tr.append(el("td",x||"—")))});
 paper.append(el("h2","数据处理与分析"),el("p",draft.responses[5]?.[0]));const chart=el("div");paper.append(chart);drawDispersion(chart,rows.map((_,i)=>measuredLine(m,i)).filter(Boolean));gratingSummary(m).forEach(t=>paper.append(el("p",t)));
 [m.procedurePlan,m.work,m.note].filter(Boolean).forEach(t=>paper.append(el("p",t)));paper.append(el("h2","思考题"));thoughtPrompts.forEach((q,i)=>paper.append(el("strong",q),el("p",draft.reflections?.[i]||"尚未作答")));
 paper.append(el("h2","分析与讨论"),el("p",draft.analysis));renderSketch(paper,draft.figure)
 paper.append(el("p","教师签字 __________________　日期 ______________"));
 by("report").append(paper);return paper;
}
