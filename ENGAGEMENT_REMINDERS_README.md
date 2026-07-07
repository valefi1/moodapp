# MoodSync scheduled reminders

Tahle verze přidává serverové push připomínky pro případy, kdy se v aplikaci nic neděje.

## Co se posílá

1. **Denní teploměr**
   - jednou denně pro každého uživatele,
   - pouze pokud si ten den neaktualizoval stav/teploměry,
   - vede na `/?tab=home`.

2. **Jemné 48h připomenutí neaktivity**
   - když uživatel cca 48 hodin neaktualizoval stav a nic neposlal,
   - vede do chatu.

3. **72h připomenutí tichého páru**
   - když pár cca 72 hodin nemá žádný post/chat,
   - vede do chatu.

Funkce neposílá víc připomínek stejného typu ve stejném období díky tabulce `push_notification_log`.

## Co nahrát do Supabase

### 1. SQL

V Supabase SQL Editoru spusť:

```sql
supabase/engagement_reminders_setup.sql
```

### 2. Edge Function

Aktualizuj/deployni:

```text
supabase/functions/mood-daily-reminder/index.ts
```

### 3. Secrets

Zkontroluj:

```text
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:tvuj@email.cz
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Volitelně:

```text
MOOD_REMINDER_SECRET
```

### 4. Schedule

V Supabase Dashboardu nastav plán pro `mood-daily-reminder`.

Doporučení: jednou denně večer, například okolo 20:00 Europe/Prague.

Pokud budeš funkci spouštět častěji, nevadí — SQL log brání duplicitám.

## Vercel/frontend

Frontend se kvůli této změně zásadně měnit nemusí, ale v ZIPu je aktualizovaná dokumentace a build.
