# MoodApp – autonomní produktový plán

> Stav: aktivní pracovní plán. Aktualizováno: 2026-09-09.
> Cíl: posunout MoodApp z funkčního prototypu k přehlednému, bezpečnému a důvěryhodnému párovému produktu.

## 1. Výchozí audit před úpravami

### Ověřeno lokálně
- Větev `main` je synchronizovaná s `origin/main` na commitu `482822d`.
- `npm run lint` prochází.
- `npm run build` prochází; Vite sestaví produkční bundle.
- `package.json` nemá testovací script; automatizované regresní testy proto zatím nejsou součástí standardního příkazu.
- React entry point `src/App.jsx` má přibližně 4 484 řádků a drží velkou část stavu, datového načítání i UI v jednom souboru.
- Existují první extrahované komponenty pro media, primitiva a archiv momentů; modularizace je rozpracovaná.
- Tailwind v4 dark variant je explicitně nakonfigurovaný.

### Známé produktové/technické rizikové oblasti k ověření
- Dashboard musí jasně říct „co mám udělat teď“ místo směšování skóre, XP, aktivit a inspirace.
- Husté mobilní karty, filtry, fixed composer a bottom navigation vyžadují skutečnou kontrolu na 320/360/390/430 px.
- Stav aktivity (návrh → odeslání → potvrzení partnerem → XP) musí být viditelný přímo u akce.
- Privacy/blur/e2ee tvrzení musí odpovídat skutečnému modelu Storage, signed URL a klientského šifrování.
- Push subscription může zůstat navázaná na starý VAPID public key; je nutná obnova při nesouladu klíčů.
- Supabase SQL, Edge Functions, RLS, Storage policies a scheduler jsou samostatné deploymenty a musí být auditovány odděleně.
- Externí RedGIFs/Lovino integrace mohou selhat i při úspěšném frontendu; je nutné testovat reálné kontrakty.

## 2. Seznam zlepšení (minimálně 30)

### A. Rychlé opravy
1. Přidat standardní `test` script a minimální Vitest/JSDOM smoke testy.
2. Zobrazit jednotný offline/synchronizační status bez blokování celé aplikace.
3. Sjednotit texty chyb, retry CTA a bezpečné fallbacky.
4. Opravit všechny mobilní řádky s input + button (`min-w-0`, `shrink-0`, stacking).
5. Zlepšit prázdné stavy feedu, galerie, přání, chatů a výzev.
6. Přidat `aria-label`/tooltip k ikonovým akcím a sjednotit focus ring.
7. Přidat `aria-live` pro upload, synchronizaci, odeslání a chyby.
8. Zkontrolovat všechny dialogy: Escape, focus, návrat focusu, scroll lock.
9. Sjednotit názvy „Dnešní moment“, „status“ a „nálada“ v copy.
10. Přidat potvrzení před destruktivními akcemi a jasný undo/retry stav.
11. Opravit časová pásma a datumové hranice pro denní obsah.
12. Přidat bezpečné file input validace MIME, velikosti, délky a reset po chybě.

### B. Větší UX změny
13. Přepracovat první viewport dashboardu na kartu „Dnes pro vás dva“.
14. Oddělit primární další akci od dlouhodobého skóre a analytiky.
15. Přidat explicitní progress flow aktivity: navrženo, čeká na partnera, potvrzeno, odměna.
16. Sjednotit bottom navigation a zkrátit jej na hlavní produktové oblasti.
17. Změnit husté mobilní galerie na responzivní one-column fallback.
18. Přidat kompaktní action menu místo přeplněných toolbarů.
19. Zjednodušit onboarding a přidat vysvětlení párování/pozvánek.
20. Zlepšit párový status: kdo co vidí a kdo je na tahu.
21. Vytvořit konzistentní komponentu pro loading skeletony.
22. Vytvořit konzistentní komponentu pro error + retry.
23. Vytvořit konzistentní komponentu pro empty state s jedním doporučeným CTA.
24. Zpřehlednit privacy mode: globální režim vs. stav konkrétní položky.
25. Přidat detailní náhled media s keyboard/mobile close a správnou orientací.
26. Zlepšit chat composer: draft, disabled stav, odesílání, retry a safe-area padding.
27. Přidat dostupný filtr/search pro přání a výzvy bez ztráty kontextu.
28. Uvést XP jako motivaci/progress, nikoli jako objektivní hodnocení vztahu.

