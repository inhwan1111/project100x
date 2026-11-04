'use strict';
const assert=require('node:assert/strict');
const engine=require('../p2-backtest-core.js');
const {parse,merge}=require('../scripts/collect-market-data.cjs');
const header='timestamp,open,high,low,close,volume\n';
function make(n,start=0){
 const out=[];
 for(let i=start+n-1;i>=start;i--){
  const date=new Date(Date.UTC(2024,0,1+i)).toISOString().slice(0,10);
  const p=100+i*.08+Math.sin(i*.3)*2;
  out.push(date+','+[p,p+1,p-1,p,10000+i].join(','));
 }
 return header+out.join('\n')+'\n';
}
const first=parse(make(252),'first');
const second=parse(make(252,100),'second');
const merged=merge(first,second);
assert.equal(merged.sorted.length,352);
assert.equal(merged.added,100);
const bars=merged.sorted.map(r=>({date:r.date,open:r.numbers[0],high:r.numbers[1],low:r.numbers[2],close:r.numbers[3],volume:r.numbers[4]})).reverse();
assert.equal(engine.validate(bars).ok,true);
for(const strategy of engine.strategies.slice(0,3)){
 const result=engine.backtest(bars,strategy,{holdDays:5,costPct:.15});
 assert.equal(result.ok,true,strategy+': '+result.reason);
 assert.ok(Number.isFinite(result.compoundedReturnPct));
}
console.log('PASS: 352 synthetic bars merge and three strategy backtests (not real returns)');
