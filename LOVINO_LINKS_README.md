# Odkazy Lovino.cz pro Kamasutru

Upraveno tak, aby aplikace už negenerovala neověřené URL automaticky pro každou polohu.

- Pro polohy, u kterých byla ověřena konkrétní stránka na Lovino.cz, se používá ručně udržovaná mapa `LOVINO_KAMASUTRA_URLS` v `src/App.jsx`.
- Například `Misionář` vede na `https://www.lovino.cz/polohy/misionarska-poloha`, ne na neexistující `/polohy/misionar`.
- Pokud přesná stránka na Lovino.cz není v ověřené mapě, tlačítko otevře obecnou stránku `https://www.lovino.cz/kamasutra`, aby uživatel nedostal nefunkční odkaz.
- Text tlačítka se podle toho mění na `Zobrazit polohu na Lovino.cz` nebo `Otevřít Kamasutru na Lovino.cz`.

Supabase úprava není potřeba.