### C. Technické změny
29. Rozdělit `App.jsx` po stabilních seam: media, daily moments, dashboard, chat, wishes, settings.
30. Přidat čisté utility pro datumy, normalizaci, validaci médií a odvození stavu.
31. Přidat testy pro párové membership/ownership rozhodování na klientské úrovni.
32. Zkontrolovat a posílit RLS pro všechny párové tabulky a Storage cesty.
33. Přidat indexy/constraints tam, kde dotazy pracují s couple/user/status/date.
34. Zkontrolovat idempotenci SQL setupů a oddělit dokumentační SQL od migrací.
35. Přidat robustní VAPID subscription rotation při změně public key.
36. Ošetřit stale signed URL a řízený refresh media URL.
37. Přidat MIME-aware renderer pro image/video s fallbackem.
38. Oddělit provider search kontrakt od rendereru a přidat live fixture/contract test.
39. Zkontrolovat service worker lifecycle, update prompt a cache invalidaci.
40. Přidat lazy loading/media concurrency limity a cleanup object URL.
41. Přidat základní bundle/performance budget a měření klíčových renderů.
42. Validovat Edge Functions samostatně mimo frontend build.
43. Přidat CI workflow pouze s reálně dostupnými bezpečnými scopes.

### D. Strategické změny
44. Definovat produktovou metriku „next meaningful action“ místo agregovaného relationship score.
45. Zavést konzistentní informační architekturu Today / Connect / Explore / Archive / Settings.
46. Navrhnout transparentní consent/privacy model pro intimní media a partnera.
47. Zjednodušit reward economy tak, aby podporovala kontakt, ne tlak na výkon.
48. Přidat bezpečný account/device recovery plán pro E2EE passphrase.
49. Navrhnout dvouuživatelské E2E scénáře pro nejdůležitější párové toky.
50. Definovat deployment gates: frontend, Supabase migrations, functions, scheduler, push.

## 3. Průběžný stav práce

### Kolo 1 – audit → návrh → testovací základ → kontrola (hotovo)
- [x] Baseline audit repozitáře a oddělení lokálního/GitHub/live stavu.
- [x] `MoodApp_AGENT_PLAN.md` vytvořen před změnami.
- [x] Tři nezávislé read-only review streamy: UX/frontend, backend/security/data, PWA/media/integrace.
- [x] Přidán Vitest a `npm test` script.
- [x] Vytvořen `src/lib/productUtils.js` s testy pro datumy, normalizaci, měnu a bezpečnou chybu.
- [x] `App.jsx` používá extrahované datumové/search utility.
- [x] Po změně prošel lint, 5 testů a build.
- [x] Browser smoke ověřil fallback „Chybí Supabase konfigurace“ bez JS chyb; autentizovaný flow je bez lokálních secrets blokovaný.

### Kolo 2 – priorita (hotovo)
- [x] Zpřesnit push subscription rotation při změně VAPID konfigurace.
- [x] Přidat testovaný čistý predicate pro rotation.
- [ ] Sjednotit všechny user-facing error cesty; základní bezpečný formatter je připraven, plošná migrace je odložena kvůli rozsahu monolitu.
- [x] Přidat testy pro hlavní nové utility.
- [x] Provést druhý lint/test/build a diff kontrolu.

### Kolo 3 – produkční odolnost (hotovo)
- [x] Přidat globální React `AppErrorBoundary` s dostupným recovery stavem.
- [x] Ověřit produkční build a runtime fallback bez Supabase konfigurace.
- [x] Zopakovat lint, testy, build, audit závislostí a browser console check.

