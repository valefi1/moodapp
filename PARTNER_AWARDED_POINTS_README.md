# Partner-awarded points update

Tahle verze mění logiku bodů ve výzvách a v denním úkolu:

- denní úkol je už jen jeden jednoduchý rituál,
- člověk si nemůže přidat XP sám sobě,
- v Partner dne klikáš na `Udělit partnerovi XP`,
- v challenges dostane body ten, kdo byl vyzván,
- body u aktivní challenge potvrzuje partner, který výzvu zadal,
- do databáze se ukládá, kdo body udělil (`awarded_by` / `completed_confirmed_by`).

## Co nahrát na Git/Vercel

Nahraj celý projekt z tohoto ZIPu na GitHub a nech Vercel udělat nový deploy.

```bash
git add .
git commit -m "Require partner approval for challenge XP"
git push
```

## Co spustit v Supabase

V Supabase Dashboardu otevři SQL Editor a spusť:

```text
supabase/partner_awarded_points_setup.sql
```

Tento SQL soubor přidá nové sloupce a upraví RLS policies pro `partner_day_completions`, aby XP u denního úkolu mohl udělit jen druhý partner, ne sám sobě.

Pokud jsi ještě nikdy nespouštěl předchozí challenge setup, spusť také:

```text
supabase/challenges_2_setup.sql
```

## Jak to otestovat

1. Přihlas se na zařízení A a zařízení B jako dva různí partneři.
2. Na zařízení A otevři Home a klikni u Partner dne na `Udělit partnerovi +10 XP`.
3. Na zařízení B by se mělo zobrazit, že partner udělil XP.
4. V Challenges vytvoř nebo vyber výzvu a z A vyzvi B.
5. Na B se zobrazí, že výzvu má splnit, ale nemůže si přidat body sám.
6. Na A se u aktivní výzvy zobrazí tlačítko `Udělit partnerovi XP`.
