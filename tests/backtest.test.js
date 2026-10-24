/* Offline regression checks. Run with: node tests/backtest.test.js */
const assert=require('node:assert/strict');
const B=require('../p2-backtest-core.js');
const bars=Array.from({length:65},(_,i)=>({date:new Date(Date.UTC(2026,0,1+i)).toISOString().slice(0,10),open:100+i,high:102+i,low:99+i,close:101+i,volume:1000}));
assert.equal(B.validate(bars).ok,true);
assert.equal(B.validate(bars.slice().reverse()).ok,false);
assert.equal(B.validate(bars.slice(0,10)).ok,false);
assert.equal(B.validate([{...bars[0],high:1},...bars.slice(1)]).ok,false);
assert.equal(B.backtest(bars,'없는 전략').ok,false);
assert.equal(B.backtest(bars,'추세 눌림목',{holdDays:0}).ok,false);
assert.equal(B.backtest(bars,'추세 눌림목',{costPct:-1}).ok,false);
for(const s of B.strategies){const r=B.backtest(bars,s);assert.equal(r.ok,true);assert.equal(r.validatedEdge,false);for(const t of r.trades)assert.ok(t.signalDate<t.entryDate&&t.entryDate<=t.exitDate);}
for(const s of B.strategies.slice(3))assert.equal(B.backtest(bars,s).count,0);
const future=bars.map(x=>({...x}));future[64].close*=2;
for(const s of B.strategies)assert.deepEqual(B.signal(bars,40,s),B.signal(future,40,s));
console.log('PROJECT 100X backtest regression: PASS');
