
import * as THREE from 'three';

/* ================================================================
   ONE dataset drives everything: the 3D tile board, the conflict
   card, the solver console, the export table. Change it once and
   the entire film follows.
================================================================ */
const CH = 11;
const DAYS = ['MON','TUE','WED','THU','FRI'];
const DEEP='#000000', MIST='#E9EEF5', BRAND='#74C947', GO='#34D399', ALERT='#FF4D5E';
const TAU = Math.PI*2;
const LOW = matchMedia('(pointer:coarse)').matches || innerWidth < 820;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
let isMobile = innerWidth < 768;
const MOT = REDUCED ? .2 : 1;

/* ================= helpers ================= */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
const lerp=(a,b,t)=>a+(b-a)*t;
const fract=x=>x-Math.floor(x);
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const bell=(x,c,w)=>Math.max(0,1-Math.pow((x-c)/w,2));
const easeSegments=p=>{const q=clamp(p,0,CH-1),i=Math.floor(q),f=q-i;return i+f*f*(3-2*f);};
const maxScroll=()=>Math.max(1,document.documentElement.scrollHeight-innerHeight);
const shade=(hex,f)=>'#'+new THREE.Color(hex).multiplyScalar(f).getHexString();

/* the subject color system — a timetable IS colorful */
const SC = { PHY:'#4F8CFF', MATH:'#C77DFF', CHEM:'#2DD4BF', CS:'#FFB224', ENG:'#FF7A9C', BIO:'#58D68D' };
const T = { // faculty: name + thread color
  RAO:   {name:'Ms. Rao',    col:SC.PHY},
  IYER:  {name:'Mr. Iyer',   col:SC.MATH},
  DHARMA:{name:'Ms. Dharma', col:SC.CHEM},
  HAQ:   {name:'Mr. Haq',    col:SC.BIO},
  FERN:  {name:'Ms. Fern',   col:SC.ENG},
  KAUR:  {name:'Ms. Kaur',   col:SC.CS},
};

/* 22 bookings: subject, teacher, room, solved slot [day,period].
   chaos = the hand-made draft slot [day,period,stack] — only for
   the 4 tiles the solver will move. Everyone else: chaos === sol. */
const BLOCKS = [
  {subj:'PHY · 11A', tc:'RAO',    room:'R-204', sol:[0,0]},
  {subj:'MATH · 9B', tc:'IYER',   room:'R-09',  sol:[0,1], chaos:[0,0,1]},
  {subj:'CHEM · 11', tc:'DHARMA', room:'LAB-1', sol:[0,2]},
  {subj:'CS · 12A',  tc:'KAUR',   room:'R-118', sol:[0,5]},
  {subj:'BIO · 10',  tc:'HAQ',    room:'LAB-2', sol:[1,0]},
  {subj:'PHY · 11B', tc:'RAO',    room:'R-204', sol:[1,1]},
  {subj:'CS · 11C',  tc:'KAUR',   room:'R-118', sol:[1,3], chaos:[1,4,1]},
  {subj:'MATH · 10', tc:'IYER',   room:'R-09',  sol:[1,4]},
  {subj:'BIO · 11',  tc:'HAQ',    room:'LAB-2', sol:[2,3]},
  {subj:'ENG · 10',  tc:'FERN',   room:'HALL',  sol:[2,1]},
  {subj:'PHY · 11C', tc:'RAO',    room:'R-204', sol:[2,2]},
  {subj:'MATH · 11', tc:'IYER',   room:'R-09',  sol:[2,0]},
  {subj:'CHEM · 10', tc:'DHARMA', room:'LAB-1', sol:[2,5]},
  {subj:'CHEM · 12', tc:'DHARMA', room:'LAB-1', sol:[3,0]},
  {subj:'ENG · 11',  tc:'FERN',   room:'HALL',  sol:[3,5], chaos:[3,0,1]},
  {subj:'BIO · 12',  tc:'HAQ',    room:'LAB-2', sol:[3,4]},
  {subj:'CS · 10',   tc:'KAUR',   room:'R-118', sol:[3,2]},
  {subj:'PHY · 10',  tc:'RAO',    room:'R-204', sol:[4,4], chaos:[0,3,0]},
  {subj:'ENG · 9',   tc:'FERN',   room:'HALL',  sol:[4,0]},
  {subj:'BIO · 9',   tc:'HAQ',    room:'LAB-2', sol:[4,1]},
  {subj:'MATH · 9A', tc:'IYER',   room:'R-09',  sol:[4,2]},
  {subj:'CHEM · 9',  tc:'DHARMA', room:'LAB-1', sol:[4,3]},
];
const N = BLOCKS.length;

/* derived per-block data */
BLOCKS.forEach((b,i)=>{
  b.i=i;
  b.col  = SC[b.subj.split(' ')[0]];
  b.ci   = ['PHY','MATH','CHEM','CS','ENG','BIO'].indexOf(b.subj.split(' ')[0]);
  b.stag = fract(i*0.37);
  b.phase= fract(i*0.27)*TAU;
  if(!b.chaos) b.chaos=[b.sol[0],b.sol[1],0];
  b.collider = b.chaos[2]===1;
  b.mover = !!b.chaos && (b.chaos[0]!==b.sol[0] || b.chaos[1]!==b.sol[1] || b.chaos[2]===1);
  b.persona = i%3;
  b.barCol  = i<8?0 : i<15?1 : 2;
  b.barIdx  = i - (b.barCol===0?0 : b.barCol===1?8:15);
  b.tower   = i<8?0 : i<15?1 : 2;
  b.tIdx    = i - (b.tower===0?0 : b.tower===1?8:15);
  b.logo    = i<4 ? i : -1;
  b.scatter = { x:(fract(i*.83)-.5)*9, y:5.5+fract(i*.29)*6, z:(fract(i*.51)-.5)*5, ry:2+fract(i*.4)*3 };
  b.out     = { x:(fract(i*.37)-.5)*11, y:(fract(i*.71)-.5)*9, z:2.5 };
});
/* solver hop windows — the console logs land exactly when these land */
[[1,0],[6,1],[14,2],[17,3]].forEach(([i,k])=>{
  BLOCKS[i].mw0=2.62+k*0.26; BLOCKS[i].mw1=BLOCKS[i].mw0+0.32; BLOCKS[i].mk=k;
});
const LOG_LINES=[2.50,2.56,2.62,2.68,2.94,3.20,3.46,3.72,3.80];
const SOLVE_T0=2.5, SOLVE_T1=3.8;
const CH_NAMES=['INTRO','THE INPUT','THE COLLISION','THE SOLVE','THE RESULT',"WHO IT'S FOR",'FEATURES','BY THE NUMBERS','TESTIMONIALS','PRICING','GET STARTED'];

