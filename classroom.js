"use strict";
const by = id => document.getElementById(id);
const lessons = [
 {title:"从入射光到一级谱线",page:0,ref:"实验目的与光栅方程",steps:["汞灯经狭缝和平行光管形成平行光，垂直入射光栅。","沿入射光方向观察零级，各波长的主极大重合。","转动望远镜，在两侧寻找同一级次的蓝、绿、黄线。","正入射时 d sin φ = kλ。同一级内，长波长偏离零级更远。"],q:"在右侧一级光谱中，哪条谱线离零级最远？",choices:["蓝线 435.8 nm","绿线 546.1 nm","黄线 579.0 nm"],answer:2,hint:"固定光栅常数和级次，比较各波长对应的 sin φ。"},
 {title:"跟随分光计读双游标",page:3,ref:"表 4-1 · 左右角位置",steps:["选定同一级绿线，先转向左侧。图中为示例刻度。","左侧对准叉丝后读取两个游标，分别记入左Ⅰ、左Ⅱ。","再转到右侧同级绿线，读取右Ⅰ、右Ⅱ。","对应游标求左右角差的一半，再将两次衍射角平均。"],q:"根据动画的四个示例读数，这条绿线的衍射角是多少度？",answer:10,hint:"同一游标的左右读数相差 20°，零级在两侧谱线中间。"},
 {title:"调节狭缝观察黄双线",page:5,ref:"思考题 · 狭缝宽度",steps:["观察 577.0 nm 和 579.0 nm 两条黄线。画面为局部放大示意。","入口狭缝较窄时谱线较细，通光量较小。","逐渐加宽狭缝，谱线变亮，同时线像变宽。","两条线的中心位置保持不变，但宽线像开始重叠。"],q:"黄双线很亮却难以区分。保持级次和光栅不变，先怎样调节？",choices:["适当收窄入口狭缝","继续加宽入口狭缝"],answer:0,hint:"比较两条线中心之间的距离和每条线本身的宽度。"}
];
const draftKey="optics-class-draft-v1";
const draft=JSON.parse(localStorage.getItem(draftKey)||"null") || {id:crypto.randomUUID(),version:0,attempts:[[],[],[]],student:"",analysis:"",figure:"",material:""};
function save(){try{localStorage.setItem(draftKey,JSON.stringify(draft));return true}catch{alert("当前浏览器空间不足，草稿暂未保存。请导出作业文件。");return false}}
const canvas=by("scene"),ctx=canvas.getContext("2d");
let lesson=0,progress=0,timer=null;
function line(x,y,X,Y,color,width=2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(X,Y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function label(s,x,y,c="#b7cec6",size=19){ctx.fillStyle=c;ctx.font=size+"px system-ui";ctx.fillText(s,x,y)}
function draw(){
 ctx.clearRect(0,0,880,330);
 for(let x=0;x<880;x+=40)line(x,0,x,330,"#1b353b",1);
 for(let y=0;y<330;y+=40)line(0,y,880,y,"#1b353b",1);
 const t=progress/100;
 if(lesson===0){
  const ox=330,oy=166;
  line(50,oy,ox,oy,"#aababc",2);line(50,oy,50+280*Math.min(1,t*4),oy,"#ffffdf",5);
  for(let y=118;y<220;y+=6)line(ox-6,y,ox+6,y,"#b1c6bd",3);
  label("平行入射光",58,211);label("光栅",305,253);line(ox,oy,760,oy,"#adc2bf",2);label("零级",770,172);
  [435.8,546.1,579].forEach((w,i)=>{const color=["#779aff","#80e5a2","#ffdc79"][i],dy=430*Math.tan(Math.asin(w/2000));for(const dir of [-1,1]){const endY=oy+dir*dy;const f=Math.min(1,Math.max(.09,(t-.22)*1.65));line(ox,oy,ox+430*f,oy+dir*dy*f,color,2);if(i===1)label(dir<0?"左一级":"右一级",770,endY+6,color,16)}});
 }else if(lesson===1){
  const a=t<.5?-10:10,shift=Math.max(0,Math.min(1,(t-.4)*5));
  label("望远镜视野",62,54);ctx.save();ctx.beginPath();ctx.arc(165,165,83,0,Math.PI*2);ctx.fillStyle="#081b1c";ctx.fill();ctx.clip();line(165,80,165,250,"#919f96",1);line(80,165,250,165,"#919f96",1);
  const pos=165+(t<.4?55*Math.max(0,1-t*5):45*Math.sin(shift*Math.PI));line(pos,80,pos,250,"#69ee9b",5);ctx.restore();
  label("一级绿线 · 546.1 nm",68,284,"#9bf0b3",17);
  ["游标 Ⅰ","游标 Ⅱ"].forEach((name,i)=>{const base=30+i*180,reading=base-10+20*shift,y=106+i*108;label(name,305,y-22);for(let j=-8;j<=8;j++){const x=565+j*15-(reading-Math.round(reading))*15;line(x,y-12,x,y+(j%5===0?19:7),"#c4d2ca",2)}line(565,y+26,565,y+10,"#e5c27d",4);label(reading.toFixed(1)+"°",720,y+5,"#dbefbc",28)});
  label(a<0?"左侧谱线":"右侧谱线",490,287,"#e0cb98");
 }else{
  const width=3+37*t,amplitude=.38+.62*t;for(let x=90;x<790;x++){const strength=Math.exp(-((x-420)**2)/(2*width**2))+Math.exp(-((x-470)**2)/(2*width**2));ctx.fillStyle="rgba(255,218,89,"+Math.min(1,amplitude*strength)+")";ctx.fillRect(x,75,1,135)}
  label("577.0 nm",326,248,"#e9d28c");label("579.0 nm",472,248,"#e9d28c");label("入口狭缝　"+(t<.35?"窄":t<.7?"中等":"宽"),65,50);label("局部视野 · 定性示意",605,300);
 }
 const step=Math.min(3,Math.floor(progress/25));by("caption").textContent=lessons[lesson].steps[step];by("timeline").value=progress;
}
function stop(){clearInterval(timer);timer=null;by("play").textContent=progress>=100?"重播演示":"播放演示"}
function answer(value){
 const unit=lessons[lesson],ok=value===unit.answer;
 draft.attempts[lesson].push({value:unit.choices?unit.choices[value]:String(value),ok});save();
 by("feedback").textContent=ok?"判断正确。"+unit.steps[3]:"再观察一次。"+unit.hint;
}
function select(i){stop();lesson=i;progress=0;const u=lessons[i];
 by("number").textContent="0"+(i+1)+" / 03";by("title").textContent=u.title;by("pageName").textContent=u.ref;
 by("guide").textContent=["实验目标：用汞灯、光栅和分光计测出衍射角与波长的关系。先认清光从哪里来，又在哪里观察。","表 4-1 的左、右表示谱线位于零级的哪一侧；Ⅰ、Ⅱ是分光计上相隔约 180° 的两个游标。","教材思考：狭缝太宽与太窄时，各会出现什么现象？尝试兼顾谱线亮度与两线的可辨程度。"][i];by("pageLink").href=by("pageImage").src="book/books/grating/hi/00"+u.page+".jpg";
 by("question").textContent=u.q;by("answers").replaceChildren();by("feedback").textContent=draft.attempts[i].length?"上次作答："+draft.attempts[i].at(-1).value:"";
 for(const [j,b] of [...by("lessons").children].entries())b.classList.toggle("active",i===j);
 if(u.choices){u.choices.forEach((c,j)=>{const b=document.createElement("button");b.textContent=c;b.onclick=()=>answer(j);by("answers").append(b)})}
 else{const input=document.createElement("input");input.type="number";input.placeholder="衍射角 / °";input.setAttribute("aria-label","衍射角（度）");const b=document.createElement("button");b.textContent="检查读数";b.onclick=()=>{if(input.value)answer(Number(input.value))};by("answers").append(input,b)}
 draw();
}
lessons.forEach((u,i)=>{const b=document.createElement("button");b.textContent="0"+(i+1)+"　"+u.title;b.onclick=()=>select(i);by("lessons").append(b)});
by("play").onclick=()=>{if(timer){stop();return}if(progress>=100)progress=0;by("play").textContent="暂停";timer=setInterval(()=>{progress=Math.min(100,progress+.5);draw();if(progress===100)stop()},90)};
function seek(v){stop();progress=Math.min(100,Math.max(0,v));draw()}
by("next").onclick=()=>seek((Math.floor(progress/25)+1)*25);by("back").onclick=()=>seek((Math.ceil(progress/25)-1)*25);by("timeline").oninput=e=>seek(+e.target.value);
select(0);


