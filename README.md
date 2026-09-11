# MoodSync – dokumentace projektu

MoodSync je párová PWA aplikace pro rychlou komunikaci, nálady/teploměry, soukromou galerii, přáníčka, challenges, Kamasutra sekci a push notifikace.

Tento soubor sjednocuje dřívější samostatné README soubory. Pro běžný deploy nahraj celý projekt na GitHub/Vercel a proveď jen ty Supabase kroky, které se týkají funkcí, které ještě nemáš v databázi nasazené.

## Rychlý deploy

```bash
git add .
git commit -m "Update MoodSync"
git push
```

Po změně environment variables ve Vercelu vždy spusť nový redeploy.

## Build

```bash
npm install
npm run build
```

## Vercel environment variables

Frontend potřebuje hlavně:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_VAPID_PUBLIC_KEY=...
```

`VITE_VAPID_PUBLIC_KEY` musí být stejný jako `VAPID_PUBLIC_KEY` v Supabase secrets.

## Supabase secrets pro Edge Functions

V Supabase nastav:

```text
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:tvoje@email.cz
SUPABASE_SERVICE_ROLE_KEY=...
MOOD_REMINDER_SECRET=...
```

`MOOD_REMINDER_SECRET` je povinný. Naplánované volání musí stejnou hodnotu poslat v hlavičce `x-cron-secret`; bez ní funkce požadavek odmítne. `SUPABASE_ANON_KEY` a `SUPABASE_URL` poskytuje hostované prostředí Supabase automaticky.

Pozor: `VAPID_SUBJECT` musí být URL, typicky `mailto:...`, ne jen samotný e-mail.

## Kompletní databázový setup

Pokud chceš aplikaci nastavit jedním spuštěním v Supabase SQL Editoru, použij:

```sql
supabase/complete_setup.sql
```

Soubor v bezpečném pořadí spojuje databázové/storage migrace z jednotlivých setup souborů. Je navržený k opakovanému spuštění a nemaže existující data. Edge Functions, jejich secrets a scheduler se nasazují samostatně podle sekce níže.

## Supabase SQL soubory

Spouštěj je v Supabase Dashboardu přes **SQL Editor**.

### Push notifikace

```sql
supabase/push_notifications_setup.sql
```

Opravuje ukládání push zařízení tak, aby měl každý telefon vlastní endpoint a Android/iOS se navzájem nepřepisovaly.

### Partner-awarded points

```sql
supabase/partner_awarded_points_setup.sql
```

Zajišťuje, že body v denním úkolu a challenges nepřiděluje člověk sám sobě, ale partner.

Pokud jsi ještě nikdy nespouštěl challenge setup, spusť také:

```sql
supabase/challenges_2_setup.sql
```

### E2EE media metadata

```sql
supabase/e2ee_media_setup.sql
```

Přidává metadata pro šifrované fotky ve Feed/Gallery/Kamasutra a profilovou fotku páru.

### RedGIF zprávy

V Supabase SQL Editoru spusť:

```sql
supabase/redgifs_setup.sql
```

Soubor přidá do `public.posts` nullable metadata externího GIFu včetně oficiálního RedGIFs embed URL. Vyhledávání nejdřív používá thumbnail/poster a při nedostupnosti přímého média bezpečně přepne na oficiální `redgifs.com/ifr/...` embed; odkaz na zdroj zůstává u náhledu i odeslané zprávy. Neobsahuje žádné přihlašovací údaje. Načtení externího náhledu, videa nebo embedu ale navazuje spojení prohlížeče se službou RedGIFs, na které se vztahují její vlastní podmínky a zásady soukromí.

### Storage pro soukromá média

Před zapnutím galerie nebo Dnešního momentu spusť také:

```sql
supabase/storage_couple_media_setup.sql
```

Migrace vytvoří nebo ponechá bucket `couple-media` jako privátní a nastaví Storage policies podle prvního segmentu cesty `couple_id`. Každý člen páru může pracovat pouze s objekty vlastního páru. Ověř před spuštěním, že žádná starší politika bucketu neumožňuje veřejný přístup.

### Dnešní moment

V Supabase SQL Editoru spusť:

```sql
supabase/daily_moments_setup.sql
```

Soubor vytvoří nebo zpětně kompatibilně rozšíří tabulky pro denní fotografie či krátká videa a partnerská hodnocení včetně indexů a RLS pravidel. Staré řádky ve `video_path` zůstávají funkční a obecná media metadata se při migraci doplní. Funkce používá existující privátní bucket `couple-media`; nový Edge Function ani změna `supabase/config.toml` nejsou potřeba.

Fotka může mít nejvýše 15 MB; video nejvýše 25 MB a 30 sekund. Nové uploady Dnešního momentu se před uložením klientsky zašifrují stejným E2EE heslem jako galerie a jako odkaz na stejný ciphertext se zapíší také do galerie — nevzniká druhá kopie souboru. Storage zůstává privátní a aplikace používá pouze krátkodobé podepsané odkazy. Starší momenty vytvořené před touto změnou se automaticky nepřešifrují; ty je potřeba případně smazat a nahrát znovu.

### Scheduled engagement reminders

```sql
supabase/engagement_reminders_setup.sql
```

Přidává log poslaných připomínek, aby cron neposílal stejné připomínky opakovaně. Scheduler `mood-daily-reminder` nyní posílá také denní připomínku Dnešního momentu, pokud uživatel ještě neposlal dnešní fotku ani video.

### Kamasutra upgrade

```sql
supabase/kamasutra_upgrade_setup.sql
```

Přidává synchronizovaný stav u poloh:

```text
Chci zkusit
Oblíbené
Ne pro nás
Vyzkoušeno
```

## Edge Functions

### redgifs-search

Po aplikování `supabase/redgifs_setup.sql` nasaď funkci:

```bash
supabase functions deploy redgifs-search
```

Funkce vyžaduje platný Supabase JWT a ověřuje členství v páru. Do prohlížeče posílá jen sanitizované údaje výsledků; embed URL přijímá pouze z `redgifs.com` nebo `www.redgifs.com`. Dočasný RedGIFs token i `SUPABASE_SERVICE_ROLE_KEY` zůstávají pouze na serveru. RedGIFs přihlašovací údaje se nenastavují ani nevkládají do `VITE_*` proměnných.

### send-push-notification

Soubor:

```text
supabase/functions/send-push-notification/index.ts
```

Používá se pro push notifikace partnerovi. U chatových notifikací používá vyšší urgency a kratší TTL. Funkce ověřuje JWT přihlášeného uživatele, členství v páru a nepřijímá identitu odesílatele ani cílovou URL pouze na základě dat z prohlížeče.

Deploy přes Supabase Dashboard:

1. Edge Functions
2. `send-push-notification`
3. Code editor
4. vložit aktuální `index.ts`
5. Deploy

### mood-daily-reminder

Soubor:

```text
supabase/functions/mood-daily-reminder/index.ts
```

Používá se pro plánované připomínky:

- denní teploměr,
- 48h jemné připomenutí neaktivity,
- 72h připomenutí tichého páru.

Doporučený schedule v Supabase Cron:

```text
30 8 * * *
```

Požadavek musí být `POST` a obsahovat hlavičku:

```text
x-cron-secret: hodnota_MOOD_REMINDER_SECRET
```

Toto je 10:30 Europe/Prague během letního času (CEST). V zimě je potřeba změnit cron na `30 9 * * *`, protože Supabase Cron běží typicky v UTC. Pokud tvůj Supabase scheduler podporuje časové pásmo, nastav přímo `Europe/Prague` a 10:30.

## Push notifikace na telefonech

### Android

1. Otevři HTTPS adresu aplikace v Chrome.
2. Přidej aplikaci na plochu nebo ji používej v Chrome.
3. V aplikaci klikni na `Notif`.
4. Povol oznámení.
5. Klikni na `Test`.

### iPhone / iOS

1. Otevři aplikaci v Safari.
2. Sdílet → Přidat na plochu.
3. Zavři Safari.
4. Spusť aplikaci z ikony na ploše.
5. Až potom klikni na `Notif` a povol oznámení.

Na iOS Web Push funguje jen pro PWA spuštěnou z ikony na ploše, ne z běžného tabu v Safari.

## Proč mohou notifikace chodit se zpožděním

PWA/Web Push negarantuje okamžité doručení jako nativní aplikace. Zpoždění může způsobit:

- úspora baterie v iOS/Androidu,
- slabá síť,
- aplikace dlouho neběžela,
- push služba prohlížeče/systému,
- cold start Supabase Edge Function,
- omezení PWA na iOS.

Realtime chat v otevřené aplikaci by měl být rychlý. Zpoždění se týká hlavně systémové notifikace, když aplikace není aktivní.

## Chat

Chat je samostatná záložka v dolní navigaci. Používá existující tabulku `posts` a typ `chat`, takže nepotřebuje vlastní tabulku.

Aktuální chování:

- zprávy jsou v bublinách,
- nejnovější zprávy jsou dole,
- po otevření chatu se scrolluje na poslední zprávu,
- pole pro psaní je trvale dole jako v běžných messengerech,
- rychlé zprávy jsou nahoře jako horizontální nabídka,
- kliknutí na push notifikaci chatu otevře `?tab=chat`.

## Feed, galerie a E2EE fotky

Fotky se bez aktivního E2EE hesla nenahrávají. Aplikace zobrazí viditelnou hlášku a nabídne přechod do profilu.

E2EE heslo:

- výchozí režim: drží se jen do zavření aplikace,
- volitelně: `Zapamatovat na tomto zařízení`, pohodlnější, ale méně bezpečné při ztrátě telefonu,
- heslo se po napsání samo neaktivuje, je potřeba potvrdit tlačítkem.

Fotky se týkají:

- Feed/Gallery fotek,
- Kamasutra fotek,
- profilové fotky páru.

## Teploměry bez spamování

Posuvníky blízkosti a nadrženosti neposílají push při každém pohybu. Aplikace počká přibližně 1,8 sekundy od poslední změny a odešle jen finální hodnotu.

## Přáníčka / Wishlist

Wishlist je přepracovaný na přáníčka s kategoriemi:

- Chci zažít,
- Chci dostat,
- Chci vyzkoušet,
- Chci, abys věděl/a.

Kvůli kompatibilitě se kategorie ukládá přímo do textu přání, například:

```text
Chci zažít: společný wellness večer
```

Dlouhé texty se zalamují, aby na telefonu nezmizelo tlačítko splnit.

## Denní status a rituál

Na hlavní obrazovce je:

- rychlý denní status,
- večerní rituál „Dnes pro nás“,
- partner-awarded denní úkol.

Status a rituál se ukládají do feedu a posílají push partnerovi.

## Kamasutra

Kamasutra sekce obsahuje:

- vyhledávání podle názvu, typu, obtížnosti a popisu,
- filtry podle typu a obtížnosti,
- možnost pouze orální,
- ověřené odkazy na Lovino.cz,
- fallback na `https://www.lovino.cz/kamasutra`, pokud přesná stránka není ověřená,
- fotku k poloze chráněnou E2EE,
- stav `Chci zkusit`, `Oblíbené`, `Ne pro nás`, `Vyzkoušeno`.

