create or replace function public.reset_sweet_potato_trial_data(p_confirmation text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted_count integer;
begin
  if p_confirmation <> 'INITIALIZE_TRIAL_ORDERS' then
    raise exception 'invalid_reset_confirmation';
  end if;

  lock table public.sweet_potato_orders in access exclusive mode;
  lock table public.sweet_potato_inventory in access exclusive mode;

  select count(*)::integer into v_deleted_count
  from public.sweet_potato_orders;

  delete from public.sweet_potato_orders;

  update public.sweet_potato_inventory
  set reserved_boxes = 0,
      updated_at = now();

  return v_deleted_count;
end;
$$;

revoke all on function public.reset_sweet_potato_trial_data(text) from public, anon, authenticated;
grant execute on function public.reset_sweet_potato_trial_data(text) to service_role;

comment on function public.reset_sweet_potato_trial_data(text) is
  '관리자 시험 주문 전체 삭제 및 예약 수량 초기화. 총 판매 수량과 가격·비용 설정은 보존한다.';
