/* PROJECT 100X — Portfolio Core v0.9 (P0)
 * Pure calculations. No storage writes, network requests, or real orders.
 * Trade array order is the ledger order; timestamps are informational.
 */
(function (root) {
  'use strict';
  const ACCOUNTS = Object.freeze(['AI', '인간', '협업', '통합']);
  const INITIAL_CASH = 100000;
  const EPS = 1e-8;
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const finitePositive = v => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v)) && Number(v) > 0;
  const finiteNonnegative = v => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v)) && Number(v) >= 0;
  const symbolOf = v => String(v == null ? '' : v).trim().toUpperCase();
  const fail = (code, message, index = null) => ({code, message, index});

  function inspectTrade(t, index) {
    if (!t || typeof t !== 'object' || Array.isArray(t)) return fail('TRADE_TYPE', '거래 데이터가 객체가 아닙니다.', index);
    if (!ACCOUNTS.includes(t.account)) return fail('ACCOUNT', '알 수 없는 계좌입니다.', index);
    if (t.side !== '매수' && t.side !== '매도') return fail('SIDE', '매수 또는 매도만 가능합니다.', index);
    if (!symbolOf(t.ticker) || symbolOf(t.ticker).length > 40) return fail('TICKER', '종목명이 비어 있거나 너무 깁니다.', index);
    if (!finitePositive(t.qty) || !finitePositive(t.price)) return fail('QUANTITY_PRICE', '수량과 가격은 유한한 양수여야 합니다.', index);
    for (const field of ['stop', 'take', 'holdDays']) {
      const value = t[field];
      if (value === '' || value === null || value === undefined) continue;
      if (!finitePositive(value)) return fail('OPTIONAL_FIELD', field + ' 값이 잘못됐습니다.', index);
      if (field === 'stop' && Number(value) >= 100) return fail('STOP', '손절 비율은 100% 미만이어야 합니다.', index);
      if (field === 'holdDays' && (!Number.isInteger(Number(value)) || Number(value) > 365)) return fail('HOLD_DAYS', '보유기간은 1~365 정수여야 합니다.', index);
    }
    return null;
  }

  function evaluate(trades, prices = {}, account = 'AI') {
    if (!ACCOUNTS.includes(account)) return {ok:false, errors:[fail('ACCOUNT','알 수 없는 계좌입니다.')], account};
    if (!Array.isArray(trades)) return {ok:false, errors:[fail('TRADES','거래 내역은 배열이어야 합니다.')], account};
    const errors = [], positions = Object.create(null);
    let cash = INITIAL_CASH, realized = 0;
    for (let i = 0; i < trades.length; i++) {
      const t = trades[i];
      if (t && t.account !== account) continue;
      const issue = inspectTrade(t, i);
      if (issue) { errors.push(issue); continue; }
      const ticker = symbolOf(t.ticker), qty = Number(t.qty), price = Number(t.price);
      const pos = positions[ticker] || (positions[ticker] = {qty:0,cost:0,realized:0,stop:null,take:null,holdDays:null,lastBuy:null});
      if (t.side === '매수') {
        const expense = qty * price;
        if (!Number.isFinite(expense) || expense > cash + EPS) {errors.push(fail('INSUFFICIENT_CASH',ticker+' 매수 자금이 부족합니다.',i));continue;}
        pos.qty += qty; pos.cost += expense; cash -= expense;
        if (finitePositive(t.stop)) pos.stop = Number(t.stop);
        if (finitePositive(t.take)) pos.take = Number(t.take);
        if (finitePositive(t.holdDays)) pos.holdDays = Number(t.holdDays);
        pos.lastBuy = t.date || null;
      } else {
        if (qty > pos.qty + EPS) {errors.push(fail('INSUFFICIENT_SHARES',ticker+' 보유 수량이 부족합니다.',i));continue;}
        const avg = pos.qty ? pos.cost / pos.qty : 0;
        const proceeds = qty * price;
        if (!Number.isFinite(proceeds)) {errors.push(fail('OVERFLOW','거래 금액이 너무 큽니다.',i));continue;}
        const gain = proceeds - qty * avg;
        pos.qty -= qty; pos.cost -= qty * avg; pos.realized += gain;
        realized += gain; cash += proceeds;
        if (pos.qty <= EPS) {pos.qty = 0;pos.cost = 0;}
      }
    }
    let value = 0, unrealized = 0, unpriced = 0;
    const marks = prices && typeof prices === 'object' && !Array.isArray(prices) ? prices : {};
    for (const [ticker, pos] of Object.entries(positions)) {
      if (pos.qty <= 0) continue;
      const mark = marks[ticker];
      if (!finitePositive(mark)) {pos.mark=null;pos.value=null;pos.pnl=null;unpriced++;continue;}
      pos.mark = Number(mark);pos.value = pos.qty * pos.mark;pos.pnl = pos.value - pos.cost;
      if (!Number.isFinite(pos.value)) {errors.push(fail('OVERFLOW','평가금액이 너무 큽니다.'));unpriced++;pos.mark=null;pos.value=null;pos.pnl=null;continue;}
      value += pos.value;unrealized += pos.pnl;
    }
    const equity = unpriced ? null : cash + value;
    return {ok:errors.length===0, account, cash, realized, unrealized, value, equity,
      returnPct:equity===null?null:(equity/INITIAL_CASH-1)*100, unpriced, positions, errors};
  }

  function validateLedger(trades, prices = {}) {
    if (!Array.isArray(trades)) return {ok:false,errors:[fail('TRADES','거래 내역은 배열이어야 합니다.')],accounts:{}};
    const accounts = {}, errors = [];
    for (const name of ACCOUNTS) {const result = evaluate(trades, prices, name);accounts[name]=result;errors.push(...result.errors);}
    return {ok:errors.length===0, errors, accounts};
  }

  function validateChange(trades, action, index, candidate) {
    if (!Array.isArray(trades)) return {ok:false,errors:[fail('TRADES','거래 내역은 배열이어야 합니다.')]};
    const copy = trades.slice();
    if (action === 'add') copy.push(candidate);
    else if (action === 'edit' && Number.isInteger(index) && index >= 0 && index < copy.length) copy[index] = candidate;
    else if (action === 'delete' && Number.isInteger(index) && index >= 0 && index < copy.length) copy.splice(index,1);
    else return {ok:false,errors:[fail('ACTION','잘못된 변경 요청입니다.')]};
    const result = validateLedger(copy);
    return {...result, trades: result.ok ? copy : null};
  }

  function validateBackup(data) {
    const errors=[];
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {ok:false,errors:[fail('BACKUP','백업은 객체여야 합니다.')]};
    if (!Array.isArray(data.trades)) errors.push(fail('TRADES','거래 배열이 없습니다.'));
    if (!Array.isArray(data.research)) errors.push(fail('RESEARCH','연구 배열이 없습니다.'));
    if (!data.prices || typeof data.prices !== 'object' || Array.isArray(data.prices)) errors.push(fail('PRICES','평가가격 객체가 없습니다.'));
    if (Array.isArray(data.research)) for (let i=0;i<data.research.length;i++) {
      const r=data.research[i];if (!r || typeof r!=='object' || Array.isArray(r)) errors.push(fail('RESEARCH_ITEM','연구 기록 형식이 잘못됐습니다.',i));
    }
    if (data.prices && typeof data.prices==='object' && !Array.isArray(data.prices)) for (const [ticker,price] of Object.entries(data.prices)) {
      if (!ticker || !finitePositive(price)) errors.push(fail('PRICE',ticker+' 평가가격이 잘못됐습니다.'));
    }
    if (Array.isArray(data.trades)) errors.push(...validateLedger(data.trades, data.prices).errors);
    return {ok:errors.length===0,errors};
  }

  const api=Object.freeze({VERSION:'0.9.0', ACCOUNTS, INITIAL_CASH, inspectTrade, evaluate, validateLedger, validateChange, validateBackup});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.Project100XCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
