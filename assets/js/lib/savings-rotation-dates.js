(function () {
  'use strict';
  function dateForRound(start, frequency, round) {
    const date = new Date(start);
    if (frequency === 'monthly') {
      const targetMonth = start.getMonth() + round;
      const lastDay = new Date(start.getFullYear(), targetMonth + 1, 0).getDate();
      date.setFullYear(start.getFullYear(), targetMonth, Math.min(start.getDate(), lastDay));
    } else {
      const interval = {daily: 1, weekly: 7, biweekly: 14}[frequency];
      date.setDate(start.getDate() + round * interval);
    }
    return date;
  }
  function civilDate(now) {
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }
  window.SavingsRotationDates = {dateForRound, civilDate};
})();