const FEATURES=[
  {t:'Auto-solve engine', cat:'Chronos-2 core', col:GO, seed:'sf-solve',
   d:"Drop in faculty, classes and rooms, and Chronos-2 composes the whole term in about 90 seconds — weighing rooms, gaps, workload and equipment in a single pass. When something changes mid-term, it re-solves in seconds, not weekends.",
   plan:'All plans', since:'v1.0 · 2023', eng:'Chronos-2', cov:'≈90 s / rebuild'},
  {t:'Conflict radar', cat:'Validation layer', col:ALERT, seed:'sf-radar',
   d:"Every possible clash — teacher double-booked, room double-booked, subject piled into one period — is flagged before publish, never after. The board simply refuses to be wrong: red tiles stay red until the solver makes them land green.",
   plan:'All plans', since:'v1.1 · 2024', eng:'Chronos-2', cov:'100% of bookings'},
  {t:'Workload fairness', cat:'Constraint engine', col:'#C77DFF', seed:'sf-fair',
   d:"The solver treats balance as a hard goal: no teacher drifts more than one period from a perfect week, and no class inherits a schedule built around someone else's convenience. Fairness you can print and defend.",
   plan:'Institution & up', since:'v1.2 · 2024', eng:'Chronos-2', cov:'±1 period max'},
  {t:'Room intelligence', cat:'Matchmaker', col:'#2DD4BF', seed:'sf-rooms',
   d:"Labs stay with lab subjects, 40-seat rooms stop hosting 60 students, and the projector roster follows the class, not the room. Every booking knows what it needs before it exists.",
   plan:'All plans', since:'v1.1 · 2024', eng:'Chronos-2', cov:'Capacity + kit'},
  {t:'One-click publish', cat:'Distribution', col:'#38BDF8', seed:'sf-publish',
   d:"Publish a live link for faculty, print clean PDFs for the noticeboard, and drop ICS files straight into calendars. When the timetable changes, nobody asks which version they're holding — the link is always current.",
   plan:'Institution & up', since:'v1.0 · 2023', eng:'Live links', cov:'PDF · ICS · Web'},
];

const QUOTES=[
  {t:"We rebuilt the entire year in an afternoon. The solver caught conflicts we'd been hand-patching for three years.", w:"D. Okafor — Timetable Head, Northfield College"},
  {t:"The first term in a decade where no teacher came to me with a clash complaint. Parents noticed too.", w:"S. Menon — Principal, Kirana Schools"},
  {t:"Twelve batches, six rooms, weekends included — it just refuses to double-book.", w:"A. Reyes — Director, Apex Coaching"},
];

/* board geometry */
const CW=1.15, CPH=0.8;
const cellXYZ=(d,p)=>({x:(d-2)*CW, y:(2.5-p)*CPH});
const stackXYZ=ch=>{
  const c=cellXYZ(ch[0],ch[1]);
  return ch[2]===1 ? {x:c.x+0.09, y:c.y-0.06, z:0.46} : {x:c.x-0.09, y:c.y+0.07, z:0.16};
};
const CLUSTERS=[{x:1.55,y:1.75},{x:2.75,y:1.75},{x:1.55,y:.25},{x:2.75,y:.25},{x:1.55,y:-1.25},{x:2.75,y:-1.25}];
const LOGO_POS=[{x:-.8,y:.8},{x:.8,y:.8},{x:-.8,y:-.8},{x:.8,y:-.8}];
const LOGO_COLS=['#38BDF8','#74C947','#34D399','#C77DFF'];

/* ================= renderer & scene ================= */
const canvas=$('#scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW?1.6:2));
renderer.setSize(innerWidth,innerHeight);
renderer.setClearColor(new THREE.Color(DEEP));           // pure AMOLED black
const MAX_ANISO=Math.min(8,renderer.capabilities.getMaxAnisotropy());

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x000000,.003); // ultra-subtle fog to pure black, no gray wash
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,120);

/* lights — bright key, luminous fill, vivid colored rims for razor-sharp foreground */
scene.add(new THREE.AmbientLight(0xffffff,1.25));
const key=new THREE.DirectionalLight(0xffffff,1.5); key.position.set(4,7,7); scene.add(key);
const fill=new THREE.DirectionalLight(0xe8f0fe,.65); fill.position.set(-5,3,5); scene.add(fill);
const rimA=new THREE.PointLight(0x38BDF8,.9,32); rimA.position.set(-7,2,-3); scene.add(rimA);
const rimB=new THREE.PointLight(0x74C947,.9,32); rimB.position.set(7,1,-4); scene.add(rimB);
const plRed=new THREE.PointLight(0xFF4D5E,0,16);  plRed.position.set(0,.5,4.5); scene.add(plRed);
const plGreen=new THREE.PointLight(0x34D399,0,16); plGreen.position.set(0,.5,4); scene.add(plGreen);

/* ---------- 3D PARTICLE FIELD: reduced, vivid jewel sparks in deep background ---------- */
let dustNear,dustFar;
function makeDust(o){
  const {count,rMin,rMax,sMin,sMax,palette,alpha,twk,soft}=o;
  const pos=new Float32Array(count*3), col=new Float32Array(count*3),
        sz=new Float32Array(count), tw=new Float32Array(count);
  const c=new THREE.Color();
  for(let i=0;i<count;i++){
    pos[i*3]   = (Math.random() - 0.5) * (soft ? 80 : 52);
    pos[i*3+1] = (Math.random() - 0.5) * (soft ? 54 : 36);
    pos[i*3+2] = -(rMin + Math.random() * (rMax - rMin));
    c.set(palette[(Math.random()*palette.length)|0]);
    col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
    sz[i]=sMin+Math.random()*(sMax-sMin);
    tw[i]=Math.random();
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('aCol',new THREE.BufferAttribute(col,3));
  g.setAttribute('aSize',new THREE.BufferAttribute(sz,1));
  g.setAttribute('aTw',new THREE.BufferAttribute(tw,1));
  const m=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uAlpha:{value:alpha}},
    vertexShader:`
      attribute float aSize; attribute vec3 aCol; attribute float aTw;
      uniform float uTime;
      varying vec3 vC; varying float vA;
      void main(){
        vec3 p=position;
        p.y+=sin(uTime*.22+p.x*.4)*aSize*.12;
        p.x+=cos(uTime*.17+p.z*.35)*aSize*.10;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=aSize*(${soft?'300.':'150.'}/-mv.z);
        vA=.78+.22*sin(uTime*${twk.toFixed(2)}*(1.+aTw*2.)+aTw*50.);
        vC=aCol;
      }`,
    fragmentShader:`
      precision mediump float;
      uniform float uAlpha; varying vec3 vC; varying float vA;
      void main(){
        vec2 c=gl_PointCoord-.5; float r=length(c);
        if(r>.5) discard;
        float a=${soft?'smoothstep(.5,.0,r)*.5':'smoothstep(.5,.08,r)'}*uAlpha*vA;
        gl_FragColor=vec4(vC,a);
      }`,
    transparent:true, depthWrite:false, depthTest:true, blending:THREE.AdditiveBlending
  });
  const pts=new THREE.Points(g,m);
  pts.renderOrder=-1;
  pts.frustumCulled=false;
  return pts;
}
{
  const vividPalette=['#74C947','#38BDF8','#34D399','#C77DFF','#FFB224','#FF7A9C','#2DD4BF','#60A5FA','#F472B6'];
  dustNear=makeDust({count:LOW?40:95, rMin:4.5, rMax:22, sMin:1.2, sMax:2.8,
    palette:vividPalette, alpha:.85, twk:1.8, soft:false});
  dustFar =makeDust({count:LOW?10:22,  rMin:22,  rMax:55, sMin:6,  sMax:18,
    palette:vividPalette, alpha:.32, twk:.4, soft:true});
  scene.add(dustNear,dustFar);
}

