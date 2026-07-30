(function(root,factory){'use strict';var data=factory();if(typeof module==='object'&&module.exports)module.exports=data;if(root)root.CROP_YIELD_TOOL_DATA=data;}(typeof window!=='undefined'?window:globalThis,function(){return {
  "schemaVersion": 1,
  "crops": {
    "maize": {
      "label": "Maize",
      "yieldHint": "Smallholder: 1–2 t/ha | Improved: 3–5 t/ha",
      "defaultYield": 2.5
    },
    "cassava": {
      "label": "Cassava",
      "yieldHint": "Smallholder: 8–12 t/ha | Improved: 20–35 t/ha",
      "defaultYield": 12
    },
    "rice": {
      "label": "Rice (Paddy)",
      "yieldHint": "Smallholder: 1.5–2.5 t/ha | Improved: 4–6 t/ha",
      "defaultYield": 2.5
    },
    "yam": {
      "label": "Yam",
      "yieldHint": "Smallholder: 8–12 t/ha | Improved: 15–25 t/ha",
      "defaultYield": 10
    },
    "sorghum": {
      "label": "Sorghum",
      "yieldHint": "Smallholder: 0.8–1.5 t/ha | Improved: 3–5 t/ha",
      "defaultYield": 1.5
    },
    "soya": {
      "label": "Soya Bean",
      "yieldHint": "Smallholder: 0.8–1.2 t/ha | Improved: 2–3.5 t/ha",
      "defaultYield": 1.2
    },
    "groundnut": {
      "label": "Groundnut",
      "yieldHint": "Smallholder: 0.7–1.2 t/ha | Improved: 2–3.5 t/ha",
      "defaultYield": 1
    },
    "cocoa": {
      "label": "Cocoa",
      "yieldHint": "Smallholder: 0.3–0.5 t/ha | Improved: 0.8–1.5 t/ha",
      "defaultYield": 0.5
    },
    "custom": {
      "label": "Custom",
      "yieldHint": "Enter your expected yield per hectare",
      "defaultYield": ""
    }
  },
  "symbols": {
    "NGN": "₦",
    "KES": "KSh ",
    "GHS": "GH₵",
    "TZS": "TSh ",
    "UGX": "USh ",
    "ETB": "Br ",
    "ZAR": "R ",
    "XOF": "CFA ",
    "USD": "$"
  },
  "presets": [
    {
      "label": "Maize NG",
      "crop": "maize",
      "yieldPerHa": 2.5,
      "price": 150000
    },
    {
      "label": "Cassava NG",
      "crop": "cassava",
      "yieldPerHa": 12,
      "price": 45000
    },
    {
      "label": "Rice NG",
      "crop": "rice",
      "yieldPerHa": 2.5,
      "price": 400000
    },
    {
      "label": "Yam NG",
      "crop": "yam",
      "yieldPerHa": 10,
      "price": 150000
    },
    {
      "label": "Cocoa GH",
      "crop": "cocoa",
      "yieldPerHa": 0.5,
      "price": 8000000
    },
    {
      "label": "Maize KE",
      "crop": "maize",
      "yieldPerHa": 3,
      "price": 35000
    }
  ]
};}));