Ověřené Lovino odkazy se udržují v `LOVINO_KAMASUTRA_URLS` v `src/App.jsx`. Například `Misionář` vede na:

```text
https://www.lovino.cz/polohy/misionarska-poloha
```

## Nejčastější problémy

### `Vapid subject is not a valid URL`

V Supabase secrets oprav:

```text
VAPID_SUBJECT=mailto:tvoje@email.cz
```

### Lokální test funguje, ale partnerovi push selže

Zkontroluj:

- Supabase Edge Function logs,
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`,
- stejný `VITE_VAPID_PUBLIC_KEY` ve Vercelu,
- tabulku `push_subscriptions`,
- jestli partner zapnul notifikace na svém zařízení.

### Fotky padají na sloupcích `encrypted`, `encryption_iv`, `mime_type`

Spusť:

```sql
supabase/e2ee_media_setup.sql
```

### Kamasutra preference padají na sloupcích `desire_status` nebo `favorite`

Spusť:

```sql
supabase/kamasutra_upgrade_setup.sql
```

## Poznámka k dokumentaci

Dřívější soubory jako `PUSH_NOTIFICATIONS_README.md`, `UX_FIXES_README.md`, `CHAT_AND_PUSH_README.md` apod. byly sloučeny sem do jednoho `README.md`.