/* ---------- the world: board + tiles + clock ---------- */
const worldGroup=new THREE.Group();
const boardGroup=new THREE.Group();
worldGroup.add(boardGroup);
scene.add(worldGroup);

/* board grid bars + labels */
const barMat=new THREE.MeshStandardMaterial({color:'#5A6C86',roughness:.5,metalness:.4});
const bars=[];
{
  const vxs=[-2.875,-1.725,-0.575,0.575,1.725,2.875];
  const vys=[2.4,1.6,0.8,0,-0.8,-1.6,-2.4];
  vxs.forEach(x=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(.032,4.92,.032),barMat);
    m.position.set(x,0,0); m.scale.y=.001; m.frustumCulled=false;
    boardGroup.add(m); bars.push({m,axis:'y'});
  });
  vys.forEach(y=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(5.9,.032,.032),barMat);
    m.position.set(0,y,0); m.scale.x=.001; m.frustumCulled=false;
    boardGroup.add(m); bars.push({m,axis:'x'});
  });
}
const backing=new THREE.Mesh(
  new THREE.PlaneGeometry(6.3,5.4),
  new THREE.MeshBasicMaterial({color:'#000000',transparent:true,opacity:0})
);
backing.position.z=-.14; backing.frustumCulled=false; boardGroup.add(backing);

/* 2x-resolution text planes → crisp labels on the board & clock */
function textPlane(txt,font,W,H,color){
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d');
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=MAX_ANISO;
  tex.minFilter=THREE.LinearMipmapLinearFilter; tex.generateMipmaps=true;
  const draw=()=>{
    x.clearRect(0,0,W,H);
    x.font=font; x.fillStyle=color; x.textAlign='center'; x.textBaseline='middle';
    x.fillText(txt,W/2,H/2+1);
    tex.needsUpdate=true;
  };
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(W/240,H/240),
    new THREE.MeshBasicMaterial({map:tex,transparent:true}));
  mesh.frustumCulled=false;
  draw();
  return {mesh,draw};
}
const labels=[];
DAYS.forEach((d,i)=>{
  const p=textPlane(d,'600 44px "IBM Plex Mono", monospace',192,96,'rgba(233,238,245,.7)');
  p.mesh.position.set((i-2)*CW,2.78,0); boardGroup.add(p.mesh); labels.push(p);
});
for(let p=0;p<6;p++){
  const lp=textPlane('P'+(p+1),'500 36px "IBM Plex Mono", monospace',128,80,'rgba(233,238,245,.5)');
  lp.mesh.position.set(-3.36,(2.5-p)*CPH,0); boardGroup.add(lp.mesh); labels.push(lp);
}

/* ---------- THE CLOCK: scroll is time. hand sweeps P1 → P6 twice ---------- */
const clockGroup=new THREE.Group();
clockGroup.position.set(0,.15,-2.4);
worldGroup.add(clockGroup);
let handGroup, handSec;
const clockLabels=[];
{
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(4.15,.022,8,140),
    new THREE.MeshStandardMaterial({color:'#7E8FA6',metalness:.7,roughness:.35})
  );
  clockGroup.add(ring);
  const tickMat=new THREE.MeshStandardMaterial({color:'#A7B7CC',metalness:.5,roughness:.4});
  for(let k=0;k<6;k++){
    const a=k*TAU/6;
    const t=new THREE.Mesh(new THREE.BoxGeometry(.06,.3,.06),tickMat);
    t.position.set(Math.sin(a)*3.95,Math.cos(a)*3.95,0);
    t.rotation.z=-a;
    clockGroup.add(t);
    const lp=textPlane('P'+(k+1),'600 40px "IBM Plex Mono", monospace',144,88,'rgba(233,238,245,.45)');
    lp.mesh.position.set(Math.sin(a)*4.62,Math.cos(a)*4.62,0);
    clockGroup.add(lp.mesh); clockLabels.push(lp);
  }
  handGroup=new THREE.Group();
  const handMat=new THREE.MeshStandardMaterial({color:BRAND,emissive:BRAND,emissiveIntensity:.35});
  const hand=new THREE.Mesh(new THREE.BoxGeometry(.07,3.5,.07),handMat);
  hand.position.y=1.75; handGroup.add(hand);
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.09,12),handMat);
  handGroup.add(tail);
  clockGroup.add(handGroup);
  handSec=new THREE.Group();
  const secMat=new THREE.MeshStandardMaterial({color:'#38BDF8',emissive:'#38BDF8',emissiveIntensity:.3});
  const sec=new THREE.Mesh(new THREE.BoxGeometry(.04,2.3,.04),secMat);
  sec.position.y=1.15; handSec.add(sec);
  clockGroup.add(handSec);
}

