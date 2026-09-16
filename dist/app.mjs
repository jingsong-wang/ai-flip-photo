import {formatError} from './core.mjs';
const $=id=>document.getElementById(id),N=1024,T=128;
const names={nearest:'最近邻 · 半像素中心',bilinear:'双线性 · 无抗锯齿',area:'区域平均 · 全像素参与'};
const hints={nearest:'每个输出像素，只读取源图的 1 个像素。',bilinear:'每个输出像素，只读取源图附近的 4 个像素。',area:'按重叠面积平均，让源像素都参与缩小。'};
let method='bilinear',size=128,preset='pets',constructed,preview,output,coverSource,targetSource,buildID=0,resizeID=0,resizeBusy=false,pending=null,building=true,animation=null,toastTimer,exportURL=null,assetImages={},uploadToken={cover:0,target:0},custom={cover:null,target:null},selectionID=0,changed=0,targetError=null;
const worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3200);}
function paint(canvas,img){canvas.width=img.width;canvas.height=img.height;canvas.getContext('2d').putImageData(new ImageData(img.data,img.width,img.height),0,0);}
function tempCanvas(img){const c=document.createElement('canvas');paint(c,img);return c;}
function exportButtons(disabled){for(const id of ['download-png','download-card','download-json'])$(id).disabled=disabled;}
function updateControls(){
 $('resolution').value=size;$('output-dim').textContent=`${size} × ${size}`;$('size-value').replaceChildren(document.createTextNode(size+' '));const small=document.createElement('small');small.textContent='px';$('size-value').append(small);
 $('sampler-caption').textContent=names[method];$('algorithm-hint').textContent=hints[method];
 for(const b of document.querySelectorAll('[data-method]')){const selected=b.dataset.method===method;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',selected);}
 for(const [i,cell] of [...$('pixel-grid').children].entries()){const x=i%8,y=Math.floor(i/8);cell.className=method==='area'?'average':((method==='nearest'?x===4&&y===4:(x===3||x===4)&&(y===3||y===4))?'selected':'');}
 $('grid-legend').textContent=method==='area'?'区域平均读取全部 64 个像素':method==='nearest'?'最近邻读取中央的 1 个像素':'双线性读取中央 4 个像素';
}
function requestResize(){updateControls();if(!constructed)return;exportButtons(true);pending={type:'resize',id:++resizeID,size,method};pump();}
function pump(){if(!resizeBusy&&!building&&pending){resizeBusy=true;const d=pending;pending=null;worker.postMessage(d);}}
function stopAnimation(){clearInterval(animation);animation=null;$('animate').textContent='▷ 看一次缩放过程';}
function setSize(value){size=Math.max(64,Math.min(N,Math.round(Number(value))));requestResize();}
function setMethod(value){method=value;requestResize();}
function refreshZoom(){if(!constructed)return;const src=tempCanvas(constructed),c=$('zoom'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(src,496,496,32,32,0,0,256,256);g.strokeStyle='#fa5930';g.lineWidth=2;for(let y=0;y<4;y++)for(let x=0;x<4;x++)g.strokeRect(x*64+24,y*64+24,16,16);}
worker.onmessage=({data:d})=>{
 if(d.type==='built'&&d.id===buildID){constructed=d.image;preview=d.preview;changed=d.changedPixels;paint($('cover-view'),preview);$('changed').textContent=(changed/(N*N)*100).toFixed(2)+'%';building=false;refreshZoom();requestResize();}
 if(d.type==='resized'){
  resizeBusy=false;
  if(d.id===resizeID&&!building){output=d.output;targetError=d.targetError;paint($('output-view'),output);$('loading').hidden=true;$('error').textContent=formatError(targetError);const hit=targetError===0;
   $('result-badge').textContent=hit?'✓ 命中隐藏图像':method==='area'?'全像素参与平均':size===N?'原尺寸 · 没有缩小':'未命中设计采样位置';$('result-badge').classList.toggle('hit',hit);
   $('output-label').textContent=hit?(preset==='pets'?'等一下，它变成了狗？':preset==='message'?'文字，一直藏在图片里。':'这是你藏进去的另一张图。'):method==='area'?'多数像素，把全貌留了下来。':size===N?'原来的像素，还在这里。':'尺寸不同，读到的内容也不同。';exportButtons(false);
  }pump();
 }
 if(d.type==='error'){resizeBusy=false;building=false;showError('图片处理失败：'+d.message);}
};
worker.onerror=()=>showError('图像处理线程无法启动，请刷新页面重试。');
function showError(message){$('loading').hidden=false;$('loading-text').textContent=message;$('retry').hidden=false;exportButtons(true);}
function imageFromCanvas(c){const d=c.getContext('2d').getImageData(0,0,c.width,c.height);return {width:c.width,height:c.height,data:d.data};}
function normalize(img,n){const c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d');g.fillStyle='#f5f3ed';g.fillRect(0,0,n,n);const w=img.width||img.naturalWidth,h=img.height||img.naturalHeight,side=Math.min(w,h);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(img,(w-side)/2,(h-side)/2,side,side,0,0,n,n);return imageFromCanvas(c);}
async function asset(name){if(assetImages[name])return assetImages[name];const img=new Image();img.src=new URL(`./assets/${name}.jpg`,import.meta.url).href;await img.decode();assetImages[name]=img;return img;}
function makeTextTarget(){const c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d');g.fillStyle='#e9482b';g.fillRect(0,0,T,T);g.strokeStyle='#ffe9ce';g.lineWidth=2;g.strokeRect(8,8,112,112);g.fillStyle='#fff8e8';g.textAlign='center';g.font='bold 33px sans-serif';g.fillText('LOOK',64,51);g.fillText('AGAIN',64,89);g.font='8px monospace';g.fillText('SAME PIXELS. NEW STORY.',64,108);return imageFromCanvas(c);}
function build(cover,target,label){
 stopAnimation();building=true;++resizeID;pending=null;output=null;exportButtons(true);coverSource=cover;targetSource=target;$('loading').hidden=false;$('loading-text').textContent='正在构造同一张图片…';$('retry').hidden=true;$('cover-label').textContent=label;
 for(const b of document.querySelectorAll('[data-preset]')){const selected=b.dataset.preset===preset;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',selected);}
 method='bilinear';size=128;updateControls();worker.postMessage({type:'build',id:++buildID,cover,target});
}
async function selectPreset(value){const token=++selectionID;stopAnimation();$('loading').hidden=false;$('loading-text').textContent='正在读取本地示例…';try{const [cat,dog]=await Promise.all([asset('cat'),value==='pets'?asset('dog'):Promise.resolve(null)]);if(token!==selectionID)return;preset=value;build(normalize(cat,N),value==='pets'?normalize(dog,T):makeTextTarget(),'一只睡着的猫');}catch{if(token===selectionID)showError('示例照片未能加载，请重试。也可以选择本地图片制作。');}}
for(let i=0;i<64;i++)$('pixel-grid').append(document.createElement('span'));
for(const b of document.querySelectorAll('[data-preset]'))b.onclick=()=>selectPreset(b.dataset.preset);
for(const b of document.querySelectorAll('[data-method]'))b.onclick=()=>{stopAnimation();setMethod(b.dataset.method);};
$('resolution').oninput=e=>{stopAnimation();setSize(e.target.value);};
$('snap').onclick=()=>{stopAnimation();method='bilinear';setSize(T);toast('已切换到 128 px / 双线性采样');};
$('animate').onclick=()=>{if(animation){stopAnimation();return;}if(!constructed)return;const steps=[1024,768,512,384,256,160,129,128];let i=0;method='bilinear';setSize(steps[i++]);$('animate').textContent='Ⅱ 停止演示';animation=setInterval(()=>{if(i>=steps.length){stopAnimation();return;}setSize(steps[i++]);},650);};
$('inspect').onclick=()=>{const open=$('magnifier').hidden;$('magnifier').hidden=!open;$('inspect').setAttribute('aria-pressed',open);};
$('custom-button').onclick=()=>{$('creation').hidden=false;$('creation').scrollIntoView({behavior:'smooth',block:'start'});};
$('close-creation').onclick=()=>{$('creation').hidden=true;$('custom-button').focus();};
async function readFile(kind,file){
 const token=++uploadToken[kind];custom[kind]=null;$('build-custom').disabled=true;
 if(!file)return;
 try{
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('请选择 JPG、PNG 或 WebP 图片。');
  if(file.size>12*1024*1024)throw Error('这张图片超过 12 MB，请选择小一些的文件。');
  const bitmap=await createImageBitmap(file);try{if(bitmap.width*bitmap.height>40000000)throw Error('图片超过 4,000 万像素，请先缩小。');if(token!==uploadToken[kind])return;custom[kind]=normalize(bitmap,kind==='cover'?N:T);}finally{bitmap.close();}
  $(kind==='cover'?'cover-filename':'target-filename').textContent=file.name;$('upload-status').classList.remove('error');$('upload-status').textContent='图片已在本机准备好。选好两张后，点击生成。';
 }catch(e){if(token!==uploadToken[kind])return;$('upload-status').classList.add('error');$('upload-status').textContent=e.message;$(kind==='cover'?'cover-filename':'target-filename').textContent='未选择有效图片';}
 finally{$('build-custom').disabled=!(custom.cover&&custom.target);}
}
for(const kind of ['cover','target'])$(kind+'-file').onchange=e=>readFile(kind,e.target.files[0]);
$('build-custom').onclick=()=>{if(!custom.cover||!custom.target)return;++selectionID;preset='custom';build(custom.cover,custom.target,'我的全貌图片');document.querySelector('.lab').scrollIntoView({behavior:'smooth',block:'start'});toast('已在本机生成，没有上传任何图片');};
$('retry').onclick=()=>selectPreset('pets');
for(const id of ['credits','metric-info'])$(id).onclick=()=>$('info').showModal();$('close-info').onclick=()=>$('info').close();
function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('图片导出失败')),'image/png'));}
async function presentExport(canvas,filename,title,note){try{const blob=await canvasBlob(canvas);if(exportURL)URL.revokeObjectURL(exportURL);exportURL=URL.createObjectURL(blob);$('export-title').textContent=title;$('export-image').src=exportURL;$('export-link').href=exportURL;$('export-link').download=filename;$('export-note').textContent=note;$('export-dialog').showModal();}catch(e){toast(e.message);}}
$('close-export').onclick=()=>$('export-dialog').close();
$('download-png').onclick=()=>{if(constructed)presentExport(tempCanvas(constructed),'misread-original-1024.png','这就是那张变脸照。','完整 1024 × 1024 PNG。用此实验的半像素中心双线性或最近邻缩至 128 × 128 可恢复隐藏图。请勿改用 JPEG；截图与社交平台压缩可能破坏效果。');};
$('download-card').onclick=()=>{
 if(!output||!preview)return;stopAnimation();const c=document.createElement('canvas');c.width=1440;c.height=1030;const g=c.getContext('2d');g.fillStyle='#f5f3ed';g.fillRect(0,0,c.width,c.height);g.fillStyle='#dc452b';g.fillRect(60,55,20,20);g.fillStyle='#30382b';g.font='bold 22px sans-serif';g.fillText('MISREAD LAB / AI 变脸照',97,74);g.font='bold 56px sans-serif';g.fillText('同一张图，缩小后变了。',60,160);
 const stages=[[preview,60,'A  构造图全貌 / 1024 × 1024'],[output,760,`B  实际采样 / ${size} × ${size}`]];
 for(const [img,x,label] of stages){g.fillStyle='#737e65';g.font='18px sans-serif';g.fillText(label,x,214);g.imageSmoothingEnabled=true;g.drawImage(tempCanvas(img),x,240,620,620);}
 g.fillStyle='#dc452b';g.font='42px sans-serif';g.fillText('→',694,560);g.fillStyle='#4e5942';g.font='19px sans-serif';g.fillText(`${names[method]}   ·   像素改动 ${(changed/(N*N)*100).toFixed(2)}%`,60,912);g.fillStyle='#8b927e';g.font='16px sans-serif';g.fillText('真实像素采样实验 · 未运行 AI 识别模型 · 卡片仅供展示',60,950);g.font='15px monospace';g.fillText('jingsong-wang.github.io/ai-flip-photo',760,950);
 presentExport(c,'misread-comparison.png','你的反差，值得被看见。','这是当前分辨率与算法下的真实对比。分享卡片不保留原始构造图的采样结构；要再次实验，请下载“变脸原图”。');
};
$('download-json').onclick=()=>{
 if(!constructed||!output)return;const record={version:1,preset,sourceSize:1024,targetSize:128,outputSize:size,sampler:method,coordinateConvention:'half-pixel centers; no antialiasing for nearest/bilinear; exact overlap weights for area; sRGB bytes',changedPixels:changed,totalPixels:N*N,targetPixelError:targetError,modelInference:false,sourcePreview:'1024 source area-resized to 512 for display',privacy:'No uploaded images or filenames included'};
 const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='misread-experiment.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('实验参数已生成，已请求下载');
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAnimation();});
updateControls();selectPreset('pets');
