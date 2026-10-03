import {performance} from 'node:perf_hooks';
import {buildCircuit,CIRCUITS} from '../src/lib/circuits.js';
import {createRoadHeightSampler} from '../src/lib/track-materials.js';
const c=buildCircuit(CIRCUITS[0]);const targets=[];
for(let i=0;i<c.N;i+=3){const s=i*c.step,f=c.frameAt(s);for(const lat of [-8,-3.6,0,8])targets.push([f.x+f.nx*lat,f.z+f.nz*lat,s]);}
const run=(sample)=>{for(const p of targets)sample(...p);const times=[];let sum=0;for(let pass=0;pass<5;pass++){const start=performance.now();for(const p of targets)sum+=sample(...p)||0;times.push(performance.now()-start);}times.sort((a,b)=>a-b);return {queries:targets.length,medianMs:+times[2].toFixed(2),checksum:+sum.toFixed(2)};};
console.log('Current:',run(createRoadHeightSampler(c)));
