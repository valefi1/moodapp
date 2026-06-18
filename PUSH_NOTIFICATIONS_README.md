# MoodSync push notifikace - Android + iOS PWA

Tahle verze opravuje registraci zařízení pro Web Push v PWA.

## Co se změnilo

- Každé zařízení má vlastní `endpoint`, takže Android a iPhone se navzájem nepřepisují.
- Starý unikátní constraint `unique(user_id)` je odstraněný SQL migrací.
- Registrace service workeru používá `updateViaCache: 'none'`, aby se na mobilech rychleji propsal nový `/sw.js`.
- Testovací tlačítko nejdřív ukáže lokální notifikaci na aktuálním zařízení a potom zkusí reálný push partnerovi.
- Edge Function vrací `sentTo`, `delivered` a `failed`, takže v aplikaci uvidíš, jestli server skutečně našel partnerova zařízení.
- Neplatné push endpointy se při chybě 404/410 mažou z databáze.

## Nutné kroky po nasazení

1. V Supabase SQL editoru spusť celý soubor:

   `supabase/push_notifications_setup.sql`

2. V Supabase Edge Functions deployni funkce:

   ```bash
   supabase functions deploy send-push-notification
   supabase functions deploy mood-daily-reminder
   ```

3. V Supabase nastav secrets pro Edge Functions:

   ```bash
   supabase secrets set VAPID_PUBLIC_KEY="..."
   supabase secrets set VAPID_PRIVATE_KEY="..."
   supabase secrets set VAPID_SUBJECT="mailto:tvoje@email.cz"
   ```

4. Stejný public key nastav ve Vercelu jako:

   `VITE_VAPID_PUBLIC_KEY`

5. Redeployni frontend.

## Test na telefonech

### Android

1. Otevři nasazenou HTTPS URL v Chrome.
2. Přidej aplikaci na plochu nebo ji otevři normálně v Chrome.
3. V aplikaci klepni na `Notif` a povol oznámení.
4. Klepni na `Test`. Měla by přijít lokální notifikace na aktuálním telefonu.
5. Druhý partner musí udělat totéž na svém zařízení, aby mu chodily partnerské push notifikace.

### iPhone / iOS

1. Otevři aplikaci v Safari.
2. Sdílet -> Přidat na plochu.
3. Zavři Safari a spusť aplikaci z nové ikony na ploše.
4. Až potom klepni na `Notif` a povol oznámení.
5. Klepni na `Test`.

Na iOS web push funguje jen pro PWA spuštěnou z ikony na ploše, ne z běžného tabu v Safari.

## Když test neprojde

- Pokud lokální test nejde, problém je v oprávnění telefonu / PWA instalaci / service workeru.
- Pokud lokální test jde, ale partnerovi se odešle `0/0`, partner ještě nemá uloženou subscription v `push_subscriptions`.
- Pokud je `0/1`, koukni do Supabase Edge Function logs. Nejčastější příčina je nesoulad `VITE_VAPID_PUBLIC_KEY` ve frontendu a `VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY` v Supabase secrets.
