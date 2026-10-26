/* PROJECT 100X — JT QQQ automated-data research, read-only. */
(()=>{'use strict';
const make=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e};
function parse(csv){
 const lines=csv.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 if(lines[0]?.trim()!=='timestamp,open,high,low,close,volume'||lines.length<51||lines.length>501)throw Error('CSV 헤더 또는 데이터 개수 오류');
 let last='9999-99-99';
 const rows=lines.slice(1).map((line,i)=>{
  const a=line.split(',');if(a.length!==6)throw Error('열 개수 오류: '+(i+2));
  const [date,...raw]=a,nums=raw.map(Number);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date||date>=last||nums.some(n=>!Number.isFinite(n)||n<0)||nums.slice(0,4).some(n=>n<=0)||nums[1]<Math.max(nums[0],nums[3])||nums[2]>Math.min(nums[0],nums[3]))throw Error('OHLCV 데이터 오류: '+(i+2));
  last=date;return {date,close:nums[3],volume:nums[4]};
 });return rows;
}
function avg(rows,n){return rows.slice(0,n).reduce((s,r)=>s+r.close,0)/n}
async function analyze(out){
 out.textContent='QQQ 수집 데이터 분석 중…';
 try{
  const [a,b]=await Promise.all([
   fetch('./market-data/status.json?t='+Date.now(),{cache:'no-store'}),
   fetch('./market-data/QQQ-daily.csv?t='+Date.now(),{cache:'no-store'})
  ]);
  if(!a.ok||!b.ok)throw Error('자동 수집 파일을 찾을 수 없습니다.');
  const status=await a.json(),rows=parse(await b.text());
  if(status.symbol!=='QQQ'||status.rows!==rows.length||status.latestDate!==rows[0].date)throw Error('상태 파일과 CSV가 일치하지 않습니다.');
  const close=rows[0].close,prior=rows[1].close,s20=avg(rows,20),s50=avg(rows,50);
  const updated=Date.parse(status.updatedAt);
  if(!Number.isFinite(updated)||Date.now()-updated>4*86400000||updated>Date.now()+86400000)throw Error('수집 시각이 오래되었거나 유효하지 않습니다.');
  const diff=(close/prior-1)*100;
  const trend=close>s20&&s20>s50?'단기 상승 배열':close<s20&&s20<s50?'단기 하락 배열':'혼조·전환 가능 구간';
  out.textContent='[QQQ 자동 데이터 연구 결과]\n'+
   '최근 거래일: '+rows[0].date+' · '+rows.length+'거래일\n'+
   '종가: $'+close.toFixed(2)+' · 전 거래일 대비 '+(diff>=0?'+':'')+diff.toFixed(2)+'%\n'+
   '20일 단순이동평균: $'+s20.toFixed(2)+'\n50일 단순이동평균: $'+s50.toFixed(2)+'\n'+
   '기술적 상태: '+trend+'\n\n'+
   '※ 연구용 기초 지표이며 매수·매도 추천이 아닙니다. 6대 전략·위험관리·과거 검증은 아직 연결되지 않았습니다.\n'+
   '※ 원본 일별 종가(배당·분할 조정 없음). 휴장·데이터 제공 지연 및 원본 정확성은 별도 확인 필요. 가상투자 기록은 변경하지 않습니다.';
 }catch(e){out.textContent='분석 보류: '+(e.message||e)+'\n가상투자 기록은 변경하지 않았습니다.';}
}
function init(){
 const home=document.getElementById('home');if(!home||document.getElementById('p100x-jt-qqq-auto'))return;
 const card=make('div');card.className='card';card.id='p100x-jt-qqq-auto';
 card.append(make('h2','JT 연구원 · QQQ 자동 데이터 분석'),make('p','GitHub Actions가 수집한 공개 QQQ 데이터를 읽어 기초 추세를 분석합니다. CSV 파일 선택은 필요하지 않습니다.'));
 const button=make('button','QQQ 자동 데이터 분석 실행');button.type='button';
 const out=make('div','분석 버튼을 눌러 주세요.');out.setAttribute('role','status');out.style.cssText='white-space:pre-wrap;line-height:1.7;overflow-wrap:anywhere;margin-top:12px';
 button.addEventListener('click',()=>analyze(out));card.append(button,out);
 const jt=document.getElementById('jt-research-v07');if(jt&&jt.parentElement===home)jt.after(card);else home.append(card);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();