/* PROJECT 100X - scheduled QQQ data collector. Node 20+, no dependencies. */
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const key=process.env.ALPHA_VANTAGE_API_KEY;
 if(!key)throw Error('ALPHA_VANTAGE_API_KEY secret not configured');
 const url=new URL('https://www.alphavantage.co/query');
 for(const [k,v] of Object.entries({function:'TIME_SERIES_DAILY',symbol:'QQQ',outputsize:'compact',datatype:'csv',apikey:key}))url.searchParams.set(k,v);
 const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('HTTP '+response.status);
 const csv=(await response.text()).trim();
 const lines=csv.replace(/^\uFEFF/,'').split(/\r?\n/);
 if(lines[0].trim()!=='timestamp,open,high,low,close,volume')throw Error('Unexpected response; no data written');
 if(lines.length<36||lines.length>501)throw Error('Unexpected number of rows: '+(lines.length-1));
 let previous='9999-99-99';
 for(const line of lines.slice(1)){
   const p=line.split(',');if(p.length!==6||!/^\d{4}-\d{2}-\d{2}$/.test(p[0])||p[0]>=previous)throw Error('Invalid dates or columns');
   previous=p[0];const nums=p.slice(1).map(Number);
   if(nums.some(x=>!Number.isFinite(x)||x<0)||nums.slice(0,4).some(x=>x<=0)||nums[1]<Math.max(nums[0],nums[3])||nums[2]>Math.min(nums[0],nums[3])||nums[1]<nums[2])throw Error('Invalid OHLCV');
 }
 const dir=path.join(process.cwd(),'market-data');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'QQQ-daily.csv'),csv+'\n');
 fs.writeFileSync(path.join(dir,'status.json'),JSON.stringify({symbol:'QQQ',rows:lines.length-1,latestDate:lines[1].split(',')[0],updatedAt:new Date().toISOString(),source:'Alpha Vantage TIME_SERIES_DAILY',adjusted:false},null,2)+'\n');
 console.log('Validated QQQ data:',lines.length-1,'rows');
})().catch(e=>{console.error('Collection failed:',e.message);process.exitCode=1;});
