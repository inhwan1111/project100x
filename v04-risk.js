/* PROJECT 100X v0.4 - manual price risk dashboard extension.
   Compatible with v0.3; does not change or delete stored trades. */
(() => {
  'use strict';
  const fmt = n => '₩' + Number(n).toLocaleString('ko-KR', {maximumFractionDigits:2});
  function update() {
    const account = document.getElementById('accountView')?.value;
    const positions = document.getElementById('positions');
    if (!account || !positions) return;
    let data;
    try { data = JSON.parse(localStorage.getItem('project100x_v1') || '{}'); } catch { return; }
    const trades = (data.trades || []).filter(t => t.account === account);
    const holdings = {};
    for (const t of trades) {
      const symbol = String(t.ticker || '').trim().toUpperCase();
      const qty = Number(t.qty), price = Number(t.price);
      if (!symbol || !(qty > 0) || !(price > 0)) continue;
      const p = holdings[symbol] ||= {qty:0,cost:0,stop:null,take:null};
      if (t.side === '매수') {
        p.qty += qty; p.cost += qty*price;
        if (Number(t.stop) > 0) p.stop = Number(t.stop);
        if (Number(t.take) > 0) p.take = Number(t.take);
      } else if (t.side === '매도' && qty <= p.qty) {
        const avg = p.qty ? p.cost/p.qty : 0;
        p.qty -= qty; p.cost -= qty*avg;
      }
    }
    for (const el of positions.querySelectorAll('.entry')) {
      el.querySelector('.v04-risk')?.remove();
      const symbol = el.querySelector('b')?.textContent?.trim();
      const p = holdings[symbol];
      if (!p || !(p.qty > 0)) continue;
      const avg = p.cost/p.qty;
      const stopPrice = p.stop ? avg*(1-p.stop/100) : null;
      const takePrice = p.take ? avg*(1+p.take/100) : null;
      const price = Number(data.prices?.[symbol]);
      let message = '평가가격 입력 대기', color = '#b5c1d3';
      if (price > 0) {
        if (stopPrice !== null && price <= stopPrice) { message = '손절 기준 도달 · 직접 확인 필요'; color = '#ff9a9a'; }
        else if (takePrice !== null && price >= takePrice) { message = '익절 목표 도달 · 직접 확인 필요'; color = '#70e0b1'; }
        else message = '보유 구간 · 목표 미도달';
      }
      const box = document.createElement('div');
      box.className = 'v04-risk metric'; box.style.marginTop = '12px';
      const heading = document.createElement('strong');
      heading.style.color = color; heading.textContent = message;
      const levels = document.createElement('p');
      levels.textContent = '손절 기준가: ' + (stopPrice === null ? '미설정' : fmt(stopPrice)) + ' / 익절 목표가: ' + (takePrice === null ? '미설정' : fmt(takePrice));
      const caveat = document.createElement('small');
      caveat.textContent = '직접 입력한 평가가격 기준 · 실시간 감시 및 자동 주문 없음';
      box.append(heading, levels, caveat); el.append(box);
    }
  }
  const observer = new MutationObserver(() => { if (!scheduled) { scheduled = true; queueMicrotask(() => {scheduled = false; observer.disconnect(); update(); observer.observe(document.getElementById('positions'), {childList:true});}); } });
  let scheduled = false;
  function start() {
    const el = document.getElementById('positions'); if (!el) return;
    observer.observe(el, {childList:true});
    document.getElementById('accountView')?.addEventListener('change', () => queueMicrotask(update));
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
