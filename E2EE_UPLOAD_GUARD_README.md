# E2EE upload guard UX fix

Tato verze zpřehledňuje chování fotkových uploadů bez aktivního E2EE hesla.

## Co se změnilo

- Pokud není aktivní E2EE heslo, aplikace už se nechová tiše.
- Ve Feed, Gallery a Kamasutra se zobrazí jasný stav, že fotky jsou zamčené.
- Tlačítka pro nahrání fotky se bez hesla změní na akci pro nastavení E2EE hesla.
- Při pokusu o upload bez hesla se zobrazí výrazný banner s vysvětlením a tlačítkem do profilu.
- Upload profilové fotky páru, galerie/feed fotek i Kamasutra fotek dál vyžaduje E2EE heslo.

## Supabase

Není potřeba žádná nová SQL migrace ani Edge Function změna.

Pokud by upload po zadání hesla padal na chybě sloupce `encrypted`, `encryption_iv` nebo `mime_type`, spusť v Supabase SQL Editoru soubor:

```sql
supabase/e2ee_media_setup.sql
```

## Test

1. Otevři aplikaci bez aktivovaného E2EE hesla.
2. Přejdi do Feed, Gallery nebo Kamasutra.
3. Zkus přidat fotku.
4. Aplikace má ukázat viditelnou hlášku a nabídnout přechod do profilu.
5. V profilu nastav E2EE heslo.
6. Zkus nahrát fotku znovu.
