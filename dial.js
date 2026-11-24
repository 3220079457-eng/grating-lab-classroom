"use strict";
let manualAngle=null,selectedVernier=0;
function resetDial(){manualAngle=null}
function drawDial(g,automatic){
 const angle=manualAngle??automatic, cx=465, cy=165, radius=122;
 const polar=(a,r)=>[cx+r*Math.sin(a*Math.PI/180),cy-r*Math.cos(a*Math.PI/180)];
 const mark=(a,r,R,color)=>{const [x,y]=polar(a,r),[X,Y]=polar(a,R);line(x,y,X,Y,color,1.3)};
 g.beginPath();g.arc(cx,cy,radius,0,2*Math.PI);g.fillStyle="#dedbc9";g.fill();
 for(let i=0;i<720;i++){
   const deg=i/2;mark(deg,radius-(i%20===0?15:i%2===0?9:5),radius,"#314a47");
   if(i%60===0){const [x,y]=polar(deg,91);g.save();g.textAlign="center";label(String(deg),x,y+4,"#253c36",13);g.restore()}
 }
 for(let v=0;v<2;v++){const a=angle+180*v;const color=v===selectedVernier?"#a83f19":"#245368";for(let j=0;j<=30;j++)mark(a+j*29/60,122,122+(j%5===0?11:5),color);mark(a,71,123,color);const [x,y]=polar(a,57);label(v?"Ⅱ":"Ⅰ",x-4,y+5,color,17)}
 const reading=((Math.round((angle+selectedVernier*180)*60)%21600)+21600)%21600,minutes=reading%30;
 label("游标 "+(selectedVernier?"Ⅱ":"Ⅰ")+" · 局部放大",635,77);
 // The zero lies minutes/30 of a main division beyond the preceding tick.
 const x0=656,scale=6.6;
 for(let j=-2;j<=30;j++){const x=x0+(j-minutes/30)*scale;line(x,126-(j%2?6:13),x,130,"#dfddca",1)}
 for(let j=0;j<=30;j++){const x=x0+j*29/30*scale;line(x,131,x,131+(j%5?9:19),j===minutes?"#ffcc6d":"#b9d4cb",j===minutes?3:1)}
 label("0",650,173);label("30′",837,173);label(Math.floor(reading/60)+"° "+reading%60+"′",670,224,"#f2d682",28);
 label("主尺 0.5° / 游标分度 1′",626,268,"#c7dbd0",16);
 const controls=document.getElementById("dialTools");if(controls){controls.hidden=false;controls.querySelector("input").value=((angle%360)+360)%360}
}

