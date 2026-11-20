(function () {
  const form = document.getElementById("g63-quote-comparison");
  if (!form) return;
  const result = form.querySelector("output");
  form.addEventListener("input", function () { result.textContent = ""; });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const difference = form.elements.local.valueAsNumber - form.elements.landed.valueAsNumber;
    const amount = "NGN " + Math.abs(difference).toLocaleString("en-NG");
    result.textContent = difference === 0 ? "Both totals are equal."
      : (difference > 0 ? "Importing" : "Buying locally") + " costs " + amount + " less.";
  });
}());
