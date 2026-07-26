(function () {
  "use strict";
  var result = null;
  function fmt(value) { return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 }); }
  function report() {
    if (!result) return "";
    return ["AfroTools Single-Food Calorie Estimate", "Food: " + result.foodName, "Amount: " + fmt(result.amountEaten) + " " + result.unit, "Reference: " + fmt(result.labelCalories) + " kcal per " + fmt(result.labelAmount) + " " + result.unit, "Source: " + result.source, "Calculated portion: " + fmt(result.calories) + " kcal", "", "Meaning: amount eaten / reference amount x reference calories. This is not a calorie target, diet prescription, diagnosis or medical advice."].join("\n");
  }
  function blobDownload(blob, name) { var a=document.createElement("a"),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},0); }
  function pdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) return setStatus("PDF library unavailable. Use TXT.");
    var doc=new window.jspdf.jsPDF({unit:"pt",format:"a4",compress:false}),y=48;
    doc.splitTextToSize(report(),500).forEach(function(line){if(y>790){doc.addPage();y=48;}doc.text(line,44,y);y+=15;});
    doc.save("afrotools-single-food-calorie-estimate.pdf");setStatus("PDF downloaded locally.");
  }
  function setStatus(text){document.getElementById("export-status").textContent=text;}
  document.addEventListener("DOMContentLoaded",function(){
    document.getElementById("calorie-form").addEventListener("submit",function(event){
      event.preventDefault();var error=document.getElementById("form-error");error.hidden=true;
      try{
        result=SingleFoodCalorieEngine.calculate(Object.fromEntries(new FormData(event.currentTarget).entries()));
        document.getElementById("result-empty").hidden=true;document.getElementById("result-content").hidden=false;
        document.getElementById("calorie-result").textContent=fmt(result.calories)+" kcal";
        document.getElementById("formula-result").textContent=fmt(result.amountEaten)+" ÷ "+fmt(result.labelAmount)+" × "+fmt(result.labelCalories);
        document.getElementById("source-result").textContent="Source: "+result.source;
      }catch(problem){
        result=null;
        document.getElementById("result-empty").hidden=false;
        document.getElementById("result-content").hidden=true;
        error.textContent=problem.message;error.hidden=false;error.focus();
      }
    });
    document.getElementById("download-txt").addEventListener("click",function(){blobDownload(new Blob([report()],{type:"text/plain;charset=utf-8"}),"afrotools-single-food-calorie-estimate.txt");setStatus("TXT downloaded locally.");});
    document.getElementById("download-pdf").addEventListener("click",pdf);
  });
  window.SingleFoodCalorieApp={buildReportText:report};
})();
