import test from 'node:test';
import assert from 'node:assert/strict';
import {construct,resize,pixelError,formatError} from '../dist/core.mjs';
const solid=(w,h,v)=>({width:w,height:h,data:Uint8ClampedArray.from({length:w*h*4},(_,i)=>i%4===3?255:v)});
test('a small nonzero pixel error is not displayed as exact zero',()=>{assert.equal(formatError(0),'0.00%');assert.equal(formatError(.00001),'<0.01%');assert.equal(formatError(.001),'0.10%');assert.equal(formatError(null),'仅 128 px 对比');});
test('construction leaves inputs untouched and only modifies the four sample pixels per block',()=>{
 const source=solid(8,8,20),target=solid(1,1,220);const out=construct(source,target);
 assert.equal(out.changedPixels,4);assert.equal(source.data[108],20);assert.equal(target.data[0],220);
 assert.equal(out.image.data[(3*8+3)*4],220);assert.equal(out.image.data[0],20);
});
test('both explicit point samplers recover the target from the constructed image',()=>{
 const source=solid(16,16,30),target={width:2,height:2,data:new Uint8ClampedArray([10,20,30,255,40,50,60,255,70,80,90,255,100,110,120,255])};
 const {image}=construct(source,target);
 assert.deepEqual(resize(image,2,2,'nearest').data,target.data);
 assert.deepEqual(resize(image,2,2,'bilinear').data,target.data);
});
test('area averaging includes all 64 pixels, diluting the four altered pixels',()=>{
 const {image}=construct(solid(8,8,20),solid(1,1,220));assert.deepEqual([...resize(image,1,1,'area').data],[32,32,32,255]);
});
test('sampling coordinates and fractional area weights agree with hand-calculated values',()=>{
 const img={width:3,height:1,data:new Uint8ClampedArray([0,0,0,255,60,60,60,255,240,240,240,255])};
 assert.equal(resize(img,2,1,'nearest').data[0],0);assert.equal(resize(img,2,1,'nearest').data[4],240);
 assert.equal(resize(img,2,1,'bilinear').data[0],15);assert.equal(resize(img,2,1,'bilinear').data[4],195);
 assert.equal(resize(img,2,1,'area').data[0],20);assert.equal(resize(img,2,1,'area').data[4],180);
});
test('identity preserves bytes and image error measures RGB rather than alpha',()=>{
 const img=solid(4,4,111);for(const method of ['nearest','bilinear','area'])assert.deepEqual(resize(img,4,4,method).data,img.data);
 assert.equal(pixelError(solid(2,2,0),solid(2,2,255)),1);assert.equal(pixelError(img,img),0);
});
test('invalid dimensions, unsupported methods and incompatible construction fail explicitly',()=>{
 assert.throws(()=>resize(solid(2,2,0),0,1,'nearest'));
 assert.throws(()=>resize(solid(2,2,0),3,3,'area'));
 assert.throws(()=>resize(solid(2,2,0),1,1,'magic'));
 assert.throws(()=>construct(solid(7,7,0),solid(2,2,1)));
 assert.throws(()=>pixelError(solid(1,1,0),solid(2,2,0)));
});
