/* PROJECT 100X: incremental QQQ history collection. Node 20+, no dependencies.
 * Preserve older validated rows; append newer provider observations.
 * Never overwrite existing history silently on conflicting overlapping dates.
 */
const fs=require('node:fs');
const path=require('node:path');
const HEADER='timestamp,open,high,low,close,volume';
function parse(text,label){
 const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 if(lines.shift()?.trim()!==HEADER)throw Error(label+': CSV header mismatch');
 if(lines.length<1||lines.length>10000)throw Error(label+': row count out of bounds');
 let prev='9999-99-99';
 const rows=new Map();
 for(const line of lines){
  const a=line.split(',');
  if(a.length!==6||!/^\d{4}-\d{2}-\d{2}$/.test(a[0])||a[0]>=prev||new Date(a[0]+'T00:00:00Z').toISOString().slice(0,10)!==a[0])throw Error(label+': date/order error');
  const n=a.slice(1).map(Number);
  if(n.some(x=>!Number.isFinite(x)||x<0)||n.slice(0,4).some(x=>x<=0)||n[1]<Math.max(n[0],n[3])||n[2]>Math.min(n[0],n[3])||n[1]<n[2])throw Error(label+': invalid OHLCV');
  rows.set(a[0],{date:a[0],numbers:n});
  prev=a[0];
 }
 return rows;
}
function merge(existing,incoming){
 const all=new Map(existing);
 let added=0;
 for(const [date,row] of incoming){
  if(all.has(date)){
   const old=all.get(date).numbers;
   // Compare numeric values rather than formatting (e.g. 1.0 vs 1.00).
   if(row.numbers.some((n,i)=>Math.abs(n-old[i])>Math.max(1e-6,Math.abs(old[i])*1e-7)))
    throw Error('Conflicting historical QQQ value on '+date+'; manual review required');
  }else{all.set(date,row);added++}
 }
 const sorted=[...all.values()].sort((a,b)=>b.date.localeCompare(a.date));
 if(sorted.length>10000)throw Error('History exceeds safety cap');
 return {sorted,added};
}
async function main(){
 const key=process.env.ALPHA_VANTAGE_API_KEY;
 if(!key)throw Error('ALPHA_VANTAGE_API_KEY secret not configured');
 const url=new URL('https://www.alphavantage.co/query');
 for(const [k,v] of Object.entries({function:'TIME_SERIES_DAILY',symbol:'QQQ',outputsize:'compact',datatype:'csv',apikey:key}))url.searchParams.set(k,v);
 const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('HTTP '+response.status);
 const incoming=parse(await response.text(),'provider');
 if(incoming.size<35||incoming.size>500)throw Error('Unexpected provider rows: '+incoming.size);
 const dir=path.join(process.cwd(),'market-data');
 const file=path.join(dir,'QQQ-daily.csv'),statusFile=path.join(dir,'status.json');
 const existing=fs.existsSync(file)?parse(fs.readFileSync(file,'utf8'),'existing'):new Map();
 const {sorted,added}=merge(existing,incoming);
 if(!added&&existing.size){console.log('QQQ history unchanged; skipping write');return}
 // All validation is complete before either output file is changed.
 fs.mkdirSync(dir,{recursive:true});
 const csv=HEADER+'\n'+sorted.map(r=>r.date+','+r.numbers.join(',')).join('\n')+'\n';
 const status={symbol:'QQQ',rows:sorted.length,latestDate:sorted[0].date,updatedAt:new Date().toISOString(),source:'Alpha Vantage TIME_SERIES_DAILY',adjusted:false};
 fs.writeFileSync(file,csv);
 fs.writeFileSync(statusFile,JSON.stringify(status,null,2)+'\n');
 console.log('Validated QQQ history: '+sorted.length+' rows, '+added+' newly added');
}
if(require.main===module)main().catch(e=>{console.error('Collection failed:',e.message);process.exitCode=1});
module.exports={parse,merge};
