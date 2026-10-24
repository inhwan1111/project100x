/* PROJECT 100X v0.9 phase 2: local CSV price-history inspection, read-only. */
(()=>{'use strict';
const make=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e;};
const MAX=1024*1024,MAX_ROWS=5000;
function parse(text){
 const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);if(lines.length<2||lines.length>MAX_ROWS+1)throw Error('데이터는 1~5000행이어야 합니다.');
 const head=lines.shift().split(',').map(x=>x.trim().toLowerCase());
 const required=['symbol','date','open','high','low','close','volume','currency','source'];
 if(required.some(x=>!head.includes(x)))throw Error('필수 열: '+required.join(','));
 const rows=[],seen=new Set();
 for(let i=0;i<lines.length;i++){
  const cells=lines[i].split(',').map(x=>x.trim());if(cells.length!==head.length)throw Error((i+2)+'행 열 개수 오류 (쉼표 포함 출처는 지원하지 않음)');
  const r=Object.fromEntries(required.map(k=>[k,cells[head.indexOf(k)]]));
  r.symbol=r.symbol.toUpperCase();r.currency=r.currency.toUpperCase();
  if(!/^[A-Z0-9.^=-]{1,24}$/.test(r.symbol)||!/^[A-Z]{3}$/.test(r.currency)||!r.source||r.source.length>100)throw Error((i+2)+'행 종목·통화·출처 오류');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date+'T00:00:00Z'))||new Date(r.date+'T00:00:00Z').toISOString().slice(0,10)!==r.date)throw Error((i+2)+'행 날짜 오류');
  for(const k of ['open','high','low','close','volume']){if(r[k]==='')throw Error((i+2)+'행 '+k+' 누락');r[k]=Number(r[k]);if(!Number.isFinite(r[k])||r[k]<0)throw Error((i+2)+'행 '+k+' 오류');}
  if(Math.min(r.open,r.high,r.low,r.close)<=0||r.high<Math.max(r.open,r.close,r.low)||r.low>Math.min(r.open,r.close,r.high)||!Number.isSafeInteger(r.volume))throw Error((i+2)+'행 OHLCV 불일치');
  const key=r.symbol+'|'+r.date;if(seen.has(key))throw Error((i+2)+'행 중복 거래일');seen.add(key);rows.push(r);
 }return rows.sort((a,b)=>a.symbol.localeCompare(b.symbol)||a.date.localeCompare(b.date));
}
function init(){const host=document.getElementById('home');if(!host||document.getElementById('p100x-history'))return;
 const card=make('div');card.id='p100x-history';card.className='card';card.append(make('h2','v0.9 · 과거 OHLCV 검증 (2단계)'),make('p','무료 데이터 제공처에서 합법적으로 받은 CSV를 기기에서만 검사합니다. 네트워크 요청·저장·자동 매매 없음.'));
 const label=make('label','과거 데이터 CSV 선택');const input=make('input');input.type='file';input.accept='.csv,text/csv';label.append(input);card.append(label);
 const example=make('pre','symbol,date,open,high,low,close,volume,currency,source\nQQQ,2026-10-22,400,410,395,405,1000000,USD,example\nQQQ,2026-10-23,405,415,400,412,1200000,USD,example');example.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px';card.append(example);
 const out=make('div');out.setAttribute('role','status');card.append(out);
 input.onchange=async()=>{out.replaceChildren();const file=input.files?.[0];if(!file)return;try{if(file.size>MAX)throw Error('1MB 초과 파일');const rows=parse(await file.text()),groups={};for(const r of rows)(groups[r.symbol]??=[]).push(r);
 out.append(make('p',rows.length+'행 · '+Object.keys(groups).length+'종목 형식 검증 통과 (원본 가격 진위는 미검증)'));
 for(const [sym,rs] of Object.entries(groups)){const first=rs[0],last=rs[rs.length-1];out.append(make('p',sym+' · '+first.date+' ~ '+last.date+' · '+rs.length+'거래일 · 최근 종가 '+last.close+' '+last.currency));}
 out.append(make('p','백테스트 사용 전 수정주가·분할·배당·거래소 시간대·결측 거래일·라이선스 검증이 필요합니다.'));
 }catch(e){out.append(make('p','검증 실패: '+e.message));}};
 host.append(card);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.Project100XHistoryV09={parse};
})();
