create index if not exists idx_backup_power_reports_contribution_id
  on public.backup_power_reports(contribution_id);

create index if not exists idx_clinic_cost_reports_contribution_id
  on public.clinic_cost_reports(contribution_id);

create index if not exists idx_fintech_fee_reports_contribution_id
  on public.fintech_fee_reports(contribution_id);

create index if not exists idx_lease_risk_reports_contribution_id
  on public.lease_risk_reports(contribution_id);

create index if not exists idx_market_basket_snapshots_contribution_id
  on public.market_basket_snapshots(contribution_id);

create index if not exists idx_market_basket_snapshots_template_id
  on public.market_basket_snapshots(template_id);

create index if not exists idx_pharmacy_price_reports_contribution_id
  on public.pharmacy_price_reports(contribution_id);

create index if not exists idx_remittance_quotes_contribution_id
  on public.remittance_quotes(contribution_id);

create index if not exists idx_rent_listings_contribution_id
  on public.rent_listings(contribution_id);

create index if not exists idx_salary_reports_contribution_id
  on public.salary_reports(contribution_id);

create index if not exists idx_school_fee_reports_contribution_id
  on public.school_fee_reports(contribution_id);

create index if not exists idx_transport_fares_contribution_id
  on public.transport_fares(contribution_id);

create index if not exists idx_wholesale_retail_reports_contribution_id
  on public.wholesale_retail_reports(contribution_id);

alter policy "Users can create buyer leads"
on public.data_buyer_leads
with check (consent = true and (submitted_by is null or (select auth.uid()) = submitted_by));

alter policy "Users can read own buyer leads"
on public.data_buyer_leads
using (submitted_by is not distinct from (select auth.uid()));