/* ---------- the 22 class tiles — 2x canvas, self-lit, razor sharp ---------- */
function roundRectPath(x,a,b,w,h,r){
  x.beginPath();
  x.moveTo(a+r,b); x.lineTo(a+w-r,b); x.arcTo(a+w,b,a+w,b+r,r);
  x.lineTo(a+w,b+h-r); x.arcTo(a+w,b+h,a+w-r,b+h,r);
  x.lineTo(a+r,b+h); x.arcTo(a,b+h,a,b+h-r,r);
  x.lineTo(a,b+r); x.arcTo(a,b,a+r,b,r); x.closePath();
}
BLOCKS.forEach((b,i)=>{
  b.canvas=document.createElement('canvas'); b.canvas.width=512; b.canvas.height=336;   // 2x → sharp
  b.ctx=b.canvas.getContext('2d');
  b.tex=new THREE.CanvasTexture(b.canvas);
  b.tex.colorSpace=THREE.SRGBColorSpace;
  b.tex.anisotropy=MAX_ANISO;                       // crisp at every viewing angle
  b.tex.minFilter=THREE.LinearMipmapLinearFilter;
  b.tex.magFilter=THREE.LinearFilter;
  b.tex.generateMipmaps=true;
  /* map + emissiveMap: the tile is self-lit → colors stay vivid on AMOLED black */
  b.frontMat=new THREE.MeshStandardMaterial({
    map:b.tex, emissiveMap:b.tex,
    emissive:new THREE.Color('#ffffff'), emissiveIntensity:.42,
    roughness:.2, metalness:0
  });
  const side=new THREE.Color(b.col).multiplyScalar(.95);
  b.sideMat=new THREE.MeshStandardMaterial({color:side,emissive:b.col,emissiveIntensity:.18,roughness:.35});
  b.tileArr=[b.sideMat,b.sideMat,b.sideMat,b.sideMat,b.frontMat,b.frontMat];
  const lm=new THREE.MeshStandardMaterial({color:LOGO_COLS[i<4?i:0],roughness:.45});
  b.logoArr=[lm,lm,lm,lm,lm,lm];
  b.mesh=new THREE.Mesh(new THREE.BoxGeometry(1.02,.66,.3),b.tileArr);
  b.mesh.frustumCulled=false; b.mesh.visible=false;
  boardGroup.add(b.mesh);
  b.drawnStatus=''; b.logoOn=false;
});
function drawTile(b,status){
  const x=b.ctx, W=512, H=336, col=b.col;
  x.clearRect(0,0,W,H);
  let bg,bd,bc,sc,tc,chipFill,rc;
  if(status==='conflict'){
    bg='#230E13'; bd='rgba(255,77,94,.9)'; bc='#FF4D5E'; sc='#FF8A97';
    tc='#FFDCE0'; chipFill='rgba(255,255,255,.08)'; rc='rgba(255,220,224,.7)';
  }else if(status==='solved'){
    bg='#0D2418'; bd='rgba(52,211,153,.85)'; bc='#34D399'; sc='#57E8A6';
    tc='#D9F8E8'; chipFill='rgba(255,255,255,.08)'; rc='rgba(217,248,232,.65)';
  }else{
    bg='#FFFFFF'; bd='rgba(255,255,255,.95)'; bc=col; sc=b.col;
    tc='#111827'; chipFill='rgba(15,23,42,.06)'; rc='rgba(15,23,42,.85)';
  }
  x.fillStyle=bg; x.fillRect(0,0,W,H);
  x.strokeStyle=bd; x.lineWidth=6; x.strokeRect(3,3,W-6,H-6);
  x.fillStyle=bc; x.fillRect(0,0,24,H);                        // vivid subject bar
  x.textAlign='left'; x.textBaseline='alphabetic';
  x.fillStyle=sc; x.font='800 58px "Plus Jakarta Sans", sans-serif';          // subject in its own color
  x.fillText(b.subj,56,118);
  x.fillStyle=tc; x.font='500 36px "IBM Plex Mono", monospace';
  x.fillText(T[b.tc].name,56,186);
  x.font='600 32px "IBM Plex Mono", monospace';
  const w=x.measureText(b.room).width+40;
  x.fillStyle=chipFill; roundRectPath(x,56,214,w,58,14); x.fill();
  x.fillStyle=rc;
  x.fillText(b.room,76,254);
  if(status==='conflict'){
    x.fillStyle='#FF4D5E'; x.font='700 54px "IBM Plex Mono", monospace'; x.textAlign='right';
    x.fillText('×2',W-24,74); x.textAlign='left';
  }
  b.tex.needsUpdate=true;
  b.drawnStatus=status;
}
BLOCKS.forEach(b=>drawTile(b,'neutral'));
document.fonts.ready.then(()=>{
  BLOCKS.forEach(b=>drawTile(b,b.drawnStatus||'neutral'));
  labels.forEach(l=>l.draw()); clockLabels.forEach(l=>l.draw());
});

/* conflict frames around the 3 stacked cells */
const clashCells=[[0,0],[1,4],[3,0]];
const clashFrames=clashCells.map(([d,p])=>{
  const c=cellXYZ(d,p);
  const g=new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(c.x-.6,c.y-.44,.68), new THREE.Vector3(c.x+.6,c.y-.44,.68),
    new THREE.Vector3(c.x+.6,c.y+.44,.68), new THREE.Vector3(c.x-.6,c.y+.44,.68),
  ]);
  const line=new THREE.LineLoop(g,new THREE.LineBasicMaterial({color:ALERT,transparent:true,opacity:0}));
  line.frustumCulled=false; boardGroup.add(line);
  return line;
});

/* teacher threads — each faculty week drawn as one colored line */
const threads=Object.keys(T).map(tc=>{
  const blocks=BLOCKS.filter(b=>b.tc===tc).sort((a,c)=>(a.sol[0]*6+a.sol[1])-(c.sol[0]*6+c.sol[1]));
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(29*3),3));
  const line=new THREE.Line(g,new THREE.LineBasicMaterial({color:T[tc].col,transparent:true,opacity:0}));
  line.frustumCulled=false; boardGroup.add(line);
  return {blocks,line};
});
function updateThreads(t){
  const op=sstep(.25,.6,t)*(1-sstep(4.05,4.4,t));
  const tmp=[];
  threads.forEach(th=>{
    th.line.material.opacity=op*.55;
    if(op<.02) return;
    tmp.length=0;
    th.blocks.forEach(b=>tmp.push(b.mesh.position));
    if(tmp.length<2) return;
    const curve=new THREE.CatmullRomCurve3(tmp,false,'catmullrom',.6);
    const pts=curve.getPoints(28);
    const arr=th.line.geometry.attributes.position.array;
    pts.forEach((p,k)=>{ arr[k*3]=p.x; arr[k*3+1]=p.y; arr[k*3+2]=p.z; });
    th.line.geometry.attributes.position.needsUpdate=true;
  });
}

