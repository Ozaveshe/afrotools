(function () {
  "use strict";
  function createAsset(input) {
    var source=input||{},title=String(source.title||"").trim(),sourceUrl=String(source.sourceUrl||"").trim(),license=String(source.license||"").trim();
    if(!title)throw new Error("Asset title is required.");
    if(!/^https?:\/\//i.test(sourceUrl))throw new Error("Source URL must use HTTP or HTTPS.");
    if(!license)throw new Error("License note is required.");
    return{title:title,sourceUrl:sourceUrl,creator:String(source.creator||"").trim(),license:license,usage:String(source.usage||"").trim(),checkedOn:String(source.checkedOn||"").trim(),note:String(source.note||"").trim()};
  }
  function csvCell(value){return'"'+String(value==null?"":value).replace(/"/g,'""')+'"';}
  function toCsv(assets){return["title,source_url,creator,license,usage,checked_on,note"].concat((assets||[]).map(function(asset){return[asset.title,asset.sourceUrl,asset.creator,asset.license,asset.usage,asset.checkedOn,asset.note].map(csvCell).join(",");})).join("\r\n");}
  window.AfroTools=window.AfroTools||{};window.AfroTools.CreatorStockEngine={createAsset:createAsset,toCsv:toCsv};
}());
