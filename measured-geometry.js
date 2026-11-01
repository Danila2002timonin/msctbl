import {calculate as baseCalculate,span} from './geometry.js';
export const measuredDefaults={schema:6,length:766,height:503,depth:415,frame:108,chip:20,tile:7,ply:12,sheet:305,build:2,prep:0,jointMin:1,wallEndGapMin:.5,cutTolerance:1,inventory:26,frameLimit:126,innerGap:2.1,innerVerticalGap:2.1,reserve:10};
// Each offset is a whole, uncut 20 mm chip. Mesh spacing follows the measured
// 14/7/5/4-chip blocks rather than forcing those measurements into one pitch.
export function measuredAxis(count,p=measuredDefaults){
 const groups=count===35?[14,14,7]:count===23?[14,5,4]:count===19?[14,5]:[];
 if(!groups.length){let left=count;while(left){const n=Math.min(left,14);groups.push(n);left-=n;}}
 const offsets=[],segments=[];let start=0;
 for(const n of groups){const size=n===14?p.sheet:n*p.chip+(n-1)*2,gap=n===1?0:(size-n*p.chip)/(n-1);segments.push({count:n,start,size,gap});for(let i=0;i<n;i++)offsets.push(start+i*(p.chip+gap));start+=size+2;}
 return {count,offsets,size:count?start-2:0,segments};
}
const regularAxis=(count,gap,p)=>({count,size:span(count,p.chip,gap),offsets:Array.from({length:count},(_,i)=>i*(p.chip+gap)),segments:[{count,start:0,size:span(count,p.chip,gap),gap}]});
const sliceAxis=(axis,start,count,p)=>{const zero=axis.offsets[start],offsets=axis.offsets.slice(start,start+count).map(v=>v-zero);return {count,offsets,size:offsets.at(-1)+p.chip,segments:[]};};
export const measuredFaceSpan=(f,axis)=>axis==='u'?f.axisU.size:f.axisV.size;
export function calculateMeasured(input={}){
 const p={...measuredDefaults,...input};p.innerVerticalGap=p.innerGap;
 const c=baseCalculate({...p,jointMin:5});
 const fit=(size)=>{let n=0;while(n<200&&measuredAxis(n+1,p).size<=size+1e-7)n++;return n;};
 const ax=measuredAxis(fit(c.X),p),ay=measuredAxis(fit(c.Y),p),az=measuredAxis(fit(c.Z),p);
 const mx=(c.X-ax.size)/2,my=(c.Y-ay.size)/2,mz=(c.Z-az.size)/2;
 // A sub-millimetre lip at the plywood opening is included in the nominal
// joinery tolerance; corner clearance is tested against actual tile thickness.
 const nf=Math.max(1,Math.floor((c.b+2)/(p.chip+2))),bottom=sliceAxis(ay,0,nf,p),upper=sliceAxis(ay,ay.count-nf,nf,p),left=sliceAxis(ax,0,nf,p),right=sliceAxis(ax,ax.count-nf,nf,p),middle=sliceAxis(ay,nf,ay.count-2*nf,p);
 // Floors stop against wall faces. Wall tiles pass behind both floor/ceiling
 // faces, so their available length is the PLYWOOD opening, not the clear one.
 const ni=Math.max(0,Math.floor((c.iw-2*p.jointMin+p.innerGap+1e-8)/(p.chip+p.innerGap))),nj=Math.max(0,Math.floor((c.h-2*p.wallEndGapMin+p.innerVerticalGap+1e-8)/(p.chip+p.innerVerticalGap)));
 const ix=regularAxis(ni,p.innerGap,p),iy=regularAxis(nj,p.innerVerticalGap,p);
 c.faces=c.faces.map(f=>{
  let axisU,axisV,origin,recut=null;
  if(['top','base'].includes(f.id)){axisU=ax;axisV=az;origin=[-ax.size/2,f.origin[1],-az.size/2];}
  else if(f.id.startsWith('outer')){axisU=az;axisV=ay;origin=[f.origin[0],my,-az.size/2];}
  else if(['floor','ceiling'].includes(f.id)){axisU=ix;axisV=az;origin=[-ix.size/2,f.origin[1],-az.size/2];recut='columns';}
  else if(f.id.startsWith('wall')){axisU=az;axisV=iy;origin=[f.origin[0],c.Y/2-iy.size/2,-az.size/2];recut='rows';}
  else if(f.id.endsWith('b')){axisU=ax;axisV=bottom;origin=[-ax.size/2,my,f.origin[2]];}
  else if(f.id.endsWith('t')){axisU=ax;axisV=upper;origin=[-ax.size/2,c.Y-my-upper.size,f.origin[2]];}
  else{const isLeft=f.id.endsWith('0');axisU=isLeft?left:right;axisV=middle;origin=[isLeft?-ax.size/2:ax.size/2-right.size,my+ay.offsets[nf],f.origin[2]];}
  return {...f,cols:axisU.count,rows:axisV.count,origin,axisU,axisV,gapU:axisU.segments[0]?.gap??c.g,gapV:axisV.segments[0]?.gap??c.g,recut};
 });
 Object.assign(c,{p,nx:ax.count,ny:ay.count,nz:az.count,nf,ni,nj,mx,my,mz,outerAxes:{x:ax,y:ay,z:az},jointX:(c.iw-ix.size)/2,jointY:(c.ih-iy.size)/2});
 c.cornerJoint=c.jointX;c.wallOverlap=-c.jointY;c.wallEndGap=(c.h-iy.size)/2;
 c.chips=c.faces.reduce((n,f)=>n+f.cols*f.rows,0);c.minimum=Math.ceil(c.chips/196);c.glueArea=c.faces.reduce((n,f)=>n+f.axisU.size*f.axisV.size,0)/1e6;
 c.profiles={outerX:c.q+mx,outerY:c.q+my,outerZ:c.q+mz,innerLeft:c.b+c.q-mx-left.size,innerRight:c.b+c.q-mx-right.size,innerBottom:c.b+c.q-my-bottom.size,innerTop:c.b+c.q-my-upper.size};
 c.profileMin=Math.min(...Object.values(c.profiles));c.profileMax=Math.max(...Object.values(c.profiles));
 c.frameTarget=c.B<=p.frameLimit+1e-7;c.bodyTarget=c.X===766&&c.Y===503&&c.Z===415;c.neat=Math.max(mx,my,mz)<=.5+1e-7&&c.profileMin>=7&&c.profileMax-c.profileMin<=1;c.target=c.frameTarget&&c.bodyTarget&&c.neat&&c.cornerJoint>=1&&c.cornerJoint<=3&&c.wallOverlap>=0&&c.wallEndGap>=p.wallEndGapMin-1e-7;
 c.errors=c.errors.filter(e=>!e.startsWith('Для целых чипов'));if(ni<1||nj<1)c.errors.push('Недостаточно места для внутренних полей.');
 if(![p.innerGap,p.innerVerticalGap].every(g=>g>=1&&g<=2.5))c.errors.push('Внутренние швы должны быть в диапазоне 1–2,5 мм.');
 c.warnings=['Расчёт по измеренным блокам: 14 чипов = '+p.sheet+' мм; 7/5/4 чипа = 152/108/86 мм; стыки блоков 2 мм.','Внутри сетка разрезается на полосы по одному чипу. Материал углового заполнения проверяется на образце.'];
 if(!c.neat)c.warnings.unshift(`Наружное поле по высоте ${ay.size} мм при каркасе ${c.Y} мм оставляет по ${my.toFixed(1)} мм на кромку. Угловые полосы ${c.profileMin.toFixed(1)}–${c.profileMax.toFixed(1)} мм не одинаковы; одинаковый внутренний шов не устраняет эту разницу.`);
 if(c.cornerJoint<1||c.cornerJoint>3||c.wallOverlap<0||c.wallEndGap<p.wallEndGapMin-1e-7)c.warnings.unshift('Внутренний стык требует подгонки: пол упирается в стенку через узкий шов; стенка должна проходить за пол/потолок, не заходя в фанеру.');
 if(!c.bodyTarget||!c.frameTarget)c.warnings.unshift('Параметры отличаются от согласованных 766 × 503 × 415 мм и готовой рамки 126 мм.');
 c.warnings.push(`Скрытый зазор торца стенки до фанеры пола/потолка ${c.wallEndGap.toFixed(2)} мм: проверить по сухой сборке до окончательной облицовки.`);
 return c;
}
