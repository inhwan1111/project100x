'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../p2-backtest-core.js');
const csv=fs.readFileSync(path.join(__dirname,'../market-data/QQQ-daily.csv'),'utf8').replace(/^\uFEFF/,'').trim();
const lines=csv.split(/\r?\n/);
assert.equal(lines.shift().trim(),'timestamp,open,high,low,close,volume');
const bars=lines.map((line,i)=>{
 const a=line.split(',');
 assert.equal(a.length,6,'CSV columns '+i);
 return {date:a[0],open:Number(a[1]),high:Number(a[2]),low:Number(a[3]),close:Number(a[4]),volume:Number(a[5])};
}).reverse();
assert.equal(engine.validate(bars).ok,true,'Invalid QQQ CSV');
const status=JSON.parse(fs.readFileSync(path.join(__dirname,'../market-data/status.json'),'utf8'));
assert.equal(status.symbol,'QQQ');
assert.equal(status.rows,bars.length);
assert.equal(status.latestDate,bars[bars.length-1].date);
for(const strategy of engine.strategies.slice(0,3)){
 const r=engine.backtest(bars,strategy,{holdDays:5,costPct:.15});
 assert.equal(r.ok,true,'Backtest rejected '+strategy+': '+r.reason);
 for(const t of r.trades){
  assert.ok(t.signalDate<t.entryDate && t.entryDate<=t.exitDate,'Chronology: '+strategy);
  assert.ok(Number.isFinite(t.netPct),'Nonfinite return');
 }
 console.log(strategy+': '+r.count+' completed historical trades');
}
console.log('PASS: real QQQ CSV and status consistency');
