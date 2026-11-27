# Naira invoice transfer source review

Reviewed the complete English Naira-to-Words page against `b1be7d1cb6a870746304fd358c78e3bbcd46b9f5`. Its normalized SHA-256 is `6e64e2c452b34c1a36a655043714c6ee3e305465812fa9bae1d901e75285b3eb`. The invoice transfer controls and event listeners occupy a separate script after the formatter. The existing formatter assertions verified singular and plural currency units, rounding, overflow, and the trillion-scale limit.

At 390 px, the transfer dialog preserved the rounded amount for NGN, MWK and ZMW, respected the optional amount in words, and preserved the previous saved invoice on cancellation and transfer. Ordinary navigation without a converted amount reopened the prior draft. The French fixture retains its original inputs, output expectation and parser dependency fingerprint.
