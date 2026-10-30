/* PROJECT 100X independent regression tests. Run: node tests/backtest-regression.test.js */
'use strict';
const assert = require('node:assert/strict');
const engine = require('../p2-backtest-core.js');
const day = n => new Date(Date.UTC(2026,0,1+n)).toISOString().slice(0,10);
function sample(n=65) {
  return Array.from({length:n},(_,i)=>({
    date:day(i),open:100+i,high:102+i,low:99+i,close:101+i,volume:1000
  }));
}
function test(name,fn){fn();console.log('PASS',name);}
test('valid ascending OHLCV',()=>assert.equal(engine.validate(sample()).ok,true));
test('duplicate dates rejected',()=>{
 const b=sample();b[10].date=b[9].date;
 assert.equal(engine.validate(b).ok,false);
});
test('invalid OHLC rejected',()=>{
 const b=sample();b[5].high=b[5].low-1;
 assert.equal(engine.validate(b).ok,false);
});
test('insufficient bars rejected',()=>assert.equal(engine.validate(sample(34)).ok,false));
test('future bars cannot alter prior signal',()=>{
 const b=sample(),before=engine.signal(b,40,'추세 눌림목');
 b[55].close=100000;
 assert.deepEqual(engine.signal(b,40,'추세 눌림목'),before);
});
test('unknown strategy rejected',()=>assert.equal(engine.backtest(sample(),'unknown').ok,false));
test('invalid costs rejected',()=>assert.equal(engine.backtest(sample(),'추세 눌림목',{costPct:-1}).ok,false));
test('flat volume does not create breakout',()=>{
 const b=sample();
 assert.equal(engine.backtest(b,'거래량 돌파').count,0);
});
test('zero trades reports null rates',()=>{
 const r=engine.backtest(sample(),'거래량 돌파');
 assert.equal(r.ok,true);
 assert.equal(r.avgNetPct,null);
 assert.equal(r.winRatePct,null);
});
test('entry occurs after signal date',()=>{
 const r=engine.backtest(sample(),'추세 눌림목');
 for(const t of r.trades)assert.ok(t.signalDate<t.entryDate);
});
test('reported net return uses two-sided costs',()=>{
 const r=engine.backtest(sample(),'추세 눌림목',{holdDays:5,costPct:0.15});
 for(const t of r.trades)assert.ok(Math.abs(t.netPct-(t.exit*0.9985/(t.entry*1.0015)-1)*100)<1e-10);
});
console.log('Regression tests passed');
