export {measuredDefaults as defaults,calculateMeasured as calculate,measuredFaceSpan as faceSpan} from './measured-geometry.js';
export {span} from './geometry.js';
// Guillotine packing: every rectangle remains a contiguous piece of mesh.
export function packFaces(faces,limit=14){
 const pieces=[];
 for(const f of faces)for(let y=0;y<f.rows;y+=limit)for(let x=0;x<f.cols;x+=limit)
 pieces.push({w:Math.min(limit,f.cols-x),h:Math.min(limit,f.rows-y),face:f.id,name:f.name,x,y});
 let best=null;
 for(let pass=0;pass<36;pass++){
 let seed=pass+1;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const list=pieces.map(v=>({...v,sort:rand()})).sort((a,b)=>pass%3===0?b.w*b.h-a.w*a.h||b.sort-a.sort:pass%3===1?Math.max(b.w,b.h)-Math.max(a.w,a.h)||b.w*b.h-a.w*a.h:b.h-a.h||b.w-a.w);
 const sheets=[];
 for(const piece of list){let found=null;
 for(let si=0;si<sheets.length;si++)for(let fi=0;fi<sheets[si].free.length;fi++)for(let rot=0;rot<2;rot++){
 const free=sheets[si].free[fi],w=rot?piece.h:piece.w,h=rot?piece.w:piece.h;
 if(w>free.w||h>free.h)continue;
 const score=(free.w*free.h-w*h)*100+Math.min(free.w-w,free.h-h);
 if(!found||score<found.score)found={si,fi,rot,w,h,score};
 }
 if(!found){sheets.push({free:[{x:0,y:0,w:14,h:14}],pieces:[]});found={si:sheets.length-1,fi:0,rot:0,w:piece.w,h:piece.h};}
 const sheet=sheets[found.si],free=sheet.free.splice(found.fi,1)[0],{w,h,rot}=found;
 sheet.pieces.push({...piece,w,h,rot:!!rot,sx:free.x,sy:free.y});
 // Split along a complete horizontal/vertical mesh line, never through chips.
 const vertical=pass%2===0?free.w-w>free.h-h:free.w-w<free.h-h;
 if(vertical){if(free.w>w)sheet.free.push({x:free.x+w,y:free.y,w:free.w-w,h:free.h});if(free.h>h)sheet.free.push({x:free.x,y:free.y+h,w,h:free.h-h});}
 else{if(free.h>h)sheet.free.push({x:free.x,y:free.y+h,w:free.w,h:free.h-h});if(free.w>w)sheet.free.push({x:free.x+w,y:free.y,w:free.w-w,h});}
 }
 if(!best||sheets.length<best.sheets.length)best={sheets,pieces:pieces.length,limit};
 }
 return best;
}
