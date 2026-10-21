'use strict';

class ProfileRequestUnavailable extends Error {
  constructor() { super('Profile temporarily unavailable'); this.name = 'ProfileRequestUnavailable'; }
}

async function withProfileRequestBudget(run, unavailable) {
  const controller = new AbortController();
  let closed = false;
  let timer;
  const expired = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      reject(new ProfileRequestUnavailable());
      controller.abort();
    }, 5000);
  });
  function active() {
    if (closed || controller.signal.aborted) throw new ProfileRequestUnavailable();
  }
  const budget = {
    controller,
    async wait(operation) {
      active();
      try {
        const value = await Promise.race([Promise.resolve().then(() => { active(); return operation(); }), expired]);
        active();
        return value;
      } catch (error) {
        controller.abort();
        throw new ProfileRequestUnavailable();
      }
    },
    async fetch(url, options) {
      const response = await budget.wait(() => fetch(url, { ...(options || {}), signal: controller.signal }));
      if (response.status === 429 || response.status >= 500) throw new ProfileRequestUnavailable();
      return response;
    },
    text(response) { return budget.wait(() => response.text()); },
    json(response) { return budget.wait(() => response.json()); }
  };
  try {
    return await Promise.race([run(budget), expired]);
  } catch (error) {
    if (!error || error.name !== 'ProfileRequestUnavailable') throw error;
    return unavailable();
  } finally {
    closed = true;
    clearTimeout(timer);
    controller.abort();
  }
}

module.exports = { withProfileRequestBudget };
