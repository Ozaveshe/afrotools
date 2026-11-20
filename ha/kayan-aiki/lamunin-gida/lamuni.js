(function () {
  const form = document.getElementById("loan");
  const result = document.getElementById("result");
  const error = document.getElementById("error");
  form.addEventListener("input", function () {
    result.hidden = true;
    error.textContent = "";
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const input = Object.fromEntries(new FormData(form));
    if (Number(input.deposit) > Number(input.propertyPrice)) {
      error.textContent = "Kuɗin farko ba zai fi farashin gidan ba.";
      form.elements.deposit.focus();
      return;
    }
    input.confirmedAssumptions = form.elements.confirmedAssumptions.checked;
    try {
      const estimate = window.AfroTools.mortgagePlanner.calculate(input);
      const money = new Intl.NumberFormat("ha-NG", { style: "currency", currency: input.currency });
      for (const [id, value] of Object.entries({monthly: estimate.allInMonthly, base: estimate.monthlyPrincipalInterest, principal: estimate.principal, interest: estimate.totalInterest})) {
        document.getElementById(id).textContent = money.format(value);
      }
      result.hidden = false;
      result.focus();
    } catch {
      error.textContent = "A duba adadin ruwan shekara da shekarun biyan bashi, sannan a sake lissafi.";
    }
  });
}());
