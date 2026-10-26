/* PROJECT 100X — one-click research v0.1: QQQ data validation and six-strategy readiness. No trades or storage writes. */
(()=>{'use strict';
const strategies=['추세 눌림목','거래량 돌파','과매도 반등','뉴스·가격 역행','저평가 회복','이벤트 모멘텀'];
const el=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x;};
function parseCSV(csv){
 const lines=csv.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 if(lines[0]?.trim()!=='timestamp,open,high,low,close,volume'||lines.length<36)throw Error('시세 CSV 형식 또는 거래일 수 부족');
 let prev='9999-99-99';
 const bars=lines.slice(1).map(line=>{
  const v=line.split(',');if(v.length!==6)throw Error('시세 열 수 오류');
  const [date,...nums]=v, a=nums.map(Number);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date||date>=prev||a.some(n=>!Number.isFinite(n))||Math.min(...a.slice(0,4))<=0||a[4]<0||a[1]<Math.max(a[0],a[3],a[2])||a[2]>Math.min(a[0],a[3],a[1]))throw Error('시세 데이터 검증 실패');
  prev=date;return {date,open:a[0],high:a[1],low:a[2],close:a[3],volume:a[4]};
 });return bars.reverse();
}
async function run(out,btn){
 btn.disabled=true;out.replaceChildren(el('p','시세 데이터 확인 중…'));
 try{
  const [statusResponse,csvResponse]=await Promise.all([
   fetch('./market-data/status.json?t='+Date.now(),{cache:'no-store'}),
   fetch('./market-data/QQQ-daily.csv?t='+Date.now(),{cache:'no-store'})
  ]);
  if(!statusResponse.ok||!csvResponse.ok)throw Error('무료 시세 파일을 가져오지 못했습니다.');
  const status=await statusResponse.json(),bars=parseCSV(await csvResponse.text());
  if(status.symbol!=='QQQ'||status.latestDate!==bars.at(-1).date)throw Error('시세 상태와 실제 CSV 날짜가 일치하지 않습니다.');
  const age=(Date.now()-Date.parse(status.updatedAt))/86400000;
  if(!Number.isFinite(age)||age< -1||age>4)throw Error('시세 갱신 시각이 오래되었거나 올바르지 않습니다.');
  out.replaceChildren();
  out.append(el('p','대상: QQQ · '+bars.length+'거래일 · 마지막 거래일: '+bars.at(-1).date));
  out.append(el('p','시세 검증 통과. 현재는 원클릭 분석의 데이터 점검 단계이며, 매수 추천을 생성하지 않습니다.'));
  const list=el('ul');for(const name of strategies){const li=el('li',name+' — '+(['뉴스·가격 역행','저평가 회복','이벤트 모멘텀'].includes(name)?'외부 근거 데이터 미연결':'전략 신호 통합 검증 전'));list.append(li);}out.append(list);
  out.append(el('p','뉴스: 미연결 · 기관/외국인 수급: 미연결 · 시장심리: 미연결 · 추천: 0건 (검증 전)'));
 }catch(err){out.replaceChildren(el('p','⚠️ 분석 보류: '+err.message+' 기존 가상투자 데이터는 변경되지 않았습니다.'));}
 finally{btn.disabled=false;}
}
function init(){
 const home=document.getElementById('home');if(!home||document.getElementById('p100x-oneclick'))return;
 const box=el('div');box.className='card';box.id='p100x-oneclick';
 box.append(el('h2','원클릭 통합 분석 · 개발 미리보기'));
 box.append(el('p','현재 QQQ 무료 데이터 유효성만 확인합니다. 뉴스·수급·6대 전략 추천은 아직 구현되지 않았습니다.'));
 const btn=el('button','데이터 점검 시작');btn.type='button';
 const out=el('div');out.setAttribute('role','status');out.setAttribute('aria-live','polite');
 btn.addEventListener('click',()=>run(out,btn));box.append(btn,out);home.append(box);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();