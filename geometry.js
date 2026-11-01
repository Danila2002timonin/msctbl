// All carpentry dimensions are integer millimetres. Mosaic remains a separate grid.
export const defaults={schema:2,length:751,height:511,depth:394,frame:100,chip:20,tile:7,ply:12,sheet:304,build:2,prep:0,jointMin:5,cutTolerance:1,reserve:10};
export const span=(n,c,g)=>n*c+(n-1)*g;
export function calculate(input={}){
 const p={...defaults,...input},g=(p.sheet-14*p.chip)/13,q=p.tile+p.build+p.prep;
 const X=p.length,Y=p.height,Z=p.depth,b=p.frame,t=p.ply,coreDepth=Z-2*t,w=X-2*b,h=Y-2*b;
 const L=X+2*q,H=Y+2*q,D=Z+2*q,B=b+2*q,iw=w-2*q,ih=h-2*q;
 const S=n=>span(n,p.chip,g),fit=a=>Math.max(0,Math.floor((a+g+1e-8)/(p.chip+g)));
 const nx=fit(X),ny=fit(Y),nz=fit(Z),mx=(X-S(nx))/2,my=(Y-S(ny))/2,mz=(Z-S(nz))/2;
 const nf=fit(b-Math.max(mx,my)),ni=fit(iw-2*p.jointMin),nj=fit(ih-2*p.jointMin);
 Object.assign(p,{nx,ny,nz,nf});
 const jointX=(iw-S(ni))/2,jointY=(ih-S(nj))/2;
 const part=(id,name,a,b,size,center,group)=>({id,name,a,b,thickness:t,size,center,group});
 const parts=[
 part('base','Основание',X,coreDepth,[X,t,coreDepth],[0,t/2,0],'shell'),
 part('top','Верхняя крышка',X,coreDepth,[X,t,coreDepth],[0,Y-t/2,0],'shell'),
 ...[-1,1].map((s,i)=>part('outer'+i,'Наружная боковина '+(i+1),Y-2*t,coreDepth,[t,Y-2*t,coreDepth],[s*(X-t)/2,Y/2,0],'shell')),
 ...[-1,1].map((s,i)=>part('inner'+i,'Внутренняя стенка '+(i+1),Y-2*t,coreDepth,[t,Y-2*t,coreDepth],[s*(w+t)/2,Y/2,0],'inner')),
 part('shelf','Пол ниши',w,coreDepth,[w,t,coreDepth],[0,b-t/2,0],'inner'),
 part('ceiling','Потолок ниши',w,coreDepth,[w,t,coreDepth],[0,Y-b+t/2,0],'inner'),
 ...[-1,1].flatMap((s,i)=>[
 part('rail'+i+'b','Нижняя накладка · '+(i?'зад':'перед'),X,b,[X,b,t],[0,b/2,s*(Z-t)/2],'frame'),
 part('rail'+i+'t','Верхняя накладка · '+(i?'зад':'перед'),X,b,[X,b,t],[0,Y-b/2,s*(Z-t)/2],'frame'),
 ...[-1,1].map((a,j)=>part('stile'+i+j,'Боковая накладка · '+(i?'зад':'перед')+' '+(j+1),b,h,[b,h,t],[a*(X-b)/2,Y/2,s*(Z-t)/2],'frame'))
 ])];
 const faces=[];
 const face=(id,name,cols,rows,origin,u,v,normal,owner,extra={})=>faces.push({id,name,cols,rows,origin,u,v,normal,owner,...extra});
 face('top','Столешница',nx,nz,[-S(nx)/2,Y+q,-S(nz)/2],[1,0,0],[0,0,1],[0,1,0],'top');
 face('base','Низ стола',nx,nz,[-S(nx)/2,-q,-S(nz)/2],[1,0,0],[0,0,1],[0,-1,0],'base');
 [-1,1].forEach((s,i)=>face('outer'+i,'Внешний бок '+(i+1),nz,ny,[s*(X/2+q),my,-S(nz)/2],[0,0,1],[0,1,0],[s,0,0],'outer'+i));
 face('floor','Пол ниши',ni,nz,[-S(ni)/2,b+q,-S(nz)/2],[1,0,0],[0,0,1],[0,1,0],'shelf');
 face('ceiling','Потолок ниши',ni,nz,[-S(ni)/2,Y-b-q,-S(nz)/2],[1,0,0],[0,0,1],[0,-1,0],'ceiling');
 [-1,1].forEach((s,i)=>face('wall'+i,'Стенка ниши '+(i+1),nz,nj,[s*(w/2-q),Y/2-S(nj)/2,-S(nz)/2],[0,0,1],[0,1,0],[-s,0,0],'inner'+i));
 [-1,1].forEach((s,i)=>{
  face('front'+i+'b',(i?'Зад':'Перед')+' · нижняя рамка',nx,nf,[-S(nx)/2,my,s*(Z/2+q)],[1,0,0],[0,1,0],[0,0,s],'rail'+i+'b');
  face('front'+i+'t',(i?'Зад':'Перед')+' · верхняя рамка',nx,nf,[-S(nx)/2,Y-my-S(nf),s*(Z/2+q)],[1,0,0],[0,1,0],[0,0,s],'rail'+i+'t');
  [-1,1].forEach((a,j)=>face('front'+i+'s'+j,(i?'Зад':'Перед')+' · боковая рамка '+(j+1),nf,ny-2*nf,[a<0?-S(nx)/2:S(nx)/2-S(nf),my+nf*(p.chip+g),s*(Z/2+q)],[1,0,0],[0,1,0],[0,0,s],'stile'+i+j));
 });
 const chips=faces.reduce((a,f)=>a+Math.max(0,f.cols)*Math.max(0,f.rows),0),plyArea=parts.reduce((a,f)=>a+f.a*f.b,0)/1e6;
 const glueArea=faces.reduce((a,f)=>a+S(f.cols)*S(f.rows),0)/1e6;
 const errors=[],warnings=[];
 if(![X,Y,Z,b].every(Number.isInteger))errors.push('Размеры фанерного каркаса и накладок должны быть целыми миллиметрами.');
 if(!(g>0))errors.push('Размер сетки должен превышать 280 мм.');
 if(parts.some(f=>f.a<100||f.b<100))errors.push('Один из размеров фанерной детали меньше 100 мм.');
 if(nf<1||ni<1||nj<1||ny<=2*nf)errors.push('Для целых чипов не хватает места. Увеличьте корпус или уменьшите рамку.');
 if(p.build<1||p.build>5||p.prep<0)errors.push('Расчётная клеевая прослойка должна быть 1–5 мм; подготовка неотрицательна.');
 const bodyTarget=X>=735&&X<=765&&Y>=485&&Y<=515&&Z>=385&&Z<=415;
 const frameTarget=B>=100&&B<=118+1e-7;
 if(!bodyTarget)warnings.push('Каркас выходит за допуск ±15 мм от 750 × 500 × 400 мм.');
 if(!frameTarget)warnings.push(`Готовая рамка ${B.toFixed(1)} мм превышает согласованные 118 мм.`);
 warnings.push('Широкие заполненные края и материал углов требуют натурного образца. Обычная затирка не утверждена как профиль.');
 return{p,g,q,X,Y,Z,b,w,h,coreDepth,L,H,D,B,iw,ih,nx,ny,nz,nf,ni,nj,mx,my,mz,jointX,jointY,parts,faces,chips,plyArea,glueArea,minimum:Math.ceil(chips/196),bodyTarget,frameTarget,target:bodyTarget&&frameTarget,errors,warnings};
}
