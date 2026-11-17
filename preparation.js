"use strict";
const prepChecks = [
  ["要画出教材中的色散曲线，同一级次要记录哪一对物理量？",["已知波长与对应衍射角","狭缝宽度与谱线亮度"],0,"对每条已知汞谱线测衍射角，以 λ 为横轴、φ 为纵轴。"],
  ["估算受照刻线数时，刻度尺应沿哪个方向量宽度？",["沿刻线长度方向","垂直于刻线、沿光栅周期方向"],1,"宽度 L 应横跨刻线，用与刻线间距相同的长度单位求 N ≈ L/d。"],
  ["刻线密度从 500 条/mm 增到 1000 条/mm，光栅常数怎样变化？",["由 2 μm 增至 4 μm","由 2 μm 减至 1 μm"],1,"每毫米内周期数加倍，每个周期的长度就减半。"],
  ["固定 d、λ 和级次，只把受照刻线数加倍。理想情况下会怎样？",["角色散率加倍","分辨本领加倍，两条谱线中心的角距不变"],1,"R = |k|N 随 N 增大。相同波长的主峰角位置仍由光栅方程确定。"]
];
const prepTabs=[...document.querySelectorAll("[data-unit]")];
const prepPanels=[...document.querySelectorAll("[data-panel]")];
let prepIndex=0;
function showPrep(index,scroll=false){
  prepIndex=index;
  if(index!==4)stop();
  prepPanels.forEach((panel,i)=>{panel.hidden=i!==index});
  prepTabs.forEach((tab,i)=>{if(i===index)tab.setAttribute("aria-current","step");else tab.removeAttribute("aria-current")});
  by("previousUnit").disabled=index===0;
  by("nextUnit").textContent=index===4?"进入实测记录 →":"下一节 · "+prepTabs[index+1].textContent;
  by("unitPosition").textContent=(index+1)+" / "+prepTabs.length;
  by("conceptCheck").hidden=index>=prepChecks.length;
  if(index<prepChecks.length){
    const [prompt,choices,correct,reason]=prepChecks[index];
    by("conceptPrompt").textContent=prompt;
    const attempts=draft.prepChecks?.[index]||[];
    const feedback=by("conceptFeedback");
    feedback.textContent=attempts.length?"上次作答："+attempts.at(-1).value+"。"+reason:"";
    by("conceptChoices").replaceChildren();
    choices.forEach((value,j)=>{
      const button=document.createElement("button");
      button.textContent=value;
      button.onclick=()=>{
        draft.prepChecks??={};
        (draft.prepChecks[index]??=[]).push({value,ok:j===correct});
        save();
        feedback.textContent=(j===correct?"正确。":"再想一想。")+reason;
      };
      by("conceptChoices").append(button);
    });
  }
  if(scroll)document.querySelector(".prep-nav").scrollIntoView({block:"start"});
}
prepTabs.forEach((button,i)=>{button.onclick=()=>showPrep(i)});
by("previousUnit").onclick=()=>showPrep(Math.max(0,prepIndex-1),true);
by("nextUnit").onclick=()=>{if(prepIndex===4)location.href="measurement.html";else showPrep(prepIndex+1,true)};
showPrep(new URLSearchParams(location.search).get("unit")==="instruments"?1:0);

