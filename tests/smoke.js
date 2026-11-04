const engine = require('../p2-backtest-core.js');
if (!engine || !engine.validate) throw Error('Missing backtest engine');
console.log('Engine loaded');
