-- MiniOyun veritabanı kurulumu (Supabase > SQL Editor'e yapıştırıp "Run" deyin).
-- Tekrar çalıştırmak güvenlidir.

-- Oyuncu profili: takma ad ve avatar (liderlik tablosunda görünür)
create table if not exists public.profiller (
  id uuid primary key references auth.users on delete cascade,
  takma_ad text not null check (char_length(takma_ad) between 1 and 20),
  avatar text not null default '🙂' check (char_length(avatar) <= 8),
  guncelleme timestamptz not null default now()
);

-- Skorlar: her bitirilen oyun bir satır; gun dolu ise günlük meydan okuma sonucu
create table if not exists public.skorlar (
  id bigint generated always as identity primary key,
  kullanici uuid not null references auth.users on delete cascade,
  oyun text not null check (oyun ~ '^[a-z0-9-]{1,40}$'),
  seviye text not null default '' check (char_length(seviye) <= 20),
  skor integer not null check (skor between 0 and 100000000),
  kucuk_iyi boolean not null default false,
  gun date,
  olusturma timestamptz not null default now()
);
create index if not exists skorlar_tablo on public.skorlar (oyun, seviye, gun);
create index if not exists skorlar_kullanici on public.skorlar (kullanici, olusturma desc);

-- Cihazlar arası kayıt: tarayıcıdaki rekor, rozet, favori verisinin yedeği
create table if not exists public.kayitlar (
  id uuid primary key references auth.users on delete cascade,
  veri jsonb not null,
  guncelleme timestamptz not null default now(),
  check (pg_column_size(veri) < 200000)
);

alter table public.profiller enable row level security;
alter table public.skorlar enable row level security;
alter table public.kayitlar enable row level security;

drop policy if exists "profiller herkes okur" on public.profiller;
create policy "profiller herkes okur" on public.profiller for select using (true);
drop policy if exists "profil sahibi yazar" on public.profiller;
create policy "profil sahibi yazar" on public.profiller for insert with check (id = auth.uid());
drop policy if exists "profil sahibi gunceller" on public.profiller;
create policy "profil sahibi gunceller" on public.profiller for update using (id = auth.uid()) with check (id = auth.uid());

-- Skorlar doğrudan yazılamaz; yalnızca skor_gonder fonksiyonu yazar
drop policy if exists "skorlar herkes okur" on public.skorlar;
create policy "skorlar herkes okur" on public.skorlar for select using (true);

drop policy if exists "kayit sahibi" on public.kayitlar;
create policy "kayit sahibi" on public.kayitlar for all using (id = auth.uid()) with check (id = auth.uid());

-- Skor gönderme: oturum zorunlu, 3 saniyede bir, günlükte kişi başı gün başına tek sonuç.
-- Oyuncunun o tablodaki sırasını döner.
create or replace function public.skor_gonder(p_oyun text, p_seviye text, p_skor integer, p_kucuk_iyi boolean, p_gunluk boolean)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_gun date := case when p_gunluk then (now() at time zone 'Europe/Istanbul')::date end;
  v_benim integer;
begin
  if v_uid is null then raise exception 'oturum yok'; end if;
  if exists (select 1 from skorlar where kullanici = v_uid and olusturma > now() - interval '3 seconds') then
    raise exception 'cok hizli';
  end if;
  if v_gun is not null and exists (select 1 from skorlar where kullanici = v_uid and oyun = p_oyun and seviye = coalesce(p_seviye, '') and gun = v_gun) then
    null; -- günlükte ilk sonuç geçerli
  else
    insert into skorlar (kullanici, oyun, seviye, skor, kucuk_iyi, gun)
    values (v_uid, p_oyun, coalesce(p_seviye, ''), p_skor, coalesce(p_kucuk_iyi, false), v_gun);
  end if;
  select sira into v_benim from liderler(p_oyun, coalesce(p_seviye, ''), v_gun, 100000) where ben;
  return v_benim;
end $$;

-- Liderlik tablosu: kişi başı en iyi skor; gun null ise tüm zamanlar, seviye null ise tüm seviyeler
create or replace function public.liderler(p_oyun text, p_seviye text default '', p_gun date default null, p_limit integer default 20)
returns table (sira integer, takma_ad text, avatar text, skor integer, ben boolean)
language sql stable security definer set search_path = public as $$
  with s as (
    select kullanici, skor, kucuk_iyi from skorlar
    where oyun = p_oyun and (p_seviye is null or seviye = p_seviye)
      and (p_gun is null or gun = p_gun)
  ), yon as (select coalesce(bool_or(kucuk_iyi), false) as kucuk from s),
  en_iyi as (
    select kullanici, case when (select kucuk from yon) then min(skor) else max(skor) end as skor
    from s group by kullanici
  ), sirali as (
    select e.kullanici, e.skor,
      rank() over (order by case when (select kucuk from yon) then e.skor else -e.skor end)::integer as sira
    from en_iyi e
  )
  select r.sira, coalesce(p.takma_ad, 'Oyuncu'), coalesce(p.avatar, '🙂'), r.skor, coalesce(r.kullanici = auth.uid(), false)
  from sirali r left join profiller p on p.id = r.kullanici
  order by r.sira
  limit greatest(1, least(p_limit, 100000));
$$;

-- Hesap silme: oyuncunun hesabını, profilini, skorlarını ve kaydını kalıcı olarak siler
create or replace function public.hesap_sil()
returns void language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.skor_gonder(text, text, integer, boolean, boolean) from public, anon;
revoke execute on function public.hesap_sil() from public, anon;
grant execute on function public.skor_gonder(text, text, integer, boolean, boolean) to authenticated;
grant execute on function public.hesap_sil() to authenticated;
grant execute on function public.liderler(text, text, date, integer) to anon, authenticated;