/* ================= pose system: 11 formations ================= */
function poseFor(b,c,ta){
  switch(c){
    case 0: { const s=cellXYZ(b.sol[0],b.sol[1]); return {x:s.x,y:s.y,z:.16,ry:0,rz:0,s:1}; }
    case 1: { const cl=CLUSTERS[b.ci];
      return { x:cl.x+(fract(b.stag*13)-.5)*.95,
               y:cl.y+(fract(b.stag*7)-.5)*.95+Math.sin(ta*1.1+b.phase)*.09,
               z:.6+fract(b.stag*3)*1.6,
               ry:.2+Math.sin(ta*.8+b.phase)*.06, rz:Math.sin(ta*.6+b.phase)*.05, s:1 }; }
    case 2: { const s=stackXYZ(b.chaos); return {x:s.x,y:s.y,z:s.z,ry:0,rz:0,s:1}; }
    case 3: case 4: { const s=cellXYZ(b.sol[0],b.sol[1]); return {x:s.x,y:s.y,z:.16,ry:0,rz:0,s:1}; }
    case 5: { const p=b.persona, a=b.stag*TAU+ta*(.3+p*.1)*(p===1?-1:1), r=1.35+p*.62;
      return {x:Math.cos(a)*r, y:-.75+p*1.0+Math.sin(ta*1.3+b.phase)*.12, z:Math.sin(a)*r, ry:-a, rz:0, s:1}; }
    case 6: { const a=(b.i/N)*TAU+ta*.16, r=2.55+Math.sin(a*5)*.22;
      return {x:Math.cos(a)*r, y:Math.sin(a*2+ta*.7)*.65, z:Math.sin(a)*r, ry:a+Math.PI/2, rz:Math.sin(ta*.9+b.phase)*.15, s:1}; }
    case 7: { return {x:(b.barCol-1)*2.05, y:-2.25+b.barIdx*.62, z:.3+(b.barCol===1?.2:0), ry:0, rz:0, s:1}; }
    case 8: { const a=(b.i/N)*TAU+ta*.2;
      return {x:Math.cos(a)*2.45, y:Math.sin(a)*1.05, z:Math.sin(a)*1.85, ry:a+Math.PI/2, rz:0, s:1}; }
    case 9: { return {x:(b.tower-1)*1.7, y:-2.05+b.tIdx*.6, z:.3, ry:(fract(b.stag*5)-.5)*.18, rz:0, s:1}; }
    case 10:{ if(b.logo>=0){ const L=LOGO_POS[b.logo]; return {x:L.x,y:L.y,z:.2,ry:0,rz:0,s:1.18}; }
              return {x:b.out.x,y:b.out.y,z:b.out.z,ry:0,rz:0,s:.001}; }
  }
}
const ARC=[0,.8,1.0,1.4,.8,.9,.9,.8,.9,.9,.9]; // lift height per transition
function poseAt(b,eased,ta){
  const c=Math.min(Math.floor(eased),CH-2);
  const A=poseFor(b,c,ta), B=poseFor(b,c+1,ta);
  let f;
  if(c===2 && b.mover){          // solver hops: exact windows, console-synced
    f=sstep(b.mw0,b.mw1,eased);
  }else if(c===2){               // everyone else is already home
    f=0;
  }else{                         // generic window with a per-tile ripple
    const w0=c+.45+b.stag*.18;
    f=sstep(w0,w0+.5,eased);
  }
  const arc=Math.sin(f*Math.PI);
  let x=lerp(A.x,B.x,f), y=lerp(A.y,B.y,f), z=lerp(A.z,B.z,f)+arc*ARC[c+1];
  let ry=lerp(A.ry,B.ry,f)+arc*.45, rz=lerp(A.rz,B.rz,f), s=lerp(A.s,B.s,f);
  /* colliders jitter while red */
  if(b.collider && eased>2.55 && eased<b.mw0 && !REDUCED){
    x+=Math.sin(ta*31+b.phase)*.02; y+=Math.cos(ta*27+b.phase)*.016;
  }
  return {x,y,z,ry,rz,s};
}
function statusOf(b,e){
  if(b.collider && e>2.5 && e<b.mw1) return 'conflict';
  if(b.mover && e>=b.mw1 && e<b.mw1+.4) return 'solved';
  return 'neutral';
}

/* ================= state ================= */
let targetScroll=0,smooth=0,eased=0,lb=0,lastN=-1,pulse=0,pulseT=0;
let bootT=Infinity;
let tmx=0,tmy=0,mxs=0,mys=0,ringX=innerWidth/2,ringY=innerHeight/2,rx=ringX,ry2=ringY;
let modalOpen=false,curFeature=0,statsDone=false,chTyping=false;

/* camera keys — WIDE left↔right swings per chapter for the 3D feel.
   Readability chapters (solve/result) stay calmer; the 3D formations
   (cloud, orbits, pinwheel, bars, ring, towers) get the big sweeps. */
const KEYS=[
  {az:.12,  el:.14, r:9.6,  gx:1.55, wy:0},
  {az:.62,  el:.20, r:9.2,  gx:1.45, wy:.1},
  {az:-.52, el:.08, r:10.4, gx:1.55, wy:0},
  {az:.30,  el:.34, r:9.8,  gx:1.5,  wy:.05},
  {az:-.38, el:.16, r:10.6, gx:1.6,  wy:0},
  {az:.68,  el:.28, r:10.0, gx:1.5,  wy:0},
  {az:-.58, el:.12, r:11.6, gx:1.7,  wy:0},
  {az:.48,  el:.22, r:10.8, gx:1.5,  wy:0},
  {az:-.60, el:.14, r:10.4, gx:1.6,  wy:0},
  {az:.55,  el:.10, r:10.2, gx:1.55, wy:0},
  {az:0,    el:.10, r:8.8,  gx:0,    wy:-1.15},
];
function camMix(t){
  const i=Math.min(Math.floor(t),KEYS.length-2), f0=clamp(t-i,0,1), f=f0*f0*(3-2*f0);
  const A=KEYS[i],B=KEYS[i+1];
  return {az:lerp(A.az,B.az,f), el:lerp(A.el,B.el,f), r:lerp(A.r,B.r,f),
          gx:lerp(A.gx,B.gx,f), wy:lerp(A.wy,B.wy,f)};
}

/* ================= DOM ================= */
const secs=Array.from({length:CH},(_,i)=>document.getElementById('ch'+i));
const railNum=$('#railNum'),railFill=$('#railFill'),railTrack=$('#railTrack');
const pbar=$('#pbar'),readout=$('#readout'),lbT=$('#lbT'),lbB=$('#lbB');
const dot=$('#cursorDot'),ring=$('#cursorRing');
const modal=$('#modal'),modalBackdrop=$('#modalBackdrop'),modalPanel=$('#modalPanel');
const loader=$('#loader'),loadNum=$('#loadNum'),loadBar=$('#loadBar'),toast=$('#toast');
const slLines=$$('#slLines .sl-line'),slBar=$('#slBar'),slPct=$('#slPct'),slDot=$('#slDot');
const cc=[$('#cc1'),$('#cc2'),$('#cc3')];

/* rail dots (11) */
const railDots=[];
for(let i=0;i<CH;i++){
  const d=document.createElement('button');
  d.className='rail-dot'+(i===0?' on':'');
  d.style.top=(i/(CH-1)*100)+'%';
  d.setAttribute('aria-label','Chapter '+(i+1));
  d.addEventListener('click',()=>goTo(i));
  railTrack.appendChild(d); railDots.push(d);
}

/* chapter windows */
const CWINS=Array.from({length:CH},(_,i)=>[i-.52,i-.06,i+.6,i+1.0]);

/* export table + legend (from the same BLOCKS) */
{
  const grid=Array(30).fill(null);
  BLOCKS.forEach(b=>{ grid[b.sol[0]*6+b.sol[1]]=b; });
  let html='<div class="rt-head"><span></span>'+DAYS.map(d=>`<span>${d}</span>`).join('')+'</div>';
  for(let p=0;p<6;p++){
    html+=`<div class="rt-row"><span class="rt-p">P${p+1}</span>`;
    for(let d=0;d<5;d++){
      const b=grid[d*6+p];
      html+= b
        ? `<span class="rt-cell" style="--tc:${b.col}"><b>${b.subj}</b><i>${T[b.tc].name} · ${b.room}</i></span>`
        : `<span class="rt-cell rt-free">·</span>`;
    }
    html+='</div>';
  }
  $('#rtBody').innerHTML=html;
  $('#rtLegend').innerHTML=['PHY','MATH','CHEM','CS','ENG','BIO'].map(s=>
    `<span class="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[.1em] text-mist/45"><span class="w-2 h-2 rounded-[3px]" style="background:${SC[s]}"></span>${s}</span>`
  ).join('');
}

