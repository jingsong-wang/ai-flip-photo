/** Explicit RGB-byte resamplers. Coordinates are half-pixel centered. */
export function formatError(value){return value===null?'仅 128 px 对比':value>0&&value<.0001?'<0.01%':(value*100).toFixed(2)+'%';}
function check(image){
 if(!Number.isInteger(image?.width)||!Number.isInteger(image?.height)||image.width<1||image.height<1||image.width*image.height>16777216||!(image.data instanceof Uint8ClampedArray)||image.data.length!==image.width*image.height*4)throw Error('Invalid RGBA image');
}
export function construct(cover,target){
 check(cover);check(target);const sx=cover.width/target.width,sy=cover.height/target.height;
 if(!Number.isInteger(sx)||!Number.isInteger(sy)||sx<4||sy<4||sx%2||sy%2)throw Error('Construction requires even integer scale factors of at least four');
 const data=new Uint8ClampedArray(cover.data);let changedPixels=0;
 for(let y=0;y<target.height;y++)for(let x=0;x<target.width;x++){
  const from=(y*target.width+x)*4;
  for(let oy=sy/2-1;oy<=sy/2;oy++)for(let ox=sx/2-1;ox<=sx/2;ox++){
   const to=((y*sy+oy)*cover.width+x*sx+ox)*4;let changed=false;
   for(let c=0;c<3;c++){if(data[to+c]!==target.data[from+c])changed=true;data[to+c]=target.data[from+c];}
   if(changed)changedPixels++;
  }
 }
 return {image:{width:cover.width,height:cover.height,data},changedPixels};
}
export function resize(image,width,height,method='bilinear'){
 check(image);if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>image.width||height>image.height)throw Error('Only valid downsampling dimensions are supported');
 if(!['nearest','bilinear','area'].includes(method))throw Error('Unknown sampler');
 const result={width,height,data:new Uint8ClampedArray(width*height*4)},out=result.data,src=image.data,sw=image.width,sh=image.height,sx=sw/width,sy=sh/height;
 if(width===sw&&height===sh){out.set(src);return result;}
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const to=(y*width+x)*4;
  if(method==='nearest'){
   const from=(Math.min(sh-1,Math.floor((y+.5)*sy))*sw+Math.min(sw-1,Math.floor((x+.5)*sx)))*4;
   out.set(src.subarray(from,from+4),to);
  }else if(method==='bilinear'){
   const fx=(x+.5)*sx-.5,fy=(y+.5)*sy-.5,x0=Math.floor(fx),y0=Math.floor(fy),dx=fx-x0,dy=fy-y0;
   for(let c=0;c<4;c++)out[to+c]=src[(y0*sw+x0)*4+c]*(1-dx)*(1-dy)+src[(y0*sw+Math.min(x0+1,sw-1))*4+c]*dx*(1-dy)+src[(Math.min(y0+1,sh-1)*sw+x0)*4+c]*(1-dx)*dy+src[(Math.min(y0+1,sh-1)*sw+Math.min(x0+1,sw-1))*4+c]*dx*dy;
  }else{
   const left=x*sx,right=(x+1)*sx,top=y*sy,bottom=(y+1)*sy,acc=[0,0,0,0];
   for(let iy=Math.floor(top);iy<Math.min(sh,Math.ceil(bottom));iy++)for(let ix=Math.floor(left);ix<Math.min(sw,Math.ceil(right));ix++){
    const w=(Math.min(right,ix+1)-Math.max(left,ix))*(Math.min(bottom,iy+1)-Math.max(top,iy)),from=(iy*sw+ix)*4;
    for(let c=0;c<4;c++)acc[c]+=src[from+c]*w;
   }
   for(let c=0;c<4;c++)out[to+c]=acc[c]/(sx*sy);
  }
 }
 return result;
}
export function pixelError(a,b){
 check(a);check(b);if(a.width!==b.width||a.height!==b.height)throw Error('Image dimensions differ');
 let sum=0;for(let i=0;i<a.data.length;i+=4)for(let c=0;c<3;c++)sum+=Math.abs(a.data[i+c]-b.data[i+c]);return sum/(a.width*a.height*3*255);
}
