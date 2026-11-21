(function (root) {
  'use strict';
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.calculateOutageIncident = function ({
    outageHours, revenuePerHour, revenueLossPct, uncoveredShare, staffIdleCost, backupCostHour,
    spoiledInventory, spoilagePct, internetPaymentCost, recoveryBufferPct, monthlyOutages
  }) {
    const grossRevenueAtRisk = revenuePerHour * outageHours;
    const lostRevenue = grossRevenueAtRisk * revenueLossPct * uncoveredShare;
    const staffCost = staffIdleCost * outageHours * uncoveredShare;
    const backupCost = backupCostHour * outageHours;
    const spoilageCost = spoiledInventory * spoilagePct;
    const riskCost = spoilageCost + internetPaymentCost;
    const subtotal = lostRevenue + staffCost + backupCost + riskCost;
    const recoveryBuffer = subtotal * recoveryBufferPct;
    const totalCost = subtotal + recoveryBuffer;
    const monthlyExposure = totalCost * monthlyOutages;
    return { grossRevenueAtRisk, lostRevenue, staffCost, backupCost, spoilageCost, riskCost,
      subtotal, recoveryBuffer, totalCost, monthlyExposure };
  };
})(window);
