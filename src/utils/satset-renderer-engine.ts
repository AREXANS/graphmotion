// @ts-nocheck
/* eslint-disable */
import {
  Bt as e,
  Dn as t,
  En as n,
  Ft as r,
  It as i,
  Lt as a,
  Mt as o,
  Nt as s,
  On as c,
  Ot as l,
  Pt as u,
  Zt as d,
  _n as f,
  bt as p,
  cn as m,
  ct as h,
  dn as g,
  ft as _,
  gn as v,
  gt as y,
  ln as b,
  un as x,
  ut as S,
  wt as C,
  xn as w,
  xt as T,
  yt as E,
  zt as D,
} from "./satset-cloud-engine";
import { SATSET_STYLE_ID_ALIASES } from "./satset-style-demos";

const O = 0.05;
var ee=[{id:`match-morph`,label:`Match Cut Morph`,hint:`transisi sambung posisi & bentuk halus ala editor manusia`,len:.38,sfx:[[`swish`,-.26,.38],[`pop`,-.04,.28]]},{id:`cinema-whip`,label:`Whip Blur Halus`,hint:`geser kamera lembut dengan directional motion blur`,len:.34,sfx:[[`whoosh`,-.24,.44],[`swish`,-.04,.26]]},{id:`luma-dissolve`,label:`Luma Dissolve`,hint:`lebur cahaya sinematik tanpa patah`,len:.42,sfx:[[`swish`,-.3,.3]]},{id:`depth-focus`,label:`Depth Focus Pull`,hint:`tarik fokus lensa & kedalaman ruang halus`,len:.42,sfx:[[`swish`,-.3,.32],[`pop`,-.05,.22]]},{id:`editorial-split`,label:`Editorial Split`,hint:`belah layar diagonal bersih ala dokumenter modern`,len:.38,sfx:[[`swipe`,-.26,.38],[`click`,-.04,.22]]},{id:`whip-left`,label:`Geser kiri`,hint:`whip-pan halus ke kiri`,len:.32,sfx:[[`whoosh`,-.2,.52],[`thud`,0,.28]]},{id:`whip-right`,label:`Geser kanan`,hint:`whip-pan halus ke kanan`,len:.32,sfx:[[`whoosh`,-.2,.52],[`thud`,0,.28]]},{id:`whip-up`,label:`Geser atas`,hint:`whip-pan halus ke atas`,len:.32,sfx:[[`whoosh`,-.2,.52],[`thud`,0,.28]]},{id:`whip-down`,label:`Geser bawah`,hint:`whip-pan halus ke bawah`,len:.32,sfx:[[`whoosh`,-.2,.52],[`thud`,0,.28]]},{id:`zoom`,label:`Zoom tembus`,hint:`menerobos halus ke scene berikutnya`,len:.34,sfx:[[`whoosh`,-.22,.48],[`pop`,0,.32]]},{id:`spin`,label:`Putar`,hint:`berputar lembut sambil zoom`,len:.36,sfx:[[`swish`,-.24,.45],[`thud`,0,.26]]},{id:`iris`,label:`Lingkaran`,hint:`lingkaran membuka dari tengah`,len:.38,sfx:[[`swipe`,-.2,.44],[`pop`,0,.34]]},{id:`wipe`,label:`Sapu miring`,hint:`garis miring menyapu layar`,len:.36,sfx:[[`swipe`,-.22,.46],[`thud`,0,.24]]},{id:`swipe`,label:`Sapuan warna`,hint:`pita warna menutup lalu membuka`,len:.4,sfx:[[`swipe`,-.3,.5],[`thud`,-.05,.26]]},{id:`glitch`,label:`Glitch`,hint:`geser sinyal ringan`,len:.34,sfx:[[`glitch`,-.22,.42]]},{id:`flash`,label:`Kilat lembut`,hint:`pendar cahaya transisi`,len:.34,sfx:[[`shutter`,-.12,.4],[`thud`,0,.24]]},{id:`blinds`,label:`Tirai`,hint:`garis-garis membuka halus bergantian`,len:.4,sfx:[[`swipe`,-.3,.36],[`tick`,-.18,.28]]},{id:`drop`,label:`Luncura atas`,hint:`scene baru meluncur turun halus`,len:.42,sfx:[[`swish`,-.34,.4],[`thud`,-.1,.28]]},{id:`fade`,label:`Memudar`,hint:`pelan, saling berganti`,len:.38,sfx:[[`swish`,-.3,.3]]},{id:`dip`,label:`Celup gelap`,hint:`redup sebentar lalu terang`,len:.44,sfx:[[`swish`,-.3,.28]]},{id:`blur`,label:`Blur lembut`,hint:`kabur lalu tajam kembali`,len:.44,sfx:[[`swish`,-.3,.32]]},{id:`sambung`,label:`Menyambung`,hint:`tanpa transisi: gambar mengalir terus, untuk satu adegan yang berlanjut`,len:.22,sfx:[[`swish`,-.14,.36],[`pop`,0,.26]]}],te=e=>{let n=String(e||``).replace(/_/g,`-`);return ee.find(t=>t.id===n)??ee[0]},ne=[`match-morph`,`cinema-whip`,`depth-focus`,`editorial-split`,`luma-dissolve`,`whip-left`,`zoom`,`swipe`,`iris`],re=[`luma-dissolve`,`depth-focus`,`match-morph`,`fade`,`blur`],ie={futuristik:[`depth-focus`,`cinema-whip`,`match-morph`,`zoom`,`editorial-split`],uiweb:[`match-morph`,`editorial-split`,`depth-focus`,`swipe`,`luma-dissolve`],retro:[`editorial-split`,`match-morph`,`whip-left`,`zoom`,`whip-down`],popart:[`editorial-split`,`match-morph`,`swipe`,`cinema-whip`,`zoom`],infopop:[`match-morph`,`editorial-split`,`depth-focus`,`swipe`,`iris`],kolase:[`editorial-split`,`luma-dissolve`,`wipe`,`iris`],papercut:[`editorial-split`,`match-morph`,`wipe`,`luma-dissolve`,`iris`],dither:[`editorial-split`,`wipe`,`swipe`,`match-morph`],kuas:[`luma-dissolve`,`depth-focus`,`fade`,`blur`],arsip:[`luma-dissolve`,`fade`,`dip`,`wipe`],sketsa:[`match-morph`,`luma-dissolve`,`wipe`,`fade`],siluet:[`luma-dissolve`,`depth-focus`,`fade`,`dip`],monofilm:[`luma-dissolve`,`fade`,`dip`,`editorial-split`],kolab:[`match-morph`,`editorial-split`,`swipe`,`zoom`],kilat:[`cinema-whip`,`match-morph`,`whip-left`,`zoom`],kapur:[`wipe`,`swipe`,`whip-left`,`match-morph`],blueprint:[`editorial-split`,`match-morph`,`wipe`,`zoom`],oneline:[`match-morph`,`luma-dissolve`,`wipe`,`fade`],tenang:[`luma-dissolve`,`depth-focus`,`fade`,`blur`],kinetik:[`cinema-whip`,`match-morph`,`editorial-split`,`zoom`],neongame:[`cinema-whip`,`depth-focus`,`editorial-split`,`zoom`],pitch:[`match-morph`,`editorial-split`,`luma-dissolve`,`wipe`],pixelbook:[`editorial-split`,`swipe`,`match-morph`,`whip-left`,`wipe`],reel:[`cinema-whip`,`match-morph`,`editorial-split`,`zoom`],ruang:[`depth-focus`,`match-morph`,`luma-dissolve`,`iris`],produk:[`match-morph`,`depth-focus`,`luma-dissolve`,`editorial-split`],heboh:[`cinema-whip`,`match-morph`,`editorial-split`,`zoom`],edukasi:[`match-morph`,`editorial-split`,`depth-focus`,`swipe`],garis:[`luma-dissolve`,`depth-focus`,`fade`,`swipe`],cahaya:[`luma-dissolve`,`depth-focus`,`fade`],aurora:[`luma-dissolve`,`depth-focus`,`fade`,`iris`],rasi:[`luma-dissolve`,`depth-focus`,`fade`],belah:[`editorial-split`,`wipe`,`swipe`,`match-morph`],tiket:[`editorial-split`,`swipe`,`match-morph`,`wipe`],diorama:[`depth-focus`,`match-morph`,`luma-dissolve`,`editorial-split`],studio_3d_room:[`depth-focus`,`match-morph`,`luma-dissolve`,`cinema-whip`],editorial_motion_grid:[`editorial-split`,`match-morph`,`cinema-whip`,`swipe`,`depth-focus`],otomatis:[`editorial-split`,`match-morph`,`cinema-whip`,`swipe`,`depth-focus`],stopmotion_clay:[`match-morph`,`editorial-split`,`wipe`,`iris`],sticker_bomb:[`match-morph`,`editorial-split`,`swipe`,`zoom`],hyper_zoom:[`depth-focus`,`cinema-whip`,`match-morph`,`zoom`],soft_glow:[`luma-dissolve`,`depth-focus`,`fade`,`blur`],bounce_cartoon:[`match-morph`,`cinema-whip`,`swipe`,`iris`],bubble_gum:[`match-morph`,`iris`,`luma-dissolve`,`swipe`],confetti_blast:[`cinema-whip`,`match-morph`,`swipe`,`zoom`],panduan:[`match-morph`,`luma-dissolve`,`depth-focus`]};function ae(e,t,n){let norm=x=>String(x||``).replace(/_/g,`-`);if(n?.transition&&ee.some(e=>e.id===norm(n.transition)))return norm(n.transition);if(t.transition&&ee.some(e=>e.id===norm(t.transition)))return norm(t.transition);let r=S(t.art,t.look).id,i=t.pace===`santai`?re:ie[r]??(S(t.art,t.look).continuous?[`match-morph`,`luma-dissolve`,`depth-focus`,`editorial-split`]:ne);return i[e%i.length]}var oe=e=>te(e).len,se=e=>te(e).sfx,k=e=>{let t=Math.sin(e*127.1+311.7)*43758.5453;return t-Math.floor(t)},ce=e=>e<.5?4*e*e*e:1-(-2*e+2)**3/2,A=e=>Math.max(0,Math.min(1,e)),le=e=>{let t=7.5625,n=2.75;return e<1/n?t*e*e:e<2/n?t*(e-=1.5/n)*e+.75:e<2.5/n?t*(e-=2.25/n)*e+.9375:t*(e-=2.625/n)*e+.984375},j=null;function ue(){j||=document.createElement(`canvas`),(j.width!==r||j.height!==u)&&(j.width=r,j.height=u);let e=j.getContext(`2d`);return e.setTransform(1,0,0,1,0,0),e.clearRect(0,0,r,u),{canvas:j,c:e}}function de(e,t,n){e.save(),e.globalAlpha=Math.sin(A(t)*Math.PI)*.16,e.strokeStyle=`#ffffff`,e.lineCap=`round`;for(let i=0;i<6;i++){e.lineWidth=1.5+k(i)*2,e.beginPath();let s=k(i+1),a=k(i+2),o=90+k(i+3)*130;n?(e.moveTo(s*r,a*u),e.lineTo(s*r,a*u+o)):(e.moveTo(a*r,s*u),e.lineTo(a*r+o,s*u)),e.stroke()}e.restore()}var fe=[],pe=0,M=null,M2=null;function me(e,t,n,i,a){if(i<=.01)return;if(n<.7)return N(e,()=>(e.globalAlpha=i,P(e,a),t(e)));let{canvas:o,c:s}=ue();t(s);if(typeof e.filter===`string`){let l=Math.min(18,n*.9);return N(e,()=>{e.globalAlpha=i,e.imageSmoothingEnabled=!0,e.imageSmoothingQuality=`high`,P(e,a*(1+Math.min(.025,n*.002))),e.filter=`blur(${l.toFixed(1)}px)`,e.drawImage(o,0,0),e.filter=`none`})}let c=1+n/2.8,l1=Math.max(2,Math.round(r/Math.sqrt(c))),d1=Math.max(2,Math.round(u/Math.sqrt(c))),l2=Math.max(2,Math.round(r/c)),d2=Math.max(2,Math.round(u/c));M2??=document.createElement(`canvas`),(M2.width!==l1||M2.height!==d1)&&([M2.width,M2.height]=[l1,d1]);let f2=M2.getContext(`2d`);f2.imageSmoothingQuality=`high`,f2.clearRect(0,0,l1,d1),f2.drawImage(o,0,0,l1,d1),M??=document.createElement(`canvas`),(M.width!==l2||M.height!==d2)&&([M.width,M.height]=[l2,d2]);let f=M.getContext(`2d`);f.imageSmoothingQuality=`high`,f.clearRect(0,0,l2,d2),f.drawImage(M2,0,0,l2,d2),N(e,()=>{e.globalAlpha=i,e.imageSmoothingEnabled=!0,e.imageSmoothingQuality=`high`,P(e,a),e.drawImage(M,0,0,r,u)})}var N=(e,t)=>{e.save(),t(),e.restore()},P=(e,t,n=0)=>{e.translate(r/2,u/2),n&&e.rotate(n),e.scale(t,t),e.translate(-r/2,-u/2)};function he(e,t,n,i,a,o,s=`#1c1530`){let p=A(n),snap=bt(p),c=ce(p),q=bt(p),tnorm=String(t||``).replace(/_/g,`-`);switch(tnorm){case`match-morph`:{let s1=1+snap*.11,s2=.9+snap*.1,outA=Math.max(0,1-snap*1.08),inA=Math.min(1,snap*1.15);N(e,()=>(e.globalAlpha=outA,e.translate(-r*.055*snap,0),P(e,s1,-snap*.016),i(e))),N(e,()=>(e.globalAlpha=inA,e.translate(r*.055*(1-snap),0),P(e,s2,(1-snap)*.016),a(e)));return}case`cinema-whip`:{let blurAmt=Math.sin(p*Math.PI)*7.5,whipCurve=snap;N(e,()=>(e.translate(-r*.86*whipCurve,0),me(e,i,blurAmt,1-whipCurve*.48,1+.04*whipCurve))),N(e,()=>(e.translate(r*.86*(1-whipCurve),0),me(e,a,blurAmt,.42+whipCurve*.58,1.04-.04*whipCurve)));return}case`luma-dissolve`:{i(e),N(e,()=>{e.globalAlpha=snap,a(e)}),N(e,()=>{let glow=Math.sin(p*Math.PI)*.24,grd=e.createRadialGradient(r/2,u*.44,r*.05,r/2,u*.44,r*.92);grd.addColorStop(0,o||`#38bdf8`),grd.addColorStop(1,`rgba(255,255,255,0)`),e.globalAlpha=glow,e.fillStyle=grd,e.fillRect(0,0,r,u)});return}case`depth-focus`:{me(e,i,snap*9.5,Math.max(0,1-snap*.94),1+.14*snap),me(e,a,(1-snap)*9.5,Math.min(1,snap*1.15),.89+.11*snap);return}case`editorial-split`:{i(e);let slant=r*.18,edge=-slant+snap*(r+slant*2);N(e,()=>{e.beginPath(),e.moveTo(-20,-20),e.lineTo(edge+slant,-20),e.lineTo(edge-slant,u+20),e.lineTo(-20,u+20),e.closePath(),e.clip(),e.translate((1-snap)*26,0),a(e)}),N(e,()=>{e.strokeStyle=o||`#38bdf8`,e.globalAlpha=.92,e.lineWidth=4.5*(1-Math.abs(n-.5)*1.4),e.beginPath(),e.moveTo(edge+slant,-10),e.lineTo(edge-slant,u+10),e.stroke()});return}case`whip-left`:case`whip-right`:case`whip-up`:case`whip-down`:{let[dx,dy]=tnorm===`whip-left`?[-r,0]:tnorm===`whip-right`?[r,0]:tnorm===`whip-up`?[0,-u]:[0,u],blurAmt=Math.sin(p*Math.PI)*4.8;N(e,()=>(e.translate(dx*snap,dy*snap),me(e,i,blurAmt,1-snap*.22,1))),N(e,()=>(e.translate(-dx*(1-snap),-dy*(1-snap)),me(e,a,blurAmt,.78+snap*.22,1))),de(e,n,dy!==0);return}case`zoom`:N(e,()=>(e.globalAlpha=Math.max(0,1-snap*.95),P(e,1+snap*.44),i(e))),N(e,()=>(e.globalAlpha=Math.min(1,snap*1.12),P(e,.82+snap*.18),a(e)));return;case`spin`:N(e,()=>(e.globalAlpha=Math.max(0,1-q*.7),P(e,1+q*.28,q*.28),i(e))),N(e,()=>(e.globalAlpha=q,P(e,.78+q*.22,-(1-q)*.28),a(e)));return;case`iris`:{i(e);let t=q*Math.hypot(r,u)*.55;N(e,()=>{e.beginPath(),e.arc(r/2,u/2,Math.max(.1,t),0,Math.PI*2),e.clip(),a(e)}),N(e,()=>{e.strokeStyle=o,e.globalAlpha=1-q*.6,e.lineWidth=4+8*(1-q),e.beginPath(),e.arc(r/2,u/2,Math.max(.1,t),0,Math.PI*2),e.stroke()});return}case`wipe`:{i(e);let t=u*.28,edge=-t+q*(r+t*2);N(e,()=>{e.beginPath(),e.moveTo(-10,-10),e.lineTo(edge+t,-10),e.lineTo(edge,u+10),e.lineTo(-10,u+10),e.closePath(),e.clip(),a(e)}),N(e,()=>{e.strokeStyle=o,e.globalAlpha=.75*(1-Math.abs(q-.5)*.8),e.lineWidth=7,e.beginPath(),e.moveTo(edge+t,-10),e.lineTo(edge,u+10),e.stroke()});return}case`swipe`:{let t=n<.5;(t?i:a)(e);let c=bt(A(t?n/.5:(n-.5)/.5)),l=r*.12,d=(n,i)=>{let a=t?r-(r+l)*c+i:-l+i,o=t?r+l:r+l-(r+l*2)*c+i;e.fillStyle=n,e.fillRect(a,0,Math.max(0,o-a),u)};N(e,()=>{d(o,t?0:l),d(s,t?l:0)});return}case`glitch`:{let{canvas:t,c:o2}=ue();(n<.5?i:a)(o2);let s=Math.sin(A(n)*Math.PI),c2=Math.floor(A(n)*8);e.drawImage(t,0,0);for(let k2=0;k2<5;k2++){let iy=k(c2*13+k2)*u,ah=24+k(c2*7+k2+.5)*80,ox=(k(c2*3+k2+.2)-.5)*32*s;e.drawImage(t,0,iy,r,ah,ox,iy,r,ah)}N(e,()=>{e.globalAlpha=.14*s,e.globalCompositeOperation=`screen`;for(let t2=0;t2<2;t2++)e.fillStyle=t2%2?`#38bdf8`:`#f43f5e`,e.fillRect(0,k(c2+t2*2.3)*u,r,6+k(c2+t2)*14)});return}case`flash`:{let t=n<.5;N(e,()=>(P(e,1+.035*Math.sin(A(n)*Math.PI)),(t?i:a)(e))),N(e,()=>{e.globalAlpha=Math.sin(A(n)*Math.PI)*.38,e.fillStyle=`#fff7ed`,e.fillRect(0,0,r,u)});return}case`blinds`:{i(e);let t=u/7;N(e,()=>{e.beginPath();for(let k2=0;k2<7;k2++){let a2=bt(A(n*1.35-k2*.035));e.rect(0,k2*t+t*(1-a2)/2,r,t*a2)}e.clip(),a(e)});return}case`drop`:i(e),N(e,()=>{e.globalAlpha=.28*q,e.fillStyle=`#0f172a`,e.fillRect(0,0,r,u)}),N(e,()=>(e.globalAlpha=Math.min(1,q*1.25),e.translate(0,-u*.28*(1-q)),P(e,.96+.04*q),a(e)));return;case`fade`:i(e),N(e,()=>(e.globalAlpha=q,a(e)));return;case`sambung`:{i(e);let t=fe[pe]??=document.createElement(`canvas`);(t.width!==r||t.height!==u)&&([t.width,t.height]=[r,u]);let o=t.getContext(`2d`);o.setTransform(1,0,0,1,0,0),o.clearRect(0,0,r,u),pe++;try{a(o)}finally{pe--}N(e,()=>{e.globalAlpha=q,e.drawImage(t,0,0)});return}case`dip`:{let t=n<.5;(t?i:a)(e),N(e,()=>{e.globalAlpha=t?bt(A(n*2)):1-bt(A((n-.5)*2)),e.fillStyle=`#14101f`,e.fillRect(0,0,r,u)});return}case`blur`:me(e,i,q*10,Math.max(0,1-q*.65),1+.04*q),me(e,a,(1-q)*10,q,1.04-.04*q);return}}var ge=e=>{let t=e.replace(`#`,``),n=t.length===3?t.split(``).map(e=>e+e).join(``):t;return[0,2,4].map(e=>parseInt(n.slice(e,e+2),16)||0)},_e=[{id:`tangan`,label:`Tulisan Tangan`,hint:`kecil, kata ditulis seperti pena + coretan di kata kunci`},{id:`ketik`,label:`Mesin Ketik`,hint:`huruf per huruf dengan kursor berkedip`},{id:`sorot`,label:`Sorot Kata`,hint:`kalimat utuh, penanda oranye meluncur ke kata yang diucapkan`},{id:`stiker`,label:`Stiker Kertas`,hint:`baris di atas strip kertas yang ditempel, kata kunci dilingkari`},{id:`pop`,label:`Pop Tebal`,hint:`besar dan tebal, kata meletup satu per satu`},{id:`karaoke`,label:`Karaoke`,hint:`kalimat utuh samar, kata terisi warna saat diucapkan`},{id:`kotak`,label:`Kotak Putih`,hint:`ala TikTok: teks hitam di atas kotak putih yang tumbuh per kata`},{id:`gelap`,label:`Kotak Gelap`,hint:`panel gelap, kata menyala putih saat diucapkan, kata kunci berwarna`},{id:`glitch`,label:`Glitch`,hint:`tebal dengan bayangan cyan & magenta yang bergetar saat kata muncul`},{id:`panduan`,label:`Panduan Atas`,hint:`di atas layar, kata muncul satu per satu, kata terbaru tebal putih, kata kunci dibingkai garis kuning`},{id:`elegan`,label:`Elegan Atas`,hint:`di atas layar, huruf miring tipis, kata kunci tebal, muncul pelan`},{id:`satu`,label:`Satu Kata`,hint:`satu kata besar di tengah, ganti mengikuti suara`},{id:`neon`,label:`Neon`,hint:`papan gelap dengan kata menyala berkedip saat muncul`},{id:`selotip`,label:`Kartu Selotip`,hint:`kartu kertas krem berselotip kuning, kata kunci distabilo kuning`},{id:`garis`,label:`Garis Bawah`,hint:`kapital bersih tanpa panel, kata kunci lebih tegas dengan garis bawah warna aksen`},{id:`redup`,label:`Karaoke Redup`,hint:`rata tengah tanpa panel, kalimat menunggu redup, kata menjadi putih saat diucapkan, kata kunci menyala berwarna`},{id:`off`,label:`Tanpa Subtitle`,hint:`video tanpa teks, hanya ilustrasi dan suara`}],ve=[{id:`auto`,label:`Otomatis (Anti-Halang)`,pos:{x:.5,y:.855}},{id:`tl`,label:`Kiri atas`,pos:{x:.3,y:.14}},{id:`tc`,label:`Atas`,pos:{x:.5,y:.14}},{id:`tr`,label:`Kanan atas`,pos:{x:.7,y:.14}},{id:`ml`,label:`Kiri tengah`,pos:{x:.3,y:.5}},{id:`mc`,label:`Tengah`,pos:{x:.5,y:.5}},{id:`mr`,label:`Kanan tengah`,pos:{x:.7,y:.5}},{id:`bl`,label:`Kiri bawah`,pos:{x:.3,y:.855}},{id:`bc`,label:`Bawah`,pos:{x:.5,y:.855}},{id:`br`,label:`Kanan bawah`,pos:{x:.7,y:.855}}],ye={x:.45,y:.66},be=(e,t)=>{let n=e?.captionPos??t?.captionPos??`auto`;if(!n||n===`auto`||n.id===`auto`)return Ye(t)?{x:.5,y:.14}:(t?.art===`editorial_motion_grid`||t?.art===`otomatis`)?{x:.36,y:.82}:{x:.5,y:.855};if(typeof n===`string`)return ve.find(e=>e.id===n)?.pos??(Ye(t)?{x:.5,y:.14}:{x:.5,y:.855});return n},xe={pop:.62,tangan:.8,ketik:.9,sorot:.8,stiker:.85,karaoke:.75,gelap:.75,glitch:.75,elegan:.9,panduan:.9,selotip:.9,garis:.8,redup:.9,kotak:.8,satu:.6,neon:.8},Se=.35,Ce=1.4,we=e=>e.captionScale??xe[F(e)]??.8;function Te(e){return{x:r/2,y:Ye(e)?Math.round(o.H*.175):o.capY}}function Ee(e){let t=Math.min(1.15,Math.max(.45,e.captionWidth??1))*Ie*o.capWidth,n=we(e)*o.capScale;return{w:Math.min(.98,620*t/o.W),h:Math.min(.5,190*n/o.H)}}var F=e=>e.caption??S(e.art,e.look).caption??(e.look===`crayon`?`ketik`:`pop`),De=e=>[`pop`,`stiker`,`sorot`,`kotak`,`satu`,`selotip`].includes(F(e)),Oe=.06,I=`#2563EB`,ke=()=>y(I)>=.25?I:`#38bdf8`;function L(e){let t=Math.sin(e*91.17+7.3)*43758.5453;return t-Math.floor(t)}var R=e=>1+2.70158*(e-1)**3+1.70158*(e-1)**2,z=e=>1-(1-Math.min(1,Math.max(0,e)))**3;function Ae(e,t,n){let r=t.split(/\s+/).filter(Boolean),i=[],a=``;for(let t of r){let r=a?`${a} ${t}`:t;e.measureText(r).width>n&&a?(i.push(a),a=t):a=r}return a&&i.push(a),i}function B(e,t,n,r,i,a,o){let s=r,c=[];for(;s>=i&&(e.font=n(s),c=Ae(e,t,a),!(c.length<=o));s-=2);return{size:Math.max(s,i),lines:c}}function je(e,t){let n=Math.max(0,(t+Oe)/O),r=Math.floor(n);return r>=e.length-1?e[e.length-1]:e[r]+(e[r+1]-e[r])*(n-r)}function Me(e,t,n){let r=e.text.split(/\s+/).filter(Boolean);if(e.wordAt&&e.wordAt.length===r.length){let n=e.wordAt,i=0,a=0;return r.forEach((e,r)=>{let o=n[r+1]??n[r]+.35,s=Math.max(0,Math.min(1,(t-n[r])/Math.max(.05,o-n[r])));s>0&&(a=i+s*(e.length+1)),i+=e.length+1}),Math.min(1,a/Math.max(1,e.text.length))}let i=e.captionCurve;if(i&&i.length>1)return je(i,t);let a=n.pace===`energik`,o=a?40:26,s=Math.min(e.duration*(a?.45:.6),Math.max(.4,e.text.length/o));return Math.max(0,Math.min(1,(t-(a?.05:.15))/s))}var V=e=>e.toLowerCase().replace(/[^\p{L}\p{N}]/gu,``),Ne=/^(dll|dsb|dst|dkk|rp|no|dr|drs|ir|jl|tgl|hlm|mis|prof|pt|cv|tn|ny|sdr|e\.g|i\.e|vs|mr|mrs|ms|st)\.$/i;function Pe(e){let t=[],n=0;return e.forEach((r,i)=>{i+1<e.length&&/[.!?…]+["'”’)\]]*$/.test(r)&&!Ne.test(r)&&(t.push([n,i+1]),n=i+1)}),n<e.length&&t.push([n,e.length]),t}function H(e,t){let n=e.text.split(/\s+/).filter(Boolean);if(e.wordAt&&e.wordAt.length===n.length)return e.wordAt;let r=e.text.length||1,i=[],a=0;for(let t of n){let n=e.text.indexOf(t,a);i.push(n<0?a:n),a=(n<0?a:n)+t.length}let o=e.captionCurve;if(o&&o.length>1)return i.map(t=>{let n=Math.max(.001,t/r),i=o.findIndex(e=>e>=n);return i<0?e.duration:i*O-Oe});let s=t.pace===`energik`,c=Math.max(.4,e.duration*(s?.83:.88)-.08),l=n.map((e,t)=>{let r=Math.max(.75,Math.min(2.1,e.replace(/[^\p{L}\p{N}]/gu,``).length/5.2)),i=t<n.length-1?/[.!?…]+$/.test(e)?s?.22:.32:/[,;:—–-]+$/.test(e)?s?.12:.18:0:0;return r+i}),u=l.reduce((e,t)=>e+t,0)||1,d=.05;return l.map(e=>{let t=d;return d+=e/u*c,t})}function U(e,t,n,i,a=e=>0){let s=[],c=o.capY-(t.length-1)*n/2,l=e.measureText(` `).width,u=x(t.join(` `).split(` `)),d=0;return t.forEach((t,o)=>{let f=t.split(` `),p=f.map(t=>e.measureText(t).width),h=f.map((e,t)=>p[t]+(i.has(V(e))?a(p[t]):0)),g=h.reduce((e,t)=>e+t,0)+l*(f.length-1),_=b(f,h,l,u),v=r/2-g/2;f.forEach((e,t)=>{s.push({word:e,index:d++,line:o,cx:v+_[t]+h[t]/2,y:c+o*n,width:p[t],emph:i.has(V(e)),rtl:m(e)})})}),s}var W=e=>new Set((e.emphasis??``).split(/\s+/).map(V).filter(Boolean));function Fe(e,t){let n=W(e);if(!n.size)return;let r=e.text.split(/\s+/).filter(Boolean).findIndex(e=>n.has(V(e)));return r<0?void 0:H(e,t)[r]}var G=!1,Ie=.92,K=1,q=0,Le=(e,t)=>G?`#f4f1e6`:`#2b2a28`;function Re(e,t,n){if(n<=0||t.length<2)return;let r=n*(t.length-1);e.beginPath(),e.moveTo(t[0][0],t[0][1]);for(let n=1;n<=Math.ceil(r);n++){let i=Math.min(1,r-(n-1)),[a,o]=t[n-1],[s,c]=t[n];e.lineTo(a+(s-a)*i,o+(c-o)*i)}e.stroke()}function ze(e,t,n,r){e.beginPath();for(let i=0;i<8;i++){let a=i/8*Math.PI*2,o=i%2?r*.35:r;e.lineTo(t+Math.cos(a)*o,n+Math.sin(a)*o)}e.closePath(),e.fill()}function Be(e,t){let n=/^#([0-9a-f]{6})$/i.exec(e.trim());if(!n)return e;let r=parseInt(n[1],16),i=e=>Math.round(t<0?e*(1+t):e+(255-e)*t);return`rgb(${i(r>>16)}, ${i(r>>8&255)}, ${i(r&255)})`}function Ve(e,t,n,r,i){let a=W(t),o=H(t,r),{size:s,lines:c}=B(e,t.text,e=>`${X} ${e}px ${Y}`,Math.round(66*i),Math.round(36*i),600*K,3+q);e.font=`${X} ${s}px ${Y}`,e.textBaseline=`middle`,e.textAlign=`center`,e.lineJoin=`round`;let l=c.some(e=>e.split(/\s+/).some(e=>a.has(V(e))));for(let r of U(e,c,s*(l?1.3:1.12),a,e=>e*.1+s*.75)){let i=n-o[r.index];if(i<0)continue;let a=Math.min(1,i/.2),c=R(a)*(r.emph?1.1:1);if(e.save(),e.globalAlpha=Math.min(1,i/.06),e.translate(r.cx,r.y+(1-a)*18),e.rotate((L(r.index+t.text.length)-.5)*.07),e.scale(c,c),r.emph){let t=r.width/2+s*.3,n=s*.6,i=s*.24,a=s*.13,o=(r,a)=>{e.beginPath(),e.roundRect(-t+r,-n+a,t*2,n*2,i)};e.lineJoin=`round`,o(a*.6,a),e.fillStyle=Be(I,-.32),e.fill(),e.lineWidth=s/11,e.strokeStyle=`#1f1a17`,e.stroke(),o(0,0),e.fillStyle=I,e.fill(),e.stroke(),e.beginPath(),e.roundRect(-t+s*.18,-n+s*.12,t*2-s*.36,s*.16,s*.08),e.fillStyle=`rgba(255,255,255,0.35)`,e.fill()}e.fillStyle=`rgba(0,0,0,0.28)`,r.emph||e.fillText(r.word,3,6),e.lineWidth=s/(r.emph?8:6.5),e.strokeStyle=`#1f1a17`,e.strokeText(r.word,0,0),e.fillStyle=`#ffffff`,e.fillText(r.word,0,0),e.restore()}}function He(e,t,n,r,i){let a=W(t),o=H(t,r),s=Le(t,r),{size:c,lines:l}=B(e,t.text,e=>`${ct} ${e}px ${st}`,Math.round(46*i),Math.round(30*i),580*K,3+q);e.font=`${ct} ${c}px ${st}`,e.textBaseline=`middle`,e.textAlign=`left`,e.lineCap=`round`,e.lineJoin=`round`;let u=r.pace===`energik`?.16:.24;for(let t of U(e,l,c*1.3,a)){let r=n-o[t.index];if(r<0)continue;let a=z(r/u),l=t.cx-t.width/2,d=Math.sin(n*2+t.index*.7)*1.5,f=(L(t.index+3)-.5)*.05;e.save(),e.translate(t.cx,t.y+d),e.rotate(f),e.translate(-t.cx,-t.y),e.save(),e.beginPath();let[p,m]=g(l-4,t.width+8,a,t.rtl);if(e.rect(p,t.y-c,m,c*2),e.clip(),J(e,t.word,l,t.y,c),e.fillStyle=t.emph?I:s,e.fillText(t.word,l,t.y),e.restore(),a<1&&(e.fillStyle=t.emph?I:s,e.beginPath(),e.arc(t.rtl?l+t.width*(1-a):l+t.width*a,t.y+c*.18,3.2*i,0,Math.PI*2),e.fill()),t.emph){let n=z((r-u*.6)/.35);e.strokeStyle=I,e.lineWidth=3.4*i;let a=t.y+c*.48,o=[];for(let e=0;e<=12;e++){let n=e/12;o.push([l-6+(t.width+12)*n,a+Math.sin(n*9+t.index)*2.2])}for(let e=12;e>=0;e--){let n=e/12;o.push([l+(t.width+4)*n,a+6*i+Math.sin(n*7+1)*2])}Re(e,o,n);let s=r-u-.2;if(s>0&&s<.9){e.fillStyle=`#ffc93c`;let n=1-s/.9;e.globalAlpha=n,ze(e,l+t.width+12,t.y-c*.55-s*14,9*i*(.6+n*.4)),ze(e,l-10,t.y-c*.35-s*10,6*i*(.6+n*.4)),e.globalAlpha=1}}e.restore()}}function Ue(e,t,n,i,a){let s=t.text,c=Me(t,n,i),l=s.length*c,u=Math.floor(l),d=l-u,f=W(t),{size:p,lines:h}=B(e,s,e=>`${ct} ${e}px ${st}`,Math.round(40*a),Math.round(28*a),580*K,4+q);e.font=`${ct} ${p}px ${st}`,e.textBaseline=`middle`,e.textAlign=`left`;let _=p*1.35,v=o.capY-(h.length-1)*_/2,y=Le(t,i),S=0,C=null,w=e.measureText(` `).width,T=x(s.split(/\s+/));h.forEach((t,n)=>{let i=v+n*_,a=S;S+=t.length+1;let o=u-a,s=e.measureText(t).width,c=r/2-s/2,l=t.split(` `),x=l.map(t=>e.measureText(t).width),E=b(l,x,w,T),D=0;l.forEach((r,a)=>{let s=c+E[a],u=Math.max(0,Math.min(r.length,o-D)),_=o>=D&&o<D+r.length;if(e.fillStyle=f.has(V(r))?I:y,m(r)){let t=(u+(_?d:0))/r.length;if(t>0){let[n,o]=g(s,x[a],t,!0);e.save(),e.beginPath(),e.rect(n-2,i-p,o+4,p*2),e.clip(),J(e,r,s,i,p),e.fillText(r,s,i),e.restore(),_&&(C=[n-6,i])}}else{let t=r.slice(0,u);if(t&&(J(e,t,s,i,p),e.fillText(t,s,i)),_){let n=e.measureText(t).width;e.globalAlpha=d*.6,e.fillStyle=y,e.fillText(r[u],s+n,i),e.globalAlpha=1,C=[s+n+e.measureText(r[u]).width*d,i]}}(o===D+r.length||o>t.length&&n===h.length-1&&a===l.length-1)&&(C=m(r)?[s-10,i]:[s+x[a]+4,i]),D+=r.length+1})}),C&&(c<1||Math.floor(n*2.2)%2==0)&&(e.fillStyle=I,e.fillRect(C[0]+2,C[1]-p*.42,3.5*a,p*.84))}function We(e,t,n,r,i){let a=W(t),o=H(t,r),s=Le(t,r),{size:c,lines:l}=B(e,t.text,e=>`${X} ${e}px ${Y}`,Math.round(48*i),Math.round(30*i),600*K,3+q);e.font=`${X} ${c}px ${Y}`,e.textBaseline=`middle`,e.textAlign=`center`;let u=U(e,l,c*1.3,a),d=z(n/.3),f=-1;for(let e of u)n>=o[e.index]&&(f=e.index);if(f>=0){let t=u[f],r=u[Math.max(0,f-1)],i=f===0?1:R(Math.min(1,(n-o[f])/.18)),a=r.cx+(t.cx-r.cx)*i,s=r.y+(t.y-r.y)*Math.min(1,i),l=r.width+(t.width-r.width)*i+26,d=c*1.12,p=f===0?R(Math.min(1,(n-o[0])/.22)):1;e.save(),e.translate(a,s),e.rotate(-.025),e.scale(p,p),e.fillStyle=t.emph?`#ffd23c`:I,e.beginPath(),e.roundRect(-l/2,-d/2,l,d,d*.35),e.fill(),e.restore()}for(let t of u){let r=n>=o[t.index],i=t.index===f,a=n-o[t.index],l=i?Math.sin(Math.min(1,a/.18)*Math.PI)*6:0;e.save(),e.globalAlpha=d*(r?1:.32),i||J(e,t.word,t.cx,t.y-l+(1-d)*14,c),e.fillStyle=i?t.emph?`#1f1a17`:`#ffffff`:t.emph&&r?I:s,e.fillText(t.word,t.cx,t.y-l+(1-d)*14),e.restore()}}function Ge(e,t,n,r,i){let a=W(t),o=H(t,r),{size:s,lines:c}=B(e,t.text,e=>`${X} ${e}px ${Y}`,Math.round(44*i),Math.round(28*i),560*K,3+q);e.font=`${X} ${s}px ${Y}`,e.textBaseline=`middle`,e.textAlign=`center`;let l=U(e,c,s*1.55,a,()=>34*i),u=22*i;c.forEach((r,a)=>{let c=l.filter(e=>e.line===a),d=n-o[c[0].index];if(d<0)return;let f=Math.min(1,d/.28),p=1+(1-R(f))*.35,m=Math.min(...c.map(e=>e.cx-e.width/2))-u,h=Math.max(...c.map(e=>e.cx+e.width/2))+u,g=(m+h)/2,_=c[0].y,v=(L(a+t.text.length)-.5)*.08;e.save(),e.translate(g,_),e.rotate(v+(1-f)*.12*(a%2?-1:1)),e.scale(p,p),e.globalAlpha=Math.min(1,d/.08);let y=h-m,b=s*1.3;e.fillStyle=`rgba(0,0,0,0.18)`,e.fillRect(-y/2+5,-b/2+7,y,b),e.fillStyle=`#fffdf6`,e.beginPath(),e.moveTo(-y/2,-b/2);for(let t=0;t<=10;t++)e.lineTo(-y/2+y*t/10,-b/2+(L(t+a*11)-.5)*3);e.lineTo(y/2,b/2);for(let t=10;t>=0;t--)e.lineTo(-y/2+y*t/10,b/2+(L(t+a*7+50)-.5)*4);e.closePath(),e.fill(),e.fillStyle=`rgba(255,190,90,0.75)`,e.save(),e.translate(-y/2+8,-b/2+2),e.rotate(-.5),e.fillRect(-22*i,-9*i,44*i,18*i),e.restore(),e.restore(),e.save(),e.translate(g,_),e.rotate(v+(1-f)*.12*(a%2?-1:1)),e.scale(p,p);for(let t of c){let r=n-o[t.index];if(r<0)continue;let a=R(Math.min(1,r/.16));if(e.save(),e.translate(t.cx-g,0),e.scale(a,a),e.fillStyle=t.emph?`#e8452c`:`#1f1a17`,e.fillText(t.word,0,2),t.emph){let n=z((r-.12)/.45);e.strokeStyle=`#e8452c`,e.lineWidth=3.2*i,e.lineCap=`round`;let a=t.width/2+14,o=s*.62,c=[];for(let e=0;e<=28;e++){let t=-2.6+e/28*Math.PI*2.15;c.push([Math.cos(t)*a*(1+e*.002),Math.sin(t)*o+e*.12])}Re(e,c,n)}e.restore()}e.restore()})}function Ke(e,t,n,r,i){let a=W(t),o=H(t,r),{size:s,lines:c}=B(e,t.text,e=>`${X} ${e}px ${Y}`,Math.round(54*i),Math.round(32*i),600*K,3+q);e.font=`${X} ${s}px ${Y}`,e.textBaseline=`middle`,e.textAlign=`left`,e.lineJoin=`round`;let l=U(e,c,s*1.22,a);e.globalAlpha=z(n/.3);for(let t of l){let r=t.cx-t.width/2,i=o[t.index+1]??o[t.index]+.35,a=Math.max(0,Math.min(1,(n-o[t.index])/Math.max(.08,i-o[t.index])));if(e.lineWidth=s/6.5,e.strokeStyle=`#1f1a17`,e.strokeText(t.word,r,t.y),e.fillStyle=`rgba(255,255,255,0.5)`,e.fillText(t.word,r,t.y),a>0){e.save(),e.beginPath();let[n,i]=g(r-4,t.width+8,a,t.rtl);e.rect(n,t.y-s,i,s*2),e.clip(),e.fillStyle=t.emph?ke():`#ffe14d`,e.fillText(t.word,r,t.y),e.restore()}}e.globalAlpha=1}function qe(e,t,n,r,i){let a=W(t),o=H(t,r),{size:s,lines:c}=B(e,t.text,e=>`${X} ${e}px ${Y}`,Math.round(42*i),Math.round(28*i),560*K,3+q);e.font=`${X} ${s}px ${Y}`,e.textBaseline=`middle`,e.textAlign=`left`;let l=s*1.25,u=U(e,c,l,a);if(!u.length)return;let d=z(n/.25),f=s*.55,p=Math.min(...u.map(e=>e.cx-e.width/2))-f,m=Math.max(...u.map(e=>e.cx+e.width/2))+f,h=Math.min(...u.map(e=>e.y))-l/2-f*.45,g=Math.max(...u.map(e=>e.y))+l/2+f*.45;e.save(),e.globalAlpha=d,e.translate(0,(1-d)*18),e.fillStyle=`rgba(22, 17, 34, 0.86)`,e.beginPath(),e.roundRect(p,h,m-p,g-h,s*.32),e.fill();let _=y(I)>.35?I:S(r.art,r.look).accent??`#ffe14d`;for(let t of u)e.fillStyle=n>=Math.min(o[t.index],o[t.index+1]??1/0)?t.emph?_:`#ffffff`:`rgba(255,255,255,0.38)`,e.fillText(t.word,t.cx-t.width/2,t.y);e.restore()}function Je(e,t,n,r,i){let a=W(t),o=H(t,r),{size:s,lines:c}=B(e,t.text,e=>`${X} ${e}px ${Y}`,Math.round(54*i),Math.round(32*i),600*K,3+q);e.font=`${X} ${s}px ${Y}`,e.textBaseline=`middle`,e.textAlign=`left`;let l=U(e,c,s*1.2,a);for(let t of l){let r=n-o[t.index];if(r<0)continue;let i=Math.min(1,r/.18),a=r<.3?(1-r/.3)*7:1.5,c=t.cx-t.width/2+(r<.12?Math.sin(r*120)*4:0);e.globalAlpha=i,e.fillStyle=`rgba(0, 234, 255, 0.85)`,e.fillText(t.word,c-a,t.y),e.fillStyle=`rgba(255, 43, 214, 0.85)`,e.fillText(t.word,c+a,t.y),J(e,t.word,c,t.y,s),e.fillStyle=G?t.emph?`#ffe14d`:`#ffffff`:t.emph?`#d4119f`:`#0b1220`,e.fillText(t.word,c,t.y)}e.globalAlpha=1}var Ye=e=>F(e)===`elegan`||F(e)===`panduan`;function Xe(e,t,n,i,a){let s=W(t),c=H(t,i),l=_(t.theme,i)?`#ffffff`:`#1d2b44`,u=t.text.split(/\s+/).filter(Boolean),d=(e,t)=>s.has(V(e))?`800 ${t}px ${Y}`:`italic 400 ${t}px ${Y}`,f=600*K,p=Math.round(40*a),m=[];for(;p>=24;p-=2){m=[[]];let t=0,n=p*.3;if(u.forEach((r,i)=>{e.font=d(r,p);let a=e.measureText(r).width;m[m.length-1].length&&t+n+a>f&&(m.push([]),t=0),t+=(t?n:0)+a,m[m.length-1].push({w:r,i,width:a})}),m.length<=3+q)break}let h=p*.3,g=p*1.28,v=Math.round(o.H*.175)-(m.length-1)*g/2;e.textBaseline=`middle`,e.textAlign=`left`;let y=x(u);m.forEach((t,i)=>{let a=t.reduce((e,t)=>e+t.width,0)+h*(t.length-1),o=b(t.map(e=>e.w),t.map(e=>e.width),h,y);t.forEach(({w:t,i:s},u)=>{let f=r/2-a/2+o[u],m=n-Math.min(c[s],c[s+1]??1/0),h=Math.max(0,Math.min(1,m/.25));e.font=d(t,p),e.fillStyle=l,e.globalAlpha=.28+.72*h,J(e,t,f,v+i*g+(1-h)*4,p),e.fillText(t,f,v+i*g+(1-h)*4)})}),e.globalAlpha=1}function Ze(e,t,n,i,a){let s=W(t),c=H(t,i),l=_(t.theme,i),u=l?`#ffffff`:`#13203d`,d=l?`rgba(255,255,255,0.5)`:`rgba(19,32,61,0.5)`,f=t.text.split(/\s+/).filter(Boolean),p=600*K,h=Math.round(38*a),v=[];for(;h>=24;h-=2){e.font=`700 ${h}px ${Y}`;let t=h*.28;v=[[]];let n=0;if(f.forEach((r,i)=>{let a=s.has(V(r))?(s.has(V(f[i-1]??``))?0:.15)+(s.has(V(f[i+1]??``))?0:.15):0,o=e.measureText(r).width+h*a;v[v.length-1].length&&n+t+o>p&&(v.push([]),n=0),n+=(n?t:0)+o,v[v.length-1].push({w:r,i,width:o})}),v.length<=3+q)break}let y=h*.28,S=h*1.32,C=Math.round(o.H*.175)-(v.length-1)*S/2,w=-1;f.forEach((e,t)=>n>=c[t]&&(w=t)),e.textBaseline=`middle`,e.textAlign=`left`;let T=e=>s.has(V(e)),E=x(f),D=e=>Math.max(0,Math.min(1,(n-c[e])/.22));v.forEach((t,n)=>{let i=t.reduce((e,t)=>e+t.width,0)+y*(t.length-1),o=C+n*S,s=b(t.map(e=>e.w),t.map(e=>e.width),y,E).map(e=>r/2-i/2+e);for(let n=0;n<t.length;n++){if(!T(t[n].w))continue;let r=n;for(;r+1<t.length&&T(t[r+1].w);)r++;let i=D(t[n].i);if(i>0){let c=n;for(let e=n;e<=r;e++)D(t[e].i)>0&&(c=e);let u=z(Math.min(1,D(t[c].i)*1.4)),d=1/0,f=-1/0;for(let e=n;e<c;e++)d=Math.min(d,s[e]),f=Math.max(f,s[e]+t[e].width);let[p,_]=g(s[c],t[c].width,u,m(t[c].w));(_>0||c===n)&&(d=Math.min(d,p),f=Math.max(f,p+_));let v=Math.max(0,f-d),y=h*1.18;e.globalAlpha=i,e.fillStyle=l?`rgba(255,255,255,0.07)`:`rgba(19,32,61,0.06)`,e.fillRect(d,o-y/2,v,y),e.strokeStyle=I,e.lineWidth=Math.max(1.5,2*a),e.strokeRect(d,o-y/2,v,y)}n=r}t.forEach(({w:t,i:n},r)=>{let i=D(n);if(i<=0)return;let a=T(t),c=o+(1-z(i))*10;e.globalAlpha=i;let l=a||n===w;e.font=`${l?700:500} ${h}px ${Y}`,e.fillStyle=l?u:d;let p=s[r]+(a&&!T(f[n-1]??``)?h*.15:0);J(e,t,p,c,h),e.fillText(t,p,c)})}),e.globalAlpha=1}function Qe(e,t,n,r,i){let a=W(t),o=H(t,r),{size:s,lines:c}=B(e,t.text,e=>`${X} ${e}px ${Y}`,Math.round(40*i),Math.round(26*i),520*K,3+q);e.font=`${X} ${s}px ${Y}`,e.textBaseline=`middle`,e.textAlign=`center`;let l=s*1.32,u=U(e,c,l,a),d=30*i,f=22*i,p=Math.min(...u.map(e=>e.cx-e.width/2))-d,m=Math.max(...u.map(e=>e.cx+e.width/2))+d,h=u[0].y-l/2-f+s*.08,_=u[u.length-1].y+l/2+f,v=m-p,y=_-h,b=(p+m)/2,x=(h+_)/2,S=R(Math.min(1,n/.28));e.save(),e.translate(b,x+(1-Math.min(1,n/.2))*18),e.rotate(-.008),e.scale(.9+.1*S,.9+.1*S),e.globalAlpha=Math.min(1,n/.12),e.save(),e.shadowColor=`rgba(40,30,10,0.22)`,e.shadowBlur=12*i,e.shadowOffsetY=6*i,e.fillStyle=`#fbf3df`,e.beginPath(),e.roundRect(-v/2,-y/2,v,y,6*i),e.fill(),e.restore(),e.fillStyle=`rgba(246,196,64,0.92)`;for(let t of[-1,1])e.save(),e.translate(t*(v/2-14*i),-y/2+2*i),e.rotate(t*.62),e.fillRect(-24*i,-8*i,48*i,16*i),e.restore();for(let t of u){let r=n-o[t.index],a=t.cx-b,c=t.y-x;if(t.emph&&r>0){let n=z(r/.3);e.fillStyle=`#f7c948`;let[o,l]=g(a-t.width/2-5*i,t.width+10*i,n,t.rtl);e.fillRect(o,c-s*.42,l,s*.86)}e.globalAlpha=Math.min(1,n/.12)*(r>0?.35+.65*Math.min(1,r/.15):.35),e.fillStyle=`#2b2a28`,e.fillText(t.word,a,c+s*.04)}e.restore()}function J(e,t,n,r,i){e.save(),e.shadowBlur=0,e.lineJoin=`round`,e.lineWidth=Math.max(3,i*.14),e.strokeStyle=G?`rgba(10,10,20,0.75)`:`rgba(255,255,255,0.85)`,e.strokeText(t,n,r),e.restore()}function $e(e,t,n,r,i){let a=W(t),o=H(t,r),{size:s,lines:c}=B(e,t.text.toUpperCase(),e=>`${X} ${e}px ${Y}`,Math.round(46*i),Math.round(28*i),600*K,3+q);e.font=`${X} ${s}px ${Y}`,e.textBaseline=`middle`,e.textAlign=`center`;let l=U(e,c,s*1.34,a),u=G?`#c3cbdc`:`#555c6b`,d=G?`#ffffff`:`#141a26`;for(let t of l){let r=n-o[t.index];if(r<=0)continue;let a=z(r/.28);if(e.globalAlpha=a,J(e,t.word,t.cx,t.y+(1-a)*10,s),e.fillStyle=t.emph?d:u,e.fillText(t.word,t.cx,t.y+(1-a)*10),t.emph){let n=z((r-.1)/.35);if(n>0){e.fillStyle=I;let[r,a]=g(t.cx-t.width/2-2,t.width+4,n,t.rtl);e.fillRect(r,t.y+s*.6,a,Math.max(3,5*i))}}}e.globalAlpha=1}function et(e,t,n,r,i){let a=W(t),o=H(t,r),{size:s,lines:c}=B(e,t.text,e=>`${X} ${e}px ${Y}`,Math.round(40*i),Math.round(26*i),600*K,3+q);e.font=`${X} ${s}px ${Y}`,e.textBaseline=`middle`,e.textAlign=`center`;let l=U(e,c,s*1.3,a),u=z(n/.25),d=G?`#ffffff`:`#1f1a17`,f=G?`rgba(241,245,249,0.58)`:`rgba(30,41,59,0.58)`;for(let t of l){let r=Math.max(0,Math.min(1,(n-o[t.index])/.12));e.globalAlpha=u,e.shadowBlur=0,e.fillStyle=f,e.fillText(t.word,t.cx,t.y),r>0&&(e.globalAlpha=u*r,J(e,t.word,t.cx,t.y,s),e.shadowColor=t.emph?I:G?`rgba(0,0,0,0.55)`:`rgba(0,0,0,0)`,e.shadowBlur=(t.emph?16:6)*i,e.fillStyle=t.emph?I:d,e.fillText(t.word,t.cx,t.y))}e.shadowBlur=0,e.globalAlpha=1}function tt(e,t,n,r,i){let a=W(t),o=H(t,r),{size:s,lines:c}=B(e,t.text,e=>`${X} ${e}px ${Y}`,Math.round(46*i),Math.round(28*i),580*K,3+q);e.font=`${X} ${s}px ${Y}`,e.textBaseline=`middle`,e.textAlign=`center`;let l=s*1.32,u=U(e,c,l,a),d=e.measureText(` `).width/2+10*i,f=l+2,p=12*i;for(let t of[`box`,`text`])for(let r of u){let i=n-o[r.index];if(i<0)continue;let a=R(Math.min(1,i/.16));e.save(),e.translate(r.cx,r.y),e.scale(a,a),t===`box`?(e.fillStyle=r.emph?I:`#ffffff`,e.beginPath(),e.roundRect(-r.width/2-d,-f/2,r.width+d*2,f,p),e.fill()):(e.fillStyle=r.emph&&y(I)<.6?`#ffffff`:`#111111`,e.fillText(r.word,0,2)),e.restore()}}function nt(e,t,n,i,a){let s=W(t),c=H(t,i),l=t.text.split(/\s+/).filter(Boolean),u=-1;for(let e=0;e<l.length;e++)n>=c[e]&&(u=e);if(u<0)return;let d=l[u],f=s.has(V(d)),p=Math.round((f?104:88)*a);e.font=`${X} ${p}px ${Y}`;let m=620*K,h=e.measureText(d).width;h>m&&(p=Math.floor(p*m/h)),e.font=`${X} ${p}px ${Y}`,e.textBaseline=`middle`,e.textAlign=`center`,e.lineJoin=`round`;let g=n-c[u],_=R(Math.min(1,g/.14));e.save(),e.translate(r/2,o.capY),e.rotate((L(u+t.text.length)-.5)*.08),e.scale(_,_),e.fillStyle=`rgba(0,0,0,0.3)`,e.fillText(d,4,7),e.lineWidth=p/6,e.strokeStyle=`#1f1a17`,e.strokeText(d,0,0),e.fillStyle=f?ke():`#ffffff`,e.fillText(d,0,0),e.restore()}function rt(e,t,n,i,a){let s=W(t),c=H(t,i),{size:l,lines:u}=B(e,t.text,e=>`${X} ${e}px ${Y}`,Math.round(48*a),Math.round(28*a),560*K,3+q);e.font=`${X} ${l}px ${Y}`,e.textBaseline=`middle`,e.textAlign=`center`;let d=l*1.3,f=U(e,u,d,s),p=Math.max(...u.map(t=>e.measureText(t).width))+56*a,m=u.length*d+36*a,h=z(n/.25);e.save(),e.globalAlpha=.78*h,e.fillStyle=`#15111f`,e.beginPath(),e.roundRect(r/2-p/2,o.capY-m/2,p,m,18*a),e.fill(),e.restore();for(let t of f){let r=n-c[t.index];if(r<0)continue;let i=r<.22?Math.floor(r*40)%3==0?.25:1:.9+Math.sin(n*6+t.index)*.1,o=t.emph?I:`#5ef2ff`;e.save(),e.globalAlpha=h*i,e.shadowColor=o,e.shadowBlur=18*a,e.fillStyle=o,e.fillText(t.word,t.cx,t.y),e.shadowBlur=6*a,e.fillStyle=t.emph?`#fff3e6`:`#effdff`,e.fillText(t.word,t.cx,t.y),e.restore()}}var it=14;function at(e){let t=[];return Pe(e).forEach(([n,r])=>{if(r-n<=it)return t.push([n,r]);for(let i=n;i<r;){let n=Math.min(r,i+10);for(let t=Math.min(r,i+12);t>=i+5;t--)if(/[.,!?;:]$/.test(e[t-1])){n=t;break}r-n<4&&(n=r),t.push([i,n]),i=n}}),t}function ot(e,t,n){let r=e.text.split(/\s+/).filter(Boolean),i=at(r);if(i.length<=1)return{scene:e,t};let a=H(e,n),o=.15,s=0;i.forEach(([e],n)=>n&&a[e]-o<=t&&(s=n));let[c,l]=i[s],u=s===0?0:a[c]-o,d=s+1<i.length?a[i[s+1][0]]-o:e.duration;return{scene:{...e,text:r.slice(c,l).join(` `),duration:Math.max(.3,d-u),captionCurve:void 0,wordAt:a.slice(c,l).map(e=>Math.max(0,e-u-(s?o:0)))},t:t-u}}var Y=``,X=800,st=``,ct=400;function lt(e,n,i,a,s){if(!n.text.trim()||F(a)===`off`||n.captionHidden)return;let l=c(a);t(l.pop),t(l.hand),Y=l.pop.family,X=l.pop.weight,st=l.hand.family,ct=l.hand.weight;let{scene:u,t:d}=ot(n,i,a),f=we(a)*o.capScale;K=Math.min(1.15,Math.max(.45,a.captionWidth??1))*Ie,(a?.art===`editorial_motion_grid`||a?.art===`otomatis`||(typeof n?.captionPos===`object`&&n?.captionPos?.x<0.42))&&(!a?.captionPos||a?.captionPos===`auto`)&&(K*=.52),q=K<.7*Ie?2:+(K<.9*Ie),K*=o.capWidth;let p=a.brand?.colors??[];G=s?.dark??_(u.theme,a);let m=p[2]??p[0];I=m?!G&&y(m)>.45?p[0]:m:S(a.art,a.look).accent??`#2563EB`,s&&on(ge(I),s.avg)<2.2&&(I=(G?[`#ffe14d`,`#ffffff`]:[`#1f1a17`,`#1e3a8a`]).reduce((e,t)=>on(ge(t),s.avg)>on(ge(e),s.avg)?t:e)),e.save();let h=be(n,a);if(h){let t=Te(a);e.translate(h.x*r,h.y*o.H),h.rotate&&e.rotate(h.rotate*Math.PI/180),e.translate(-t.x,-t.y)}let g=F(a);switch((g===`tangan`||g===`ketik`||g===`sorot`)&&(e.shadowColor=G?`rgba(0,0,0,0.6)`:`rgba(255,255,255,0.85)`,e.shadowBlur=7*f),F(a)){case`tangan`:He(e,u,d,a,f);break;case`ketik`:Ue(e,u,d,a,f);break;case`sorot`:We(e,u,d,a,f);break;case`stiker`:Ge(e,u,d,a,f);break;case`karaoke`:Ke(e,u,d,a,f);break;case`kotak`:tt(e,u,d,a,f);break;case`gelap`:qe(e,u,d,a,f);break;case`elegan`:Xe(e,u,d,a,f);break;case`panduan`:Ze(e,u,d,a,f);break;case`glitch`:Je(e,u,d,a,f);break;case`satu`:nt(e,u,d,a,f);break;case`neon`:rt(e,u,d,a,f);break;case`selotip`:Qe(e,u,d,a,f);break;case`garis`:$e(e,u,d,a,f);break;case`redup`:et(e,u,d,a,f);break;default:Ve(e,u,d,a,f)}e.restore()}var ut=.06,dt=[{id:`push`,label:`Zoom in`,hint:`mendekat pelan ke objek; membangun fokus/ketegangan`},{id:`pull`,label:`Zoom out`,hint:`mundur dari dekat; reveal, lega, gambaran besar`},{id:`pan-left`,label:`Geser kiri`,hint:`kamera menyapu ke kiri; perjalanan, waktu berjalan`},{id:`pan-right`,label:`Geser kanan`,hint:`kamera menyapu ke kanan; maju, progres`},{id:`tilt-up`,label:`Naik`,hint:`kamera naik; harapan, bangkit, target`},{id:`tilt-down`,label:`Turun`,hint:`kamera turun; jatuh, beban, kenyataan`},{id:`roll`,label:`Miring`,hint:`frame berputar miring; bingung, dunia terbalik, overthinking`},{id:`orbit`,label:`Mengayun`,hint:`kamera mengayun kiri-kanan; ragu, menimbang pilihan`},{id:`crash`,label:`Crash zoom`,hint:`zoom kilat + hentakan; kejutan, tamparan kenyataan`},{id:`handheld`,label:`Handheld`,hint:`goyang tangan alami; jujur, curhat, dekat`},{id:`shake`,label:`Getar`,hint:`frame bergetar keras; benturan, gagal, ledakan, marah, panik`}],ft=dt.map(e=>e.id),pt=e=>typeof e==`string`&&ft.includes(e),mt=/!|\b(jatuh|pecah|hancur|meledak|ledak|gagal|tabrak|nabrak|brak|dor|boom|bangkrut|ditolak|runtuh|ambruk|hantam|banting|panik|marah|teriak|stop|berhenti)\b/i,ht=[`push`,`pan-right`,`tilt-up`,`orbit`,`pull`,`pan-left`,`roll`,`handheld`,`tilt-down`,`crash`];function gt(e){let t=0;for(let n=0;n<e.length;n++)t=t*31+e.charCodeAt(n)|0;return Math.abs(t)}function _t(e){return pt(e.camera)?e.camera:mt.test(e.text)?`shake`:ht[gt(e.text)%ht.length]}function vt(e){let t=Math.sin(e*91.17+7.3)*43758.5453;return t-Math.floor(t)}function Z(e,t){let n=Math.floor(e),r=e-n,i=(1-Math.cos(r*Math.PI))/2;return(vt(n+t*101)*(1-i)+vt(n+1+t*101)*i)*2-1}var yt=(e,t)=>vt(Math.floor(e*30)+t*977)*2-1,bt=e=>e<=0?0:e>=1?1:e*e*e*(e*(6*e-15)+10),xt=e=>1-(1-e)**3;function St(e,t,n){let r=n.pace===`energik`,i=(r?1.02:.88)*(S(n.art,n.look).calmCamera?.88:1);let a=_t(e),s=Math.max(.6,e.duration),c=Math.min(1,t/s),l=bt(c),snap=l,u=gt(e.text)%97,d=1,f=0,p=0,m=0,h=0,driftX=Math.sin(t*1.15+(u%7))*2.6*i,driftY=Math.cos(t*.92+(u%5))*2.2*i;switch(a){case`push`:d=1+.21*i*snap,p=-19*i*snap,f=(u%2?1:-1)*15*i*Math.sin(snap*Math.PI);break;case`pull`:d=1+.24*i*(1-snap),p=-20*i*(1-snap),f=(u%2?-1:1)*15*i*Math.sin(snap*Math.PI);break;case`pan-left`:case`pan-right`:d=1+.08*i+.045*i*Math.sin(snap*Math.PI),f=(a===`pan-left`?1:-1)*56*i*(1-2*snap),p=-9*i*Math.sin(snap*Math.PI),m=(a===`pan-left`?-1:1)*.017*i*(1-2*snap);break;case`tilt-up`:case`tilt-down`:d=1+.1*i+.045*i*snap,p=(a===`tilt-up`?-1:1)*54*i*(1-2*snap),f=(u%2?1:-1)*11*i*Math.sin(snap*Math.PI);break;case`roll`:d=1+.12*i+.05*i*snap,m=i*(-.042+.084*snap),f=18*i*(1-2*snap);break;case`orbit`:{let o=Math.sin(c*Math.PI*1.5);d=1+.09*i+.055*i*Math.sin(c*Math.PI),f=40*i*o,p=-13*i*Math.cos(c*Math.PI),m=.024*i*o;break}case`crash`:{let o=Math.min(1,t/.32),cr=o<=0?0:o>=1?1:1-Math.exp(-o*7.5)*Math.cos(o*Math.PI*2.2);d=1+.21*i*cr+.035*i*c,p=-15*i*cr,h=t>.14&&t<.56?Math.exp(-(t-.14)*7.2)*.42:0;break}case`handheld`:d=1+.07*i,f=17*i*Z(t*.75,u),p=13*i*Z(t*.66,u+1),m=.013*i*Z(t*.58,u+2);break;case`shake`:d=1+.12*i+.06*i*snap,h=t<.58?Math.exp(-t*6.2)*.48:0}let g=Fe(e,n);if(g!==void 0&&t>=g){let o=t-g,n2=r?.15:.24,o2=r?.55:.8,s2=o<n2?Math.sin(o/n2*(Math.PI/2)):Math.max(0,1-(o-n2)/o2);d+=.065*i*s2,m+=(u%2?1:-1)*.013*i*s2,(a===`shake`||a===`crash`)&&o<.44&&(h=Math.max(h,Math.exp(-o*7.2)*.42))}d=Math.max(.95,Math.min(1.26,d));f=Math.max(-68,Math.min(68,f+driftX*.65));p=Math.max(-68,Math.min(68,p+driftY*.65));let ee=(r?7.5:5)*h,sx=(a===`shake`||a===`crash`)?ee*Math.sin(t*18)*Math.exp(-t*2.8):ee*Z(t*2.1,u+6),sy=(a===`shake`||a===`crash`)?ee*Math.cos(t*15)*Math.exp(-t*2.8):ee*Z(t*2.1,u+7);return{zoom:d,x:f,y:p,rot:m,sx,sy,srot:.007*h*Z(t*2.1,u+8)}}var Ct=`pop.tick.click.whoosh.swish.boom.ding.sparkle.rise.thud.boing.tap.coin.cash.type.shutter.heart.tock.rocket.notify.drop.paper.chalk.beep.blip.laser.impact.kick.riser.swipe.whip.glitch.stamp.snap.clap.bubble.slide.scratch.buzzer.correct.tada.magic.step.pageflip`.split(`.`),wt={retro:`8bit`,futuristik:`digital`,uiweb:`digital`,carakerja:`digital`,modern:`digital`,cerita:`soft`,aurora:`digital`,belah:`digital`,popart:`default`,infopop:`digital`,isometrik:`digital`,blueprint:`digital`,pitch:`digital`,reel:`digital`,heboh:`digital`,editorial_motion_grid:`digital`,otomatis:`digital`,studio_3d_room:`default`,kolase:`paper`,papercut:`paper`,dither:`8bit`,kuas:`soft`,arsip:`paper`,sketsa:`chalk`,siluet:`soft`,monofilm:`default`,kolab:`default`,kilat:`digital`,kapur:`chalk`,oneline:`default`,tenang:`soft`,kinetik:`digital`,neongame:`digital`,pixelbook:`8bit`,ruang:`default`,produk:`digital`,edukasi:`paper`,garis:`default`,cahaya:`default`,rasi:`soft`,tiket:`default`,diorama:`paper`,stopmotion_clay:`default`,sticker_bomb:`default`,hyper_zoom:`digital`,soft_glow:`soft`,bounce_cartoon:`default`,bubble_gum:`default`,confetti_blast:`default`,panduan:`digital`},Tt=e=>e&&wt[e]||`default`,Et={default:{},"8bit":{pop:[`blip`,1,.85],tick:[`blip`,1.6,.55],click:[`blip`,2,.75],ding:[`coin`,1,1],sparkle:[`coin`,1.5,.75],tap:[`blip`,.8,.8]},digital:{pop:[`pop`,1.08,.95],tick:[`beep`,1.4,.55],click:[`click`,1.15,.85],tap:[`tap`,1,.85]},paper:{pop:[`paper`,1,.92],tick:[`tick`,1.1,.55],click:[`click`,1.05,.82],thud:[`thud`,.95,.95]},chalk:{tick:[`chalk`,1,.65],click:[`click`,1.1,.85],pop:[`pop`,1,.92]},soft:{pop:[`pop`,.95,.88],tick:[`tick`,1.1,.5],click:[`click`,1,.78],boom:[`thud`,1,.88],impact:[`thud`,1,.88],kick:[`thud`,1,.82]}};function Dt(e,t,n=1,r=1){let i=Et[t][e];return i?[i[0],n*i[1],r*i[2]]:[e,n,r]}var Ot=new Set([`pop`,`blip`,`coin`,`drop`,`tap`,`paper`,`beep`,`boing`,`thud`,`bubble`,`step`,`clap`,`snap`]);function kt(e){let t=new Map;for(let n of e){if(n.pitch!==void 0)continue;let r=t.get(n.name),i=Ot.has(n.name)&&r&&n.t-r.t<.6?(r.step+1)%3:0;t.set(n.name,{t:n.t,step:i});let micro=((i-1)*.024)+Math.sin(n.t*47.3)*.014;n.pitch=Math.max(.92,Math.min(1.08,1+micro))}return e}var At=new WeakMap;function jt(e){let t=At.get(e);if(!t){t=e.createBuffer(1,e.sampleRate,e.sampleRate);let n=t.getChannelData(0),r=7,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;for(let e=0;e<n.length;e++){r=r*16807%2147483647;let w=r/2147483647*2-1;b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;let pk=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.11;b6=w*.115926;n[e]=Math.max(-1,Math.min(1,pk))}At.set(e,t)}return t}function Mt(e,t,n,r,i=1,a=1,o=`default`){let s=[],c=Math.max(r,e.currentTime),l=Math.min(4,Math.max(.25,a)),u=o===`8bit`,d=t;{let f=e.createBiquadFilter();f.type=`lowpass`,f.frequency.value=o===`soft`?5800:o===`paper`||o===`chalk`?7200:u?6400:8600,f.Q.value=.55,f.connect(t),d=f,i*=o===`soft`?.92:1.08}let f=(t,n,r,a=c)=>{let o=e.createGain(),s=Math.max(.006,n);return o.gain.setValueAtTime(1e-4,a),o.gain.linearRampToValueAtTime(Math.max(2e-4,t*i),a+s),o.gain.exponentialRampToValueAtTime(1e-4,a+s+r+.06),o.connect(d),o},p=(t,n,r,i,a,o=c)=>{let d=e.createOscillator();if(d.type=u?`triangle`:t===`square`||t===`sawtooth`?`triangle`:t,d.frequency.setValueAtTime(n*l,o),d.frequency.exponentialRampToValueAtTime(Math.max(1,r*l),o+i),u){let t=e.createGain();t.gain.value=.44,t.connect(a),d.connect(t)}else d.connect(a);return d.start(o),d.stop(o+i+.1),s.push(d),d},m=(t,n,r=c)=>{let i=e.createBufferSource();i.buffer=jt(e),i.connect(n),i.start(r,Math.random()*.45),i.stop(r+t+.07),s.push(i)},h=(t,n,r=1,i=c)=>{let a=e.createBiquadFilter();return a.type=t,a.frequency.setValueAtTime(n*l,i),a.Q.value=r,a},g=(e,t,n,r,i,a,o=c)=>{let s=h(e,t,n,o);return s.connect(f(r,i,a,o)),s};switch(n){case`pop`:p(`sine`,420,140,.09,f(.44,.008,.11)),m(.024,g(`bandpass`,1350,.95,.18,.006,.024));break;case`tick`:p(`triangle`,1180,640,.034,f(.22,.006,.038)),m(.015,g(`bandpass`,2400,1.2,.16,.005,.016));break;case`click`:p(`triangle`,840,310,.032,f(.28,.006,.036)),m(.022,g(`bandpass`,2200,1.0,.22,.005,.024));break;case`whoosh`:case`swish`:{let dur=n===`whoosh`?.35:.23,t=h(`bandpass`,260,.62);t.frequency.exponentialRampToValueAtTime((n===`whoosh`?1850:2200)*l,c+dur*.48),t.frequency.exponentialRampToValueAtTime(420*l,c+dur),t.connect(f(n===`whoosh`?.48:.34,dur*.38,dur*.62)),m(dur,t),p(`sine`,165,72,dur*.82,f(n===`whoosh`?.18:.1,dur*.25,dur*.52));break}case`boom`:p(`sine`,118,34,.4,f(.78,.008,.42)),p(`triangle`,260,85,.12,f(.26,.006,.12)),m(.16,g(`lowpass`,280,.85,.34,.008,.15));break;case`ding`:p(`sine`,880,878,.72,f(.28,.008,.72)),p(`sine`,1320,1318,.5,f(.11,.008,.5)),p(`sine`,2640,2636,.28,f(.045,.008,.28));break;case`sparkle`:for(let e=0;e<4;e++){let t=c+e*.055,n=[988,1175,1480,1760][e];p(`sine`,n,n,.24,f(.15,.008,.24,t),t),p(`sine`,n*2,n*2,.16,f(.05,.008,.16,t),t)}break;case`rise`:{let e=h(`bandpass`,240,.9);e.frequency.exponentialRampToValueAtTime(2800*l,c+.72),e.connect(f(.42,.66,.12)),m(.78,e),p(`triangle`,165,620,.74,f(.13,.66,.1));break}case`thud`:p(`sine`,96,36,.24,f(.7,.008,.24)),m(.085,g(`lowpass`,360,.85,.32,.007,.085));break;case`boing`:{let t=p(`sine`,230,440,.35,f(.34,.008,.35)),n=e.createOscillator(),r=e.createGain();n.frequency.value=12,r.gain.value=24*l,n.connect(r),r.connect(t.frequency),n.start(c),n.stop(c+.4),s.push(n);break}case`tap`:p(`sine`,360,165,.052,f(.34,.006,.058)),m(.02,g(`bandpass`,1650,1.1,.18,.006,.02));break;case`coin`:p(`triangle`,988,988,.065,f(.24,.006,.07)),p(`triangle`,1318,1318,.36,f(.24,.006,.36,c+.065),c+.065);break;case`cash`:m(.045,g(`bandpass`,2300,1.3,.28,.006,.045)),p(`sine`,1046,1046,.56,f(.24,.006,.56,c+.075),c+.075),p(`sine`,1568,1568,.42,f(.12,.006,.42,c+.075),c+.075);break;case`type`:m(.024,g(`bandpass`,1950,1,.28,.006,.024)),p(`triangle`,310,165,.028,f(.18,.006,.028));break;case`shutter`:m(.038,g(`bandpass`,1950,.9,.38,.006,.038)),m(.048,g(`bandpass`,1350,.9,.32,.006,.048,c+.07),c+.07);break;case`heart`:p(`sine`,72,42,.12,f(.58,.008,.12)),p(`sine`,62,38,.12,f(.46,.008,.12,c+.2),c+.2);break;case`tock`:p(`triangle`,860,620,.048,f(.3,.006,.052)),m(.024,g(`bandpass`,1350,1.3,.18,.006,.024));break;case`rocket`:{let e=h(`lowpass`,240,.75);e.frequency.exponentialRampToValueAtTime(1280*l,c+1.05),e.connect(f(.48,.24,.9)),m(1.15,e),p(`triangle`,65,120,1.05,f(.14,.18,.9));break}case`notify`:p(`sine`,784,784,.085,f(.24,.008,.09)),p(`sine`,1175,1175,.26,f(.24,.008,.26,c+.085),c+.085);break;case`drop`:p(`sine`,880,260,.095,f(.32,.008,.1));break;case`paper`:p(`sine`,330,150,.1,f(.26,.008,.11)),m(.08,g(`bandpass`,2100,.6,.32,.008,.08)),m(.09,g(`bandpass`,1550,.6,.26,.008,.09,c+.055),c+.055);break;case`chalk`:{let t=h(`bandpass`,1950,1.1),n=f(.28,.01,.18);t.connect(n),m(.2,t);break}case`beep`:p(`sine`,1046,1046,.065,f(.22,.006,.07)),p(`sine`,1568,1568,.05,f(.09,.006,.05));break;case`blip`:p(`triangle`,580,1040,.065,f(.24,.006,.075));break;case`laser`:p(`triangle`,1180,190,.22,f(.2,.006,.23));break;case`impact`:p(`sine`,124,34,.48,f(.72,.008,.48)),p(`triangle`,320,110,.09,f(.3,.006,.09)),m(.2,g(`lowpass`,780,.75,.34,.007,.2)),m(.028,g(`bandpass`,1900,.85,.24,.006,.028));break;case`kick`:p(`sine`,138,42,.26,f(.78,.008,.26)),p(`triangle`,520,155,.026,f(.24,.006,.026));break;case`riser`:{let e=h(`bandpass`,260,.85);e.frequency.exponentialRampToValueAtTime(2900*l,c+.88),e.connect(f(.36,.78,.1)),m(.9,e),p(`triangle`,118,560,.88,f(.1,.78,.1)),p(`sine`,236,1120,.88,f(.1,.78,.1));break}case`swipe`:{let e=h(`bandpass`,860,.72);e.frequency.exponentialRampToValueAtTime(2900*l,c+.16),e.connect(f(.52,.024,.16)),m(.2,e);break}case`whip`:m(.1,g(`bandpass`,1450,.7,.3,.04,.05)),m(.05,g(`bandpass`,2100,.8,.38,.008,.045,c+.075),c+.075);break;case`glitch`:for(let e=0;e<5;e++){let t=c+e*.038,n=[280,920,460,1240,580][e];p(`triangle`,n,n*.95,.026,f(.14,.006,.026,t),t),e%2==0&&m(.02,g(`bandpass`,1750,.95,.18,.006,.02,t),t)}break;case`stamp`:p(`sine`,106,44,.15,f(.7,.008,.15)),m(.055,g(`lowpass`,1350,.8,.36,.007,.055)),m(.045,g(`bandpass`,2000,.85,.18,.006,.045,c+.04),c+.04);break;case`snap`:m(.024,g(`bandpass`,2100,.95,.36,.006,.024)),p(`triangle`,1380,920,.022,f(.22,.006,.022));break;case`clap`:for(let e of[0,.012,.024])m(.02,g(`bandpass`,1350,1,.48,.006,.018,c+e),c+e);m(.13,g(`bandpass`,1280,.85,.38,.006,.12,c+.03),c+.03);break;case`bubble`:p(`sine`,310,820,.095,f(.34,.008,.1));break;case`slide`:{let t=p(`sine`,380,1140,.44,f(.26,.035,.42)),n=e.createOscillator(),r=e.createGain();n.frequency.value=6,r.gain.value=14*l,n.connect(r),r.connect(t.frequency),n.start(c),n.stop(c+.48),s.push(n);break}case`scratch`:{let e=h(`bandpass`,640,1.3);e.frequency.exponentialRampToValueAtTime(1750*l,c+.12),e.frequency.exponentialRampToValueAtTime(440*l,c+.28),e.connect(f(.52,.012,.28)),m(.3,e);break}case`buzzer`:{let e=h(`lowpass`,880,.8);e.connect(f(.28,.012,.38)),p(`triangle`,140,136,.38,e),p(`triangle`,147,143,.38,e);break}case`correct`:p(`sine`,660,660,.12,f(.26,.008,.14)),p(`sine`,988,988,.28,f(.26,.008,.28,c+.1),c+.1),p(`sine`,1976,1976,.22,f(.08,.008,.22,c+.1),c+.1);break;case`tada`:[440,554,659,880].forEach((e,t)=>{let n=c+t*.07,r=t===3?.62:.19;p(`triangle`,e,e,r,f(.24,.008,r,n),n),p(`sine`,e*2,e*2,r,f(.08,.008,r,n),n)});break;case`magic`:for(let e=0;e<7;e++){let t=c+e*.05,n=784*2**([0,2,4,7,9,12,14][e]/12);p(`sine`,n,n,.26,f(.14,.008,.26,t),t)}m(.4,g(`bandpass`,2900,.65,.09,.06,.32));break;case`step`:m(.065,g(`lowpass`,660,.85,.38,.006,.065)),p(`sine`,94,54,.058,f(.3,.006,.06));break;case`pageflip`:{let t=h(`bandpass`,1950,.75),n=f(.48,.018,.22);t.connect(n),m(.26,t);break}default:{let e=String(n||`pop`).toLowerCase();if(/zoom|focus|lens|camera|pan|tilt|orbit/.test(e)){let t=h(`bandpass`,340,.75);t.frequency.exponentialRampToValueAtTime(1950*l,c+.16),t.frequency.exponentialRampToValueAtTime(560*l,c+.28),t.connect(f(.36,.06,.2)),m(.28,t),p(`sine`,210,380,.18,f(.26,.018,.18))}else if(/slide|card|panel|drawer|float|bento/.test(e)){let t=h(`bandpass`,860,.8);t.frequency.exponentialRampToValueAtTime(2400*l,c+.15),t.connect(f(.38,.02,.15)),m(.17,t),p(`triangle`,310,510,.11,f(.26,.01,.11))}else if(/data|scan|stream|counter|metric|ping|hud|pulse/.test(e)){[660,990,1320].forEach((e,t)=>{let n=c+t*.04;p(`sine`,e,e*1.015,.11,f(.22,.006,.11,n),n)})}else if(/shield|lock|secure|verify|check|valid/.test(e)){p(`triangle`,520,920,.08,f(.28,.006,.09)),p(`sine`,920,1380,.22,f(.28,.006,.22,c+.06),c+.06)}else if(/graph|chart|grow|trend|up/.test(e)){[294,392,494,587,784].forEach((e,t)=>{let n=c+t*.045;p(`triangle`,e,e*1.05,.14,f(.24,.006,.14,n),n)})}else if(/cursor|mouse|pointer|select|hover/.test(e)){p(`triangle`,1040,420,.032,f(.28,.005,.035)),m(.022,g(`bandpass`,2000,.95,.2,.005,.024))}else if(/key|type|input|url/.test(e)){[0,.05,.1].forEach(e=>p(`triangle`,1080,410,.025,f(.22,.005,.028,c+e),c+e))}else if(/boom|cinema|sub|drop_heavy/.test(e)){p(`sine`,118,34,.42,f(.76,.008,.42)),m(.18,g(`lowpass`,280,.85,.36,.008,.16))}else{p(`sine`,480,195,.12,f(.36,.006,.13))}}}return s}function Nt(e,t,n,r,i){let a=[];for(let o of n){let isOpeningGrace=r<=.2&&o.t<=.2;if(o.t<r-.14&&!isOpeningGrace)continue;let when=isOpeningGrace&&o.t<r?i:i+Math.max(0,o.t-r);a.push(...Mt(e,t,o.name,when,o.gain,o.pitch,o.flavor))}return()=>a.forEach(e=>{try{e.stop()}catch{}})}var Pt=`// @advanced`,Ft=e=>!!e&&e.trimStart().startsWith(`// @advanced`),It=(e,t)=>t&&!Ft(e)?`${Pt}\n${e}`:e,Lt={look:`scribble3d`,pace:`energik`},Rt=new Map;function zt(e){let t=Rt.get(e);if(t)return t;let n;try{n=Function(`s`,`ctx`,`"use strict";\n${e}`)}catch(e){n=e instanceof Error?e:Error(String(e))}return Rt.set(e,n),n}var Bt=new Map;function Vt(e,t){let n=Bt.get(e);if(n!==void 0)return n;let r=0;for(let t of e.matchAll(/s\.(at|pop|sfx)\(([^()]*)\)/g)){let e=t[2].split(`,`).map(e=>Number(e.trim())),n=t[1]===`sfx`?e[1]:e[0];if(!Number.isFinite(n))continue;let i=t[1]===`sfx`?0:Number.isFinite(e[1])?e[1]:t[1]===`at`?.6:.5;r=Math.max(r,n+i)}let[i,a]=t===`energik`?[1.5,4.5]:[2.5,6],o=Math.min(a,Math.max(i,r+(t===`energik`?.4:.8)));return Bt.set(e,o),o}function Ht(e,t){let d=Math.max(.1,Number(e.duration)||3.5);return{k:1,dur:d}}var Ut=new Map;function Q(e){let t=Math.sin(e*91.17+7.3)*43758.5453;return t-Math.floor(t)}function Wt(e,t){if(t===`paper`){e.fillStyle=`#f3efe4`,e.fillRect(0,0,r,u);for(let t=0;t<9e3;t++){let n=Q(t);e.fillStyle=n>.5?`rgba(255,255,255,${.25*n})`:`rgba(120,100,70,${.06*(1-n)})`,e.fillRect(Q(t+.31)*r,Q(t+.77)*u,1.5,1.5)}}else{let n=e.createLinearGradient(0,0,0,u);t===`night`?(n.addColorStop(0,`#1c2a6b`),n.addColorStop(1,`#1a2560`)):(n.addColorStop(0,`#22347a`),n.addColorStop(.45,`#3d5a9e`),n.addColorStop(.75,`#c9b48f`),n.addColorStop(1,`#ead9b6`)),e.fillStyle=n,e.fillRect(0,0,r,u);for(let t=0;t<2600;t++){let n=Q(t+.5)*u,i=Q(t+.9)*r-60,a=40+Q(t+.2)*220;e.strokeStyle=Q(t+.4)>.45?`rgba(120,150,230,${.05+Q(t)*.12})`:`rgba(10,15,50,${.05+Q(t)*.12})`,e.lineWidth=1+Q(t+.6)*2,e.beginPath(),e.moveTo(i,n),e.lineTo(i+a,n+(Q(t+.8)-.5)*2),e.stroke()}}let n=e.createRadialGradient(r/2,u*.45,u*.3,r/2,u*.5,u*.85);n.addColorStop(0,`rgba(0,0,0,0)`),n.addColorStop(1,t===`paper`?`rgba(90,70,40,0.10)`:`rgba(0,0,20,0.25)`),e.fillStyle=n,e.fillRect(0,0,r,u)}function Gt(e,t,n){let[i,a,o]={paper:[`#fff4d6`,`#ffd8a8`,`rgba(240,110,30,0.22)`],dusk:[`#dff7ee`,`#a9e4d3`,`rgba(20,110,90,0.18)`],night:[`#2a2346`,`#15121f`,`rgba(255,255,255,0.10)`]}[t],s=e.createRadialGradient(r/2,u*.36,60,r/2,u*.5,u*.8);if(s.addColorStop(0,i),s.addColorStop(1,a),e.fillStyle=s,e.fillRect(0,0,r,u),e.fillStyle=o,e.strokeStyle=o,t===`dusk`){e.lineWidth=1.2;for(let t=0;t<=r;t+=48)e.beginPath(),e.moveTo(t,0),e.lineTo(t,u),e.stroke();for(let t=0;t<=u;t+=48)e.beginPath(),e.moveTo(0,t),e.lineTo(r,t),e.stroke()}else for(let t=18;t<u;t+=36)for(let n=18+t/36%2*18;n<r;n+=36)e.beginPath(),e.arc(n,t,2.2,0,Math.PI*2),e.fill();e.lineCap=`round`,e.lineWidth=3;let c=(t,n,r,i)=>{if(e.beginPath(),r===0)for(let r=0;r<=10;r++){let i=r/10*Math.PI*2-Math.PI/2,a=r%2?9:22,o=t+Math.cos(i)*a,s=n+Math.sin(i)*a;r?e.lineTo(o,s):e.moveTo(o,s)}else if(r===1)for(let r=0;r<=24;r++){let a=t-40+r*3.4,o=n+Math.sin(r*.9+i)*8;r?e.lineTo(a,o):e.moveTo(a,o)}else e.arc(t,n,14+Q(i)*8,0,Math.PI*2);e.stroke()},l=[[80,110],[640,170],[70,760],[650,820],[120,1220],[610,1200],[360,70]],d=r/720,f=u/1280;l.forEach(([e,t],r)=>n===void 0?c(e*d,t*f,r%3,r*3.3):c(e*d+(Q(n+r)-.5)*90,t*f+(Q(n+r+40)-.5)*120,Math.floor(Q(n+r+80)*3),n+r));let p=e.createRadialGradient(r/2,u*.45,u*.35,r/2,u*.5,u*.9);p.addColorStop(0,`rgba(0,0,0,0)`),p.addColorStop(1,t===`night`?`rgba(0,0,0,0.35)`:`rgba(120,60,0,0.10)`),e.fillStyle=p,e.fillRect(0,0,r,u)}function Kt(t,n){return e(n.ratio,()=>qt(t,n))}function qt(e,t){let n=C(e,t),i=o.ratio===`9:16`?``:`@${o.ratio}`,a=(n?JSON.stringify(n):`native:${t.look}:${e}:${t.bgSeed??``}:${t.bgCtx??``}`)+i,s=Ut.get(a);if(!s){s=document.createElement(`canvas`),s.width=r,s.height=u;let i=s.getContext(`2d`,{willReadFrequently:!0});if(n)T(i,n);else{let n=document.createElement(`canvas`);n.width=r,n.height=u;let a=n.getContext(`2d`);t.look===`crayon`?Wt(a,e):Gt(a,e,t.bgSeed),t.bgSeed!==void 0&&E(t)&&(i.filter=`hue-rotate(${E(t)}deg)`),i.drawImage(n,0,0),i.filter=`none`,t.bgSeed!==void 0&&p(i,t.bgSeed,h(t),e===`night`)}Ut.set(a,s),Ut.size>32&&Ut.delete(Ut.keys().next().value)}return s}var Jt=[244,241,230],Yt=[43,42,40],Xt=new WeakMap;function Zt([e,t,n]){let r=e=>{let t=e/255;return t<=.03928?t/12.92:((t+.055)/1.055)**2.4};return .2126*r(e)+.7152*r(t)+.0722*r(n)}function Qt(e,t,n,r){let i=e.getContext(`2d`,{willReadFrequently:!0});if(!i)return!1;let a=i.getImageData(0,t,e.width,n-t).data,o=[],s=[0,0,0];for(let e=0;e<a.length;e+=388){o.push(Zt([a[e],a[e+1],a[e+2]]));for(let t=0;t<3;t++)s[t]+=a[e+t]}if(!o.length)return!1;if(r)for(let e=0;e<3;e++)r[e]=s[e]/o.length;let c=(e,t)=>(Math.max(e,t)+.05)/(Math.min(e,t)+.05),l=Zt(Jt),u=Zt(Yt),d=e=>Math.min(...o.map(t=>c(t,e)));return d(l)>d(u)}function $(e){let t=Xt.get(e);if(!t){let n=[0,0,0],r=Object.values(s).find(t=>t.W===e.width&&t.H===e.height)??a();t={caption:{dark:Qt(e,r.capBand[0],r.capBand[1],n),avg:n},art:Qt(e,r.art[1]+20,r.art[3])},Xt.set(e,t)}return t}var $t=new WeakMap;function en(e,t){let n=Math.round(t/10)*10,r=$t.get(e);r||$t.set(e,r=new Map);let i=r.get(n);if(!i){let t=[0,0,0],a=Math.max(0,n-110),o=Math.min(e.height,n+120);i={dark:Qt(e,a,Math.max(a+10,o),t),avg:t},r.set(n,i)}return i}var enLiveCache=new Map,enScratch=null;function enLive(e,xN,yN,n,cacheKey){if(cacheKey&&enLiveCache.has(cacheKey))return enLiveCache.get(cacheKey);let c=e?.canvas;if(c&&c.height>10&&c.width>10){try{let sw=96,sh=Math.max(96,Math.round(96*(c.height/Math.max(1,c.width))));enScratch??=document.createElement(`canvas`);(enScratch.width!==sw||enScratch.height!==sh)&&([enScratch.width,enScratch.height]=[sw,sh]);let ctx2=enScratch.getContext(`2d`,{willReadFrequently:!0});if(ctx2){ctx2.clearRect(0,0,sw,sh),ctx2.drawImage(c,0,0,sw,sh);let xC=Math.round(Math.max(.1,Math.min(.9,xN??.5))*sw),hw=Math.max(10,Math.round(sw*.22)),x0=Math.max(0,xC-hw),x1=Math.min(sw,xC+hw),yC=Math.round(Math.max(0,Math.min(1,yN??.855))*sh),a0=Math.max(0,yC-10),o0=Math.min(sh,Math.max(a0+4,yC+10)),w=Math.max(1,x1-x0),h=Math.max(1,o0-a0),data=ctx2.getImageData(x0,a0,w,h).data,lum=0,cnt=0,sum=[0,0,0];for(let k=0;k<data.length;k+=8){let r=data[k],g=data[k+1],b=data[k+2];sum[0]+=r,sum[1]+=g,sum[2]+=b,lum+=Zt([r,g,b]),cnt++}if(cnt>0){let res={dark:lum/cnt<.42,avg:[sum[0]/cnt,sum[1]/cnt,sum[2]/cnt]};if(cacheKey){enLiveCache.size>128&&enLiveCache.delete(enLiveCache.keys().next().value);enLiveCache.set(cacheKey,res)}return res}}}catch{}}return n?en(n,(yN??.855)*n.height):{dark:!1,avg:[244,241,230]}}function tn(e,t){return $(Kt(e,t)).caption}function nn(e,t){let n=t?a(t):o,r=Math.min(1,(n.art[3]-n.art[1])/680),i=f(e);if(i?.live)return{x:n.cx,y:n.cy-15,w:300*r,h:300*r*(16/9),live:!0};let s=i?i.h/Math.max(1,i.w):1,c=Math.min(1.5,Math.max(.6,s)),l=Math.min(440*r,470*r/c),u=l*c;return{x:n.cx,y:n.cy-15,w:l,h:u,live:!1}}function rn(e,t,n){let{x:r,y:i,w:a,h:o,live:s}=nn(t),c=t.length%2?1:-1,l=e.at(0,.6),u=e.wave(.5,9);e.shadow(r,i+o/2+44,a*.4*(1-u/90),{alpha:l}),e.photo(t,{x:r+e.wave(.33,5,1),y:i+u+(1-l)*70,w:a,frame:s?`phone`:`card`,pad:s?11:14,r:s?42:30,ring:e.c.orange,ringWidth:7,rotate:c*.035+e.wave(.4,.022)-c*.25*(1-l),draw:l,zoom:s?1:1.03+.07*e.p,time:n})}function an(e,t){let n=a(e.ratio),r=be(t??{},e),i=F(e)!==`off`&&!t?.captionHidden,o=r?.y??.855;if(Ye(e)||i&&o<.3)return n.ratio===`9:16`?{zoom:.96,from:880,to:940}:{zoom:.96,from:n.art[3],to:n.art[3]+24};if(i&&o>.7)return n.ratio===`9:16`?{zoom:.97,from:n.art[3],to:n.art[3]-24}:{zoom:.96,from:n.art[3],to:Math.max(n.art[1]+260,n.floor-24)};return{zoom:n.zoom,from:n.art[3],to:n.floor}}function drawGraphMotionWatermark(e,t,n){if(n?.watermarkHidden)return;let r=t.W/720,i=Math.round(24*r),a=Math.round(22*r),o=Math.round(32*r);e.save(),e.globalAlpha=.92,e.translate(i,a);let s=o/48;e.save(),e.scale(s,s),e.fillStyle=`rgba(8, 12, 24, 0.72)`,e.beginPath(),e.roundRect(0,0,224,48,14),e.fill(),e.strokeStyle=`rgba(56, 189, 248, 0.28)`,e.lineWidth=1.5,e.stroke(),e.fillStyle=`#0284c7`,e.beginPath(),e.roundRect(9,25,6,14,2),e.fill(),e.fillStyle=`#6366f1`,e.beginPath(),e.roundRect(18,17,6,22,2),e.fill(),e.fillStyle=`#ec4899`,e.beginPath(),e.roundRect(27,10,6,29,2),e.fill(),e.strokeStyle=`#38bdf8`,e.lineWidth=2.5,e.lineCap=`round`,e.beginPath(),e.moveTo(8,34),e.quadraticCurveTo(20,26,35,11),e.stroke(),e.fillStyle=`#f43f5e`,e.beginPath(),e.moveTo(33,8),e.lineTo(42,13),e.lineTo(33,18),e.closePath(),e.fill(),e.font=`800 18px "Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif`,e.textBaseline=`middle`,e.textAlign=`left`,e.fillStyle=`#ffffff`,e.fillText(`Graph`,50,25),e.fillStyle=`#38bdf8`,e.fillText(`Motion`,108,25),e.restore(),e.restore()}function on(e,t){let n=Zt(e),r=Zt(t);return(Math.max(n,r)+.05)/(Math.min(n,r)+.05)}function sn(e,t,n,r,a){let s=i(e,a,1,t,n);s.circle(o.cx,o.cy,90+s.wave(.6,6),{stroke:s.c.orange,width:4,draw:s.at(0,1)}),s.text(r,o.cx,o.cy,{size:30,color:s.c.orange})}var cn=null;function ln(e,t=Lt){if(!cn){let e=document.createElement(`canvas`);e.width=r,e.height=u,cn=e.getContext(`2d`)}if(!cn||!e.code)return null;let n=null;for(let r of[0,.25,.5,.75,.98])if(cn.setTransform(1,0,0,1,0,0),fn(cn,e,e.duration*r,e=>n??=e,t),n)break;return n}var un=new Map,dn=e=>{let t=un.get(e);return t===void 0&&un.set(e,t=D(e)),t};function fn(t,n,r,i,a=Lt){e(a.ratio,()=>pn(t,n,r,i,a))}function pn(e,t,n,r,a){let{cx:s,cy:c}=o;e.save();let u=Kt(t.theme,a);let isAutoCtx=!!(t.code&&t.code.trimStart().startsWith(`// @auto-contextual-scene`));if(Ft(t.code)||isAutoCtx){mn(e,t,n,r,a,u),e.restore();return}let d=St(t,n,a);e.save(),e.translate(s+d.x*.28+d.sx*.4,c+d.y*.28+d.sy*.4),e.rotate(d.rot*.35+d.srot*.4);let f=Math.max(1.08,1.08+(d.zoom-1)*.25+Math.abs(d.x)/s*.14);e.scale(f,f),e.translate(-s,-c),e.drawImage(u,0,0),e.restore(),e.save(),e.translate(s+d.x+d.sx,c+d.y+d.sy),e.rotate(d.rot+d.srot),e.scale(d.zoom,d.zoom),e.translate(-s,-c);let p=an(a,t);if(e.translate(o.W/2,p.to),e.scale(p.zoom,p.zoom),e.translate(-o.W/2,-p.from),t.code){let o=zt(t.code);if(o instanceof Error)sn(e,t.theme,a.look,`kode error`,n),r?.(o.message);else{e.save();try{let r=Ht(t,a),s={...l(t.theme,a),dark:$(u).art,degrees:dn(t.code)},_ctx=i(e,n*r.k,r.dur,t.theme,a.look,void 0,s);_ctx.caption=hn(t,a,r.k,r.dur);_ctx.pace=a.pace;o(_ctx,e)}catch(e){r?.(e instanceof Error?e.message:String(e))}e.restore()}}else sn(e,t.theme,a.look,`belum dianimasikan`,n);t.photo&&(e.save(),rn(i(e,n,t.duration,t.theme,a.look,void 0,{...l(t.theme,a),dark:$(u).art}),t.photo,n+(t.photoAt??0)),e.restore()),e.restore();let m=be(t,a),ck=`${t.id??t.text?.slice(0,24)??``}:${t.theme}:${a.art}:${a.look}:${a.ratio}:${Math.round((m?m.x:.5)*100)}:${Math.round((m?m.y:.855)*100)}`;lt(e,t,n,a,t.code?enLive(e,m?m.x:.5,m?m.y:.855,u,ck):m?en(u,m.y*u.height):$(u).caption),drawGraphMotionWatermark(e,o,a),e.restore()}function mn(e,t,n,r,a,s){e.drawImage(s,0,0);let c=zt(t.code);if(c instanceof Error)sn(e,t.theme,a.look,`kode error`,n),r?.(c.message);else{e.save();try{let r=Ht(t,a),u={...l(t.theme,a),dark:$(s).art,degrees:!1},d=i(e,n*r.k,r.dur,t.theme,a.look,void 0,u);d.caption=hn(t,a,r.k,r.dur),d.pace=a.pace,c(d,e)}catch(e){r?.(e instanceof Error?e.message:String(e))}e.restore()}t.photo&&(e.save(),rn(i(e,n,t.duration,t.theme,a.look,void 0,{...l(t.theme,a),dark:$(s).art}),t.photo,n+(t.photoAt??0)),e.restore());let u=be(t,a),ck=`${t.id??t.text?.slice(0,24)??``}:${t.theme}:${a.art}:${a.look}:${a.ratio}:${Math.round((u?u.x:.5)*100)}:${Math.round((u?u.y:.855)*100)}`;lt(e,t,n,a,t.code?enLive(e,u?u.x:.5,u?u.y:.855,s,ck):u?en(s,u.y*s.height):$(s).caption),drawGraphMotionWatermark(e,o,a)}function hn(e,t,n,r){let i=e.text.split(/\s+/).filter(Boolean),a=H(e,t).map(e=>Math.max(0,e)*n),o=e=>e.toLowerCase().replace(/[^\p{L}\p{N}]/gu,``),s=new Set((e.emphasis??``).split(/\s+/).map(o).filter(Boolean)),wt=Array.isArray(e.wordTimings)&&e.wordTimings.length===i.length?e.wordTimings:null,paceRate=t.pace===`santai`||t.pace===`tenang`?.16:.115;return{text:e.text,words:i.map((e,c)=>{if(wt?.[c]){let u=Math.max(0,Number(wt[c].at??0)*n),d=Math.min(r,Math.max(u+.08,Number(wt[c].end??u+.28)*n));return{text:e,at:u,end:d,key:Boolean(wt[c].key)||s.has(o(e))}}let u=a[c]??0,nextAt=a[c+1],vCnt=Math.max(1,(e.match(/[aiueoAIUEO]/g)||[]).length),sylEst=Math.max(.14,Math.min(.62,vCnt*paceRate+.06)),pauseGap=/[.,!?;:—–\-]$/.test(e.trim())?.12:.03,capEnd=nextAt!==void 0?Math.min(nextAt-pauseGap,u+sylEst):u+sylEst;return{text:e,at:u,end:Math.min(r,Math.max(u+.08,capEnd)),key:s.has(o(e))}})}}function gn(e){return e.reduce((e,t)=>e+t.duration,0)}function _n(e,t){let n=0;for(let r=0;r<e.length;r++){if(t<n+e[r].duration||r===e.length-1)return{index:r,local:Math.min(t-n,e[r].duration)};n+=e[r].duration}return{index:0,local:0}}function vn(e,t){let n=e[t];if(!n.photo)return n;let r=0;for(let i=0;i<t;i++)e[i].photo===n.photo&&(r+=e[i].duration);return r?{...n,photoAt:r}:n}function yn(t,n,r,i,a=Lt){e(a.ratio,()=>xn(t,n,r,i,a))}function bn(e,t,n,r){let i=t[Math.min(t.length-1,Math.max(0,Math.round(n.scene??1)-1))];pn(e,{...i,captionHidden:!0},Math.min(i.duration*.6,Math.max(0,i.duration-.2)),void 0,{...r,hook:void 0});let{W:a,H:s}=o,c=h(r)??`#38bdf8`,l=`#1c1612`,u=(e,t=800)=>`${t} ${e}px "Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif`,d=(t,n,r,i=800)=>{e.font=u(n,i);let a=e.measureText(t).width;return a>r?Math.max(12,Math.floor(n*r/a)):n};e.save(),e.fillStyle=`rgba(10,8,6,0.28)`,e.fillRect(0,0,a,s);let f=e.createRadialGradient(a/2,s*.42,a*.2,a/2,s*.45,s*.75);f.addColorStop(0,`rgba(10,8,6,0)`),f.addColorStop(1,`rgba(10,8,6,0.7)`),e.fillStyle=f,e.fillRect(0,0,a,s),e.textAlign=`center`,e.textBaseline=`middle`;let p=a/2,m=a*.8,g=s*.3;if(n.top){let t=d(n.top.toUpperCase(),a*.042,m*.9);e.font=u(t);let r=e.measureText(n.top.toUpperCase()).width+t*1.2,i=t*1.7;e.fillStyle=`#ffffff`,e.beginPath(),e.roundRect(p-r/2,g-i/2,r,i,i/2),e.fill(),e.fillStyle=l,e.fillText(n.top.toUpperCase(),p,g+t*.06),g+=i/2+a*.02}{let t=n.big.toUpperCase(),r=d(t,a*.14,m-a*.08);e.font=u(r);let i=e.measureText(t).width+r*.7,o=r*1.25;g+=o/2,e.save(),e.translate(p,g),e.rotate(-.045),e.fillStyle=l,e.fillRect(-i/2+a*.012,-o/2+a*.012,i,o),e.fillStyle=c,e.fillRect(-i/2,-o/2,i,o),e.lineWidth=a*.006,e.strokeStyle=l,e.strokeRect(-i/2,-o/2,i,o),e.lineJoin=`round`,e.lineWidth=r*.12,e.strokeText(t,0,r*.06),e.fillStyle=`#ffffff`,e.fillText(t,0,r*.06),e.restore(),g+=o/2+a*.035}if(n.bottom){let t=d(n.bottom,a*.05,m,700);e.font=u(t,700);let r=e.measureText(n.bottom).width;g+=t*.5,e.shadowColor=`rgba(0,0,0,0.6)`,e.shadowBlur=a*.015,e.fillStyle=`#ffffff`,e.fillText(n.bottom,p,g),e.shadowColor=`transparent`,e.strokeStyle=c,e.lineCap=`round`,e.lineWidth=t*.14,e.beginPath(),e.moveTo(p-r*.42,g+t*.62),e.quadraticCurveTo(p,g+t*.74,p+r*.42,g+t*.6),e.stroke()}e.restore()}function xn(e,t,n,r,i){if(t.length===0)return;let a=i.thumbDuration??0,s=a>0&&n<a?f(`thumb`):void 0;if(!s&&i.hook&&n<.5)return bn(e,t,i.hook,i);let c=Math.min(.15,a*.25);if(s&&n<a-c){let{sx:t,sy:n,sw:r,sh:i}=v(s,o.W,o.H);e.drawImage(s.src,t,n,r,i,0,0,o.W,o.H);return}let{index:l,local:u}=_n(t,n),d=vn(t,l),p=t[l+1]&&vn(t,l+1),m=e=>r?.({index:l,message:e}),h=e=>r?.({index:l+1,message:e}),g=d.duration-u,_=ae(l,i,d),y=oe(_);if(!p||g>=y)fn(e,d,u,m,i);else{let tr=1-g/y,inT=Math.min(Math.max(.08,p.duration*.14),bt(tr)*Math.min(.32,y*.9));he(e,_,tr,e=>fn(e,d,u,m,i),e=>fn(e,p,inT,h,i),i.brand?.colors?.[0]??S(i.art,i.look).accent??`#2563EB`)}if(s){e.save(),e.globalAlpha=Math.max(0,Math.min(1,(a-n)/Math.max(.01,c)));let{sx:t,sy:r,sw:i,sh:l}=v(s,o.W,o.H);e.drawImage(s.src,t,r,i,l,0,0,o.W,o.H),e.restore()}}var Sn=null;function Cn(e,t=Lt){let n=[],a=t.pace===`energik`,pScale=a?1.08:.96,o=0;e.forEach((e,s,r)=>{if(s>0)for(let[e,r2,i]of se(ae(s-1,t,r[s-1])))n.push({t:Math.max(0,o+r2),name:e,gain:Math.min(1,i*1.12*pScale)});else n.push({t:o,name:a?`whoosh`:`swish`,gain:a?.52:.34});let c=_t(e),camCueTimes=[];if(c===`shake`||c===`crash`){let r=Fe(e,t);r!==void 0&&r>.3&&r<e.duration&&camCueTimes.push({t:o+r,name:`thud`,gain:.5*pScale}),a||camCueTimes.push({t:o,name:`thud`,gain:.38*pScale})}else if(c===`push`||c===`pull`){camCueTimes.push({t:o+.12,name:`swish`,gain:.28*pScale,pitch:c===`push`?1.04:.96});let r=Fe(e,t);r!==void 0&&r>.32&&r<e.duration-.15&&camCueTimes.push({t:o+r,name:`swish`,gain:.3*pScale,pitch:1.05})}else if(c===`pan-left`||c===`pan-right`||c===`tilt-up`||c===`tilt-down`||c===`orbit`){camCueTimes.push({t:o+.14,name:`swish`,gain:.26*pScale,pitch:1.01});let r=Fe(e,t);r!==void 0&&r>.32&&r<e.duration-.15&&camCueTimes.push({t:o+r,name:`pop`,gain:.28*pScale,pitch:1.04})}let l0=n.length,sceneCueTimes=[];if(e.code){let fnCode=zt(e.code),sStart=o,cTime=Ht(e,t),seen=new Set;if(!(fnCode instanceof Error)){if(!Sn){let cv=document.createElement(`canvas`);cv.width=720,cv.height=1280,Sn=cv.getContext(`2d`)}let probeTimes=[0];let stepProbe=Math.max(.14,cTime.dur/14);for(let pt=stepProbe;pt<=cTime.dur+.001;pt+=stepProbe)probeTimes.push(Math.min(cTime.dur,pt));for(let pt of probeTimes){try{fnCode(i(Sn,pt,cTime.dur,e.theme,t.look,(nmRaw,tmRaw,gnRaw,ptRaw)=>{let tmNum=Number(tmRaw)||0;if(nmRaw&&tmNum>=0&&tmNum<=cTime.dur){let nm=String(nmRaw).toLowerCase(),k=`${nm}@${Math.round(tmNum*50)}`;if(!seen.has(k)){seen.add(k);let absT=sStart+tmNum/cTime.k;if(!sceneCueTimes.some(st=>Math.abs(st-absT)<.045&&n.some(ev=>Math.abs(ev.t-st)<.045&&ev.name===nm))){sceneCueTimes.push(absT);n.push({t:absT,name:nm,gain:Math.min(.98,Math.max(.22,(Number(gnRaw)||.82)*1.04*pScale)),pitch:ptRaw})}}}},l(e.theme,t)),Sn)}catch{}}}for(let m of e.code.matchAll(/s\.sfx\(\s*['"`]([a-z0-9_-]+)['"`]\s*(?:,\s*([0-9.]+))?\s*(?:,\s*([0-9.]+))?\s*(?:,\s*([0-9.]+))?\s*\)/gi)){let nm=m[1].toLowerCase(),tm=m[2]!==void 0?Number(m[2]):.06,gn=m[3]!==void 0?Number(m[3]):.8,pt=m[4]!==void 0?Number(m[4]):void 0;if(nm&&Number.isFinite(tm)&&tm>=0&&tm<=cTime.dur){let k=`${nm}@${Math.round(tm*50)}`;if(!seen.has(k)){seen.add(k);let absT=sStart+tm/cTime.k;sceneCueTimes.push(absT);n.push({t:absT,name:nm,gain:Math.min(.98,Math.max(.22,gn*1.04*pScale)),pitch:pt})}}}if(seen.size===0){let autoIdx=0,lastAutoT=-1;for(let m of e.code.matchAll(/s\.(pop|spring|at)\(\s*([0-9.]+)/g)){let fn=m[1],tm=Number(m[2]);if(Number.isFinite(tm)&&tm>=.06&&tm<=cTime.dur-.12&&autoIdx<3&&tm-lastAutoT>=.30){let cue=fn===`pop`?`pop`:fn===`spring`?`slide`:`swish`,k=`auto@${tm.toFixed(1)}`;if(!seen.has(k)){seen.add(k),autoIdx++,lastAutoT=tm;let absT=sStart+tm/cTime.k;sceneCueTimes.push(absT);n.push({t:absT,name:cue,gain:.42*pScale,pitch:1+((autoIdx%3)-1)*.022})}}}}}for(let cc of camCueTimes){if(!sceneCueTimes.some(st=>Math.abs(st-cc.t)<.26)){sceneCueTimes.push(cc.t);n.push(cc)}}{let dur=Math.max(.8,Number(e.duration)||3.2),isLast=s===r.length-1,beatTemplates=[{frac:.06,name:e.sfxCue?String(e.sfxCue).toLowerCase():s===0?`whoosh`:`pop`,gain:.74*pScale,pitch:1.0},{frac:.28,name:s%2===0?`click`:`slide`,gain:.56*pScale,pitch:1.03},{frac:.54,name:s%3===0?`coin`:s%2===0?`impact`:`sparkle`,gain:.64*pScale,pitch:.98},{frac:.78,name:isLast?`ding`:`correct`,gain:.68*pScale,pitch:1.05}];for(let bt of beatTemplates){let btT=o+Math.min(dur-.12,Math.max(.05,dur*bt.frac));if(!sceneCueTimes.some(st=>Math.abs(st-btT)<.22)){sceneCueTimes.push(btT);n.push({t:btT,name:bt.name,gain:bt.gain,pitch:bt.pitch})}}}o+=e.duration});let s=Tt(S(t.art,t.look).id);return kt(n.map(e=>{let[t,n,r]=Dt(e.name,s,e.pitch??1,e.gain);return{...e,name:t,gain:Math.min(1,r*1.12),pitch:e.pitch===void 0&&n===1?void 0:n,flavor:s}}).sort((e,t)=>e.t-t.t))}async function wn(e){(e?.character?.kit||e?.kitPeople)&&await d().catch(()=>{});try{await Promise.all([document.fonts.load(`36px "Patrick Hand"`),document.fonts.load(`800 60px "Baloo 2"`)])}catch{}if(e){let t=c(e);await n([t.pop,t.hand])}}
w(yn);


// ============================================================================
// STYLE-SPECIFIC SOUND DESIGN & SFX FLAVOR SYSTEM (12 Distinct Sonic Profiles)
// ============================================================================
Object.assign(wt, {
  // 8-Bit / Voxel / Arcade / Chiptune
  retro: "8bit",
  voxelverse: "8bit",
  pixelbook: "8bit",
  dither: "8bit",
  mabar: "8bit",
  neongame: "8bit",
  pixel_rpg: "8bit",
  arcade_8bit: "8bit",

  // Paper / Collage / Editorial Zine / Scrapbook
  paperworld: "paper",
  papercut: "paper",
  kolase: "paper",
  arsip: "paper",
  diorama: "paper",
  edukasi: "paper",
  zine_brutalis: "paper",
  scrapbook_polaroid: "paper",
  vintage_newspaper: "paper",

  // Chalk / Sketch / Blueprint / Whiteboard
  sketsa: "chalk",
  kapur: "chalk",
  blueprint: "chalk",
  oneline: "chalk",
  papan_tulis: "chalk",
  sketch_notebook: "chalk",

  // Mechanical / Precision / Isometric CAD / Watchmaker
  precision: "mechanical",
  isometrik: "mechanical",
  belah: "mechanical",
  garis: "mechanical",
  kinetic_grid: "mechanical",
  jam_mekanik: "mechanical",

  // Terminal / Hacker / Cyber Glitch / Matrix
  terminal: "terminal",
  kilat: "terminal",
  glitch: "terminal",
  cyber_glitch: "terminal",
  matrix_code: "terminal",
  dev_terminal: "terminal",

  // Cinema / Documentary / Worldforge / Epic
  worldforge_roma: "cinema",
  worldforge_mars: "cinema",
  monofilm: "cinema",
  hyper_zoom: "cinema",
  sinematik: "cinema",
  noir_investigasi: "cinema",
  crime_doc: "cinema",
  history_epic: "cinema",

  // Clay / Stop-Motion / Playful Cartoon / Pop Art
  lempung: "clay",
  stopmotion_clay: "clay",
  bounce_cartoon: "clay",
  sticker_bomb: "clay",
  confetti_blast: "clay",
  popart: "clay",
  heboh: "clay",
  kolab: "clay",

  // Liquid / Ambient / Watercolor / Dreamy Glow
  cair: "liquid",
  bubble_gum: "liquid",
  aurora: "liquid",
  soft_glow: "liquid",
  cahaya: "liquid",
  tenang: "liquid",
  kuas: "liquid",
  siluet: "liquid",
  rasi: "liquid",
  cerita: "liquid",

  // Retro Tape / Analog Camera / Vinyl / VHS
  kaset: "retro_tape",
  tiket: "retro_tape",
  vhs_retro: "retro_tape",
  vinyl_warm: "retro_tape",

  // Editorial Motion Grid / SaaS UI / Kinetic Infographic
  editorial_motion_grid: "editorial",
  mograph_mix: "editorial",
  infopop: "editorial",
  pitch: "editorial",
  uiweb: "editorial",
  panduan: "editorial",
  carakerja: "editorial",
  modern: "editorial",
  produk: "editorial",
  reel: "editorial",
  kinetik: "terminal",
  futuristik: "digital",

  // 3D Studio Room / 3D Host Stage
  studio_3d_room: "studio3d",
  ruang: "studio3d",
  otomatis: "studio3d",
});

// Register style aliases into transition pool map ie and SFX flavor map wt
for (const [alias, target] of Object.entries(SATSET_STYLE_ID_ALIASES)) {
  if (ie[target] && !ie[alias]) {
    ie[alias] = ie[target];
  }
  if (wt[target] && !wt[alias]) {
    wt[alias] = wt[target];
  }
}

Object.assign(Et, {
  default: {
    pop: ["pop", 1, 0.92],
    tick: ["tick", 1, 0.65],
    click: ["click", 1, 0.85],
    whoosh: ["whoosh", 1, 0.88],
    swish: ["swish", 1, 0.85],
    zoom_in: ["zoom_in", 1, 0.88],
    card_slide: ["card_slide", 1, 0.86],
    slide: ["slide", 1, 0.85],
    ding: ["ding", 1, 0.9],
    correct: ["correct", 1, 0.9],
    sparkle: ["sparkle", 1, 0.85],
  },
  "8bit": {
    pop: ["blip", 1.15, 0.88],
    tick: ["blip", 1.65, 0.6],
    click: ["blip", 1.95, 0.78],
    tap: ["blip", 0.88, 0.82],
    whoosh: ["laser", 1.12, 0.84],
    swish: ["blip", 1.35, 0.78],
    swipe: ["laser", 1.28, 0.82],
    zoom_in: ["laser", 0.94, 0.86],
    card_slide: ["blip", 1.42, 0.82],
    slide: ["blip", 1.25, 0.8],
    data_scan: ["blip", 1.75, 0.76],
    ding: ["coin", 1.05, 0.96],
    correct: ["coin", 1.22, 0.94],
    sparkle: ["coin", 1.48, 0.82],
    impact: ["kick", 1.15, 0.9],
    boom: ["kick", 0.85, 0.92],
    thud: ["step", 1.2, 0.86],
  },
  digital: {
    pop: ["pop", 1.12, 0.92],
    tick: ["beep", 1.38, 0.62],
    click: ["click", 1.18, 0.86],
    tap: ["tap", 1.08, 0.85],
    whoosh: ["swipe", 1.14, 0.86],
    swish: ["swish", 1.16, 0.84],
    zoom_in: ["zoom_in", 1.12, 0.88],
    card_slide: ["card_slide", 1.15, 0.86],
    slide: ["card_slide", 1.08, 0.84],
    data_scan: ["data_scan", 1.16, 0.88],
    ding: ["notify", 1.08, 0.9],
    correct: ["correct", 1.1, 0.9],
    sparkle: ["sparkle", 1.15, 0.84],
    impact: ["impact", 1.06, 0.88],
  },
  editorial: {
    pop: ["cursor_click", 1.06, 0.88],
    tick: ["tick", 1.28, 0.64],
    click: ["cursor_click", 1.12, 0.86],
    tap: ["tap", 1.1, 0.84],
    whoosh: ["swipe", 1.08, 0.86],
    swish: ["card_slide", 1.05, 0.84],
    swipe: ["swipe", 1.04, 0.88],
    zoom_in: ["zoom_in", 1.06, 0.86],
    card_slide: ["card_slide", 1.04, 0.88],
    slide: ["card_slide", 1.0, 0.85],
    data_scan: ["data_scan", 1.05, 0.86],
    ding: ["correct", 1.04, 0.9],
    correct: ["correct", 1.0, 0.9],
    sparkle: ["graph_up", 1.04, 0.86],
    coin: ["cash", 1.02, 0.88],
    impact: ["stamp", 1.04, 0.86],
  },
  studio3d: {
    pop: ["card_slide", 1.04, 0.88],
    tick: ["tock", 1.06, 0.66],
    click: ["tap", 1.04, 0.84],
    tap: ["tap", 0.98, 0.86],
    whoosh: ["whoosh", 0.94, 0.88],
    swish: ["swish", 0.96, 0.84],
    zoom_in: ["zoom_in", 0.95, 0.88],
    card_slide: ["card_slide", 0.96, 0.86],
    slide: ["slide", 0.95, 0.84],
    data_scan: ["notify", 1.04, 0.84],
    ding: ["ding", 0.98, 0.92],
    correct: ["tada", 1.0, 0.88],
    sparkle: ["magic", 1.0, 0.84],
    impact: ["thud", 0.92, 0.9],
  },
  paper: {
    pop: ["paper", 1.0, 0.94],
    tick: ["tick", 1.12, 0.6],
    click: ["stamp", 1.18, 0.82],
    tap: ["paper", 1.16, 0.86],
    whoosh: ["pageflip", 0.96, 0.92],
    swish: ["paper", 0.92, 0.88],
    swipe: ["pageflip", 1.06, 0.9],
    zoom_in: ["pageflip", 1.0, 0.9],
    card_slide: ["paper", 1.08, 0.9],
    slide: ["pageflip", 0.94, 0.88],
    data_scan: ["type", 1.05, 0.82],
    ding: ["stamp", 1.0, 0.92],
    correct: ["stamp", 1.08, 0.9],
    sparkle: ["sparkle", 1.12, 0.84],
    thud: ["stamp", 0.92, 0.94],
    impact: ["stamp", 0.88, 0.95],
  },
  chalk: {
    pop: ["chalk", 1.08, 0.9],
    tick: ["chalk", 1.24, 0.68],
    click: ["tock", 1.12, 0.84],
    tap: ["tock", 1.0, 0.82],
    whoosh: ["chalk", 0.86, 0.92],
    swish: ["chalk", 0.98, 0.86],
    swipe: ["scratch", 0.92, 0.84],
    zoom_in: ["chalk", 0.92, 0.88],
    card_slide: ["chalk", 1.04, 0.88],
    slide: ["chalk", 0.95, 0.86],
    data_scan: ["chalk", 1.18, 0.82],
    ding: ["snap", 1.05, 0.88],
    correct: ["tock", 1.18, 0.88],
    sparkle: ["snap", 1.15, 0.82],
    impact: ["thud", 0.95, 0.88],
  },
  mechanical: {
    pop: ["snap", 1.04, 0.9],
    tick: ["tick", 1.0, 0.78],
    click: ["click", 0.94, 0.9],
    tap: ["tock", 1.05, 0.86],
    whoosh: ["whip", 0.92, 0.86],
    swish: ["swipe", 0.94, 0.84],
    zoom_in: ["tock", 0.88, 0.88],
    card_slide: ["click", 1.08, 0.88],
    slide: ["tock", 1.12, 0.84],
    data_scan: ["tick", 1.32, 0.8],
    ding: ["ding", 1.18, 0.9],
    correct: ["snap", 1.12, 0.9],
    sparkle: ["tick", 1.45, 0.78],
    impact: ["stamp", 0.94, 0.92],
  },
  terminal: {
    pop: ["type", 1.08, 0.9],
    tick: ["type", 1.25, 0.75],
    click: ["type", 1.0, 0.88],
    tap: ["beep", 1.15, 0.82],
    whoosh: ["glitch", 0.96, 0.86],
    swish: ["beep", 0.92, 0.8],
    swipe: ["glitch", 1.08, 0.84],
    zoom_in: ["glitch", 1.0, 0.86],
    card_slide: ["type", 1.12, 0.88],
    slide: ["beep", 1.04, 0.82],
    data_scan: ["glitch", 1.18, 0.86],
    ding: ["beep", 1.35, 0.9],
    correct: ["notify", 1.2, 0.88],
    sparkle: ["blip", 1.4, 0.82],
    impact: ["buzzer", 0.92, 0.86],
  },
  cinema: {
    pop: ["thud", 0.95, 0.9],
    tick: ["tock", 0.85, 0.72],
    click: ["shutter", 0.96, 0.88],
    tap: ["thud", 1.1, 0.82],
    whoosh: ["whoosh", 0.78, 0.96],
    swish: ["whoosh", 0.86, 0.88],
    swipe: ["whip", 0.84, 0.9],
    zoom_in: ["riser", 0.92, 0.88],
    card_slide: ["whoosh", 0.88, 0.86],
    slide: ["swish", 0.84, 0.84],
    data_scan: ["heart", 1.0, 0.88],
    ding: ["boom", 0.92, 0.94],
    correct: ["impact", 0.94, 0.92],
    sparkle: ["riser", 1.05, 0.84],
    impact: ["boom", 0.86, 0.98],
    thud: ["boom", 0.9, 0.94],
  },
  clay: {
    pop: ["boing", 1.06, 0.92],
    tick: ["pop", 1.25, 0.74],
    click: ["pop", 1.12, 0.86],
    tap: ["step", 1.08, 0.86],
    whoosh: ["slide", 1.04, 0.88],
    swish: ["boing", 0.94, 0.86],
    swipe: ["whip", 1.12, 0.86],
    zoom_in: ["boing", 0.98, 0.9],
    card_slide: ["pop", 0.96, 0.9],
    slide: ["slide", 1.0, 0.88],
    data_scan: ["bubble", 1.14, 0.86],
    ding: ["tada", 1.04, 0.92],
    correct: ["clap", 1.05, 0.9],
    sparkle: ["tada", 1.12, 0.86],
    impact: ["boing", 0.84, 0.94],
    thud: ["step", 0.92, 0.9],
  },
  liquid: {
    pop: ["bubble", 1.0, 0.9],
    tick: ["drop", 1.22, 0.68],
    click: ["drop", 1.06, 0.82],
    tap: ["bubble", 1.14, 0.84],
    whoosh: ["swish", 0.88, 0.84],
    swish: ["swish", 0.92, 0.82],
    swipe: ["bubble", 0.92, 0.86],
    zoom_in: ["magic", 0.96, 0.84],
    card_slide: ["drop", 0.96, 0.86],
    slide: ["swish", 0.9, 0.82],
    data_scan: ["sparkle", 1.04, 0.82],
    ding: ["magic", 1.0, 0.88],
    correct: ["sparkle", 1.06, 0.88],
    sparkle: ["magic", 1.08, 0.86],
    impact: ["drop", 0.78, 0.9],
    boom: ["thud", 0.88, 0.84],
  },
  retro_tape: {
    pop: ["shutter", 1.04, 0.9],
    tick: ["tock", 0.94, 0.74],
    click: ["shutter", 1.12, 0.88],
    tap: ["click", 0.92, 0.84],
    whoosh: ["scratch", 0.94, 0.86],
    swish: ["pageflip", 0.88, 0.84],
    swipe: ["scratch", 1.04, 0.86],
    zoom_in: ["shutter", 0.96, 0.9],
    card_slide: ["shutter", 1.08, 0.86],
    slide: ["scratch", 0.9, 0.82],
    data_scan: ["type", 0.94, 0.84],
    ding: ["cash", 0.96, 0.9],
    correct: ["stamp", 0.96, 0.9],
    sparkle: ["coin", 0.94, 0.86],
    impact: ["stamp", 0.88, 0.92],
  },
  soft: {
    pop: ["pop", 0.92, 0.86],
    tick: ["tick", 1.08, 0.52],
    click: ["tap", 0.96, 0.76],
    whoosh: ["swish", 0.88, 0.8],
    swish: ["swish", 0.92, 0.78],
    zoom_in: ["swish", 0.9, 0.82],
    card_slide: ["tap", 0.94, 0.8],
    ding: ["sparkle", 0.96, 0.84],
    correct: ["ding", 0.96, 0.84],
    boom: ["thud", 0.92, 0.84],
    impact: ["thud", 0.92, 0.84],
    kick: ["thud", 0.92, 0.8],
  },
});

// Resolve style ID (including Kreatorlab IDs & heuristic prefixes) to one of the 12 sonic flavors
Tt = (styleRaw) => {
  if (!styleRaw) return "default";
  const clean = String(styleRaw).toLowerCase().trim();
  if (wt[clean]) return wt[clean];
  const aliased = SATSET_STYLE_ID_ALIASES[clean];
  if (aliased && wt[aliased]) return wt[aliased];
  if (/voxel|pixel|8bit|retro|arcade|mabar|game|dither/.test(clean)) return "8bit";
  if (/paper|kertas|kolase|collage|arsip|zine|scrapbook|buku|koran|diorama/.test(clean)) return "paper";
  if (/chalk|kapur|sketsa|sketch|blueprint|whiteboard|tulis|oneline/.test(clean)) return "chalk";
  if (/precision|mekanik|isometrik|gear|clock|jam|cad|grid_tech/.test(clean)) return "mechanical";
  if (/terminal|matrix|hacker|cli|code|glitch|cyber/.test(clean)) return "terminal";
  if (/worldforge|roma|mars|cinema|noir|film|doc|epic|investigasi|thriller/.test(clean)) return "cinema";
  if (/clay|lempung|stopmotion|cartoon|bounce|sticker|confetti|popart|heboh/.test(clean)) return "clay";
  if (/cair|liquid|bubble|water|aurora|glow|cahaya|tenang|kuas|zen|ambient/.test(clean)) return "liquid";
  if (/kaset|tape|vhs|vinyl|tiket|analog|polaroid/.test(clean)) return "retro_tape";
  if (/studio_3d|host|ruang|stage_3d|avatar/.test(clean)) return "studio3d";
  if (/editorial|mograph|bento|saas|ui|dashboard|infopop|pitch|panduan|kinetik/.test(clean)) return "editorial";
  return "default";
};

Dt = (sfxName, flavor = "default", pitch = 1, gain = 1) => {
  const flv = Et[flavor] || Et.default || {};
  const key = String(sfxName || "pop").toLowerCase().trim();
  const mapped = flv[key];
  if (mapped) {
    return [mapped[0], pitch * mapped[1], gain * mapped[2]];
  }
  return [key, pitch, gain];
};

// Style-specific tempo-synced motion beat templates (organic foley & motion cues, zero repetitive high-pitched chimes)
const STYLE_FLAVOR_BEAT_TEMPLATES = {
  "8bit": [
    { frac: 0.06, name: "laser", gain: 0.52, pitch: 0.96 },
    { frac: 0.42, name: "blip", gain: 0.44, pitch: 0.94 },
    { frac: 0.76, name: "step", gain: 0.46, pitch: 0.92 },
  ],
  paper: [
    { frac: 0.06, name: "pageflip", gain: 0.62, pitch: 0.96 },
    { frac: 0.42, name: "paper", gain: 0.52, pitch: 1.0 },
    { frac: 0.76, name: "stamp", gain: 0.56, pitch: 0.94 },
  ],
  chalk: [
    { frac: 0.06, name: "chalk", gain: 0.58, pitch: 0.94 },
    { frac: 0.42, name: "tock", gain: 0.46, pitch: 0.92 },
    { frac: 0.76, name: "snap", gain: 0.52, pitch: 0.96 },
  ],
  mechanical: [
    { frac: 0.06, name: "whip", gain: 0.56, pitch: 0.94 },
    { frac: 0.42, name: "tock", gain: 0.48, pitch: 0.92 },
    { frac: 0.76, name: "snap", gain: 0.54, pitch: 0.96 },
  ],
  terminal: [
    { frac: 0.06, name: "swipe", gain: 0.54, pitch: 0.96 },
    { frac: 0.42, name: "type", gain: 0.48, pitch: 0.96 },
    { frac: 0.76, name: "tap", gain: 0.5, pitch: 0.94 },
  ],
  cinema: [
    { frac: 0.06, name: "boom", gain: 0.66, pitch: 0.88 },
    { frac: 0.42, name: "whoosh", gain: 0.52, pitch: 0.86 },
    { frac: 0.76, name: "thud", gain: 0.58, pitch: 0.9 },
  ],
  clay: [
    { frac: 0.06, name: "boing", gain: 0.58, pitch: 0.96 },
    { frac: 0.42, name: "pop", gain: 0.5, pitch: 0.98 },
    { frac: 0.76, name: "step", gain: 0.52, pitch: 0.94 },
  ],
  liquid: [
    { frac: 0.06, name: "swish", gain: 0.56, pitch: 0.92 },
    { frac: 0.42, name: "bubble", gain: 0.48, pitch: 0.96 },
    { frac: 0.76, name: "drop", gain: 0.5, pitch: 0.94 },
  ],
  retro_tape: [
    { frac: 0.06, name: "shutter", gain: 0.58, pitch: 0.96 },
    { frac: 0.42, name: "scratch", gain: 0.48, pitch: 0.96 },
    { frac: 0.76, name: "stamp", gain: 0.52, pitch: 0.94 },
  ],
  editorial: [
    { frac: 0.06, name: "swipe", gain: 0.58, pitch: 0.98 },
    { frac: 0.42, name: "card_slide", gain: 0.5, pitch: 0.96 },
    { frac: 0.76, name: "cursor_click", gain: 0.48, pitch: 0.96 },
  ],
  studio3d: [
    { frac: 0.06, name: "whoosh", gain: 0.58, pitch: 0.94 },
    { frac: 0.42, name: "card_slide", gain: 0.5, pitch: 0.96 },
    { frac: 0.76, name: "tap", gain: 0.48, pitch: 0.94 },
  ],
};

// Override Mt & Nt so any high-frequency chime/bell cue ('ding', 'coin', 'sparkle', 'notify', 'cash', 'beep', 'correct', 'tada', 'magic', 'tick')
// is synthesized as a warm, low-mid wooden marimba / soft felt / studio foley accent (< 580Hz fundamental, rapid decay, zero metallic 'ting-ting')
const _origMt = Mt;
Mt = function playWarmStudioRawSfx(ctx, dest, rawName, whenSec, gain = 1, pitch = 1, flavor = "default") {
  const name = String(rawName || "pop").toLowerCase().trim();
  const c = Math.max(whenSec, ctx.currentTime);
  const pRatio = Math.min(1.35, Math.max(0.65, Number(pitch) || 1));
  const gScale = Math.min(0.85, Math.max(0.12, (Number(gain) || 0.7) * 0.78));

  // Intercept piercing metallic/high-frequency chime cues and render warm low-mid studio foley instead
  if (
    name === "ding" ||
    name === "coin" ||
    name === "notify" ||
    name === "correct" ||
    name === "sparkle" ||
    name === "tada" ||
    name === "magic" ||
    name === "cash" ||
    name === "beep" ||
    name === "tick" ||
    name === "tock" ||
    name === "data_scan"
  ) {
    const nodes = [];
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.setValueAtTime(1650, c);
    lpf.Q.setValueAtTime(0.5, c);
    lpf.connect(dest);

    const makeWarmPulse = (freqStart, freqEnd, durSec, peakGain, startOffset = 0) => {
      const t0 = c + startOffset;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freqStart * pRatio, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(60, freqEnd * pRatio), t0 + durSec);
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.linearRampToValueAtTime(Math.max(0.0002, peakGain * gScale), t0 + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec + 0.03);
      osc.connect(env);
      env.connect(lpf);
      osc.start(t0);
      osc.stop(t0 + durSec + 0.05);
      nodes.push(osc);
    };

    if (name === "tick" || name === "tock" || name === "beep" || name === "data_scan") {
      // Soft wooden block / muted key tap (240Hz -> 135Hz, 45ms)
      makeWarmPulse(260, 135, 0.048, 0.24, 0);
    } else if (name === "ding" || name === "notify" || name === "correct") {
      // Warm low-mid marimba fifth (293.66Hz D4 -> 392Hz G4, soft felt envelope, 130ms)
      makeWarmPulse(293.66, 285, 0.11, 0.28, 0);
      makeWarmPulse(392.0, 380, 0.14, 0.24, 0.045);
    } else if (name === "coin" || name === "cash") {
      // Warm tactile card-snap + low wood accent (no high 1318Hz arcade ring)
      makeWarmPulse(330, 220, 0.075, 0.28, 0);
      makeWarmPulse(440, 360, 0.12, 0.22, 0.04);
    } else {
      // Warm chordal swell for sparkle / tada / magic (261Hz, 329Hz, 392Hz warm low-mid triad)
      makeWarmPulse(261.63, 255, 0.12, 0.2, 0);
      makeWarmPulse(329.63, 320, 0.14, 0.18, 0.035);
      makeWarmPulse(392.0, 382, 0.16, 0.16, 0.07);
    }
    return nodes;
  }

  return _origMt(ctx, dest, name, whenSec, gScale, pRatio, flavor);
};

Nt = function scheduleWarmSatsetSfxTimeline(ctx, dest, events, fromSec, startCtxTime) {
  const activeNodes = [];
  for (const ev of events) {
    const isOpeningGrace = fromSec <= 0.2 && ev.t <= 0.2;
    if (ev.t < fromSec - 0.14 && !isOpeningGrace) continue;
    const when = isOpeningGrace && ev.t < fromSec ? startCtxTime : startCtxTime + Math.max(0, ev.t - fromSec);
    activeNodes.push(...Mt(ctx, dest, ev.name, when, ev.gain, ev.pitch, ev.flavor));
  }
  return () =>
    activeNodes.forEach((n) => {
      try {
        n.stop();
      } catch {}
    });
};

// Override Cn (collectSatsetSfxTimeline) so each scene resolves its own style flavor & synchronizes beats to narration word timings
const _origCn = Cn;
Cn = function collectSatsetSfxTimelineByStyle(scenes, projectMeta = Lt) {
  if (!Array.isArray(scenes) || scenes.length === 0) return [];
  const isEnergik = projectMeta.pace === "energik";
  const pScale = isEnergik ? 1.0 : 0.9;
  const projectStyleId = S(projectMeta.art, projectMeta.look).id;
  const events = [];
  let cursor = 0;

  scenes.forEach((sc, idx, arr) => {
    const rawSceneStyle =
      sc.styleId ||
      sc.visualModule ||
      (projectMeta.art && projectMeta.art !== "otomatis" ? projectMeta.art : projectStyleId);
    const sceneFlavor = Tt(rawSceneStyle);

    // 1. Scene transition / opening SFX adapted to sceneFlavor
    if (idx > 0) {
      for (const [trName, offset, gain] of se(ae(idx - 1, projectMeta, arr[idx - 1]))) {
        const [, mappedPitch, mappedGain] = Dt(trName, sceneFlavor, 1.0, Math.min(0.92, gain * pScale));
        events.push({
          t: Math.max(0, cursor + offset),
          name: trName,
          gain: mappedGain,
          pitch: mappedPitch,
          flavor: sceneFlavor,
        });
      }
    } else {
      const openBase = sc.sfxCue ? String(sc.sfxCue).toLowerCase() : isEnergik ? "whoosh" : "swish";
      const [mappedOpen, openPitch, openGain] = Dt(openBase, sceneFlavor, 1.0, (isEnergik ? 0.52 : 0.38) * pScale);
      events.push({
        t: cursor,
        name: mappedOpen,
        gain: openGain,
        pitch: openPitch,
        flavor: sceneFlavor,
      });
    }

    // 2. Collect explicit s.sfx(...) cues from scene code and map them through sceneFlavor
    const sceneCueTimes = [];
    if (sc.code) {
      const cTime = Ht(sc, projectMeta);
      const seen = new Set();
      const fnCode = zt(sc.code);
      if (!(fnCode instanceof Error)) {
        if (!Sn && typeof document !== "undefined") {
          const cv = document.createElement("canvas");
          cv.width = 720;
          cv.height = 1280;
          Sn = cv.getContext("2d");
        }
        if (Sn) {
          const probeTimes = [0];
          const stepProbe = Math.max(0.14, cTime.dur / 14);
          for (let pt = stepProbe; pt <= cTime.dur + 0.001; pt += stepProbe) {
            probeTimes.push(Math.min(cTime.dur, pt));
          }
          for (const pt of probeTimes) {
            try {
              fnCode(
                i(
                  Sn,
                  pt,
                  cTime.dur,
                  sc.theme,
                  projectMeta.look,
                  (nmRaw, tmRaw, gnRaw, ptRaw) => {
                    const tmNum = Number(tmRaw) || 0;
                    if (nmRaw && tmNum >= 0 && tmNum <= cTime.dur) {
                      const nm = String(nmRaw).toLowerCase();
                      const key = `${nm}@${Math.round(tmNum * 50)}`;
                      if (!seen.has(key)) {
                        seen.add(key);
                        const absT = cursor + tmNum / cTime.k;
                        const [mName, mPitch, mGain] = Dt(
                          nm,
                          sceneFlavor,
                          ptRaw ?? 1.0,
                          Math.min(0.92, Math.max(0.18, (Number(gnRaw) || 0.72) * pScale))
                        );
                        if (!sceneCueTimes.some((st) => Math.abs(st - absT) < 0.045)) {
                          sceneCueTimes.push(absT);
                          events.push({ t: absT, name: mName, gain: mGain, pitch: mPitch, flavor: sceneFlavor });
                        }
                      }
                    }
                  },
                  l(sc.theme, projectMeta)
                ),
                Sn
              );
            } catch {}
          }
        }
      }
      for (const m of sc.code.matchAll(
        /s\.sfx\(\s*['"`]([a-z0-9_-]+)['"`]\s*(?:,\s*([0-9.]+))?\s*(?:,\s*([0-9.]+))?\s*(?:,\s*([0-9.]+))?\s*\)/gi
      )) {
        const nm = m[1].toLowerCase();
        const tm = m[2] !== undefined ? Number(m[2]) : 0.06;
        const gn = m[3] !== undefined ? Number(m[3]) : 0.72;
        const pt = m[4] !== undefined ? Number(m[4]) : 1.0;
        if (nm && Number.isFinite(tm) && tm >= 0 && tm <= cTime.dur) {
          const key = `${nm}@${Math.round(tm * 50)}`;
          if (!seen.has(key)) {
            seen.add(key);
            const absT = cursor + tm / cTime.k;
            const [mName, mPitch, mGain] = Dt(
              nm,
              sceneFlavor,
              pt,
              Math.min(0.92, Math.max(0.18, gn * pScale))
            );
            sceneCueTimes.push(absT);
            events.push({ t: absT, name: mName, gain: mGain, pitch: mPitch, flavor: sceneFlavor });
          }
        }
      }
    }

    // 3. Synchronize any missing beat slots to actual narration word timestamps (H(sc, projectMeta))
    // so SFX cues follow the spoken voice-over rhythm rather than arbitrary out-of-tempo intervals
    const dur = Math.max(0.8, Number(sc.duration) || 3.2);
    const wordTimes = sc.text ? H(sc, projectMeta) : [];
    const emphTime = sc.text ? Fe(sc, projectMeta) : undefined;
    const templates = STYLE_FLAVOR_BEAT_TEMPLATES[sceneFlavor] || STYLE_FLAVOR_BEAT_TEMPLATES.editorial;

    for (let bIdx = 0; bIdx < templates.length; bIdx++) {
      const bt = templates[bIdx];
      const rawName = bIdx === 0 && sc.sfxCue ? String(sc.sfxCue).toLowerCase() : bt.name;
      // Anchor beat timing to actual spoken word / emphasis timestamp when available
      let localBeatSec = dur * bt.frac;
      if (bIdx === 0 && wordTimes.length > 0) {
        localBeatSec = Math.max(0.05, Math.min(0.28, wordTimes[0]));
      } else if (bIdx === 1 && emphTime !== undefined) {
        localBeatSec = emphTime;
      } else if (wordTimes.length >= 3) {
        const wPick = wordTimes[Math.min(wordTimes.length - 1, Math.floor((bIdx / templates.length) * wordTimes.length))];
        if (Number.isFinite(wPick)) {
          localBeatSec = wPick;
        }
      }
      const btT = cursor + Math.min(dur - 0.16, Math.max(0.05, localBeatSec));
      if (!sceneCueTimes.some((st) => Math.abs(st - btT) < 0.38)) {
        sceneCueTimes.push(btT);
        const [mName, mPitch, mGain] = Dt(rawName, sceneFlavor, bt.pitch, bt.gain * pScale);
        events.push({ t: btT, name: mName, gain: mGain, pitch: mPitch, flavor: sceneFlavor });
      }
    }

    cursor += sc.duration;
  });

  return kt(events.sort((a, b) => a.t - b.t));
};

// Provide a lightweight 2D context stub for Sn when running in Node.js (unit tests)
if (typeof document === "undefined" && !Sn) {
  const noop = () => {};
  const grad = { addColorStop: noop };
  Sn = new Proxy(
    {
      canvas: { width: 1080, height: 1920 },
      measureText: (txt) => ({ width: String(txt || "").length * 14 }),
      createLinearGradient: () => grad,
      createRadialGradient: () => grad,
      getImageData: () => ({ data: new Uint8ClampedArray(16) }),
    },
    {
      get(target, prop) {
        return prop in target ? target[prop] : noop;
      },
    }
  );
}

export {
  F as resolveSatsetCaptionMode,
  _e as CAPTION_SIZES,
  _e as SATSET_CAPTION_MODES,
  Te as getCaptionAnchor,
  ve as CAPTION_POSITIONS,
  ve as CAPTION_WIDTH_OPTIONS,
  oe as getSatsetTransitionDuration,
  se as getSatsetTransitionSfx,
  H as computeSatsetWordTimings,
  ee as SATSET_TRANSITIONS,
  Ye as isCaptionBottomReserved,
  ae as resolveSatsetTransitionId,
  ye as getCaptionZoneBounds,
  Se as hitTestCaptionZone,
  dt as SATSET_CAMERA_MODES,
  Cn as collectSatsetSfxTimeline,
  Mt as playSatsetRawSfx,
  Nt as scheduleSatsetSfxTimeline,
  Tt as getSatsetStyleSfxFlavor,
  Dt as mapSatsetSfxToFlavor,
  Ct as SATSET_SFX_NAMES,
  wt as SATSET_STYLE_SFX_FLAVORS,
  pt as CAMERA_DIRECTIONS,
  wn as preloadSatsetProjectAssets,
  an as getCameraFramingOffset,
  gn as getSatsetTotalDuration,
  Nt as getSceneCameraConfig,
  It as isSceneContinuous,
  ln as validateSatsetSceneCode,
  lt as renderSatsetSubtitle,
  we as getCaptionScale,
  nn as getPhotoPlacement,
  Ft as isCustomCaptionHandled,
  Kt as getCachedSatsetBgCanvas,
  fn as renderSatsetSceneFrame,
  Pt as isScenePlainBg,
  tn as isThemeCaptionDark,
  yn as renderSatsetTimelineFrame,
  Lt as DEFAULT_SATSET_PROJECT_META,
  _n as findSatsetSceneAtTime,
  ut as PACE_MODES,
  _t as resolveSatsetCameraMode,
  he as renderSatsetTransitionFrame,
  St as computeSatsetCameraTransform,
  ot as chunkSatsetNarration,
  ie as SATSET_STYLE_TRANSITION_POOLS,
  zt as compileSatsetSceneCode,
};