/* feature rows */
const featureList=$('#featureList');
FEATURES.forEach((f,i)=>{
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='feature-row group w-full text-left border-t border-mist/12 py-5 flex items-center gap-4 md:gap-6 rounded-lg pl-4 pr-3 -mx-4 transition-colors duration-300 hover:bg-mist/[.04]';
  btn.style.setProperty('--c',f.col);
  btn.dataset.cursor='view';
  btn.innerHTML=`
    <span class="fnum font-mono text-[11px] w-7 shrink-0">0${i+1}</span>
    <span class="ftitle font-display font-bold text-xl md:text-2xl leading-none tracking-tight flex-1">${f.t}</span>
    <span class="hidden md:inline font-mono text-[10px] tracking-[.14em] uppercase text-mist/45">${f.cat}</span>
    <svg class="farrow w-5 h-5 shrink-0" style="color:var(--c)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 17 17 7M17 7H8M17 7v9"/></svg>`;
  btn.addEventListener('mouseenter',()=>pulseT=1);
  btn.addEventListener('mouseleave',()=>pulseT=0);
  btn.addEventListener('click',()=>openModal(i));
  featureList.appendChild(btn);
});

/* modal */
function fillModal(i){
  const f=FEATURES[i];
  $('#mIndex').textContent=`0${i+1} / 0${FEATURES.length}`;
  $('#mTitle').textContent=f.t;
  const mc=$('#mCat'); mc.textContent=f.cat; mc.style.color=f.col;
  const img=$('#mImg'); img.src=`https://picsum.photos/seed/${f.seed}/1200/700.jpg`; img.alt=`${f.t} — feature visual`;
  $('#mDesc').textContent=f.d; $('#mPlan').textContent=f.plan;
  $('#mSince').textContent=f.since; $('#mEng').textContent=f.eng; $('#mCov').textContent=f.cov;
}
function openModal(i){
  curFeature=i; fillModal(i); modalOpen=true; pulseT=0;
  modal.classList.remove('invisible');
  modalBackdrop.style.opacity=1; modalPanel.style.opacity=1; modalPanel.style.transform='translateY(0)';
  document.documentElement.classList.add('lock');
}
function closeModal(){
  modalOpen=false;
  modalBackdrop.style.opacity=0; modalPanel.style.opacity=0; modalPanel.style.transform='translateY(2.5rem)';
  document.documentElement.classList.remove('lock');
  setTimeout(()=>modal.classList.add('invisible'),500);
}
 $('#modalClose').addEventListener('click',closeModal);
modalBackdrop.addEventListener('click',closeModal);
 $('#mNext').addEventListener('click',()=>{
  curFeature=(curFeature+1)%FEATURES.length; fillModal(curFeature);
  modalPanel.scrollTo({top:0,behavior:'smooth'});
});

/* toast */
let toastTimer;
function showToast(msg){
  $('#toastMsg').textContent=msg;
  toast.style.opacity=1; toast.style.transform='translate(-50%,0)';
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{toast.style.opacity=0;toast.style.transform='translate(-50%,1rem)';},2400);
}
 $('#btnLive').addEventListener('click',()=>showToast('Live link copied — share it with faculty'));
 $('#btnPDF').addEventListener('click',()=>showToast('PDF queued — clean print layout'));
 $('#btnICS').addEventListener('click',()=>showToast('Calendar file exported'));

/* typewriter */
const FIELDS=[
  {el:$('#tw1'),lines:['Ms. Rao — Physics','Mr. Iyer — Maths','Ms. Kaur — Comp. Sci','Ms. Dharma — Chemistry']},
  {el:$('#tw2'),lines:['Gr-11A · 30 students','Gr-10B · 28 students','Gr-9C · 26 students','Gr-12A · 31 students']},
  {el:$('#tw3'),lines:['R-204 · 40 seats','LAB-1 · 12 benches','HALL · assemblies','R-118 · seminar']},
].map(f=>({...f,li:0,ci:0,mode:'type',wait:0}));
setInterval(()=>{
  if(!chTyping||document.hidden) return;
  FIELDS.forEach(f=>{
    const line=f.lines[f.li];
    if(f.mode==='type'){ f.ci++; f.el.textContent=line.slice(0,f.ci);
      if(f.ci>=line.length){f.mode='hold';f.wait=16;} }
    else if(f.mode==='hold'){ if(--f.wait<=0) f.mode='erase'; }
    else{ f.ci--; f.el.textContent=line.slice(0,Math.max(f.ci,0));
      if(f.ci<=0){ f.mode='type'; f.li=(f.li+1)%f.lines.length; } }
  });
},75);

/* quotes rotator */
let qi=0,qTimer=null;
const qDots=[];
QUOTES.forEach((_,i)=>{
  const b=document.createElement('button');
  b.type='button'; b.className='qdot'+(i===0?' on':''); b.setAttribute('aria-label','Quote '+(i+1));
  b.addEventListener('click',()=>{qi=i;showQuote();});
  $('#qDots').appendChild(b); qDots.push(b);
});
function showQuote(){
  const box=$('#quoteBox');
  box.classList.add('out');
  setTimeout(()=>{
    $('#qText').textContent=QUOTES[qi].t;
    $('#qWho').textContent=QUOTES[qi].w;
    qDots.forEach((d,i)=>d.classList.toggle('on',i===qi));
    box.classList.remove('out');
  },300);
}
 $('#qText').textContent=QUOTES[0].t; $('#qWho').textContent=QUOTES[0].w;
function startQuotes(){ if(!qTimer) qTimer=setInterval(()=>{ if(!document.hidden){ qi=(qi+1)%QUOTES.length; showQuote(); } },4600); }
function stopQuotes(){ clearInterval(qTimer); qTimer=null; }

/* count-ups */
function countUp(el){
  const val=+el.dataset.val,dec=+(el.dataset.dec||0),suf=el.dataset.suf||'';
  const t0=performance.now(),dur=1200;
  (function s(){
    const p=clamp((performance.now()-t0)/dur,0,1),e=1-Math.pow(1-p,3);
    const v=(val*e).toFixed(dec);
    el.textContent=(dec?v:(+v).toLocaleString('en-US'))+suf;
    if(p<1)requestAnimationFrame(s);
  })();
}

/* navigation */
const goTo=i=>window.scrollTo({top:i/(CH-1)*maxScroll(),behavior:REDUCED?'auto':'smooth'});
 $$('[data-goto]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();goTo(+a.dataset.goto);}));
 $('#logo').addEventListener('click',e=>{e.preventDefault();goTo(0);});
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&modalOpen){closeModal();return;}
  if(modalOpen)return;
  if(e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();goTo(clamp(Math.floor(eased)+1,0,CH-1));}
  if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();goTo(clamp(Math.ceil(eased)-1,0,CH-1));}
  if(e.key==='Home'){e.preventDefault();goTo(0);}
  if(e.key==='End'){e.preventDefault();goTo(CH-1);}
});

