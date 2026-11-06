/* QQQ CSV integration checks; run: node tests/qqq-integration.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../p2-backtest-core.js');
const text=fs.readFileSync(path.join(__dirname,'../market-data/QQQ-daily.csv'),'utf8').trim();
const lines=text.split(/\r?\n/);
assert.equal(lines.shift(),'timestamp,open,high,low,close,volume','CSV header');
const bars=lines.map((line)=>{
 const parts=line.split(',');
 assert.equal(parts.length,6,'CSV columns');
 const [date,open,high,low,close,volume]=parts;
 return {date,open:Number(open),high:Number(high),low:Number(low),close:Number(close),volume:Number(volume)};
}).reverse();
assert.equal(bars.length,100,'expected QQQ sample size at time of fixture');
assert.equal(engine.validate(bars).ok,true,'OHLCV validation');
const expected={
 '추세 눌림목':[
 ['2026-08-03','2026-08-04','2026-08-10'],
 ['2026-08-27','2026-08-28','2026-09-03'],
 ['2026-09-04','2026-09-08','2026-09-14'],
 ['2026-09-17','2026-09-18','2026-09-24'],
 ['2026-10-01','2026-10-02','2026-10-08'],
 ['2026-10-08','2026-10-09','2026-10-15']],
 '거래량 돌파':[],
 '과매도 반등':[]
};
const expectedNet={
 '추세 눌림목':[1.4899,-0.5863,-1.9217,2.7893,-0.7945,-3.5520],
 '거래량 돌파':[],
 '과매도 반등':[]
};
for(const [strategy,dates] of Object.entries(expected)){
 const r=engine.backtest(bars,strategy,{holdDays:5,costPct:0.15});
 assert.equal(r.ok,true,strategy+': backtest valid');
 assert.equal(r.count,dates.length,strategy+': count');
 assert.deepEqual(r.trades.map(t=>[t.signalDate,t.entryDate,t.exitDate]),dates,strategy+': trade dates');
 assert.deepEqual(r.trades.map(t=>Number(t.netPct.toFixed(4))),expectedNet[strategy],strategy+': historical net returns');
 for(const t of r.trades){
  assert.ok(t.signalDate<t.entryDate&&t.entryDate<=t.exitDate);
  assert.ok(Math.abs(t.netPct-(t.exit*.9985/(t.entry*1.0015)-1)*100)<1e-10);
 }
 console.log('PASS',strategy,r.count,'completed trades');
}
console.log('QQQ integration checks passed; research only, not a predictive validation.');
