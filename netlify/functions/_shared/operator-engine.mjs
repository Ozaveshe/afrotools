export const PROJECT = 'zpclagtgczsygrgztlts';
export const SITE = '8aa543db-b4bd-4631-98f8-221440055c41';
export const STORE = 'operator-command-centre';
const text = value => typeof value === 'string' ? value.slice(0,180) : '';
const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const number = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
const fields = (row, shape) => Object.fromEntries(Object.entries(shape).map(([key,fn])=>[key,fn(row?.[key])]));
const rows = (value, shape, limit=150) => Array.isArray(value) ? value.slice(0,limit).map(row=>fields(row,shape)) : [];
const status = value => ['ok','unavailable','stale'].includes(value) ? value : 'unavailable';
const sha = value => /^[a-f0-9]{40}$/.test(value) ? value : null;
export function sanitizeEngine(value) {
  if(value?.schema_version!==1 || value.project_ref!==PROJECT || !date(value.collected_at)) throw new Error('Invalid operator summary');
  return {
    schema_version:1, project_ref:PROJECT, collected_at:date(value.collected_at),
    git:{status:status(value.git?.status),fetched_at:date(value.git?.fetched_at),base_sha:sha(value.git?.base_sha),
      rows:rows(value.git?.rows,{workspace:text,branch:text,head:sha,pending_commits:v=>Array.isArray(v)?v.slice(0,8).map(sha).filter(Boolean):[],last_commit:date,ahead:number,behind:number,dirty:number,untracked:number,status,stale:v=>v===true})},
    automations:{status:status(value.automations?.status),invalid_receipts:number(value.automations?.invalid_receipts),
      rows:rows(value.automations?.rows,{id:text,name:text,enabled:v=>v===true,schedule:text,disposition:text,receipt_at:date,commit:sha,integrated:v=>typeof v==='boolean'?v:null,review_area:text,dependencies:number,checks_passed:number,checks_failed:number,source_changes:number,stale:v=>v===true})},
    ci:{status:status(value.ci?.status),rows:rows(value.ci?.rows,{id:number,name:text,status:text,conclusion:text,branch:text,commit:sha,created_at:date},30)},
    pulls:{status:status(value.pulls?.status),rows:rows(value.pulls?.rows,{number:number,branch:text,draft:v=>v===true,updated_at:date},50)},
    runtime:{status:status(value.runtime?.status),checked_at:date(value.runtime?.checked_at),rows:rows(value.runtime?.rows,{scraper_id:text,latest_at:date,latest_status:text,runs_24h:number,failures_24h:number},80)}
  };
}
