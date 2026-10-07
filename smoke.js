
const vm=require('vm'),fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const ui=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const els={},mem={};let handlers={},hits=[];
const el=s=>els[s]||(els[s]={innerHTML:'',textContent:'',style:{},classList:{toggle(){}},showModal(){},close(){}});
const fakeNode={setAttribute(){},classList:{add(){}}};
const svg={addEventListener:(t,f)=>handlers[t]=f,getBoundingClientRect:()=>({left:0,top:0,width:340,height:215}),setPointerCapture(){},querySelector:()=>fakeNode};
el('#game').querySelector=()=>svg;
const ctx={document:{querySelector:el,querySelectorAll:s=>{hits=s==='svg line.hit'?[0,1,2,3,4,5].map(e=>({dataset:{e}})):[];return hits;},addEventListener(){}},
 localStorage:{getItem:k=>mem[k]??null,setItem:(k,v)=>mem[k]=v},history:{replaceState(a,b,h){ctx.location.hash=h;}},location:{hash:'#pyra'},navigator:{},addEventListener(){},setTimeout:()=>0,Core:require('./core.js'),Data:require('./data.js'),console};
vm.createContext(ctx); vm.runInContext(ui,ctx);
const run=c=>vm.runInContext(c,ctx), html2=()=>els['#game'].innerHTML, count=(re)=>(html2().match(re)||[]).length;
assert.strictEqual(ctx.location.hash,'#pyra');
// known layout: nodes in solved order, then mark WORK>SHOP and WORK>BOOK
run("P.arr=pyraP.nodes.slice(); P.arr=Core.swap(P.arr,5,6); pyraSave();"); // mirror: still unsolved? doesn't matter
run("P.arr=pyraP.nodes.slice(); pyraSave();");
hits[2].onclick(); hits[3].onclick();
assert.strictEqual(count(/class="mark "/g),2,'two orange links');
assert.strictEqual(count(/class="n [^"]*grp/g),3,'three grouped nodes');
// swap elsewhere keeps orange
const down=(i)=>handlers.pointerdown({target:{closest:()=>({dataset:{i}})},clientX:POSX[i][0],clientY:POSX[i][1],pointerId:1,preventDefault(){}});
const POSX=[[170,30],[95,105],[245,105],[55,180],[135,180],[205,180],[285,180]];
const up=(i)=>handlers.pointerup({clientX:POSX[i][0],clientY:POSX[i][1]});
down(5); handlers.pointermove({clientX:POSX[5][0]+80,clientY:POSX[5][1]}); up(6);
assert.strictEqual(count(/class="mark "/g),2,'orange survives swap elsewhere');
const n=run('pyraP.nodes.slice()');
assert.strictEqual(run('P.arr.slice(5).join()'),[n[6],n[5]].join());
// drag the group (grab SHOP at 3) onto leaf 5 position: group should move as a unit
down(3); handlers.pointermove({clientX:POSX[3][0]+90,clientY:POSX[3][1]}); up(5);
const g=run("Core.groupOf(P.arr,P.marks,5).map(i=>P.arr[i]).sort().join()");
assert.strictEqual(g,[n[1],n[3],n[4]].sort().join(),'group moved as one');
// tap fallback: tap 0 then 2 swaps
const before=run('P.arr.slice()'); down(0); up(0); down(1); up(1);
assert.notStrictEqual(run('P.arr.join()'),before.join());
// verify greens persist after a guess then another swap
run("P.arr=pyraP.nodes.slice(); P.marks=[]; pyraSave();"); els['#pg'].onclick();
assert(run('P.won'),'solved'); assert(html2().includes(n[0]+n[1]),'shows compounds');
console.log('smoke ok');
