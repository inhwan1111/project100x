'use strict';
const assert = require('node:assert/strict');
const engine = require('../p2-backtest-core.js');
const bars = Array.from({length:110},(_,i)=>{
 const p=100+i*.1+Math.sin(i*.45)*2;
 return {date:new Date(Date.UTC(2025,0,1+i)).toISOString().slice(0,10),open:p,high:p+1,low:p-1,close:p,volume:10000+i*100};
});
assert.equal(engine.validate(bars).ok,true);
assert.equal(engine.validate([...bars].reverse()).ok,false);
assert.equal(engine.validate([...bars.slice(0,45),bars[44],...bars.slice(45)]).ok,false);
for(const name of engine.strategies.slice(0,3)){
 for(const i of [35,55,80]){
  assert.deepEqual(engine.signal(bars,i,name),engine.signal(bars.slice(0,i),i,name),'future signal leak: '+name);
 }
 const original=engine.backtest(bars,name,{holdDays:5,costPct:.15});
 const changed=bars.map((b,i)=>i<85?b:{...b,close:b.close*1.01,high:b.high*1.01});
 const revised=engine.backtest(changed,name,{holdDays:5,costPct:.15});
 assert.equal(original.ok,true);assert.equal(revised.ok,true);
 const completed=x=>x.trades.filter(t=>t.exitDate<bars[85].date);
 assert.deepEqual(completed(original),completed(revised),'historical trade changed: '+name);
}
console.log('PASS: chronology, duplicate detection, future signal isolation, completed trades');
