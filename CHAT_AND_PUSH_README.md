# Chat a rychlé zprávy

Tahle verze přidává samostatnou obrazovku **Chat** v dolní navigaci.

## Co se změnilo

- Nová záložka `Chat` mimo Feed.
- Chat používá existující tabulku `posts` a typ záznamu `chat`, takže není nutná nová databázová tabulka.
- Zprávy se zobrazují jako bubliny: moje zprávy vpravo, partnerovy vlevo.
- Přidané rychlé reakce, například `Myslím na tebe`, `Potřebuju obejmout`, `Miluju tě`.
- Push upozornění na novou chat zprávu otevírá aplikaci s parametrem `?tab=chat`, takže po kliknutí na notifikaci aplikace skočí do chatu.

## Co je potřeba nahrát

Frontend nahraj na GitHub/Vercel celý.

Supabase databázová migrace není potřeba, protože chat používá existující tabulku `posts`.

## Doporučená Supabase úprava

V této verzi je upravená Edge Function:

`supabase/functions/send-push-notification/index.ts`

Pro chatové notifikace používá `urgency: high` a kratší TTL. To může pomoct s rychlejším doručením, ale i tak Web Push/PWA negarantuje okamžité doručení na 100 %.

Pokud chceš tuto část využít, nahraj/deployni i funkci `send-push-notification` v Supabase.

## Proč mohou push notifikace chodit se zpožděním

U PWA notifikací na Androidu a iOS je doručení závislé na push službě prohlížeče/systému, stavu baterie, síti, režimu úspory energie, pozadí aplikace a někdy i na cold startu Supabase Edge Function. Web Push se chová spolehlivě pro upozornění, ale není to garantovaný instantní chat kanál jako nativní aplikace přes Firebase Cloud Messaging nebo Apple Push Notification service.

Realtime chat v otevřené aplikaci by měl reagovat rychle, protože se obnovuje přes Supabase realtime změny v tabulce `posts`. Zpoždění se týká hlavně systémové push notifikace, když aplikace není aktivní.