### Kolo 4 – další bezpečné zlepšení (rozpracováno)
- [ ] Rozdělit dashboard a hlavní panely z `App.jsx` po stabilních seam bez změny datového kontraktu.
- [ ] Přidat testy pro ownership/status/challenge state derivace.
- [ ] Provést screenshot review s autentizovanými daty, pokud bude dostupný bezpečný testovací účet.

### Release evidence
- [x] Commit `0ff9aed0fe934fe7607ea3ba74f972f1deb99f2c` vytvořen.
- [x] Push na `origin/main` ověřen stejným SHA.
- [x] Lokální změny jsou po commitu čisté; live Vercel/Supabase deployment není tímto commitem samostatně potvrzen.

### Sloučené auditní závěry
- UX: aplikace má dobrý základ primárních flow, ale `App.jsx` je příliš koncentrovaný; dashboard a husté mobilní surface vyžadují další produktovou hierarchii a skutečný auth browser test.
- Security/data: RLS/core schema není v repozitáři kompletně kanonizované; bezpečné SQL změny vyžadují live schema snapshot. Push scheduler/function/live delivery zůstává samostatný deployment gate.
- PWA/media: build a dependency audit jsou lokálně OK, ale signed URL, iOS push, provider media a two-user realtime nelze potvrdit bez autentizovaného/device testu.

## 3. Fáze a pořadí

1. **Audit:** baseline, paralelní UX/frontend, backend/security/data, PWA/media/integration review.
2. **Rychlé opravy:** test harness, state/error/empty/accessibility/mobile safety.
3. **Větší UX:** Today-first dashboard, action/state flows, mobile density, privacy clarity.
4. **Technické změny:** modularizace, utilities/tests, RLS/Storage/function contracts.
5. **Druhé zlepšení:** znovu projít screenshoty, konzoli, flows a opravit regresní nálezy.
6. **Strategie a delivery:** dokumentace, deployment checklist, commit/push, oddělené live gates.

## 4. Jak poznám, že je hotovo

- [ ] Je vyhodnoceno všech 50 kandidátních zlepšení; u každého je stav done/deferred/blocked s důvodem.
- [ ] Každá bezpečně proveditelná P0/P1 oprava má implementaci a regresní test.
- [ ] Lint, build a test script prochází po každém větším kole.
- [ ] Proveden browser smoke test a screenshot review na 320, 360, 390 a 430 px.
- [ ] Konzole je bez nových uncaught errors v testovaných tocích.
- [ ] Authenticated Supabase/RLS/two-user/push výsledky jsou označeny pouze jako ověřené, pokud skutečně proběhly.
- [ ] Live deploy je oddělen od lokálního kódu, GitHubu a Supabase deploymentu.
- [ ] Diff neobsahuje tokeny, secret hodnoty, debug dumpy ani nechtěné změny.

## 5. Kontrolní checklist

### Před změnou
- [x] `git status --short --branch`
- [x] package scripts, source tree, Supabase tree
- [x] baseline lint
- [x] baseline build
- [ ] baseline test command (chybí script)
- [ ] authenticated/live access matrix

### Po každém kole
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `git diff --check`
- [ ] inspect changed files and secrets scan
- [ ] browser/screenshot smoke test where relevant

### Před doručením
- [ ] audit report and 30+ improvement list retained here
- [ ] local clean/intentional diff
- [ ] commit SHA recorded
- [ ] remote branch SHA verified
- [ ] production/live blockers explicitly listed

## 6. Předpoklady

- Budu prioritizovat bezpečné změny v lokálním repozitáři a nebudu mazat produkční data.
- Supabase migrace, Edge Function deployment, scheduler a Vercel/live deploy jsou samostatné brány; bez explicitního potvrzení je nebudu aplikovat.
- Pokud autentizované browser testy nejsou dostupné, označím je jako blokované a nebudu simulovat úspěch.
- `origin/main` je požadovaný cílový branch, protože uživatel výslovně žádá pokračování v úpravách aplikace; před push ověřím diff a build.
