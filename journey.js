"use strict";
const stageNames=["实验目的","实验仪器","实验步骤与注意事项","实验原理","仿真与自测","实测记录（表4-1）","导出实验报告"];
const finalCriteria=[
 [thoughtPrompts[0],"入口狭缝过宽时谱线较亮但展宽重叠，过窄时通光量下降，谱线较暗。",["宽|重叠","亮|通光","暗|弱"]],
 [thoughtPrompts[1],"光栅依靠衍射干涉，具有多个级次，长波长偏角大；普通玻璃棱镜依靠折射色散，短波长偏角大。",["衍射|干涉","级次|多级","折射","长波","短波"]],
 [thoughtPrompts[2],"同级同色左右测角，角差取半得衍射角，按 λ = d sin φ / k 求波长。",["左右|两侧","取半|一半|除以二|除以2","dsin|光栅方程"]]
];
draft.responses??={};draft.grades??={};
let stage=0,revision=0;
const nav=by("journey"), advance=by("advance"),form=by("entryForm");
const topButtons=stageNames.map((name,i)=>{const b=action((i+1)+" "+name,()=>location.hash="step-"+(i+1));nav.append(b);return b});
const completed=i=>draft.grades[i]?.score>=90;
function unlocked(){const first=stageNames.findIndex((_,i)=>!completed(i));return first<0?6:first}
function refresh(){
 const limit=unlocked();topButtons.forEach((b,i)=>{b.disabled=i>limit;b.setAttribute("aria-current",i===stage?"step":"false");b.classList.toggle("passed",completed(i))});
 by("continue").hidden=stage===6;by("continue").disabled=!completed(stage);
 by("verdict").textContent=draft.grades[stage]?gradeLabel(draft.grades[stage]):"填写后提交校验，达到 90% 可通过。";
 by("reportActions").hidden=!completed(6);
}
function gradeLabel(g){return g.method+"　"+g.score+"%　"+(g.score>=90?"通过。":"请修改后重试。")+g.feedback}
function dirty(i){
 revision++;delete draft.grades[i];delete draft.grades[6];save();
 document.querySelector(".paper")?.remove();refresh();
}
function written(){
 form.replaceChildren();
 const entries=rubrics[stage];if(!entries)return;
 const card=el("article");card.className="card";card.append(el("h2",stageNames[stage]),el("p","按条用自己的话填写，首次提交后可展开参考答案。"));
 const answers=draft.responses[stage]??=entries.map(()=>"");
 entries.forEach(([prompt],i)=>{const label=el("label",prompt),area=el("textarea");area.value=answers[i]||"";area.rows=2;area.oninput=()=>{answers[i]=area.value;dirty(stage)};label.append(area);card.append(label)});
 const ref=el("details");ref.id="references";ref.hidden=!draft.seen?.[stage];ref.append(el("summary","查看标准答案"));entries.forEach(([q,a])=>ref.append(el("p",q+"　"+a)));card.append(ref);form.append(card);
 const reviewIndices=[[0],[1],[],[2,3],[],[]][stage];
 for(const i of reviewIndices){
   const [question,options,correct,reason]=prepChecks[i],practice=el("details");practice.className="card";practice.append(el("summary","随堂练习 · "+question));
   const result=el("p",draft.prepChecks?.[i]?.at(-1)?.value||"");options.forEach((option,j)=>practice.append(action(option,()=>{draft.prepChecks??={};(draft.prepChecks[i]??=[]).push({value:option,ok:j===correct});save();result.textContent=(j===correct?"正确。":"再想想。")+reason})));practice.append(result);form.append(practice);
 }
}
const submitted=by("submit"),outputs=el("div");outputs.id="reportActions";submitted.before(outputs);outputs.append(action("打印 / 导出 PDF",async()=>{const p=previewReport();if(!p)return;await Promise.all([...p.querySelectorAll("img")].map(im=>im.decode().catch(()=>{})));document.body.classList.add("print-report");window.print()}),submitted);
window.addEventListener("afterprint",()=>document.body.classList.remove("print-report"));
by("report").addEventListener("input",()=>dirty(6));
by("measure").addEventListener("input",e=>{if(e.target.id!=="mode"&&by("mode").value==="real")dirty(5)});
const studentPage=()=>location.hash!=="#teacher"&&location.hash!=="#shelf"&&!!location.hash;
function route(){
 revision++;stop();
 const shelf=!location.hash||location.hash==="#shelf",teacher=location.hash==="#teacher",active=studentPage()&&!!profile;
 by("shelf").hidden=!(shelf||(!profile&&!teacher));by("teacher").hidden=!teacher;
 document.querySelector(".mast").hidden=!active;nav.hidden=advance.hidden=!active;
 by("logout").hidden=!profile;by("learn").hidden=by("measure").hidden=by("report").hidden=true;
 if(!active){if(studentPage()&&!by("login").open)by("login").showModal();return}
 const hash=location.hash.slice(1),requested=/^step-[1-7]$/.test(hash)?Number(hash.slice(5))-1:({learn:0,report:6,sim:4,quiz:4,data:5,review:6})[hash]??0;
 stage=Math.min(requested,unlocked());history.replaceState(null,"","#step-"+(stage+1));
 by("who").textContent=profile.student+" · "+profile.number;
 by("learn").hidden=stage===6;by("measure").hidden=stage!==5;by("report").hidden=stage!==6;
 const visiblePanels=[[0],[1],[],[2,3],[4],[],[]][stage];prepPanels.forEach((panel,i)=>panel.hidden=!visiblePanels.includes(i));
 by("materials").hidden=stage>3;written();
 if(stage===5)by("measure").after(form);else by("learn").prepend(form);
 by("evaluate").textContent=stage===6?"校验并生成报告":"提交校验";form.hidden=stage===6;refresh();if(stage===6&&completed(6))previewReport();
 window.scrollTo(0,0);
}
by("continue").onclick=()=>{if(completed(stage)&&stage<6)location.hash="step-"+(stage+2)};
by("evaluate").onclick=async()=>{
 const btn=by("evaluate"),idx=stage,token=revision;
 try{
  const answers=stage===6?thoughtPrompts.map((_,i)=>draft.reflections?.[i]||""):draft.responses[stage]||[];
  if(!answers.length||answers.some(a=>!a.trim()))throw Error(stage===5?"请填写表格下方的「测量与处理说明」，并提交校验。":"请先逐条填写全部答案。");
  if(stage===4&&!draft.attempts.every(a=>a.at(-1)?.ok))throw Error("请在三个演示中分别完成自测并答对。");
  if(stage===5){
    const problems=validateMeasurement();
    if(problems.length)throw Error(problems.join("\n"));
  }
  if(stage===6&&!draft.analysis.trim())throw Error("请填写分析与讨论。");
  btn.disabled=true;by("verdict").textContent="正在校验…";
  const grade=await gradeWriting(stage===6?finalCriteria:rubrics[stage],answers);
  if(token!==revision||idx!==stage)return;
  if(grade.score<90)delete draft.grades[6];document.querySelector(".paper")?.remove();draft.grades[stage]=grade;(draft.seen??={})[stage]=true;save();
  if(by("references"))by("references").hidden=false;refresh();
  if(stage===6&&completed(6))previewReport();
 }catch(e){if(token===revision)by("verdict").textContent=e.message}finally{btn.disabled=false}
};
const login=by("login");login.querySelector("form").onsubmit=e=>{
 e.preventDefault();const f=e.target.elements,name=f.student.value.trim(),id=f.number.value.trim();
 if(!name||!id||f.password.value!==courseConfig.password){login.querySelector("p").textContent="请检查姓名、学号与课堂密码。";return}
 sessionStorage.setItem("grating-login",JSON.stringify({student:name,number:id}));
 const legacy=JSON.parse(localStorage.getItem("optics-class-draft-v1")||"null");
 if(legacy?.identity?.number===id&&!localStorage.getItem("optics-class-draft-v1:"+id)){localStorage.setItem("optics-class-draft-v1:"+id,JSON.stringify(legacy));const raw=localStorage.getItem("grating-measure-v1-real");if(raw)localStorage.setItem("grating-measure-v1-real:"+id,raw)}
 location.reload();
};
by("cancelLogin").onclick=()=>login.close();login.onclose=()=>{if(!profile)location.hash="shelf"};
by("logout").onclick=()=>{sessionStorage.removeItem("grating-login");history.replaceState(null,"","#shelf");location.reload()};
const toolsBox=el("div");toolsBox.id="dialTools";toolsBox.className="controls";const dialRange=el("input");dialRange.type="range";dialRange.min=0;dialRange.max=359.983333;dialRange.step=1/60;dialRange.setAttribute("aria-label","旋转圆盘（度）");
function rotate(angle){stop();manualAngle=(angle+360)%360;draw()}
dialRange.oninput=()=>rotate(+dialRange.value);toolsBox.append(el("span","转动度盘"),dialRange,action("−1′",()=>rotate(+dialRange.value-1/60)),action("+1′",()=>rotate(+dialRange.value+1/60)),...["读游标Ⅰ","读游标Ⅱ"].map((s,i)=>action(s,()=>{selectedVernier=i;draw()})));by("scene").after(toolsBox);toolsBox.hidden=true;
const dialCanvas=by("scene");
function pointerAngle(event){
 const box=dialCanvas.getBoundingClientRect();
 const x=(event.clientX-box.left)*dialCanvas.width/box.width-465;
 const y=(event.clientY-box.top)*dialCanvas.height/box.height-165;
 return {distance:Math.hypot(x,y),angle:Math.atan2(x,-y)*180/Math.PI-selectedVernier*180};
}
dialCanvas.addEventListener("pointerdown",event=>{
 if(lesson!==1||pointerAngle(event).distance>140)return;
 dialCanvas.setPointerCapture(event.pointerId);rotate(pointerAngle(event).angle);
});
dialCanvas.addEventListener("pointermove",event=>{
 if(lesson===1&&dialCanvas.hasPointerCapture(event.pointerId))rotate(pointerAngle(event).angle);
});
by("lessons").addEventListener("click",()=>{toolsBox.hidden=lesson!==1;dialCanvas.style.touchAction=lesson===1?"none":"auto"});
by("answers").addEventListener("click",()=>{if(stage===4)dirty(4)});
const settings=el("details");settings.className="card";settings.append(el("summary","校验服务设置"));
for(const [key,title] of [["endpoint","模型接口完整地址（HTTPS）"],["model","模型名称"],["apiKey","临时 API 密钥"]]){const l=el("label",title),input=el("input");input.type=key==="apiKey"?"password":"text";input.value=courseConfig[key];input.onchange=()=>{courseConfig[key]=input.value.trim();revision++};l.append(input);settings.append(l)}
settings.append(el("p","支持兼容 Chat Completions 的接口。本页仅发送本环节答案和评分标准。未配置服务时采用本地要点校验；临时设置刷新后清除。"));advance.append(settings);
window.addEventListener("hashchange",route);window.addEventListener("pageshow",route);route();

