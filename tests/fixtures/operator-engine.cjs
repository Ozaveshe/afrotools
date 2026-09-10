module.exports=()=>({schema_version:1,project_ref:'zpclagtgczsygrgztlts',collected_at:new Date().toISOString(),
  git:{status:'ok',fetched_at:new Date().toISOString(),base_sha:'a'.repeat(40),rows:[
    {branch:'codex/checkout-refresh',head:'b'.repeat(40),last_commit:new Date().toISOString(),ahead:3,behind:0,dirty:2,untracked:1,status:'ok',stale:false},
    {branch:'codex/older-workspace',head:'c'.repeat(40),last_commit:'2026-01-01T00:00:00Z',ahead:0,behind:21,dirty:0,untracked:0,status:'ok',stale:true}]},
  automations:{status:'ok',invalid_receipts:0,rows:[
    {id:'content-batch',name:'Morning content batch',enabled:true,disposition:'ready',receipt_at:new Date().toISOString(),commit:'b'.repeat(40),checks_passed:4,checks_failed:0,source_changes:2},
    {id:'source-watch',name:'Source freshness watch',enabled:true,disposition:'blocked',receipt_at:new Date().toISOString(),checks_passed:1,checks_failed:1,source_changes:0},
    {id:'health-check',name:'Daily health check',enabled:true,disposition:'no_change',receipt_at:new Date().toISOString(),checks_passed:8,checks_failed:0,source_changes:0}]},
  ci:{status:'ok',rows:[{id:123,name:'CI',status:'completed',conclusion:'success',branch:'main',commit:'a'.repeat(40),created_at:new Date().toISOString()}]},
  pulls:{status:'ok',rows:[{number:42,branch:'codex/checkout-refresh',draft:true,updated_at:new Date().toISOString()}]},
  runtime:{status:'ok',checked_at:new Date().toISOString(),rows:[{scraper_id:'fuel-prices',latest_at:new Date().toISOString(),latest_status:'ok',runs_24h:4,failures_24h:0}]}});
