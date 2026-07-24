"use strict";

const assert = require("assert");
const engine = require("../assets/js/engines/crypto-profit.js");

function close(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
}

const zero = engine.calculate({
  buyPrice: 100,
  sellPrice: 150,
  quantity: 2,
  buyFee: { type: "percent", value: 0 },
  sellFee: { type: "flat", value: 0 }
});
assert.equal(zero.totalCost, 200);
assert.equal(zero.netProceeds, 300);
assert.equal(zero.netProfit, 100);
assert.equal(zero.roi, 50);
assert.equal(zero.breakEvenPrice, 100);

const percent = engine.calculate({
  buyPrice: 100,
  sellPrice: 150,
  quantity: 2,
  buyFee: { type: "percent", value: 10 },
  sellFee: { type: "percent", value: 10 }
});
assert.equal(percent.buyFee.amount, 20);
assert.equal(percent.sellFee.amount, 30);
assert.equal(percent.totalCost, 220);
assert.equal(percent.netProceeds, 270);
assert.equal(percent.netProfit, 50);
close(percent.roi, 22.727272727272727);
close(percent.breakEvenPrice, 122.22222222222221);

const flat = engine.calculate({
  buyPrice: 100,
  sellPrice: 150,
  quantity: 2,
  buyFee: { type: "flat", value: 10 },
  sellFee: { type: "flat", value: 5 }
});
assert.equal(flat.totalCost, 210);
assert.equal(flat.netProceeds, 295);
assert.equal(flat.netProfit, 85);
close(flat.roi, 40.476190476190474);
assert.equal(flat.breakEvenPrice, 107.5);

const loss = engine.calculate({
  buyPrice: 200,
  sellPrice: 100,
  quantity: 1,
  buyFee: { type: "flat", value: 0 },
  sellFee: { type: "flat", value: 0 }
});
assert.equal(loss.netProfit, -100);
assert.equal(loss.roi, -50);

const scenarios = engine.scenarios({
  buyPrice: 100,
  sellPrice: 150,
  quantity: 2,
  buyFee: { type: "percent", value: 10 },
  sellFee: { type: "percent", value: 10 }
}, [150, 200]);
assert.equal(scenarios[0].sellFee.amount, 30);
assert.equal(scenarios[1].sellFee.amount, 40);
assert.equal(scenarios[1].netProfit, 140);

assert.doesNotThrow(() => engine.calculate({
  buyPrice: engine.LIMITS.unitPrice,
  sellPrice: engine.LIMITS.unitPrice,
  quantity: 1,
  buyFee: { type: "percent", value: 0 },
  sellFee: { type: "flat", value: 0 }
}));
assert.doesNotThrow(() => engine.calculate({
  buyPrice: 1,
  sellPrice: 2,
  quantity: engine.LIMITS.quantity,
  buyFee: { type: "flat", value: 0 },
  sellFee: { type: "percent", value: 0 }
}));
assert.doesNotThrow(() => engine.calculate({
  buyPrice: 1,
  sellPrice: 2,
  quantity: 1,
  buyFee: { type: "flat", value: engine.LIMITS.flatFee },
  sellFee: { type: "flat", value: 0 }
}));

[
  () => engine.calculate({ buyPrice: 0, sellPrice: 1, quantity: 1, buyFee: { type: "flat", value: 0 }, sellFee: { type: "flat", value: 0 } }),
  () => engine.calculate({ buyPrice: 1, sellPrice: 1, quantity: 1, buyFee: { type: "percent", value: -1 }, sellFee: { type: "flat", value: 0 } }),
  () => engine.calculate({ buyPrice: 1, sellPrice: 1, quantity: 1, buyFee: { type: "percent", value: 0 }, sellFee: { type: "percent", value: 100 } }),
  () => engine.calculate({ buyPrice: engine.LIMITS.unitPrice + 1, sellPrice: 1, quantity: 1, buyFee: { type: "flat", value: 0 }, sellFee: { type: "flat", value: 0 } }),
  () => engine.calculate({ buyPrice: 1, sellPrice: 1, quantity: engine.LIMITS.quantity + 1, buyFee: { type: "flat", value: 0 }, sellFee: { type: "flat", value: 0 } }),
  () => engine.calculate({ buyPrice: 1, sellPrice: 1, quantity: 1, buyFee: { type: "flat", value: engine.LIMITS.flatFee + 1 }, sellFee: { type: "flat", value: 0 } }),
  () => engine.calculate({ buyPrice: engine.LIMITS.unitPrice, sellPrice: 1, quantity: engine.LIMITS.quantity, buyFee: { type: "flat", value: 0 }, sellFee: { type: "flat", value: 0 } }),
  () => engine.calculate({ buyPrice: Infinity, sellPrice: 1, quantity: 1, buyFee: { type: "flat", value: 0 }, sellFee: { type: "flat", value: 0 } })
].forEach((fn) => assert.throws(fn));

console.log("crypto profit engine: ok");
