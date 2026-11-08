/* PROJECT 100X independent regression tests. Run: node tests/backtest-regression.test.js */
'use strict';
const assert = require('node:assert/strict');
const engine = require('../p2-backtest-core.js');
const day = n => new Date(Date.UTC(2026,0,1+n)).toISOString().slice(0,10);
function sample(n=65) {
  return Array.from({length:n},(_,i)=>({
    date:day(i),open:100+i,high:102+i,low:88+i,close:101+i,volume:1000
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
 assert.ok(r.count>0,'Expected at least one trade');
 for(const t of r.trades)assert.ok(t.signalDate<t.entryDate);
});
test('reported net return uses two-sided costs',()=>{
 const r=engine.backtest(sample(),'추세 눌림목',{holdDays:5,costPct:0.15});
 assert.ok(r.count>0,'Expected at least one trade');
 for(const t of r.trades)assert.ok(Math.abs(t.netPct-(t.exit*0.9985/(t.entry*1.0015)-1)*100)<1e-10);
});
test('invalid holding period rejected',()=>assert.equal(engine.backtest(sample(),'추세 눌림목',{holdDays:0}).ok,false));
test('unadjusted extreme opening gap rejected',()=>{const b=sample();b[40].open=1000;b[40].high=1002;assert.equal(engine.backtest(b,'추세 눌림목').ok,false);});
test('unconnected fundamental and news strategies cannot trade',()=>{for(const s of engine.strategies.slice(3))assert.equal(engine.backtest(sample(),s).count,0);});
test('trades cannot overlap for the same strategy',()=>{const r=engine.backtest(sample(),'추세 눌림목',{holdDays:5});assert.ok(r.count>1);for(let i=1;i<r.trades.length;i++)assert.ok(r.trades[i].entryDate>r.trades[i-1].exitDate);});
test('future OHLCV cannot alter prior technical signals',()=>{
 const b=sample(80);
 for(let i=35;i<70;i++)for(const strategy of engine.strategies.slice(0,3)){
  const before=engine.signal(b,i,strategy);
  const changed=b.map(x=>({...x}));
  changed[i+1].open+=20;changed[i+1].high+=30;changed[i+1].close+=25;changed[i+1].volume+=50000;
  assert.deepEqual(engine.signal(changed,i,strategy),before);
 }
});
test('invalid calendar date rejected without throwing',()=>{
 const b=sample();b[10].date='2026-02-30';
 assert.equal(engine.validate(b).ok,false);
});
test('backtest does not mutate input OHLCV',()=>{
 const b=sample(),before=JSON.stringify(b);
 const r=engine.backtest(b,'추세 눌림목');
 assert.equal(r.ok,true);
 assert.equal(JSON.stringify(b),before);
});
test('future appended bars cannot alter completed trades',()=>{
 const b=sample(65),extended=sample(80);
 const a=engine.backtest(b,'추세 눌림목',{holdDays:5});
 const z=engine.backtest(extended,'추세 눌림목',{holdDays:5});
 assert.equal(a.ok,true);assert.equal(z.ok,true);
 assert.deepEqual(z.trades.filter(t=>t.exitDate<=b[b.length-1].date),a.trades);
});
console.log('Regression tests passed');
