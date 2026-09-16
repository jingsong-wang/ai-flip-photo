import {construct,resize,pixelError} from './core.mjs';
let image,target;
self.onmessage=({data:d})=>{
 try{
  if(d.type==='build'){
   const t=performance.now(),made=construct(d.cover,d.target);image=made.image;target=d.target;
   const preview=resize(image,512,512,'area');
   postMessage({type:'built',id:d.id,image,preview,changedPixels:made.changedPixels,elapsed:performance.now()-t});
  }
  if(d.type==='resize'&&image){
   const t=performance.now(),output=resize(image,d.size,d.size,d.method);
   const targetError=d.size===target.width?pixelError(output,target):null;
   postMessage({type:'resized',id:d.id,output,targetError,elapsed:performance.now()-t},[output.data.buffer]);
  }
 }catch(e){postMessage({type:'error',id:d.id,message:e.message});}
};
