/* PROJECT 100X P0 integration v0.9.1 — load after app.js and portfolio-core.js.
 * No network, no automatic orders. Preserves existing storage key.
 */
(function(root){'use strict';
 const C=root.Project100XCore;
 if(!C){console.error('PROJECT 100X: portfolio-core.js missing');return;}
 const KEY='project100x_v1';
 const number=v=>Number(v);
 const symbol=v=>String(v??'').trim().toUpperCase();
 function explain(result){return result.errors.map(e=>`${e.index===null?'':`거래 #${e.index+1}: `}${e.message}`).join('\n');}
 function compatiblePortfolio(account){
   const p=C.evaluate(state.trades,state.prices,account);
   return {cash:p.cash,positions:p.positions,realized:p.realized,unrealized:p.unrealized,value:p.value,
     unknown:p.unpriced,errors:p.errors.map(e=>e.message)};
 }
 function safeTrade(t,index=-1){
   const normalized={...t,ticker:symbol(t.ticker)};
   const outcome=C.validateChange(state.trades,index<0?'add':'edit',index,normalized);
   return outcome.ok?null:explain(outcome);
 }
 // Global function declarations in app.js are replaceable in classic scripts.
 portfolio=compatiblePortfolio;
 validTrade=safeTrade;
 const originalRender=render;
 if(typeof originalRender==='function')render=function(){originalRender();
   const p=C.evaluate(state.trades,state.prices,document.getElementById('accountView').value);
   const s=document.getElementById('summary');
   if(!s)return;
   const metrics=s.querySelectorAll('.metric');
   if(metrics[4])metrics[4].querySelector('b').textContent=p.equity===null?'일부 미평가':'₩'+p.equity.toLocaleString('ko-KR',{maximumFractionDigits:2});
   if(metrics[5])metrics[5].querySelector('b').textContent=p.returnPct===null?'평가가격 필요':(p.returnPct>=0?'+':'')+p.returnPct.toFixed(2)+'%';
 };
 // Deleting a trade may invalidate a later sell. Reject before app.js click listener runs.
 document.addEventListener('click',e=>{
   const b=e.target.closest?.('button[data-delete-trade]');if(!b)return;
   const index=Number(b.dataset.deleteTrade);
   const outcome=C.validateChange(state.trades,'delete',index);
   if(!outcome.ok){e.stopImmediatePropagation();e.preventDefault();alert('이 거래를 삭제하면 이후 기록이 유효하지 않게 됩니다.\n'+explain(outcome));}
 },true);
 // Validate restored JSON before the old restore handler sees the change event.
 document.getElementById('restore')?.addEventListener('change',async e=>{
   e.stopImmediatePropagation();
   const input=e.currentTarget;
   try{
     const file=input.files?.[0];if(!file)return;
     const data=JSON.parse(await file.text());
     const checked=C.validateBackup(data);
     if(!checked.ok)throw Error(explain(checked));
     if(!confirm('현재 기록을 백업 파일로 교체할까요? 먼저 현재 기록을 백업했는지 확인하세요.'))return;
     const next={...data,version:3,prices:data.prices};
     const encoded=JSON.stringify(next);
     localStorage.setItem(KEY,encoded); // commit storage before switching in-memory state
     state=next;
     render();
     document.getElementById('status').textContent='검증 후 복원 완료';
   }catch(err){document.getElementById('status').textContent='복원 실패: '+err.message;}
   finally{input.value='';}
 },true);
 // Surface pre-existing ledger issues, without changing historical records.
 const audit=C.validateLedger(state.trades,state.prices);
 if(!audit.ok){const toast=document.getElementById('toast');if(toast)toast.textContent='기존 거래 기록에서 검증 오류 '+audit.errors.length+'건 발견. 데이터는 변경하지 않았습니다. 먼저 JSON 백업을 보관하세요.';}
 if(typeof render==='function')render();
 root.Project100XP0={version:'0.9.1',audit:()=>C.validateLedger(state.trades,state.prices)};
})(typeof window!=='undefined'?window:globalThis);