/* pricing → CTA */
 $$('[data-plan]').forEach(b=>b.addEventListener('click',()=>{
  const p=b.dataset.plan;
  $('#planName').textContent=p;
  showToast(p==='Campus'?'Tell us your campus size — drop your email below':p+' selected — drop your email below');
  goTo(10);
}));
 $('#ctaForm').addEventListener('submit',e=>{
  e.preventDefault();
  const inp=$('#ctaEmail');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())){
    inp.classList.add('ring-2','ring-alert');
    setTimeout(()=>inp.classList.remove('ring-2','ring-alert'),1200);
    showToast('That email looks off — mind checking it?');
    return;
  }
  showToast('Magic link sent — check your inbox');
  inp.value='';
});

/* cursor / magnetic / liquid / tilt / ripple */
let cursorSeen=false;
addEventListener('mousemove',e=>{
  tmx=(e.clientX/innerWidth-.5)*2; tmy=(e.clientY/innerHeight-.5)*2;
  ringX=e.clientX; ringY=e.clientY;
  if(!cursorSeen){cursorSeen=true;dot.style.opacity=1;ring.style.opacity=1;}
  dot.style.transform=`translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
});
document.addEventListener('mouseover',e=>{
  const view=e.target.closest('[data-cursor="view"]');
  const hov=e.target.closest('[data-hover]');
  ring.classList.toggle('is-view',!!view);
  ring.classList.toggle('is-active',!!hov&&!view);
});
document.addEventListener('pointermove',e=>{
  const el=e.target.closest('.liquid');
  if(el){
    const r=el.getBoundingClientRect();
    el.style.setProperty('--mx',(e.clientX-r.left)+'px');
    el.style.setProperty('--my',(e.clientY-r.top)+'px');
  }
});
 $$('.magnet').forEach(el=>{
  el.addEventListener('pointermove',e=>{
    const r=el.getBoundingClientRect();
    el.style.transform=`translate(${(e.clientX-(r.left+r.width/2))*.22}px,${(e.clientY-(r.top+r.height/2))*.22}px)`;
  });
  el.addEventListener('pointerleave',()=>{el.style.transform='';});
});
 $$('.tilt').forEach(el=>{
  el.style.transition='transform .3s cubic-bezier(.2,.9,.3,1.2)';
  el.addEventListener('pointermove',e=>{
    if(LOW) return;
    const r=el.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5;
    el.style.transform=`perspective(700px) rotateY(${px*5}deg) rotateX(${-py*5}deg) translateY(-2px)`;
  });
  el.addEventListener('pointerleave',()=>{el.style.transform='';});
});
 $$('.btn-primary,.btn-glass').forEach(el=>{
  el.addEventListener('pointerdown',e=>{
    const r=el.getBoundingClientRect();
    const s=document.createElement('span');
    s.className='rip';
    s.style.left=(e.clientX-r.left-12)+'px';
    s.style.top=(e.clientY-r.top-12)+'px';
    el.appendChild(s);
    setTimeout(()=>s.remove(),600);
  });
});

/* scroll / resize */
addEventListener('scroll',()=>{targetScroll=scrollY;},{passive:true});
function onResize(){
  isMobile=innerWidth<768;
  renderer.setSize(innerWidth,innerHeight);
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
}
addEventListener('resize',onResize);
onResize();

/* ================= main loop ================= */
let last=performance.now();
function tick(now){
  const dt=Math.min((now-last)/1000,.05); last=now;
  const t=now/1000, ta=t*MOT;

  const k=REDUCED?1:(1-Math.exp(-dt*4.5));
  smooth+=(targetScroll-smooth)*k;
  if(Math.abs(targetScroll-smooth)<.05)smooth=targetScroll;
  const raw=clamp(smooth/maxScroll(),0,1)*(CH-1);
  eased=easeSegments(raw);

  /* intro rain: the board assembles on load, then scroll owns everything */
  const introK=b=>REDUCED?1:sstep(bootT+.2+b.stag*1.1, bootT+.95+b.stag*1.1, t);

  /* tiles */
  BLOCKS.forEach(b=>{
    const p=poseAt(b,eased,ta);
    const ik=introK(b);
    let x=p.x, y=p.y, z=p.z, ry=p.ry, s=p.s;
    if(ik<1){
      x=lerp(b.scatter.x,x,ik); y=lerp(b.scatter.y,y,ik);
      z=lerp(b.scatter.z,z,ik); ry+=b.scatter.ry*(1-ik);
    }
    b.mesh.visible = s>.01 && ik>.02;
    if(b.mesh.visible){
      b.mesh.position.set(x,y,z);
      b.mesh.scale.setScalar(Math.max(s,.001));
      b.mesh.rotation.set(0,ry,p.rz);
    }
    /* logo material swap on the final chapter */
    if(b.logo>=0){
      const lg=sstep(9.55,9.85,eased);
      if(lg>.5 && !b.logoOn){ b.mesh.material=b.logoArr; b.logoOn=true; }
      else if(lg<.5 && b.logoOn){ b.mesh.material=b.tileArr; b.logoOn=false; }
    }
    /* face status + emissive (self-lit base keeps tiles vivid on black) */
    const st=statusOf(b,eased);
    if(st!==b.drawnStatus && !(b.logoOn&&eased>9.5)) drawTile(b,st);
    if(st==='conflict'){
      b.frontMat.emissive.set(ALERT);
      b.frontMat.emissiveIntensity=REDUCED?.3:(.45+.22*Math.sin(t*7+b.phase));
    }else if(st==='solved'){
      b.frontMat.emissive.set(GO);
      b.frontMat.emissiveIntensity=.38+.6*bell(eased,b.mw1+.1,.12);
    }else{
      b.frontMat.emissive.set('#ffffff');
      b.frontMat.emissiveIntensity=.42;
    }
  });

  /* board reveal/dissolve */
  bars.forEach((bar,i2)=>{
    const rv=sstep(.05+i2*.03,.55+i2*.03,eased);
    const hv=1-sstep(9.55,9.9,eased);
    bar.m.scale[bar.axis]=Math.max(rv*hv,.001);
  });
  const lop=sstep(.4,.85,eased)*(1-sstep(9.4,9.8,eased));
  labels.forEach(l=>{ l.mesh.material.opacity=lop; l.mesh.visible=lop>.01; });
  backing.material.opacity=lop*.9;

  /* clock: the hand sweeps twice across the whole film; seconds tick */
  handGroup.rotation.z=(eased/(CH-1))*TAU*2+Math.sin(t*.6)*.015;
  handSec.rotation.z=ta*.8;
  const clockOp=sstep(.1,.5,eased)*(1-sstep(9.6,9.95,eased));
  clockGroup.visible=clockOp>.02;

  /* threads + clash frames + mood lights */
  updateThreads(eased);
  const frameFade=sstep(2.42,2.52,eased);
  [BLOCKS[1],BLOCKS[6],BLOCKS[14]].forEach((m,k)=>{
    const op=frameFade*(1-sstep(m.mw1+.02,m.mw1+.15,eased));
    clashFrames[k].material.opacity=op*(.45+.35*Math.sin(t*9));
    clashFrames[k].visible=op>.01;
  });
  plRed.intensity=sstep(2.45,2.6,eased)*(1-sstep(3.5,3.8,eased))*(.9+.25*Math.sin(t*5));
  plGreen.intensity=0;
  [1,6,14,17].forEach(i=>{ plGreen.intensity+=.8*bell(eased,BLOCKS[i].mw1+.1,.14); });

  /* hover pulse (feature rows) */
  pulse+=(pulseT-pulse)*(1-Math.exp(-dt*5));
  boardGroup.scale.setScalar(1+pulse*.02*Math.sin(t*9));

  /* ---- CAMERA: wide left↔right swings + idle sway + strong parallax + dolly breath ---- */
  mxs+=(tmx-mxs)*(1-Math.exp(-dt*3.5));
  mys+=(tmy-mys)*(1-Math.exp(-dt*3.5));
  const C=camMix(eased);
  const sway=Math.sin(t*.21)*.055+Math.sin(t*.117)*.03;
  const az=C.az+sway+mxs*.14;
  const el=C.el-mys*.09;
  const r=(C.r+Math.sin(t*.16)*.3)*(isMobile?1.2:1);
  /* impact shake when the draft slams in + micro-kicks on each landing */
  let amp=bell(eased,2.93,.09)*.05;
  [1,6,14,17].forEach(i=>{ amp+=bell(eased,BLOCKS[i].mw1,.05)*.012; });
  let shx=0,shy=0;
  if(amp>.0005&&!REDUCED){ shx=Math.sin(t*39)*amp; shy=Math.cos(t*47)*amp; }
  camera.position.set(
    Math.sin(az)*Math.cos(el)*r+shx,
    Math.sin(el)*r+.12+shy,
    Math.cos(az)*Math.cos(el)*r
  );
  camera.lookAt(0,.12+C.wy*.5,0);

  /* board pushed decisively to the free half of the screen */
  const aspect=innerWidth/innerHeight;
  const sideK=clamp((aspect-.8)*.9,.3,1)*(isMobile?.2:1);
  const rvx=Math.cos(az)*Math.cos(el), rvz=-Math.sin(az)*Math.cos(el);
  worldGroup.position.set(rvx*C.gx*sideK, C.wy+(isMobile?1.25:0), rvz*C.gx*sideK);
  worldGroup.scale.setScalar(isMobile?.62:1);

  /* FOV breathes through each cut */
  const frac=eased-Math.floor(eased);
  const fov=38+bell(frac,.5,.25)*2.5;
  camera.fov=fov; camera.updateProjectionMatrix();

  /* ---- 3D particle field: counter-drifting depth layers in background ---- */
  dustNear.rotation.z+=dt*.015*MOT;
  dustFar.rotation.z -=dt*.006*MOT;
  dustNear.material.uniforms.uTime.value=ta;
  dustFar.material.uniforms.uTime.value=ta;
  dustNear.position.set(-mxs*.9, -eased*1.1, 0);   // near layer: moves less with pointer, more with scroll
  dustFar.position.set( mxs*2.2, -eased*2.6, 0);   // far bokeh: drifts opposite → depth

  /* chapter crossfades + live staggering */
  for(let i=0;i<CH;i++){
    const w=CWINS[i];
    const op=sstep(w[0],w[1],eased)*(1-sstep(w[2],w[3],eased));
    const el2=secs[i];
    if(op<=.012){
      if(el2.style.visibility!=='hidden'){el2.style.visibility='hidden';el2.style.opacity=0;}
    }else{
      el2.style.visibility='visible';
      el2.style.opacity=op.toFixed(3);
      el2.style.transform=`translate3d(0,${((i-eased)*8).toFixed(2)}vh,0)`;
      el2.style.pointerEvents=op>.5?'auto':'none';
    }
  }

  const n=Math.round(eased);
  if(n!==lastN){
    lastN=n;
    secs.forEach((s,i)=>s.classList.toggle('live',i===n));
    railNum.textContent='0'+(n+1)+'/11';
    railDots.forEach((d,i)=>d.classList.toggle('on',i===n));
    readout.textContent=`CH 0${n+1}/11 — ${CH_NAMES[n]}`;
    readout.classList.remove('blink'); void readout.offsetWidth; readout.classList.add('blink');
    chTyping=(n===1);
    if(n===7&&!statsDone){statsDone=true;$$('.count').forEach(countUp);}
    if(n===8) startQuotes(); else stopQuotes();
  }

  /* solver HUD — synced to the hops */
  const pct=clamp((eased-SOLVE_T0)/(SOLVE_T1-SOLVE_T0),0,1);
  slBar.style.width=(pct*100).toFixed(1)+'%';
  slLines.forEach((l,i2)=>l.classList.toggle('on',eased>=LOG_LINES[i2]));
  cc[0].classList.toggle('ok',eased>3.2);
  cc[1].classList.toggle('ok',eased>3.6);
  cc[2].classList.toggle('ok',eased>3.85);
  if(eased<SOLVE_T0){ slPct.textContent='IDLE'; slPct.className='text-mist/50'; slDot.className='w-1.5 h-1.5 rounded-full bg-mist/30'; }
  else if(eased<SOLVE_T1){ slPct.textContent='SOLVING '+Math.round(pct*100)+'%'; slPct.className='text-go'; slDot.className='w-1.5 h-1.5 rounded-full bg-go animate-pulse'; }
  else { slPct.textContent='LOCKED ✓'; slPct.className='text-go'; slDot.className='w-1.5 h-1.5 rounded-full bg-go'; }

  /* letterbox during cuts */
  const lbTgt=bell(frac,.5,.22)*innerHeight*.032;
  lb+=(lbTgt-lb)*.16;
  lbT.style.height=lbB.style.height=lb.toFixed(1)+'px';

  /* rail / progress */
  railFill.style.height=(eased/(CH-1)*100).toFixed(2)+'%';
  pbar.style.width=(raw/(CH-1)*100).toFixed(2)+'%';

  /* lagging cursor ring */
  if(cursorSeen){
    rx+=(ringX-rx)*.18; ry2+=(ringY-ry2)*.18;
    ring.style.transform=`translate(${rx}px,${ry2}px) translate(-50%,-50%)`;
  }

  renderer.render(scene,camera);
  requestAnimationFrame(tick);
}

/* ================= boot ================= */
if(history.scrollRestoration) history.scrollRestoration='manual';
scrollTo(0,0);
requestAnimationFrame(tick);

function runLoader(){
  return new Promise(res=>{
    const dur=REDUCED?500:1400,t0=performance.now();
    (function step(){
      const p=clamp((performance.now()-t0)/dur,0,1),e=1-Math.pow(1-p,3);
      loadNum.textContent=String(Math.round(e*100));
      loadBar.style.width=(e*100)+'%';
      if(p<1)requestAnimationFrame(step); else res();
    })();
  });
}
runLoader().then(()=>{
  window.__sched2Ready=true;
  bootT=performance.now()/1000;   // the intro rain starts now
  loader.style.transform='translateY(-101%)';
  document.documentElement.classList.remove('lock');
  setTimeout(()=>loader.remove(),900);
});
