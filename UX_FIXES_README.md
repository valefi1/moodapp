# MoodSync UX fixes - meters, photos, E2EE

## Změny v této verzi

### 1. Teploměry bez spamování notifikací
- Posuvník blízkosti a nadrženosti už neposílá push při každém drobném pohybu.
- Aplikace počká 1,8 s od poslední změny a odešle jen finální hodnotu.
- Text notifikace obsahuje výslednou hodnotu, např. 72 %.

### 2. Feed - Přidat fotku
- Tlačítko Přidat fotku ve feedu teď nahrává soubor přes stejnou funkci jako galerie.
- Fotka se uloží jako typ `photo`, otevře se Galerie a fotka se objeví i v galerii.
- Input se po uploadu resetuje, takže jde znovu vybrat i stejný soubor.

### 3. E2EE heslo
- Heslo se už neaktivuje po každém napsaném znaku.
- Uživatel ho zadá a potvrdí tlačítkem Aktivovat heslo.
- Výchozí režim zůstává bezpečný: heslo se drží jen do zavření aplikace.
- Nově je volitelná možnost Zapamatovat na tomto zařízení. Ta ukládá heslo lokálně do prohlížeče/PWA, takže je pohodlnější, ale méně bezpečná při ztrátě telefonu.

### 4. Kamasutra fotky
- Fotku k poloze jde přidat i bez předchozího ručního označení polohy jako splněné.
- Nahrání fotky polohu automaticky označí jako completed.
- File input se resetuje, takže lze znovu vybrat stejný soubor.

## Supabase
Tahle verze nepřidává novou tabulku ani nové sloupce. Pokud už běží E2EE media setup, není potřeba žádná nová SQL migrace.

Pokud fotky stále padají na databázové chybě typu `column encrypted does not exist`, spusť v Supabase SQL Editoru:

```sql
-- soubor v projektu:
-- supabase/e2ee_media_setup.sql
```

Pokud padají na storage chybě, zkontroluj bucket `couple-media` a jeho policy podle původního E2EE setupu.

## Build
Ověřeno přes:

```bash
npm run build
```
