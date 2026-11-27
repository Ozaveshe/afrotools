(function (global) {
  "use strict";

  function fmt(number, digits) {
    return number.toLocaleString("en-US", {
      minimumFractionDigits: digits || 0,
      maximumFractionDigits: digits || 0,
    });
  }

  function value(id) {
    return document.getElementById(id).value;
  }

  var routeInput = document.getElementById("pubRoute");
  var costInput = document.getElementById("authorCostShare");
  var royaltyInput = document.getElementById("authorRoyalty");
  var savedTerms = {};
  var activeRoute;

  function showRouteTerms() {
    var route = routeInput.value;
    if (activeRoute !== route) {
      if (activeRoute) savedTerms[activeRoute] = [costInput.value, royaltyInput.value];
      var saved = savedTerms[route] || ["", ""];
      costInput.value = saved[0];
      royaltyInput.value = saved[1];
      activeRoute = route;
    }
    var defaults = global.AfroTools.BookPublishingCostEngine.routeDefaults(route, Number(value("retailPrice")));
    costInput.placeholder = String(defaults.costShare);
    royaltyInput.placeholder = String(defaults.royalty);
  }

  if (costInput && royaltyInput) {
    routeInput.closest(".en-tool-layout").addEventListener("input", function () {
      document.getElementById("results").classList.remove("on");
    });
    routeInput.addEventListener("change", showRouteTerms);
    document.getElementById("retailPrice").addEventListener("input", showRouteTerms);
    showRouteTerms();
  }

  function calculate() {
    var engine = global.AfroTools && global.AfroTools.BookPublishingCostEngine;
    var tools = global.AfroTools && global.AfroTools.CreativeResultTools;
    if (!engine) throw new Error("BookPublishingCostEngine is unavailable");
    if (!(parseFloat(value("retailPrice")) > 0)) {
      return tools.reject(tools.text("Enter a retail price greater than zero.", "Saisissez un prix de vente supérieur à zéro."), "retailPrice");
    }
    if (!(parseInt(value("monthlySales"), 10) >= 1)) {
      return tools.reject(tools.text("Enter at least one estimated monthly sale.", "Saisissez au moins une vente mensuelle estimée."), "monthlySales");
    }
    if (costInput && royaltyInput) {
      var invalid = [costInput, royaltyInput].find(function (field) { return !field.validity.valid; });
      if (invalid) return tools.reject("Enter a percentage from 0 to 100.", invalid.id);
    }
    var result = engine.calculate({
      pubRoute: costInput ? routeInput.value : undefined,
      authorCostShare: costInput ? costInput.value : undefined,
      authorRoyalty: royaltyInput ? royaltyInput.value : undefined,
      country: value("country"),
      retailPrice: value("retailPrice"),
      monthlySales: value("monthlySales"),
      devEdit: value("devEdit"),
      copyEdit: value("copyEdit"),
      proofread: value("proofread"),
      coverDesign: value("coverDesign"),
      layout: value("layout"),
      isbn: value("isbn"),
      printQty: value("printQty"),
      printCost: value("printCost"),
    });

    document.getElementById("totalBudget").textContent =
      "$" + fmt(result.totalUSD, 2);
    document.getElementById("localBudget").textContent =
      result.symbol +
      fmt(result.totalLocal) +
      " (using the built-in planning rate)";
    document.getElementById("breakEven").textContent =
      result.breakEven === null ? "No break-even at this royalty" : fmt(result.breakEven) + " copies";
    var comparison = result.platforms;
    if (costInput) {
      var routeLabel = routeInput.selectedOptions[0].textContent;
      document.getElementById("routeSummary").textContent = routeLabel + " · You cover " +
        result.authorCostShare + "% of $" + fmt(result.projectTotal, 2) + " in production costs.";
      comparison = [{
        name: routeLabel,
        royalty: result.authorRoyalty / 100,
        perCopy: result.royaltyPerCopy,
        monthly: result.royaltyPerCopy * result.monthlySales,
        annual: result.royaltyPerCopy * result.monthlySales * 12,
      }];
    }
    document.getElementById("royaltyTable").innerHTML = comparison
      .map(function (platform) {
        return (
          '<tr><td class="en-td-value">' +
          platform.name +
          "</td><td>" +
          Number((platform.royalty * 100).toFixed(4)) +
          "%</td><td>$" +
          fmt(platform.perCopy, 2) +
          "</td><td>$" +
          fmt(platform.monthly, 0) +
          '</td><td class="en-td-highlight">$' +
          fmt(platform.annual, 0) +
          "</td></tr>"
        );
      })
      .join("");
    document.getElementById("metrics").innerHTML =
      '<div class="en-metric"><div class="en-metric-label">Editing Costs</div><div class="en-metric-value">$' +
      fmt(result.editingTotal) +
      '</div><div class="en-metric-unit">Dev + Copy + Proof</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Setup Costs</div><div class="en-metric-value">$' +
      fmt(result.setupTotal) +
      '</div><div class="en-metric-unit">Cover, layout, ISBN</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Print Run</div><div class="en-metric-value">$' +
      fmt(result.printTotal) +
      '</div><div class="en-metric-unit">' +
      fmt(result.printQty) +
      " copies</div></div>" +
      '<div class="en-metric"><div class="en-metric-label">Monthly Revenue</div><div class="en-metric-value">$' +
      fmt(result.royaltyPerCopy * result.monthlySales) +
      '</div><div class="en-metric-unit">At ' +
      fmt(result.monthlySales) +
      " sales/mo</div></div>";
    document.getElementById("projTable").innerHTML = result.projections
      .map(function (projection) {
        return (
          "<tr><td>Year " +
          projection.year +
          "</td><td>" +
          fmt(projection.copies) +
          "</td><td>$" +
          fmt(projection.gross) +
          "</td><td>$" +
          fmt(projection.publishingCost) +
          '</td><td class="en-td-highlight' +
          (projection.net >= 0 ? " en-text-accent" : "") +
          '">$' +
          fmt(projection.net) +
          "</td></tr>"
        );
      })
      .join("");
    document.getElementById("results").classList.add("on");
    tools.publish({
      name: tools.text("Book Publishing Cost Calculator", "Calculateur du coût de publication d'un livre"),
      fileBase: "book-publishing-cost",
    });
    document
      .getElementById("results")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  }

  global.calculate = calculate;
})(window);
