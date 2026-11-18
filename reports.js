"use strict";
const readMeasurements=()=>JSON.parse(localStorage.getItem("grating-measure-v1-real")||"null");
function writeText(parent,tag,text){const n=document.createElement(tag);n.textContent=text;parent.append(n);return n}
function route(){
 const shelf=!location.hash||location.hash==="#shelf"; by("shelf").hidden=!shelf; document.querySelector(".mast").hidden=shelf; const routeId=shelf?"shelf":["report","teacher"].includes(location.hash.slice(1))?location.hash.slice(1):"learn";
 for(const id of ["learn","report","teacher"])by(id).hidden=id!==routeId;
 for(const a of document.querySelectorAll("nav a")){if(a.getAttribute("href")==="#"+routeId)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")}
 if(routeId!=="learn")stop();
 const m=readMeasurements(),n=m?.raw.slice(1).filter(row=>row.every(v=>String(v).trim())).length||0;
 by("measureStatus").textContent="当前实测记录："+n+" / 8 行已填满。报告仅收录实测区的数据。";
}
window.addEventListener("hashchange",route);window.addEventListener("pageshow",route);route();
for(const id of ["student","analysis"]){by(id).value=draft[id];by(id).oninput=()=>{draft[id]=by(id).value;save()}}
function displayPhoto(id,url){const img=by(id+"View");img.hidden=!url;if(url)img.src=url;else img.removeAttribute("src")}
for(const id of ["figure","material"]){
 displayPhoto(id,draft[id]);by(id).onchange=async()=>{try{const f=by(id).files[0];if(!f)return;
 if(!["image/jpeg","image/png","image/webp"].includes(f.type)||f.size>15e6)throw Error("请选择小于 15 MB 的 JPG、PNG 或 WebP 图片。");
 const bmp=await createImageBitmap(f),ratio=Math.min(1,1200/Math.max(bmp.width,bmp.height)),c=document.createElement("canvas");
 c.width=Math.max(1,Math.round(bmp.width*ratio));c.height=Math.max(1,Math.round(bmp.height*ratio));const g=c.getContext("2d");g.fillStyle="white";g.fillRect(0,0,c.width,c.height);g.drawImage(bmp,0,0,c.width,c.height);bmp.close();
 draft[id]=c.toDataURL("image/jpeg",.76);displayPhoto(id,draft[id]);save();
 }catch(e){alert(e.message)}};
}
function download(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
const thoughtPrompts=[
  "入口狭缝太宽和太窄时，谱线的亮度、线宽与可辨程度各有什么变化？",
  "比较光栅光谱与棱镜光谱。可从分光原因、谱线排列方向和级次说明。",
  "已知光栅常数 d，怎样测出未知光源的波长？写出所需读数、级次与计算式。"
];
thoughtPrompts.forEach((prompt,i)=>{
  const label=document.createElement("label");
  label.textContent=(i+1)+"　"+prompt;
  const input=document.createElement("textarea");
  input.value=draft.reflections?.[i]||"";
  input.oninput=()=>{draft.reflections??={};draft.reflections[i]=input.value;save()};
  label.append(input);by("thinking").append(label);
});
function currentReport(){
 const m=readMeasurements();if(!draft.student.trim()||!draft.analysis.trim())throw Error("请填写姓名或课堂代号，以及实验分析。");
 if(!m||!rows.some((_,i)=>measuredLine(m,i)))throw Error("请先在表 4-1 的课堂实测区填写至少一条谱线的四个有效读数；请复核角度格式和左右位置。");
 return {format:"grating-report-1",id:draft.id,version:draft.version+1,student:draft.student.trim(),identity:draft.identity||{},sketch:draft.sketch||"",discussion:draft.analysis,figure:draft.figure,attempts:draft.attempts,prepChecks:draft.prepChecks||{},measurement:m,reflections:draft.reflections||{},submitted:new Date().toISOString()};
}
by("submit").onclick=()=>{try{const report=currentReport();download(report,report.student+"-光栅报告-v"+report.version+".json");draft.version=report.version;save();by("submitStatus").textContent="已生成第 "+report.version+" 版作业，请通过课程约定渠道发给教师。"}catch(e){by("submitStatus").textContent=e.message}};
function validReport(r){return r?.format==="grating-report-1"&&typeof r.id==="string"&&Number.isInteger(r.version)&&r.version>0&&typeof r.student==="string"&&typeof r.discussion==="string"&&r.measurement?.raw?.length===9&&r.measurement.raw.every(row=>Array.isArray(row)&&row.length===4&&row.every(v=>typeof v==="string"))&&Array.isArray(r.attempts)&&r.attempts.length===3&&r.attempts.every(a=>Array.isArray(a)&&a.every(x=>typeof x?.value==="string"&&typeof x.ok==="boolean"))&&(!r.figure||/^data:image\/jpeg;base64,[\w+/=]+$/.test(r.figure))}
async function loadFile(input){const f=input.files[0];if(!f||f.size>6e6)throw Error("请选择小于 6 MB 的课堂作业文件。");try{return JSON.parse(await f.text())}catch{throw Error("文件格式无法识别，请选择本平台导出的 JSON 文件。")}}
let incoming=null;
by("incoming").onchange=async e=>{incoming=null;by("grading").hidden=true;try{
 const r=await loadFile(e.target);if(!validReport(r))throw Error("请选择学生导出的光栅报告。");incoming=r;by("grading").hidden=false;by("teacherMessage").textContent="已打开报告，第 "+r.version+" 版。";by("studentName").textContent=r.student;
 const panel=by("evidence");panel.replaceChildren(); renderIdentity(panel,r); renderSketch(panel,r.sketch);prepChecks.forEach(([prompt],i)=>{const a=r.prepChecks?.[i];if(Array.isArray(a)&&a.length)writeText(panel,"p",prompt+"　首次："+String(a[0]?.value||"")+"；末次"+(a.at(-1)?.ok?"正确":"需复习"))});r.attempts.forEach((a,i)=>writeText(panel,"p",lessons[i].title+"　"+(a.length?"首次："+a[0].value+"；共 "+a.length+" 次，末次"+(a.at(-1).ok?"正确":"需复习"):"尚无作答")));
 writeText(panel,"h3","表 4-1 · 原始读数");writeText(panel,"p","仪器："+(r.measurement.instrument||"未填写")+"　光栅："+(r.measurement.grating||"未填写"));
 const wrap=document.createElement("div");wrap.className="scroll";panel.append(wrap);const table=document.createElement("table");wrap.append(table);const head=table.insertRow();["谱线","左Ⅰ","左Ⅱ","右Ⅰ","右Ⅱ","φⅠ / °","φⅡ / °","平均 φ / °","dᵢ / nm"].forEach(s=>writeText(head,"th",s));
 r.measurement.raw.forEach((row,i)=>{const tr=table.insertRow();writeText(tr,"th",i?Math.ceil(i/4)+" 级 · "+["蓝","绿","黄一","黄二"][(i-1)%4]:"零级");row.forEach(v=>writeText(tr,"td",v||"—"));const p=measuredLine(r.measurement,i);[p?.phiI,p?.phiII,p?.phi,p?.d].forEach((v,j)=>writeText(tr,"td",v==null?"—":v.toFixed(j===3?1:3)))});
 writeText(panel,"h3","数据处理与观察");const chart=document.createElement("div");panel.append(chart);drawDispersion(chart,rows.map((_,i)=>measuredLine(r.measurement,i)).filter(Boolean));gratingSummary(r.measurement).forEach(s=>writeText(panel,"p",s));if(r.measurement.procedurePlan){writeText(panel,"strong","测量方案与注意事项");writeText(panel,"p",r.measurement.procedurePlan)}writeText(panel,"p",r.measurement.work||"");writeText(panel,"p",r.measurement.note||"");writeText(panel,"h3","教材思考题");thoughtPrompts.forEach((prompt,i)=>{writeText(panel,"strong",prompt);writeText(panel,"p",r.reflections?.[i]||"未作答")});writeText(panel,"h3","分析与讨论");writeText(panel,"p",r.discussion);
 if(r.figure){const img=document.createElement("img");img.src=r.figure;img.alt="学生光路图或推导";panel.append(img)}
 by("score").value=by("comment").value="";
 }catch(err){by("teacherMessage").textContent=err.message}};
by("grade").onclick=()=>{if(!incoming)return;const score=by("score"),comment=by("comment").value.trim();if(!score.value||!score.checkValidity()||!comment){by("teacherMessage").textContent="请填写 0–100 分的成绩以及批注。";return}
 const review={format:"grating-review-1",id:incoming.id,version:incoming.version,student:incoming.student,score:+score.value,comment,target:by("target").value,decision:by("decision").value};
 download(review,incoming.student+"-教师批改-v"+incoming.version+".json");by("teacherMessage").textContent="批改文件已生成，可以发回学生。"};
function showReview(r){by("returned").textContent="第 "+r.version+" 版 · "+r.decision+" · "+r.score+" 分　"+r.target+"："+r.comment}
if(draft.review)showReview(draft.review);
by("receive").onchange=async e=>{try{const r=await loadFile(e.target);if(r.format!=="grating-review-1"||r.id!==draft.id||typeof r.comment!=="string"||!Number.isInteger(r.version)||r.version>draft.version)throw Error("该文件与当前浏览器中的作业不匹配。请在生成作业的浏览器中打开对应批改文件。");draft.review=r;save();showReview(r)}catch(err){by("returned").textContent=err.message}};

by("materialText").value=draft.materialText||"";
by("materialText").oninput=()=>{draft.materialText=by("materialText").value;save()};
by("exportLesson").onclick=()=>{if(!draft.material){by("packStatus").textContent="请先添加一张教学图。";return}
 download({format:"grating-lesson-1",image:draft.material,text:draft.materialText||""},"光栅实验-补充教学图.json");by("packStatus").textContent="教学包已导出，可发给学生在此打开。"};
by("importLesson").onchange=async e=>{try{const pack=await loadFile(e.target);
 if(pack.format!=="grating-lesson-1"||typeof pack.text!=="string"||!/^data:image\/jpeg;base64,[\w+/=]+$/.test(pack.image))throw Error("请选择教师导出的图文教学包。");
 draft.material=pack.image;draft.materialText=pack.text;by("materialText").value=pack.text;displayPhoto("material",pack.image);save();by("packStatus").textContent="已载入老师的教学图片和观察任务。";
 }catch(err){by("packStatus").textContent=err.message}};
if(["#sim","#data","#review","#quiz"].includes(location.hash))location.replace("explore.html"+location.hash);






