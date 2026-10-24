/* PROJECT 100X: touch-friendly development meeting room.
 * Independent local storage; never writes project100x_v1.
 */
(()=>{'use strict';
const KEY='project100x_meetings_v1';
const agenda=[
 {id:1,q:'실패한 추천을 어떻게 처리할까?',options:['실패 원인만 기록','원인 분석 후 개선안 제안','개선안 독립 검증 후 반영 검토'],chosen:'C'},
 {id:2,q:'추천 종목의 최소 신뢰도는?',options:['전략 1개 신호','전략 2개 이상 일치','시장·데이터·성과·위험 종합 평가'],chosen:'C'},
 {id:3,q:'급락장에 어떻게 대응할까?',options:['기존 추천 유지','신규 추천 전면 중단','위험 수준별 제한 및 별도 검증'],chosen:'C'},
 {id:4,q:'가상투자 검증 기간은?',options:['1개월','3개월','6~12개월 이상, 거래 수·시장 국면 병행'],chosen:'C'},
 {id:5,q:'가장 중요한 성과 기준은?',options:['수익률','승률','수익률·MDD·손익비·비용·시장 대비 성과'],chosen:'C'},
 {id:6,q:'JT AI 전략 개선 방식은?',options:['사용자 직접 변경','연구 후 사용자 승인','자동 연구·독립 검증·사용자 승인 후 적용'],chosen:'C'},
 {id:7,q:'목표가·손절가 결정 방식은?',options:['고정 비율','기술적 분석','변동성·시장·보유기간 종합 위험관리'],chosen:'C'},
 {id:8,q:'투자 기회 알림 방식은?',options:['정기 보고','실시간 알림','정기 보고와 중요 신호 알림 병행'],chosen:'C'},
 {id:9,q:'추천 종목 개수는?',options:['1개','3개','상황에 따라 0~5개'],chosen:'C'}
];
function el(tag,text){const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x}
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}}
function init(){
 const home=document.getElementById('home');if(!home||document.getElementById('p100x-meeting'))return;
 const card=el('div');card.className='card';card.id='p100x-meeting';
 card.append(el('h2','개발 회의실 · 터치 선택'));
 card.append(el('p','A·B·C를 직접 누른 뒤 선택을 확정하세요. 회의 결정은 이 기기에 별도 저장되며 가상투자 기록은 변경하지 않습니다.'));
 const picker=el('label','회의 안건'),select=el('select');for(const a of agenda){const o=el('option','안건 '+a.id+' · '+a.q);o.value=String(a.id);select.append(o)}picker.append(select);card.append(picker);
 const question=el('h3'),form=el('form'),status=el('p');status.setAttribute('role','status');status.style.marginTop='12px';
 function render(){
  const a=agenda.find(x=>String(x.id)===select.value)||agenda[0];question.textContent='안건 '+a.id+' · '+a.q;form.replaceChildren();
  const saved=read()[a.id];const current=['A','B','C'].includes(saved)?saved:a.chosen;
  a.options.forEach((label,i)=>{
   const value='ABC'[i],row=el('label');row.style.cssText='display:flex;align-items:flex-start;gap:12px;padding:12px;border:1px solid #45536b;border-radius:10px;margin:8px 0;cursor:pointer';
   const radio=el('input');radio.type='radio';radio.name='decision';radio.value=value;radio.checked=value===current;radio.style.cssText='width:22px;height:22px;flex:0 0 auto;margin:0';
   row.append(radio,el('span',value+' · '+label));form.append(row);
  });
  const btn=el('button','선택 확정하기 →');btn.type='submit';form.append(btn);
  status.textContent=saved?'이 기기에 저장된 선택: '+saved:'기존 회의 확정: '+a.chosen+' (앱 저장 전)';
 }
 form.addEventListener('submit',e=>{
  e.preventDefault();const a=agenda.find(x=>String(x.id)===select.value);const checked=form.querySelector('input[name="decision"]:checked');if(!a||!checked)return;
  try{const data=read();data[a.id]=checked.value;localStorage.setItem(KEY,JSON.stringify(data));status.textContent='안건 '+a.id+' · '+checked.value+' 선택이 이 기기에 저장되었습니다.'}catch{status.textContent='저장 실패: 기기 저장 공간을 확인하세요.'}
 });
 select.addEventListener('change',render);card.append(question,form,status);
 const note=el('p','※ 1~9번은 기존 회의에서 모두 C로 확정되었습니다. 이 화면에서 선택을 다시 저장해도 전략 코드가 자동 변경되지는 않습니다.');note.className='notice';card.append(note);
 home.append(card);render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
