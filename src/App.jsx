import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  AlertCircle,
  BatteryLow,
  CloudRain,
  Frown,
  ZapOff,
  Award,
  Bell,
  Clock,
  Copy,
  Flame,
  Gift,
  Heart,
  Image,
  Lock,
  LogOut,
  MessageCircle,
  Moon,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Target,
  User,
  Users,
  Wand2,
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const LOCAL_KEY = 'moodsync-ui-v2';
const STORAGE_BUCKET = 'couple-media';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const ENC_KEY_SESSION = 'moodsync-e2ee-passphrase';

const moods = [
  { id: 'love', icon: Heart, label: 'Zamilovaný/á', color: 'from-pink-400 to-rose-500', tone: 'positive' },
  { id: 'calm', icon: Sparkles, label: 'V pohodě', color: 'from-sky-300 to-blue-400', tone: 'positive' },
  { id: 'hug', icon: Heart, label: 'Potřebuju obejmout', color: 'from-violet-300 to-purple-500', tone: 'soft' },
  { id: 'flirt', icon: Flame, label: 'Flirt mood', color: 'from-fuchsia-400 to-pink-600', tone: 'spicy' },
  { id: 'hot', icon: Flame, label: 'Mega nadržený/á', color: 'from-orange-400 to-red-500', tone: 'spicy' },
  { id: 'close', icon: Users, label: 'Chci blízkost', color: 'from-emerald-300 to-teal-500', tone: 'soft' },
  { id: 'sad', icon: CloudRain, label: 'Smutný/á', color: 'from-blue-400 to-slate-600', tone: 'negative' },
  { id: 'tired', icon: BatteryLow, label: 'Unavený/á', color: 'from-amber-300 to-orange-500', tone: 'negative' },
  { id: 'drained', icon: ZapOff, label: 'Vyčerpaný/á', color: 'from-slate-400 to-gray-700', tone: 'negative' },
  { id: 'angry', icon: Frown, label: 'Naštvaný/á', color: 'from-red-500 to-orange-700', tone: 'negative' },
];

function getMoodByLabel(label) {
  return moods.find((mood) => mood.label === label) || moods[0];
}

function isStatusFresh(status) {
  if (!status?.updated_at) return false;
  return Date.now() - new Date(status.updated_at).getTime() < 24 * 60 * 60 * 1000;
}

const photoCategories = [
  { id: 'all', label: 'Všechny' },
  { id: 'boobs', label: 'Boobs' },
  { id: 'ass', label: 'Ass' },
  { id: 'dick', label: 'Dick' },
  { id: 'couple', label: 'Couple' },
  { id: 'lingerie', label: 'Lingerie' },
  { id: 'mirror', label: 'Mirror' },
  { id: 'romantic', label: 'Romantic' },
];

const challengeCategories = [
  { id: 'all', label: 'Vše', color: 'from-pink-400 to-rose-500' },
  { id: 'romantic', label: 'Romantické', color: 'from-pink-400 to-rose-500' },
  { id: 'flirty', label: 'Flirt', color: 'from-fuchsia-400 to-pink-600' },
  { id: 'spicy', label: 'Spicy', color: 'from-orange-400 to-red-500' },
  { id: 'deep', label: 'Deep talk', color: 'from-violet-400 to-purple-600' },
  { id: 'fun', label: 'Fun', color: 'from-sky-400 to-blue-500' },
];

const rewardTiers = [
  { level: 1, title: 'Nový pár', minXp: 0, reward: 'Odemčeno: denní check-in' },
  { level: 2, title: 'Jiskra', minXp: 50, reward: 'Odemčeno: Flirt badge' },
  { level: 3, title: 'Chemie', minXp: 120, reward: 'Odemčeno: After Dark výzvy' },
  { level: 4, title: 'Magnetismus', minXp: 220, reward: 'Odemčeno: Soukromé rituály' },
  { level: 5, title: 'Power Couple', minXp: 360, reward: 'Odemčeno: Premium intimacy vault' },
];

const starterChallenges = [
  {
    title: 'Pošli partnerovi tři věci, které na něm dnes miluješ.',
    category: 'romantic',
    difficulty: 'Easy',
    xp: 20,
  },
  {
    title: 'Pošli tajemnou selfie jen pro partnera nebo partnerku.',
    category: 'flirty',
    difficulty: 'Easy',
    xp: 8,
  },
  {
    title: 'Mirror tease v bezpečném soukromém prostředí.',
    category: 'spicy',
    difficulty: 'Medium',
    xp: 15,
  },
  {
    title: 'Dejte si večer otázku: Co ti dnes udělalo radost?',
    category: 'deep',
    difficulty: 'Easy',
    xp: 12,
  },
  {
    title: 'Naplánujte spontánní mini rande ještě dnes.',
    category: 'romantic',
    difficulty: 'Medium',
    xp: 18,
  },
  {
    title: 'Pošli partnerovi hlasovou zprávu s něčím sexy.',
    category: 'flirty',
    difficulty: 'Medium',
    xp: 16,
  },
  {
    title: '30 minut bez mobilu jen jeden pro druhého.',
    category: 'deep',
    difficulty: 'Easy',
    xp: 20,
  },
  {
    title: 'Vyzkoušejte novou polohu z Kamasutry.',
    category: 'spicy',
    difficulty: 'Hard',
    xp: 35,
  },
  {
    title: 'Řekněte si navzájem jednu tajnou fantazii.',
    category: 'deep',
    difficulty: 'Hard',
    xp: 30,
  },
  {
    title: 'Připrav partnerovi překvapení bez vysvětlení.',
    category: 'fun',
    difficulty: 'Medium',
    xp: 18,
  },
  {
    title: 'Polibek minimálně na jednu minutu bez přerušení.',
    category: 'romantic',
    difficulty: 'Easy',
    xp: 14,
  },
  {
    title: 'Večer jen ve spodním prádle nebo pyžamu partnera.',
    category: 'spicy',
    difficulty: 'Medium',
    xp: 24,
  },
  {
    title: 'Pošli partnerovi fotku detailu těla bez obličeje.',
    category: 'flirty',
    difficulty: 'Medium',
    xp: 14,
  },
  {
    title: 'Udělejte si společnou koupel nebo sprchu.',
    category: 'romantic',
    difficulty: 'Medium',
    xp: 22,
  },
  {
    title: 'Řekni partnerovi, co tě na něm nejvíc přitahuje.',
    category: 'deep',
    difficulty: 'Easy',
    xp: 12,
  },
  {
    title: 'Napiš partnerovi krátký dirty text během dne.',
    category: 'flirty',
    difficulty: 'Easy',
    xp: 10,
  },
  {
    title: 'Společný filmový večer bez dalších povinností.',
    category: 'fun',
    difficulty: 'Easy',
    xp: 10,
  },
  {
    title: 'Masáž zad alespoň 15 minut.',
    category: 'romantic',
    difficulty: 'Easy',
    xp: 16,
  },
  {
    title: 'Vyberte si společně další challenge do zítřka.',
    category: 'fun',
    difficulty: 'Easy',
    xp: 8,
  },
  {
    title: 'Večer bez světla jen při svíčkách.',
    category: 'spicy',
    difficulty: 'Medium',
    xp: 20,
  },
];

function normalizeStarterChallenge(challenge, coupleId, index = 0, userId = null) {
  return {
    couple_id: coupleId,
    title: challenge.title,
    category: challenge.category,
    difficulty: challenge.difficulty,
    xp: challenge.xp,
    assigned_to: index % 2 === 0 ? userId : null,
    accepted: false,
    completed: false,
  };
}

const kamaPositions = [
  { id: "kama-1", title: "Vodnář", pose: "edge-bed", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 34, tag: "Romantické", description: { setup: "Partnerka leží na zádech, zvedne boky a podepře je rukama nebo polštářem. Partner klečí mezi jejími nohami a pomáhá jí držet stabilní úhel pánve.", focus: "Poloha je vhodná pro páry, které chtějí kombinovat intenzivnější kontakt s dobrým výhledem na sebe navzájem. Tempo by mělo začínat pomalu a postupně se ladit podle pohodlí.", comfort: "Dbejte na oporu beder a krku. Pokud se partnerce začne napínat spodní část zad, snižte úhel boků nebo přejděte do jednodušší varianty." } },
  { id: "kama-2", title: "Kyvadlo", pose: "top-facing", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 30, tag: "Romantické", description: { setup: "Partner leží na zádech s lehce pokrčenými koleny. Partnerka je nahoře tváří k němu, opírá se jednou rukou o podložku a druhou o jeho hrudník.", focus: "Partnerka přebírá vedení a volí jemné, plynulé pohyby boků. Poloha se hodí jako klidnější mezihra mezi náročnějšími pozicemi.", comfort: "Partner může pomáhat rukama na jejích bocích. Pohyb by měl být spíš plynulý než silový, aby se zbytečně nepřetěžovala kolena." } },
  { id: "kama-3", title: "Lotos", pose: "seated-face", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 28, tag: "Romantické", description: { setup: "Partner sedí opřený o čelo postele nebo zeď. Partnerka si sedne do jeho klína čelem k němu a obemkne ho nohama kolem pasu.", focus: "Tahle poloha je o blízkosti, dechu, polibcích a očním kontaktu. Hodí se pro pomalou intimitu, kdy nejde o výkon, ale o propojení.", comfort: "Opřete záda a boky polštáři. Když začne bolet spodní část zad, změňte úhel sedu nebo přejděte do lehu." } },
  { id: "kama-4", title: "Motýl", pose: "edge-bed", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 32, tag: "Vášnivé", description: { setup: "Partnerka leží na kraji postele, boky má blízko hrany a nohy pohodlně pokrčené. Partner stojí nebo klečí před ní.", focus: "Umožňuje dobře řídit úhel a tempo. Hodí se pro chvíle, kdy chcete intenzivnější kontakt, ale stále pohodlnou oporu.", comfort: "Hrana postele musí být stabilní. Bedra podložte polštářem a domluvte si signál pro zpomalení." } },
  { id: "kama-5", title: "Lžička", pose: "side-spoon", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 18, tag: "Romantické", description: { setup: "Oba leží na boku za sebou. Zadní partner se přitiskne k partnerce a obejme ji kolem pasu nebo hrudníku.", focus: "Jemná poloha pro ranní nebo večerní intimitu. Funguje skvěle, když chcete hodně blízkosti bez fyzické námahy.", comfort: "Polštář mezi koleny uvolní kyčle a bedra. Tempo držte klidné a upravujte náklon boků." } },
  { id: "kama-6", title: "Kovbojka", pose: "top-facing", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 30, tag: "Vášnivé", description: { setup: "Partner leží na zádech a partnerka sedí nahoře čelem k němu. Může být vzpřímená nebo lehce předkloněná.", focus: "Partnerka ovládá rytmus, tlak i hloubku a partner má prostor vnímat její tempo. Poloha je dobrá pro komunikaci a kontrolu.", comfort: "Nepřetěžujte kolena. Partnerka se může opřít o hrudník, stehna nebo matraci." } },
  { id: "kama-7", title: "Obrácená kovbojka", pose: "top-facing", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 36, tag: "Vášnivé", description: { setup: "Partner leží na zádech, partnerka sedí nahoře zády k němu a opírá se o stehna nebo matraci.", focus: "Varianta přináší odlišný úhel a výraznější vizuální teasing. Tempo by měla partnerka držet pod kontrolou.", comfort: "Začínejte pomalu a vyhýbejte se prudkým pohybům. Stabilita kolen a beder je zásadní." } },
  { id: "kama-8", title: "Kolébka", pose: "side-facing", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 20, tag: "Romantické", description: { setup: "Oba leží čelem k sobě na boku. Nohy jsou jemně propletené a těla zůstávají v těsném kontaktu.", focus: "Poloha je vhodná pro pomalé mazlení, polibky a komunikaci. Pomáhá, když chcete intimitu bez tlaku na výkon.", comfort: "Upravte ramena tak, aby nikdo neležel na ruce. Polštář pod hlavou výrazně zlepší pohodlí." } },
  { id: "kama-9", title: "Amazonka", pose: "top-facing", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 40, tag: "Vášnivé", description: { setup: "Partner leží nebo sedí níže a partnerka je nahoře v dominantnější pozici s větší kontrolou boků.", focus: "Silná poloha pro partnerku, která chce převzít vedení. Hodí se pro hravé střídání tempa a dominance.", comfort: "Držte stabilní oporu rukama. Pokud se objeví tlak v kolenou, zkraťte interval nebo změňte pozici." } },
  { id: "kama-10", title: "Sfinga", pose: "kneeling-arch", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 28, tag: "Vášnivé", description: { setup: "Partnerka leží nízko na břiše nebo se opírá o lokty, boky má mírně zvednuté. Partner je za ní.", focus: "Poloha kombinuje těsný kontakt s klidnějším tempem. Je vhodná, když chcete intenzitu bez velké akrobacie.", comfort: "Podložte boky a nepřetěžujte bedra. Pohyb by měl zůstat plynulý a kontrolovaný." } },
  { id: "kama-11", title: "Most", pose: "edge-bed", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 45, tag: "Akčnější", description: { setup: "Partnerka zvedá boky do mírného mostu s oporou ramen nebo předloktí. Partner ji drží za boky a pomáhá stabilizovat.", focus: "Krátká intenzivnější poloha pro páry, které chtějí silnější úhel a fyzickou výzvu.", comfort: "Nedržte dlouho. Při tlaku v zádech nebo krku okamžitě přejděte do jednodušší varianty." } },
  { id: "kama-12", title: "Pravý úhel", pose: "tabletop", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 34, tag: "Vášnivé", description: { setup: "Partnerka sedí nebo leží na hraně pevné postele či stolu, partner stojí nebo klečí před ní.", focus: "Dobře se nastavuje výška a úhel. Poloha působí spontánně a zároveň dává oběma jasnou oporu.", comfort: "Použijte pouze stabilní povrch. Pozor na ostré hrany a kluzké materiály." } },
  { id: "kama-13", title: "Tulipán", pose: "side-facing", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 18, tag: "Romantické", description: { setup: "Ležící měkká poloha s volně propletenýma nohama. Těla zůstávají blízko bez nutnosti držet napětí.", focus: "Vhodná pro romantický večer, pomalý rytmus a dlouhé doteky.", comfort: "Nechte kolena a kyčle uvolněné. Když něco táhne, změňte úhel nohou." } },
  { id: "kama-14", title: "Houpačka", pose: "seated-face", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 42, tag: "Hravé", description: { setup: "Partner sedí stabilně a partnerka je v jeho klíně. Pohyb vychází spíš z přenášení váhy dopředu a dozadu.", focus: "Hravá poloha, která dobře funguje s hudbou, smíchem a pomalým zkoušením rytmu.", comfort: "Použijte pevný sed bez koleček. Pokud je rovnováha nejistá, vraťte se do jednoduššího lotosu." } },
  { id: "kama-15", title: "Mořská panna", pose: "edge-bed", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 26, tag: "Romantické", description: { setup: "Partnerka leží na zádech s nohama blíže u sebe nebo lehce natočenými do strany. Partner je před ní.", focus: "Poloha vytváří těsnější kontakt a elegantnější pomalý rytmus. Hodí se pro klidnější intimní chvíle.", comfort: "Nevytáčejte kolena do bolesti. Polštář pod boky může pomoci s pohodlným úhlem." } },
  { id: "kama-16", title: "Bambusový výhonek", pose: "edge-bed", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 30, tag: "Vášnivé", description: { setup: "Partnerka leží na zádech a jednu nohu opře výš o partnera nebo jeho rameno. Druhá zůstává uvolněná.", focus: "Umožňuje změnit úhel a prohloubit kontakt bez velké změny polohy.", comfort: "Noha musí být uvolněná. Pokud táhne stehno nebo kyčel, okamžitě ji položte níž." } },
  { id: "kama-17", title: "U zdi", pose: "standing-mirror", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 42, tag: "Akčnější", description: { setup: "Partnerka se opírá zády nebo rukama o zeď, partner stojí těsně u ní a pomáhá držet stabilitu.", focus: "Spontánní poloha s vášnivou energií, vhodná spíš na kratší intenzivní chvíle.", comfort: "Zeď používejte jako oporu, ne pro tlak do zad. Vyhněte se zvedání bez jistoty." } },
  { id: "kama-18", title: "Tanečnice", pose: "standing-mirror", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 38, tag: "Hravé", description: { setup: "Ve stoje se partnerka jednou nohou opře nebo zahákne kolem partnera. Partner ji přidržuje za boky.", focus: "Poloha působí jako tanec a vyžaduje souhru, rytmus a důvěru.", comfort: "Držte pomalé tempo a stabilní oporu. Není vhodná při únavě nebo kluzké podlaze." } },
  { id: "kama-19", title: "Klapka", pose: "kneeling-arch", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 30, tag: "Vášnivé", description: { setup: "Partnerka je v kleku níže u podložky, opírá se o předloktí. Partner je za ní a drží pohyb kontrolovaně.", focus: "Zadní varianta s větší kontrolou tempa a těsným kontaktem.", comfort: "Podložte kolena a předloktí. Krk musí zůstat uvolněný." } },
  { id: "kama-20", title: "Krab", pose: "side-facing", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 32, tag: "Hravé", description: { setup: "Těla jsou bokem částečně propletená, nohy vytvářejí stabilní oporu a ruce zůstávají volné.", focus: "Hravé hledání úhlu, které může být překvapivě intimní a pohodlné.", comfort: "Nespěchejte. Upravujte nohy postupně, aby nevznikal tlak v kyčlích." } },
  { id: "kama-21", title: "Líní psi", pose: "edge-bed", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 20, tag: "Soft", description: { setup: "Oba jsou nízko u sebe, horní partner se opírá tak, aby neležel celou vahou na partnerce.", focus: "Klidná poloha pro pomalejší tempo a tělesnou blízkost.", comfort: "Váhu rozložte na ruce nebo lokty. Přestávky jsou součástí pohodlí." } },
  { id: "kama-22", title: "Vodopád", pose: "edge-bed", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 44, tag: "Akčnější", description: { setup: "Ležící varianta na kraji postele s výraznějším náklonem těla a vyšší oporou boků.", focus: "Poloha mění perspektivu i úhel a hodí se pro páry, které rády experimentují.", comfort: "Krk a záda musí být bezpečně podepřené. Nedržte polohu dlouho." } },
  { id: "kama-23", title: "Pevné objetí", pose: "side-facing", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 18, tag: "Romantické", description: { setup: "Partneři leží velmi blízko a drží se v objetí. Nohy jsou jen lehce propletené.", focus: "Cílem je klid, bezpečí a společný rytmus dechu.", comfort: "Upravte ramena a hlavu tak, aby nikdo neležel nepohodlně." } },
  { id: "kama-24", title: "Mexický styl", pose: "seated-face", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 28, tag: "Hravé", description: { setup: "Partner sedí na pevné židli nebo kraji postele, partnerka si sedá do klína.", focus: "Volné ruce, blízký kontakt a dobrá kontrola rytmu partnerkou.", comfort: "Židle musí být stabilní a bez koleček. Chodidla držte pevně na zemi." } },
  { id: "kama-25", title: "Vzdušný jezdec", pose: "seated-face", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 42, tag: "Akčnější", description: { setup: "Varianta sedu, kde partnerka více zapojuje nohy a drží se blízko partnera.", focus: "Fyzicky náročnější poloha s pocitem intenzivního propojení.", comfort: "Dělejte ji krátce a nepřepínejte sílu stehen nebo beder." } },
  { id: "kama-26", title: "Šéfkuchař", pose: "tabletop", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 30, tag: "Hravé", description: { setup: "Partnerka sedí na stabilní hraně linky nebo stolu, partner stojí mezi jejími nohami.", focus: "Změna prostředí, hravost a přímý kontakt tváří v tvář.", comfort: "Stůl musí být pevný. Pozor na hrany a předměty kolem." } },
  { id: "kama-27", title: "Zajetí", pose: "edge-bed", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 40, tag: "Vášnivé", description: { setup: "Partnerka leží blízko okraje postele, boky jsou podepřené a partner přebírá větší část vedení.", focus: "Vášnivější poloha s pocitem odevzdání a intenzivnějším úhlem.", comfort: "Hlava, krk a bedra musí mít oporu. Domluvte si tempo předem." } },
  { id: "kama-28", title: "Ještěrky", pose: "edge-bed", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 16, tag: "Soft", description: { setup: "Oba partneři jsou nízko u sebe v ležící poloze, kde se těla přirozeně kopírují.", focus: "Minimum akrobacie, hodně tělesného kontaktu a klidné tempo.", comfort: "Skvělá volba při únavě. Stačí měnit malé úhly boků." } },
  { id: "kama-29", title: "Venušin polibek", pose: "side-facing", category: "Orální", type: "Orální", difficulty: "Středně pokročilé", xp: 30, tag: "Orální", description: { setup: "Partneři leží pohodlně proti sobě nebo bokem tak, aby měli stabilní oporu hlavy a ramen.", focus: "Poloha je zaměřená na vzájemnou pozornost, pomalost a citlivou komunikaci.", comfort: "Použijte polštáře a domluvte si jednoduchý signál pro pauzu nebo změnu." } },
  { id: "kama-30", title: "Kruh 69", pose: "side-facing", category: "Orální", type: "Orální", difficulty: "Středně pokročilé", xp: 35, tag: "Orální", description: { setup: "Partneři jsou natočení proti sobě tak, aby si mohli vzájemně dopřát orální stimulaci v pohodlné poloze.", focus: "Důležitá je souhra, pomalost a střídání intenzity podle reakcí.", comfort: "Varianta na boku je méně namáhavá než nad sebou a lépe se v ní dýchá." } },
  { id: "kama-31", title: "Med", pose: "side-facing", category: "Orální", type: "Orální", difficulty: "Začátečníci", xp: 22, tag: "Orální", description: { setup: "Ležící poloha pro jemné orální hrátky s pohodlnou oporou hlavy a ramen.", focus: "Hodí se pro pomalý teasing a budování atmosféry bez spěchu.", comfort: "Držte pohodlný úhel krku a pravidelně měňte polohu hlavy." } },
  { id: "kama-32", title: "Čokoláda", pose: "seated-face", category: "Orální", type: "Orální", difficulty: "Začátečníci", xp: 24, tag: "Orální", description: { setup: "Jeden partner pohodlně sedí nebo leží s oporou, druhý má dost prostoru pro jemný orální kontakt.", focus: "Poloha je hravá, intimní a dobře kombinuje doteky s komunikací.", comfort: "Vyhněte se tlaku na krk. Pohodlná opora je důležitější než výdrž." } },
  { id: "kama-33", title: "Karamel", pose: "edge-bed", category: "Orální", type: "Orální", difficulty: "Středně pokročilé", xp: 28, tag: "Orální", description: { setup: "Partnerka nebo partner leží u hrany postele, druhý partner klečí nebo sedí tak, aby byl pohodlně ve správné výšce.", focus: "Vhodné pro soustředěnou pozornost a pomalejší intenzivní stimulaci.", comfort: "Podložte kolena a krk. Komunikujte tempo i tlak." } },
  { id: "kama-34", title: "Pírko", pose: "side-facing", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 14, tag: "Romantické", description: { setup: "Lehká poloha s uvolněnými těly a minimem fyzické námahy.", focus: "Zaměřuje se na doteky, mazlení a jemné budování napětí.", comfort: "Uvolněte ramena, boky i stehna. Ideální pro dlouhé předehry." } },
  { id: "kama-35", title: "Bouře", pose: "kneeling-arch", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 46, tag: "Vášnivé", description: { setup: "Dynamická poloha zezadu v kleku s jasnou oporou rukou.", focus: "Hodí se pro energičtější chvíle, kde je důležitá důvěra a komunikace.", comfort: "Podložte kolena, nepřetěžujte zápěstí a domluvte si tempo." } },
  { id: "kama-36", title: "Vanilka", pose: "edge-bed", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 10, tag: "Soft", description: { setup: "Jednoduchá pohodlná poloha tváří v tvář s dobrou oporou zad.", focus: "Pomalý kontakt, snadná komunikace a minimum fyzické náročnosti.", comfort: "Dobrá volba pro začátek nebo po náročném dni." } },
  { id: "kama-37", title: "Infinity", pose: "top-facing", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 48, tag: "Vášnivé", description: { setup: "Aktivní poloha nahoře s plynulým pohybem boků a střídáním náklonu.", focus: "Partnerka vede rytmus a může snadno měnit intenzitu.", comfort: "Nepřetěžujte kolena a dělejte krátké pauzy." } },
  { id: "kama-38", title: "Harmonie", pose: "side-facing", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 15, tag: "Romantické", description: { setup: "Klidná poloha bokem, kde těla zůstávají uvolněná a blízko.", focus: "Synchronizace dechu a pomalých pohybů vytváří jemné propojení.", comfort: "Ideální pro pomalé tempo a pohodlnou komunikaci." } },
  { id: "kama-39", title: "Samet", pose: "edge-bed", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 18, tag: "Romantické", description: { setup: "Ležící klasická pozice s měkkou oporou a jednoduchým nastavením těla.", focus: "Pomalý rytmus, doteky a nenáročná intimita.", comfort: "Uvolněte boky a stehna, podložte si záda." } },
  { id: "kama-40", title: "Polární záře", pose: "side-facing", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 24, tag: "Romantické", description: { setup: "Bokem k sobě s propletenýma nohama a možností měnit úhel pánve.", focus: "Mazlení, teasing a pomalé hledání nejpříjemnějšího nastavení.", comfort: "Netlačte na ramena a držte kolena měkká." } },
  { id: "kama-41", title: "Hvězdný prach", pose: "standing-mirror", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 40, tag: "Akčnější", description: { setup: "Poloha ve stoje s oporou o zeď, dveře nebo pevný nábytek.", focus: "Silná chemie, vizuální kontakt a pocit spontánnosti.", comfort: "Držte rovnováhu a nezkoušejte zvedání bez jistoty." } },
  { id: "kama-42", title: "Pokušení", pose: "tabletop", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 30, tag: "Hravé", description: { setup: "Poloha na hraně postele, stolu nebo stabilní lavice.", focus: "Hravost, přímý výhled na partnera a snadné vedení pohybu.", comfort: "Vyberte správnou výšku povrchu a zkontrolujte stabilitu." } },
  { id: "kama-43", title: "Magnet", pose: "seated-face", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 26, tag: "Romantické", description: { setup: "Sedící objetí čelem k sobě, kdy se partneři drží velmi blízko.", focus: "Oční kontakt, tělesné teplo a pomalý rytmus.", comfort: "Opřete se o čelo postele a držte ramena uvolněná." } },
  { id: "kama-44", title: "Zen", pose: "side-spoon", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 12, tag: "Soft", description: { setup: "Ležení za sebou v naprosto uvolněné poloze.", focus: "Relax, ticho, pomalé tempo a pocit bezpečí.", comfort: "Bez tlaku na záda a kyčle, ideální na večer." } },
  { id: "kama-45", title: "Noční objetí", pose: "side-spoon", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 14, tag: "Romantické", description: { setup: "Lžičková varianta s větším objetím přes hrudník nebo pas.", focus: "Jemnost, blízkost a nenucená intimita před spaním.", comfort: "Nechte ruce pohodlně položené, aby nebrněly." } },
  { id: "kama-46", title: "Královna", pose: "top-facing", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 32, tag: "Vášnivé", description: { setup: "Partnerka nahoře v sebevědomější pozici, partner leží nebo je opřený.", focus: "Kontrola rytmu, dominance a intenzivní vizuální kontakt.", comfort: "Stabilita boků a pomalé střídání tempa pomůže pohodlí." } },
  { id: "kama-47", title: "Jemný déšť", pose: "side-facing", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 16, tag: "Romantické", description: { setup: "Ležení bokem velmi blízko u sebe s volnými rameny a měkkým kontaktem.", focus: "Pomalé tempo, dlouhé doteky a klidná atmosféra.", comfort: "Použijte měkké polštáře a nezapomeňte měnit strany." } },
  { id: "kama-48", title: "Mléčná dráha", pose: "top-facing", category: "Vaginální", type: "Vaginální", difficulty: "Pokročilé", xp: 44, tag: "Vášnivé", description: { setup: "Aktivní poloha nahoře s větším rozsahem pohybu boků.", focus: "Intenzita, rytmus a výraznější zapojení partnerky.", comfort: "Pravidelně měňte tempo a nepřetěžujte stehna." } },
  { id: "kama-49", title: "Tango", pose: "standing-mirror", category: "Vaginální", type: "Vaginální", difficulty: "Středně pokročilé", xp: 34, tag: "Hravé", description: { setup: "Stojící poloha s těsným kontaktem, kdy se partneři pohybují jako v pomalém tanci.", focus: "Rytmus, hravost a dominance pohledu.", comfort: "Použijte oporu a nechte pohyby malé a přesné." } },
  { id: "kama-50", title: "Obkročmo", pose: "top-facing", category: "Vaginální", type: "Vaginální", difficulty: "Začátečníci", xp: 20, tag: "Romantické", description: { setup: "Partnerka obkročí partnera nahoře nebo v sedě a nastaví si pohodlný úhel.", focus: "Jednoduchá kontrola tempa, blízké doteky a pohodlné střídání rytmu.", comfort: "Nechte kolena volná a používejte ruce pro oporu." } }
];

const navItems = [
  { id: 'home', label: 'Home', icon: Heart },
  { id: 'feed', label: 'Feed', icon: MessageCircle },
  { id: 'gallery', label: 'Gallery', icon: Image },
  { id: 'challenges', label: 'Challenges', icon: Flame },
  { id: 'kamasutra', label: 'Kamasutra', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User },
];

function createPairCode() {
  return `LOVE-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function getLocalState() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalState(patch) {
  const current = getLocalState();
  localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...current, ...patch }));
}

function formatDate(value) {
  return new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function bytesToBase64(bytes) {
  let binary = '';
  const view = new Uint8Array(bytes);
  view.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function deriveEncryptionKey(passphrase, coupleId) {
  const encoder = new TextEncoder();
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(`moodsync:${coupleId}`),
      iterations: 250000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptFileForCouple(file, coupleId, passphrase) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(passphrase, coupleId);
  const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await file.arrayBuffer());
  return {
    blob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
    iv: bytesToBase64(iv),
    mimeType: file.type || 'image/jpeg',
  };
}

async function decryptSignedUrlToObjectUrl(signedUrl, coupleId, passphrase, ivBase64, mimeType = 'image/jpeg') {
  if (!signedUrl || !coupleId || !passphrase || !ivBase64) return null;
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error('Šifrovaný soubor se nepodařilo stáhnout.');
  const encryptedBuffer = await response.arrayBuffer();
  const key = await deriveEncryptionKey(passphrase, coupleId);
  const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(ivBase64) }, key, encryptedBuffer);
  return URL.createObjectURL(new Blob([decryptedBuffer], { type: mimeType || 'image/jpeg' }));
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalonePwa() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  return registration;
}

function getPushSupportMessage() {
  if (!('Notification' in window)) return 'Tenhle prohlížeč nepodporuje oznámení.';
  if (!('serviceWorker' in navigator)) return 'Tenhle prohlížeč nepodporuje Service Worker.';
  if (!('PushManager' in window)) {
    if (isIosDevice()) {
      return 'Na iPhonu fungují push notifikace jen po přidání aplikace na plochu přes Safari a spuštění z ikony na ploše.';
    }
    return 'Tenhle prohlížeč nepodporuje web push notifikace.';
  }
  if (isIosDevice() && !isStandalonePwa()) {
    return 'Na iPhonu nejdřív otevři aplikaci v Safari, dej Sdílet → Přidat na plochu a pak ji spusť z nové ikony.';
  }
  return '';
}

function getChallengeStats(challenges, currentUserId) {
  const completed = challenges.filter((challenge) => challenge.completed);
  const activeDuels = challenges.filter((challenge) => challenge.challenge_status === 'active');
  const failedDuels = challenges.filter((challenge) => ['failed', 'debt_assigned'].includes(challenge.challenge_status));
  const repaidDuels = challenges.filter((challenge) => challenge.challenge_status === 'debt_repaid');

  const completedXpFor = (userId) => completed
    .filter((challenge) => challenge.completed_by === userId)
    .reduce((sum, challenge) => sum + (challenge.xp || 10), 0);

  const penaltyFor = (userId) => failedDuels
    .filter((challenge) => challenge.assigned_to === userId)
    .reduce((sum, challenge) => sum + (challenge.penalty_points || challenge.xp || 10), 0);

  const repaidFor = (userId) => repaidDuels
    .filter((challenge) => challenge.assigned_to === userId)
    .reduce((sum, challenge) => sum + (challenge.penalty_points || challenge.xp || 10), 0);

  const myXp = completedXpFor(currentUserId) - penaltyFor(currentUserId) + repaidFor(currentUserId);
  const partnerIds = [...new Set(challenges.flatMap((challenge) => [challenge.completed_by, challenge.assigned_to, challenge.challenged_by]).filter(Boolean))]
    .filter((id) => id !== currentUserId);
  const partnerId = partnerIds[0];
  const partnerXp = partnerId ? completedXpFor(partnerId) - penaltyFor(partnerId) + repaidFor(partnerId) : 0;
  const coupleXp = Math.max(0, myXp) + Math.max(0, partnerXp);

  const currentTier = [...rewardTiers].reverse().find((tier) => coupleXp >= tier.minXp) || rewardTiers[0];
  const nextTier = rewardTiers.find((tier) => tier.minXp > coupleXp) || rewardTiers[rewardTiers.length - 1];
  const currentMin = currentTier.minXp;
  const nextMin = nextTier.minXp === currentMin ? currentMin + 1 : nextTier.minXp;
  const progress = Math.round(((coupleXp - currentMin) / Math.max(1, nextMin - currentMin)) * 100);

  const categoryScores = challengeCategories.filter((category) => category.id !== 'all').map((category) => ({
    ...category,
    xp: completed.filter((challenge) => challenge.category === category.id).reduce((sum, challenge) => sum + (challenge.xp || 10), 0),
  }));

  return {
    coupleXp,
    myXp,
    partnerXp,
    myDebt: Math.max(0, -myXp),
    partnerDebt: Math.max(0, -partnerXp),
    activeDuels,
    failedDuels,
    level: currentTier.level,
    title: currentTier.title,
    currentMin,
    nextMin,
    progress: Math.max(0, Math.min(100, progress)),
    categoryScores,
  };
}

async function uploadToStorage(file, folder, options = {}) {
  if (!supabase || !file) return null;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  let uploadFile = file;
  let uploadName = safeName;
  let encryption = { encrypted: false, encryptionIv: null, mimeType: file.type || null };

  if (options.encrypt) {
    if (!options.coupleId || !options.passphrase) throw new Error('Nejdřív nastav společné E2EE heslo v profilu.');
    const encrypted = await encryptFileForCouple(file, options.coupleId, options.passphrase);
    uploadFile = encrypted.blob;
    uploadName = `${safeName}.enc`;
    encryption = { encrypted: true, encryptionIv: encrypted.iv, mimeType: encrypted.mimeType };
  }

  const path = `${folder}/${crypto.randomUUID()}-${uploadName}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, uploadFile, {
    cacheControl: '3600',
    upsert: false,
    contentType: encryption.encrypted ? 'application/octet-stream' : file.type,
  });
  if (error) throw error;
  return { path, ...encryption };
}

async function getSignedUrl(path) {
  if (!supabase || !path) return null;
  const { data } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 5);
  return data?.signedUrl || null;
}

function Card({ children, className = '' }) {
  return <section className={`box-border w-full max-w-full min-w-0 rounded-[1.5rem] border border-white/70 bg-white/85 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/10 sm:rounded-[2rem] sm:p-5 ${className}`}>{children}</section>;
}

function PillButton({ active, children, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${active ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'border border-gray-200 bg-white/80 hover:bg-pink-50 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15'}`}>
      {children}
    </button>
  );
}

function TextInput(props) {
  return <input {...props} className={`w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-4 focus:ring-pink-200 dark:border-white/10 dark:bg-gray-900 dark:text-white ${props.className || ''}`} />;
}

function EmptyState({ title, text, icon: Icon = Sparkles }) {
  return (
    <div className="rounded-3xl border border-dashed border-pink-200 bg-pink-50/70 p-8 text-center dark:border-white/10 dark:bg-white/5">
      <Icon className="mx-auto text-pink-500" size={34} />
      <h3 className="mt-3 text-xl font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-300">{text}</p>
    </div>
  );
}

export default function App() {
  const local = getLocalState();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(local.dark ?? true);
  const [activeTab, setActiveTab] = useState(local.activeTab || 'home');
  const [profile, setProfile] = useState(null);
  const [couple, setCouple] = useState(null);
  const [coupleAvatarUrl, setCoupleAvatarUrl] = useState(null);
  const [partnerName, setPartnerName] = useState('');
  const [pairCodeInput, setPairCodeInput] = useState('');
  const [posts, setPosts] = useState([]);
  const [coupleStatuses, setCoupleStatuses] = useState([]);
  const [coupleMembers, setCoupleMembers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [kamaProgress, setKamaProgress] = useState([]);
  const [selectedMoodId, setSelectedMoodId] = useState(local.selectedMoodId || 'love');
  const [heat, setHeat] = useState(local.heat ?? 50);
  const [closeness, setCloseness] = useState(local.closeness ?? 70);
  const [thought, setThought] = useState('');
  const [message, setMessage] = useState('');
  const [photoCategory, setPhotoCategory] = useState('all');
  const [challengeCategory, setChallengeCategory] = useState('all');
  const [kamaFilter, setKamaFilter] = useState('all');
  const [oralOnly, setOralOnly] = useState(false);
  const [kamaDifficultyFilter, setKamaDifficultyFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [panicMode, setPanicMode] = useState(local.panicMode ?? true);
  const [vanishMode, setVanishMode] = useState(local.vanishMode ?? true);
  const [toast, setToast] = useState('');
  const [creatingCouple, setCreatingCouple] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [encryptionPassphrase, setEncryptionPassphrase] = useState(() => sessionStorage.getItem(ENC_KEY_SESSION) || '');

  const isBackendReady = Boolean(supabase);
  const selectedMood = moods.find((mood) => mood.id === selectedMoodId) || moods[0];
  const appClass = dark ? 'dark' : '';
  const encryptionReady = Boolean(couple?.id && encryptionPassphrase);

  useEffect(() => {
    saveLocalState({ dark, activeTab, selectedMoodId, heat, closeness, panicMode, vanishMode });
    document.documentElement.classList.toggle('dark', Boolean(dark));
    document.body.classList.toggle('dark', Boolean(dark));
  }, [dark, activeTab, selectedMoodId, heat, closeness, panicMode, vanishMode]);

  useEffect(() => {
    getServiceWorkerRegistration().catch(() => {
      // Service Worker registrace není kritická pro načtení aplikace.
    });
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    loadCloudData();
    checkNotificationState();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!couple?.id) return;
    loadPosts(couple.id);
    loadKamaProgress(couple.id);
    if (couple.avatar_path) loadCoupleAvatar(couple);
  }, [encryptionPassphrase, couple?.id]);

  useEffect(() => {
    if (!supabase || !couple?.id) return;

    const channel = supabase
      .channel(`couple-${couple.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `couple_id=eq.${couple.id}` }, () => loadPosts(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges', filter: `couple_id=eq.${couple.id}` }, () => loadChallenges(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kama_progress', filter: `couple_id=eq.${couple.id}` }, () => loadKamaProgress(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_status', filter: `couple_id=eq.${couple.id}` }, () => loadCoupleStatuses(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_members', filter: `couple_id=eq.${couple.id}` }, () => loadCoupleMembers(couple.id))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [couple?.id]);

  async function loadCloudData() {
    if (!supabase || !session?.user) return;
    setLoading(true);
    try {
      const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      const userProfile = existingProfile || await createProfile();
      setProfile(userProfile);
      setPartnerName(userProfile?.display_name || '');

      const { data: membership } = await supabase
        .from('couple_members')
        .select('couple_id, couples(*)')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const activeCouple = membership?.couples || null;
      setCouple(activeCouple);
      setCoupleAvatarUrl(activeCouple?.avatar_path ? await getCoupleAvatarUrl(activeCouple) : null);

      if (activeCouple?.id) {
        await Promise.all([loadPosts(activeCouple.id), loadChallenges(activeCouple.id), loadKamaProgress(activeCouple.id), loadCoupleStatuses(activeCouple.id), loadCoupleMembers(activeCouple.id)]);
      }
    } catch (error) {
      setToast(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createProfile(name = '') {
    const fallbackName = name || session.user.email?.split('@')[0] || 'Já';
    const { data, error } = await supabase.from('profiles').insert({ id: session.user.id, display_name: fallbackName }).select('*').single();
    if (error) throw error;
    return data;
  }

  async function updateProfileName(name) {
    if (!supabase || !session?.user || !name.trim()) return;
    const { data, error } = await supabase.from('profiles').upsert({ id: session.user.id, display_name: name.trim() }).select('*').single();
    if (error) return setToast(error.message);
    setProfile(data);
  }

  async function loadPosts(coupleId) {
    const { data, error } = await supabase.from('posts').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false });
    if (error) return setToast(error.message);

    const hydrated = await Promise.all((data || []).map(async (post) => {
      const rawSignedUrl = post.image_path ? await getSignedUrl(post.image_path) : null;
      let displayUrl = rawSignedUrl;
      let locked = false;

      if (post.encrypted && rawSignedUrl) {
        if (!encryptionPassphrase) {
          displayUrl = null;
          locked = true;
        } else {
          try {
            displayUrl = await decryptSignedUrlToObjectUrl(rawSignedUrl, coupleId, encryptionPassphrase, post.encryption_iv, post.mime_type);
          } catch {
            displayUrl = null;
            locked = true;
          }
        }
      }

      return { ...post, signedUrl: displayUrl, locked };
    }));
    setPosts(hydrated);
  }

  async function getCoupleAvatarUrl(activeCouple) {
    if (!activeCouple?.avatar_path) return null;
    const signedUrl = await getSignedUrl(activeCouple.avatar_path);
    if (!activeCouple.avatar_encrypted) return signedUrl;
    if (!encryptionPassphrase) return null;
    try {
      return await decryptSignedUrlToObjectUrl(
        signedUrl,
        activeCouple.id,
        encryptionPassphrase,
        activeCouple.avatar_encryption_iv,
        activeCouple.avatar_mime_type
      );
    } catch {
      return null;
    }
  }

  async function loadCoupleAvatar(activeCouple = couple) {
    setCoupleAvatarUrl(await getCoupleAvatarUrl(activeCouple));
  }

  async function loadCoupleStatuses(coupleId) {
    const { data, error } = await supabase
      .from('couple_status')
      .select('*')
      .eq('couple_id', coupleId)
      .order('updated_at', { ascending: false });

    if (error) return setToast(error.message);
    setCoupleStatuses(data || []);
  }


  async function loadCoupleMembers(coupleId) {
    const { data, error } = await supabase.from('couple_members').select('*').eq('couple_id', coupleId);
    if (error) return setToast(error.message);
    setCoupleMembers(data || []);
  }

  function getPartnerUserId() {
    const member = coupleMembers.find((item) => item.user_id && item.user_id !== session?.user?.id);
    if (member?.user_id) return member.user_id;
    const status = coupleStatuses.find((item) => item.user_id && item.user_id !== session?.user?.id);
    if (status?.user_id) return status.user_id;
    const post = posts.find((item) => item.author_id && item.author_id !== session?.user?.id);
    return post?.author_id || null;
  }

  async function checkExpiredChallengeDuels(sourceChallenges = challenges) {
    if (!couple?.id || !session?.user?.id) return;
    const now = Date.now();
    const expired = sourceChallenges.filter((challenge) =>
      challenge.challenge_status === 'active'
      && challenge.challenge_deadline
      && new Date(challenge.challenge_deadline).getTime() < now
    );

    for (const challenge of expired) {
      const { error } = await supabase
        .from('challenges')
        .update({ challenge_status: 'failed', failed_at: new Date().toISOString() })
        .eq('id', challenge.id)
        .eq('challenge_status', 'active');
      if (!error) {
        await notifyPartner('challenge_failed', 'MoodSync', `Výzva nebyla splněna včas: ${challenge.title}. Body byly odečteny.`);
      }
    }
  }

  async function saveMyStatus(next = {}) {
    if (!couple?.id || !session?.user?.id) return;

    const payload = {
      couple_id: couple.id,
      user_id: session.user.id,
      mood_label: next.moodLabel ?? selectedMood.label,
      heat: next.heat ?? heat,
      closeness: next.closeness ?? closeness,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('couple_status')
      .upsert(payload, { onConflict: 'couple_id,user_id' });

    if (error) setToast(error.message);
  }

  async function checkNotificationState() {
    const supportMessage = getPushSupportMessage();
    if (supportMessage) {
      setNotificationsEnabled(false);
      return;
    }

    try {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      setNotificationsEnabled(Notification.permission === 'granted' && Boolean(subscription));
    } catch {
      setNotificationsEnabled(false);
    }
  }

  async function enablePushNotifications() {
    if (!couple?.id || !session?.user?.id) return setToast('Nejdřív vytvoř nebo připoj pár.');
    if (!VAPID_PUBLIC_KEY) return setToast('Chybí VITE_VAPID_PUBLIC_KEY ve Vercel Environment Variables.');

    const supportMessage = getPushSupportMessage();
    if (supportMessage) return setToast(supportMessage);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotificationsEnabled(false);
        return setToast('Upozornění nejsou povolená. Povol je v nastavení prohlížeče / iOS.');
      }

      const registration = await getServiceWorkerRegistration();
      if (!registration) throw new Error('Service Worker se nepodařilo zaregistrovat.');

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          couple_id: couple.id,
          user_id: session.user.id,
          subscription: subscription.toJSON(),
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;

      setNotificationsEnabled(true);
      setToast('Mobilní upozornění jsou zapnutá na tomto zařízení.');
    } catch (error) {
      setNotificationsEnabled(false);
      setToast(`Upozornění se nepodařilo zapnout: ${error.message}`);
    }
  }

  async function notifyPartner(eventType, title, body) {
    if (!couple?.id || !session?.user?.id || !supabase) return;

    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          coupleId: couple.id,
          senderId: session.user.id,
          eventType,
          title,
          body,
          url: window.location.origin,
        },
      });

      if (error) {
        console.warn('Push notification failed:', error.message || error);
      }
    } catch (error) {
      console.warn('Push notification failed:', error);
    }
  }

  async function updateHeatValue(value) {
    setHeat(value);
    await saveMyStatus({ heat: value });
    await notifyPartner('heat_changed', 'MoodSync', 'Partner/ka změnil/a teploměr nadrženosti.');
  }

  async function updateClosenessValue(value) {
    setCloseness(value);
    await saveMyStatus({ closeness: value });
    await notifyPartner('closeness_changed', 'MoodSync', 'Partner/ka změnil/a teploměr blízkosti.');
  }

  async function updateMoodValue(moodId) {
    const nextMood = moods.find((mood) => mood.id === moodId) || moods[0];
    setSelectedMoodId(moodId);
    await saveMyStatus({ moodLabel: nextMood.label });
    await notifyPartner('mood_changed', 'MoodSync', `Partner/ka má novou náladu: ${nextMood.label}.`);
  }

  async function loadChallenges(coupleId) {
    const { data, error } = await supabase.from('challenges').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false });
    if (error) return setToast(error.message);

    if (!data || data.length === 0) {
      await seedChallenges(coupleId);
      const { data: seededData, error: seededError } = await supabase.from('challenges').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false });
      if (seededError) return setToast(seededError.message);
      setChallenges(seededData || []);
      await checkExpiredChallengeDuels(seededData || []);
      return;
    }

    setChallenges(data || []);
    await checkExpiredChallengeDuels(data || []);
  }

  async function loadKamaProgress(coupleId) {
    const { data, error } = await supabase.from('kama_progress').select('*').eq('couple_id', coupleId);
    if (error) return setToast(error.message);

    const hydrated = await Promise.all((data || []).map(async (item) => {
      const rawSignedUrl = item.photo_path ? await getSignedUrl(item.photo_path) : null;
      let displayUrl = rawSignedUrl;
      let locked = false;

      if (item.encrypted && rawSignedUrl) {
        if (!encryptionPassphrase) {
          displayUrl = null;
          locked = true;
        } else {
          try {
            displayUrl = await decryptSignedUrlToObjectUrl(rawSignedUrl, coupleId, encryptionPassphrase, item.encryption_iv, item.mime_type);
          } catch {
            displayUrl = null;
            locked = true;
          }
        }
      }

      return { ...item, signedUrl: displayUrl, locked };
    }));
    setKamaProgress(hydrated);
  }

  async function createCouple() {
    if (!supabase || !session?.user) return;
    setCreatingCouple(true);
    setToast('');

    try {
      const pair_code = createPairCode();
      let createdCouple = null;
      let createError = null;

      const withCreatedBy = await supabase
        .from('couples')
        .insert({ pair_code, created_by: session.user.id })
        .select('*')
        .single();

      if (withCreatedBy.error && String(withCreatedBy.error.message).includes('created_by')) {
        const fallback = await supabase
          .from('couples')
          .insert({ pair_code })
          .select('*')
          .single();
        createdCouple = fallback.data;
        createError = fallback.error;
      } else {
        createdCouple = withCreatedBy.data;
        createError = withCreatedBy.error;
      }

      if (createError) throw createError;

      const { error: memberError } = await supabase
        .from('couple_members')
        .insert({ couple_id: createdCouple.id, user_id: session.user.id, role: 'owner' });

      if (memberError) throw memberError;

      await seedChallenges(createdCouple.id);
      setCouple(createdCouple);
      setCoupleAvatarUrl(null);
      await loadCloudData();
      setToast(`Pár vytvořen. Kód je ${pair_code}.`);
    } catch (error) {
      setToast(`Pár se nepodařilo vytvořit: ${error.message}`);
    } finally {
      setCreatingCouple(false);
    }
  }

  async function joinCouple() {
    if (!supabase || !session?.user || !pairCodeInput.trim()) return;
    const code = pairCodeInput.trim().toUpperCase();
    const { data: foundCouple, error } = await supabase.from('couples').select('*').eq('pair_code', code).maybeSingle();
    if (error || !foundCouple) return setToast('Párovací kód nebyl nalezen.');

    const { error: memberError } = await supabase.from('couple_members').upsert({ couple_id: foundCouple.id, user_id: session.user.id, role: 'partner' });
    if (memberError) return setToast(memberError.message);

    setPairCodeInput('');
    await loadCloudData();
  }

  async function seedChallenges(coupleId) {
    const rows = starterChallenges.map((challenge, index) => normalizeStarterChallenge(challenge, coupleId, index, session?.user?.id));
    const { error } = await supabase.from('challenges').insert(rows);
    if (error && !String(error.message).includes('duplicate')) {
      setToast(`Výzvy se nepodařilo založit: ${error.message}`);
    }
  }

  async function uploadCoupleAvatar(file) {
    if (!couple?.id || !file) return;

    try {
      if (!encryptionPassphrase) throw new Error('Nejdřív nastav společné E2EE heslo v profilu.');
      const uploaded = await uploadToStorage(file, `${couple.id}/profile`, { encrypt: true, coupleId: couple.id, passphrase: encryptionPassphrase });
      const avatarPath = uploaded.path;
      const { data, error } = await supabase
        .from('couples')
        .update({
          avatar_path: avatarPath,
          avatar_encrypted: uploaded.encrypted,
          avatar_encryption_iv: uploaded.encryptionIv,
          avatar_mime_type: uploaded.mimeType,
        })
        .eq('id', couple.id)
        .select('*')
        .single();

      if (error) throw error;

      setCouple(data);
      setCoupleAvatarUrl(await getCoupleAvatarUrl(data));
      await notifyPartner('couple_avatar_changed', 'MoodSync', 'Partner/ka změnil/a profilovou fotku páru.');
    } catch (error) {
      setToast(`Profilovou fotku se nepodařilo uložit: ${error.message}`);
    }
  }

  async function addPost() {
    if (!couple?.id) return setToast('Nejdřív vytvoř nebo připoj pár.');
    const text = thought.trim() || `Aktuální nálada: ${selectedMood.label}.`;
    const { error } = await supabase.from('posts').insert({
      couple_id: couple.id,
      author_id: session.user.id,
      type: 'mood',
      text,
      mood_label: selectedMood.label,
      heat,
      closeness,
    });
    if (error) return setToast(error.message);
    setThought('');
    await loadPosts(couple.id);
    await notifyPartner('thought_added', 'MoodSync', 'Partner/ka ti poslal/a novou myšlenku.');
  }

  async function sendMessage() {
    if (!couple?.id || !message.trim()) return;
    const { error } = await supabase.from('posts').insert({ couple_id: couple.id, author_id: session.user.id, type: 'chat', text: message.trim() });
    if (error) return setToast(error.message);
    setMessage('');
    await loadPosts(couple.id);
    await notifyPartner('message_added', 'MoodSync', 'Partner/ka ti poslal/a novou zprávu.');
  }

  async function addPhoto(file, options = {}) {
    if (!couple?.id) return setToast('Nejdřív vytvoř nebo připoj pár.');
    if (!file) return;
    try {
      if (!encryptionPassphrase) throw new Error('Nejdřív nastav společné E2EE heslo v profilu. Bez něj se intimní fotky nenahrávají.');
      const uploaded = await uploadToStorage(file, `${couple.id}/gallery`, { encrypt: true, coupleId: couple.id, passphrase: encryptionPassphrase });
      const imagePath = uploaded.path;
      const { error } = await supabase.from('posts').insert({
        couple_id: couple.id,
        author_id: session.user.id,
        type: 'photo',
        text: options.text?.trim() || 'Soukromá fotka v galerii',
        photo_category: options.photoCategory || (photoCategory === 'all' ? 'romantic' : photoCategory),
        image_path: imagePath,
        encrypted: uploaded.encrypted,
        encryption_iv: uploaded.encryptionIv,
        mime_type: uploaded.mimeType,
      });
      if (error) throw error;
      await loadPosts(couple.id);
      setActiveTab('gallery');
      await notifyPartner('photo_added', 'MoodSync', 'Partner/ka přidal/a novou fotku do galerie.');
    } catch (error) {
      setToast(error.message);
    }
  }

  async function deletePost(post) {
    if (!couple?.id || !post?.id) return;

    const confirmed = window.confirm(post.type === 'photo' ? 'Opravdu smazat tuto fotku?' : 'Opravdu smazat tento příspěvek?');
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id).eq('couple_id', couple.id);
      if (error) throw error;

      if (post.image_path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([post.image_path]);
      }

      await loadPosts(couple.id);
    } catch (error) {
      setToast(`Mazání se nepodařilo: ${error.message}`);
    }
  }

  async function addChallenge(payload) {
    if (!couple?.id || !payload.title?.trim()) return;
    const { error } = await supabase.from('challenges').insert({
      couple_id: couple.id,
      title: payload.title.trim(),
      category: payload.category,
      difficulty: payload.difficulty,
      xp: Number(payload.xp) || 10,
      assigned_to: payload.assignedTo === 'me' ? session.user.id : null,
      accepted: false,
      completed: false,
    });
    if (error) return setToast(error.message);
    await loadChallenges(couple.id);
    await notifyPartner('challenge_added', 'MoodSync', 'Partner/ka přidal/a novou výzvu.');
  }

  async function updateChallenge(id, patch) {
    const normalizedPatch = patch.completed ? { ...patch, completed_by: session.user.id } : patch;
    const { error } = await supabase.from('challenges').update(normalizedPatch).eq('id', id);
    if (error) return setToast(error.message);
    await loadChallenges(couple.id);
    if (patch.completed) {
      await notifyPartner('challenge_completed', 'MoodSync', 'Partner/ka splnil/a výzvu a získal/a XP.');
    }
  }

  async function toggleKama(positionId) {
    if (!couple?.id) return;
    const existing = kamaProgress.find((item) => item.position_id === positionId);
    const nextCompleted = existing ? !existing.completed : true;

    if (existing) {
      await supabase.from('kama_progress').update({ completed: nextCompleted, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('kama_progress').insert({ couple_id: couple.id, position_id: positionId, completed: true });
    }

    await loadKamaProgress(couple.id);

    if (nextCompleted) {
      const position = kamaPositions.find((item) => item.id === positionId);
      await notifyPartner('kamasutra_completed', 'MoodSync', `Partner/ka označil/a polohu ${position?.title || ''} jako splněnou.`);
    }
  }

  async function uploadKamaPhoto(positionId, file) {
    if (!couple?.id || !file) return;
    try {
      if (!encryptionPassphrase) throw new Error('Nejdřív nastav společné E2EE heslo v profilu. Bez něj se intimní fotky nenahrávají.');
      const uploaded = await uploadToStorage(file, `${couple.id}/kamasutra`, { encrypt: true, coupleId: couple.id, passphrase: encryptionPassphrase });
      const photoPath = uploaded.path;
      const existing = kamaProgress.find((item) => item.position_id === positionId);
      if (existing) {
        await supabase.from('kama_progress').update({ photo_path: photoPath, encrypted: uploaded.encrypted, encryption_iv: uploaded.encryptionIv, mime_type: uploaded.mimeType, completed: true, updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('kama_progress').insert({ couple_id: couple.id, position_id: positionId, photo_path: photoPath, encrypted: uploaded.encrypted, encryption_iv: uploaded.encryptionIv, mime_type: uploaded.mimeType, completed: true });
      }
      await loadKamaProgress(couple.id);
      const position = kamaPositions.find((item) => item.id === positionId);
      await notifyPartner('kamasutra_photo_added', 'MoodSync', `Partner/ka přidal/a fotku k poloze ${position?.title || ''}.`);
    } catch (error) {
      setToast(error.message);
    }
  }

  function saveEncryptionPassphrase(value) {
    setEncryptionPassphrase(value);
    if (value) {
      sessionStorage.setItem(ENC_KEY_SESSION, value);
      setToast('E2EE heslo je aktivní na tomto zařízení. Nové fotky se budou šifrovat před uploadem.');
    } else {
      sessionStorage.removeItem(ENC_KEY_SESSION);
      setToast('E2EE heslo bylo vymazané z tohoto zařízení.');
    }
  }

  async function signOut() {
    sessionStorage.removeItem(ENC_KEY_SESSION);
    setEncryptionPassphrase('');
    await supabase.auth.signOut();
    setSession(null);
    setCouple(null);
    setPosts([]);
    setChallenges([]);
    setKamaProgress([]);
    setCoupleStatuses([]);
    setCoupleMembers([]);
  }

  const filteredPosts = useMemo(() => {
    return [...posts]
      .filter((item) => photoCategory === 'all' || item.photo_category === photoCategory || item.type !== 'photo')
      .sort((a, b) => sortOrder === 'newest' ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at));
  }, [posts, photoCategory, sortOrder]);

  const photoPosts = filteredPosts.filter((post) => post.type === 'photo');
  const filteredChallenges = challenges.filter((challenge) => challengeCategory === 'all' || challenge.category === challengeCategory);
  const challengeStats = getChallengeStats(challenges, session?.user?.id);

  const latestOwnMoodPost = useMemo(
    () => posts.find((post) => post.type === 'mood' && post.author_id === session?.user?.id) || null,
    [posts, session?.user?.id]
  );

  const latestPartnerMoodPost = useMemo(
    () => posts.find((post) => post.type === 'mood' && post.author_id && post.author_id !== session?.user?.id) || null,
    [posts, session?.user?.id]
  );

  const myLiveStatus = useMemo(
    () => coupleStatuses.find((item) => item.user_id === session?.user?.id) || null,
    [coupleStatuses, session?.user?.id]
  );

  const partnerLiveStatus = useMemo(
    () => coupleStatuses.find((item) => item.user_id && item.user_id !== session?.user?.id) || null,
    [coupleStatuses, session?.user?.id]
  );

  if (!isBackendReady) {
    return <MissingBackend />;
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-pink-50 text-gray-900"><div className="text-2xl font-black">Načítám MoodSync...</div></main>;
  }

  if (!session) {
    return <AuthScreen dark={dark} setDark={setDark} />;
  }

  return (
    <div className={appClass}>
      <main className="box-border min-h-screen w-screen max-w-[100vw] overflow-x-hidden bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 px-3 py-3 pb-28 text-gray-900 transition dark:from-gray-950 dark:via-purple-950 dark:to-rose-950 dark:text-white sm:px-4 sm:py-4 md:px-8 md:py-8 md:pb-28">
        <div className="mx-auto grid w-full max-w-full min-w-0 gap-4 md:max-w-7xl md:gap-6">
          <CompactHeader
            encryptionReady={encryptionReady}
            profile={profile}
            couple={couple}
            coupleAvatarUrl={coupleAvatarUrl}
            dark={dark}
            setDark={setDark}
            panicMode={panicMode}
            setPanicMode={setPanicMode}
            notificationsEnabled={notificationsEnabled}
            enablePushNotifications={enablePushNotifications}
            signOut={signOut}
          />

          {!couple && <PairingPanel pairCodeInput={pairCodeInput} setPairCodeInput={setPairCodeInput} createCouple={createCouple} joinCouple={joinCouple} creatingCouple={creatingCouple} />}

          {toast && (
            <div className="rounded-2xl border border-pink-200 bg-white p-4 font-bold text-pink-600 shadow-lg dark:border-white/10 dark:bg-white/10 dark:text-pink-200">
              {toast} <button className="ml-3 underline" onClick={() => setToast('')}>zavřít</button>
            </div>
          )}

          {activeTab === 'home' && (
            <HomePanel
              profile={profile}
              couple={couple}
              latestOwnMoodPost={latestOwnMoodPost}
              latestPartnerMoodPost={latestPartnerMoodPost}
              myLiveStatus={myLiveStatus}
              partnerLiveStatus={partnerLiveStatus}
              selectedMood={selectedMood}
              setSelectedMoodId={updateMoodValue}
              heat={heat}
              setHeat={updateHeatValue}
              closeness={closeness}
              setCloseness={updateClosenessValue}
              thought={thought}
              setThought={setThought}
              addPost={addPost}
              partnerName={partnerName}
              setPartnerName={setPartnerName}
              updateProfileName={updateProfileName}
            />
          )}

          {activeTab === 'feed' && <FeedPanel posts={filteredPosts} message={message} setMessage={setMessage} sendMessage={sendMessage} addPhoto={addPhoto} deletePost={deletePost} panicMode={panicMode} vanishMode={vanishMode} openImage={setFullscreenImage} />}
          {activeTab === 'gallery' && <GalleryPanel posts={photoPosts} addPhoto={addPhoto} deletePost={deletePost} photoCategory={photoCategory} setPhotoCategory={setPhotoCategory} sortOrder={sortOrder} setSortOrder={setSortOrder} panicMode={panicMode} vanishMode={vanishMode} openImage={setFullscreenImage} />}
          {activeTab === 'challenges' && <ChallengesPanel challenges={filteredChallenges} allChallenges={challenges} category={challengeCategory} setCategory={setChallengeCategory} addChallenge={addChallenge} updateChallenge={updateChallenge} challengePartner={challengePartner} assignDebtTask={assignDebtTask} repayDebt={repayDebt} currentUserId={session?.user?.id} stats={challengeStats} />}
          {activeTab === 'kamasutra' && <KamasutraPanel kamaProgress={kamaProgress} kamaFilter={kamaFilter} setKamaFilter={setKamaFilter} kamaDifficultyFilter={kamaDifficultyFilter} setKamaDifficultyFilter={setKamaDifficultyFilter} oralOnly={oralOnly} setOralOnly={setOralOnly} toggleKama={toggleKama} uploadKamaPhoto={uploadKamaPhoto} />}
          {activeTab === 'profile' && <ProfilePanel profile={profile} couple={couple} coupleAvatarUrl={coupleAvatarUrl} partnerName={partnerName} setPartnerName={setPartnerName} updateProfileName={updateProfileName} uploadCoupleAvatar={uploadCoupleAvatar} encryptionPassphrase={encryptionPassphrase} saveEncryptionPassphrase={saveEncryptionPassphrase} signOut={signOut} />}
        </div>

        {fullscreenImage && <FullscreenImageViewer image={fullscreenImage} onClose={() => setFullscreenImage(null)} />}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>
    </div>
  );
}

function MissingBackend() {
  return (
    <main className="grid min-h-screen place-items-center bg-pink-50 p-6 text-gray-900">
      <Card className="max-w-2xl">
        <h1 className="text-4xl font-black">Chybí Supabase konfigurace</h1>
        <p className="mt-3 text-gray-600">Aplikace je teď cloud-first. Vytvoř soubor <code>.env.local</code> a přidej VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY.</p>
        <pre className="mt-5 overflow-auto rounded-2xl bg-gray-900 p-4 text-sm text-white">VITE_SUPABASE_URL=https://xxxxx.supabase.co{`
`}VITE_SUPABASE_ANON_KEY=tvuj_publishable_anon_key</pre>
      </Card>
    </main>
  );
}

function AuthScreen({ dark, setDark }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submitAuth() {
    setError('');
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setError('Vyplň email i heslo.');
      return;
    }

    if (password.length < 6) {
      setError('Heslo musí mít alespoň 6 znaků.');
      return;
    }

    setLoadingAuth(true);

    try {
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim() || email.trim().split('@')[0],
            },
          },
        });

        if (signUpError) throw signUpError;

        setMessage('Účet vytvořen. Teď se přepni na Přihlásit a přihlas se stejným emailem a heslem. Pokud Supabase vyžaduje potvrzení emailu, nejdřív potvrď zprávu v emailu.');
        setMode('login');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          if (String(signInError.message).toLowerCase().includes('invalid login credentials')) {
            throw new Error('Neplatné přihlášení. Pokud jsi účet ještě nevytvořil/a přes záložku Registrovat, nejdřív ho vytvoř. Pokud už účet existuje z magic linku, smaž ho v Supabase Authentication → Users a zaregistruj ho znovu s heslem, nebo nastav nové heslo.');
          }
          throw signInError;
        }
      }
    } catch (authError) {
      setError(authError.message);
    } finally {
      setLoadingAuth(false);
    }
  }

  return (
    <div className={dark ? 'dark' : ''}>
      <main className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-6 text-gray-900 dark:from-gray-950 dark:via-purple-950 dark:to-rose-950 dark:text-white">
        <Card className="w-full max-w-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-sm font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-200">
                <Lock size={16} /> Secure couple login
              </div>
              <h1 className="mt-4 text-5xl font-black">MoodSync</h1>
              <p className="mt-3 text-gray-500 dark:text-gray-300">
                Přihlašování přes email a heslo. Bez magic linků, takže nenarážíš na limit emailů.
              </p>
            </div>
            <button className="rounded-2xl bg-gray-900 p-3 text-white dark:bg-white dark:text-gray-900" onClick={() => setDark(!dark)}>
              {dark ? <Sun /> : <Moon />}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-pink-50 p-2 dark:bg-white/10">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-xl px-4 py-3 font-black transition ${mode === 'login' ? 'bg-pink-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Přihlásit
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-xl px-4 py-3 font-black transition ${mode === 'register' ? 'bg-pink-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Registrovat
            </button>
          </div>

          <div className="mt-6 grid gap-3">
            {mode === 'register' && (
              <TextInput
                placeholder="Tvoje jméno"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            )}

            <TextInput
              type="email"
              placeholder="tvuj@email.cz"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <TextInput
              type="password"
              placeholder="Heslo"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && submitAuth()}
            />

            <button
              type="button"
              onClick={submitAuth}
              disabled={loadingAuth}
              className="rounded-2xl bg-pink-500 px-5 py-3 font-black text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingAuth ? 'Pracuju...' : mode === 'login' ? 'Přihlásit se' : 'Vytvořit účet'}
            </button>
          </div>

          {message && <p className="mt-4 rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-700">{message}</p>}
          {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}

          <p className="mt-5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            Tip: pokud jsi dřív používal magic link, starý uživatel nemusí mít nastavené heslo. Nejčistší testovací postup je smazat uživatele v Supabase Authentication → Users a vytvořit ho znovu přes Registrovat.
          </p>
        </Card>
      </main>
    </div>
  );
}

function CompactHeader({ encryptionReady, profile, couple, coupleAvatarUrl, dark, setDark, panicMode, setPanicMode, notificationsEnabled, enablePushNotifications, signOut }) {
  return (
    <header className="box-border w-full max-w-full overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/80 p-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/10 sm:rounded-[2rem] sm:p-4 md:p-5">
      <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg sm:h-12 sm:w-12">
            {coupleAvatarUrl ? <img src={coupleAvatarUrl} alt="Profil páru" className="h-full w-full object-cover" /> : <Heart size={24} />}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black sm:text-2xl">MoodSync</h1>
            <p className="max-w-[140px] truncate text-[11px] font-bold text-gray-500 dark:text-gray-300 sm:max-w-none sm:text-xs">{profile?.display_name || 'uživatel'}{couple?.pair_code ? ` · ${couple.pair_code}` : ''}</p>
          </div>
        </div>
        <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          <span className={`rounded-xl px-2 py-2 text-[11px] font-black sm:rounded-2xl sm:px-3 sm:text-xs ${encryptionReady ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-gray-900'}`}>{encryptionReady ? 'E2EE' : 'No key'}</span>
          <button onClick={() => setPanicMode(!panicMode)} className="rounded-xl bg-gray-900 px-2 py-2 text-[11px] font-black text-white dark:bg-white dark:text-gray-900 sm:rounded-2xl sm:px-3 sm:text-xs">{panicMode ? 'Blur' : 'Open'}</button>
          <button onClick={enablePushNotifications} className={`rounded-xl px-2 py-2 text-[11px] font-black sm:rounded-2xl sm:px-3 sm:text-xs ${notificationsEnabled ? 'bg-emerald-500 text-white' : 'bg-pink-500 text-white'}`}>{notificationsEnabled ? 'Notif ON' : 'Notif'}</button>
          <button onClick={() => setDark(!dark)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 sm:h-10 sm:w-10 sm:rounded-2xl">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button onClick={signOut} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-gray-200 dark:border-white/10 sm:h-10 sm:w-10 sm:rounded-2xl"><LogOut size={18} /></button>
        </div>
      </div>
    </header>
  );
}

function PairingPanel({ pairCodeInput, setPairCodeInput, createCouple, joinCouple, creatingCouple }) {
  return (
    <Card className="border-pink-300/70 dark:border-pink-500/30">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-3xl font-black">Vytvoř nebo připoj pár</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-300">První člověk vytvoří pár a pošle kód. Druhý člověk se přihlásí do aplikace a zadá stejný kód.</p>
        </div>
        <div className="grid gap-3">
          <button disabled={creatingCouple} onClick={createCouple} className="rounded-2xl bg-pink-500 px-5 py-3 font-black text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60">
            {creatingCouple ? 'Vytvářím pár...' : 'Vytvořit nový pár a kód'}
          </button>
          <div className="flex gap-3">
            <TextInput placeholder="LOVE-ABCD" value={pairCodeInput} onChange={(event) => setPairCodeInput(event.target.value)} />
            <button onClick={joinCouple} className="rounded-2xl bg-gray-900 px-5 py-3 font-black text-white dark:bg-white dark:text-gray-900">Připojit</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function HomePanel({ profile, couple, latestOwnMoodPost, latestPartnerMoodPost, myLiveStatus, partnerLiveStatus, selectedMood, setSelectedMoodId, heat, setHeat, closeness, setCloseness, thought, setThought, addPost, partnerName, setPartnerName, updateProfileName }) {
  const freshOwnStatus = isStatusFresh(myLiveStatus) ? myLiveStatus : null;
  const freshPartnerStatus = isStatusFresh(partnerLiveStatus) ? partnerLiveStatus : null;
  const ownMood = freshOwnStatus?.mood_label ? getMoodByLabel(freshOwnStatus.mood_label) : latestOwnMoodPost ? getMoodByLabel(latestOwnMoodPost.mood_label) : selectedMood;
  const partnerMood = freshPartnerStatus?.mood_label ? getMoodByLabel(freshPartnerStatus.mood_label) : latestPartnerMoodPost ? getMoodByLabel(latestPartnerMoodPost.mood_label) : null;
  const ownHeat = freshOwnStatus?.heat ?? heat;
  const ownCloseness = freshOwnStatus?.closeness ?? closeness;
  const partnerHeat = freshPartnerStatus?.heat ?? 0;
  const partnerCloseness = freshPartnerStatus?.closeness ?? 0;

  return (
    <>
      <section className="grid min-w-0 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <PartnerCard
          name={couple ? 'Partner/ka' : 'Čeká na spárování'}
          status={freshPartnerStatus ? `Aktualizováno ${formatDate(freshPartnerStatus.updated_at)}` : couple ? 'Čekám na první změnu' : 'Zadej párovací kód'}
          mood={partnerMood || selectedMood}
          heat={partnerHeat}
          closeness={partnerCloseness}
          note={latestPartnerMoodPost?.text || (couple ? 'Jakmile partner/ka změní náladu nebo teploměr, uvidíš to tady nahoře.' : 'Pár zatím není propojený.')}
          waiting={!couple || !freshPartnerStatus}
          highlight
        />
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black"><Heart className="text-pink-500" /> Moje nastavení</h2>
          <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:gap-3">
            <CompactMeter title="Blízkost" value={closeness} setValue={setCloseness} />
            <CompactMeter title="Nadrženost" value={heat} setValue={setHeat} />
          </div>
          <textarea value={thought} onChange={(event) => setThought(event.target.value)} placeholder="Myšlenka pro partnera..." className="mt-4 min-h-[96px] w-full rounded-3xl border border-gray-200 bg-white p-4 text-gray-900 outline-none focus:ring-4 focus:ring-pink-200 dark:border-white/10 dark:bg-gray-900 dark:text-white" />
          <button onClick={addPost} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 font-black text-white shadow-lg hover:bg-pink-600"><Send size={18} /> Sdílet myšlenku do feedu</button>
        </Card>
      </section>

      <RelationshipOverview ownHeat={ownHeat} ownCloseness={ownCloseness} partnerHeat={partnerHeat} partnerCloseness={partnerCloseness} hasPartnerMood={Boolean(freshPartnerStatus)} />

      <Card>
        <h2 className="mb-4 flex items-center justify-between text-2xl font-black">Moje aktuální nálada<Bell className="text-pink-500" /></h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {moods.map((mood) => {
            const Icon = mood.icon;
            return <button key={mood.id} onClick={() => setSelectedMoodId(mood.id)} className={`rounded-3xl border p-4 text-left shadow-sm transition ${selectedMood.id === mood.id ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/20' : 'border-gray-200 bg-white/70 hover:bg-pink-50 dark:border-white/10 dark:bg-white/5'}`}><div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${mood.color} text-white shadow-md`}><Icon size={22} /></div><div className="mt-3 text-sm font-black">{mood.label}</div></button>;
          })}
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-black">Profil</h3>
        <div className="mt-4 flex gap-3">
          <TextInput placeholder="Tvoje jméno" value={partnerName} onChange={(event) => setPartnerName(event.target.value)} />
          <button onClick={() => updateProfileName(partnerName)} className="rounded-2xl bg-gray-900 px-5 py-3 font-black text-white dark:bg-white dark:text-gray-900">Uložit</button>
        </div>
      </Card>
    </>
  );
}

function CompactMeter({ title, value, setValue }) {
  return (
    <div className="min-w-0 rounded-3xl bg-gradient-to-br from-pink-400 via-rose-500 to-purple-600 p-4 text-center text-white shadow-xl">
      <div className="text-xs font-bold uppercase tracking-wide text-white/80">{title}</div>
      <div className="text-4xl font-black sm:text-5xl">{value}%</div>
      <input value={value} onChange={(event) => setValue(Number(event.target.value))} type="range" min="0" max="100" className="mt-4 block w-full min-w-0 accent-white" />
    </div>
  );
}

function RelationshipOverview({ ownHeat, ownCloseness, partnerHeat, partnerCloseness, hasPartnerMood }) {
  return (
    <Card>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-black">Společný vztahový přehled</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Hodnoty se aktualizují přímo ze sliderů každého partnera, bez nutnosti posílat náladu do feedu.
          </p>
        </div>
        {!hasPartnerMood && <div className="rounded-2xl bg-amber-100 px-4 py-3 text-sm font-black text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">Čekám na první změnu teploměru partnera/partnerky</div>}
      </div>
      <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
        <CompareBar label="Blízkost" leftLabel="Já" rightLabel="Partner/ka" left={ownCloseness} right={partnerCloseness} icon={<Heart size={18} />} />
        <CompareBar label="Nadrženost" leftLabel="Já" rightLabel="Partner/ka" left={ownHeat} right={partnerHeat} icon={<Flame size={18} />} />
      </div>
    </Card>
  );
}

function CompareBar({ label, leftLabel, rightLabel, left, right, icon }) {
  return (
    <div className="rounded-3xl border border-pink-100 bg-pink-50 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex items-center gap-2 font-black">{icon}{label}</div>
      <div className="space-y-3">
        <MiniBar label={leftLabel} value={left} />
        <MiniBar label={rightLabel} value={right} />
      </div>
    </div>
  );
}

function MiniBar({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-bold"><span>{label}</span><span>{value}%</span></div>
      <div className="h-3 overflow-hidden rounded-full bg-white dark:bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PartnerCard({ name, status, mood, heat, closeness, note, waiting, highlight = false }) {
  const Icon = mood?.icon || User;
  return <Card className={highlight ? 'border-pink-300 dark:border-pink-500/30' : ''}><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 text-white shadow-lg">{waiting ? <User size={28} /> : <Icon size={28} />}</div><div><h3 className="text-xl font-black">{name}</h3><p className="text-sm text-gray-500 dark:text-gray-300">{status}</p></div></div>{waiting ? <Lock className="text-gray-400" /> : <Icon className="text-pink-500" />}</div><p className="mt-5 rounded-2xl bg-pink-50 p-4 text-gray-700 dark:bg-white/10 dark:text-gray-200">{note}</p><div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:gap-3"><StatBar label="Blízkost" value={waiting ? 0 : closeness} icon={<Heart size={16} />} /><StatBar label="Nadrženost" value={waiting ? 0 : heat} icon={<Flame size={16} />} /></div></Card>;
}

function Meter({ title, value, setValue, low, high }) {
  return <div className="mt-5 rounded-[2rem] bg-gradient-to-br from-pink-400 via-rose-500 to-purple-600 p-6 text-center text-white shadow-xl"><div className="text-sm font-bold uppercase tracking-wide text-white/80">{title}</div><div className="text-6xl font-black">{value}%</div><input value={value} onChange={(event) => setValue(Number(event.target.value))} type="range" min="0" max="100" className="mt-6 w-full accent-white" /><div className="mt-2 flex justify-between text-xs text-white/80"><span>{low}</span><span>{high}</span></div></div>;
}

function StatBar({ label, value, icon }) {
  return <div className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/10"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">{icon}{label}</div><span className="font-black">{value}%</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200/70 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500" style={{ width: `${value}%` }} /></div></div>;
}

function FeedPanel({ posts, message, setMessage, sendMessage, addPhoto, deletePost, panicMode, vanishMode, openImage }) {
  return <Card><div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h2 className="text-3xl font-black">Feed</h2><p className="mt-1 text-gray-500 dark:text-gray-300">Realtime zprávy, nálady a fotky páru.</p></div><PhotoUploadButton addPhoto={addPhoto} /></div><div className="mb-5 flex gap-2"><TextInput value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} placeholder="Napiš rychlou zprávu..." /><button onClick={sendMessage} className="rounded-2xl bg-gray-900 px-5 font-black text-white dark:bg-white dark:text-gray-900">Poslat</button></div><FeedList posts={posts} panicMode={panicMode} vanishMode={vanishMode} openImage={openImage} deletePost={deletePost} /></Card>;
}

function GalleryPanel({ posts, addPhoto, deletePost, photoCategory, setPhotoCategory, sortOrder, setSortOrder, panicMode, vanishMode, openImage }) {
  return (
    <Card>
      <div className="mb-5">
        <h2 className="text-3xl font-black">Private Gallery</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-300">
          Fotky jsou uložené v privátním Supabase Storage bucketu a cesty jsou oddělené podle ID vašeho páru.
        </p>
      </div>

      <div className="mb-5 flex min-w-0 flex-wrap gap-2">
        {photoCategories.map((category) => (
          <PillButton
            key={category.id}
            active={photoCategory === category.id}
            onClick={() => setPhotoCategory(category.id)}
          >
            {category.label}
          </PillButton>
        ))}

        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-900 dark:border-white/10 dark:bg-gray-900 dark:text-white"
        >
          <option value="newest">Nejnovější</option>
          <option value="oldest">Nejstarší</option>
        </select>
      </div>

      <GalleryUploadForm addPhoto={addPhoto} />
      <FeedList
        posts={posts}
        panicMode={panicMode}
        vanishMode={vanishMode}
        galleryOnly
        openImage={openImage}
        deletePost={deletePost}
      />
    </Card>
  );
}

function GalleryUploadForm({ addPhoto }) {
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('romantic');
  function handleUpload(file) { addPhoto(file, { text: caption, photoCategory: category }); setCaption(''); }
  return <div className="mb-6 rounded-[2rem] border border-pink-100 bg-pink-50 p-5 dark:border-white/10 dark:bg-white/5"><div className="grid gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-end"><label className="grid gap-2 text-sm font-bold">Popisek fotky<TextInput value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Naše soukromá vzpomínka..." /></label><label className="grid gap-2 text-sm font-bold">Kategorie<select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-900 dark:border-white/10 dark:bg-gray-900 dark:text-white">{photoCategories.filter((item) => item.id !== 'all').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 font-black text-white hover:bg-pink-600"><input type="file" accept="image/*" className="hidden" onChange={(event) => handleUpload(event.target.files?.[0])} /><Image size={18} /> Nahrát fotku</label></div></div>;
}

function PhotoUploadButton({ addPhoto }) {
  return <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 font-black text-white hover:bg-pink-600"><input type="file" accept="image/*" className="hidden" onChange={(event) => addPhoto(event.target.files?.[0])} /><Plus size={18} /> Přidat fotku</label>;
}

function FeedList({ posts, panicMode, vanishMode, galleryOnly = false, openImage, deletePost }) {
  if (posts.length === 0) return <EmptyState title="Zatím tu nic není" text={galleryOnly ? 'Nahrajte první společnou fotku.' : 'Pošlete první zprávu, náladu nebo fotku.'} icon={galleryOnly ? Image : MessageCircle} />;
  return (
    <div className={galleryOnly ? 'grid max-h-[760px] grid-cols-2 gap-2 overflow-auto pr-1 sm:gap-4' : 'max-h-[650px] space-y-4 overflow-auto pr-1'}>
      {posts.map((post) => (
        <article
          key={post.id}
          className={galleryOnly ? 'overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-xl dark:border-white/10 dark:bg-white/10' : 'rounded-3xl border border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50 p-5 dark:border-white/10 dark:from-white/10 dark:to-white/5'}
        >
          {galleryOnly ? (
            <>
              <MediaCard imageUrl={post.signedUrl} locked={post.locked} blurred={panicMode} expiresIn={vanishMode ? '24 h' : 'saved'} category={post.photo_category || 'photo'} openImage={openImage} compact />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black">{post.photo_category || 'photo'}</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{formatDate(post.created_at)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deletePost?.(post)}
                    className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white"
                  >
                    Smazat
                  </button>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{post.text}</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="font-black">{post.type === 'photo' ? 'Fotka' : post.type === 'mood' ? 'Nálada' : 'Zpráva'}</div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500 dark:text-gray-300">{formatDate(post.created_at)}</div>
                  <button
                    type="button"
                    onClick={() => deletePost?.(post)}
                    className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white"
                  >
                    Smazat
                  </button>
                </div>
              </div>
              <p className="mt-3 text-lg">{post.text}</p>
              {post.mood_label && <div className="mt-4 grid gap-2 sm:grid-cols-3"><div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold dark:bg-white/10">Nálada: {post.mood_label}</div><div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold dark:bg-white/10">Blízkost: {post.closeness}%</div><div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold dark:bg-white/10">Nadrženost: {post.heat}%</div></div>}
              {post.type === 'photo' && <MediaCard imageUrl={post.signedUrl} locked={post.locked} blurred={panicMode} expiresIn={vanishMode ? '24 h' : 'saved'} category={post.photo_category || 'photo'} openImage={openImage} />}
            </>
          )}
        </article>
      ))}
    </div>
  );
}

function MediaCard({ blurred, locked, expiresIn, category, imageUrl, openImage, compact = false }) {
  return (
    <div className={`relative overflow-hidden border border-white/20 bg-gradient-to-br from-rose-500 via-fuchsia-500 to-purple-700 ${compact ? 'h-56 rounded-none md:h-72' : 'mt-4 h-72 rounded-3xl'}`}>
      {imageUrl ? (
        <button
          type="button"
          onClick={() => !blurred && openImage?.({ src: imageUrl, title: category })}
          className="block h-full w-full"
        >
          <img
            src={imageUrl}
            alt={category}
            className={`h-full w-full object-cover transition ${blurred ? 'blur-sm scale-105' : 'hover:scale-105'}`}
          />
        </button>
      ) : (
        <div className="grid h-full place-items-center p-5 text-center text-white">
          <div>
            <Lock className="mx-auto mb-3" size={44} />
            <div className="font-black">{locked ? 'Šifrovaná fotka' : 'Fotka není dostupná'}</div>
            <p className="mt-2 text-sm text-white/80">{locked ? 'Zadej správné E2EE heslo v profilu.' : 'Zkus obnovit stránku.'}</p>
          </div>
        </div>
      )}
      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur">Couple protected</span>
        <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-bold text-white">{expiresIn}</span>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">{category}</span>
      </div>
      {!blurred && imageUrl && (
        <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-black text-white backdrop-blur">
          Klikni pro fullscreen
        </div>
      )}
      {blurred && <div className="absolute inset-0 grid place-items-center"><div className="rounded-2xl bg-black/60 px-5 py-3 font-bold text-white backdrop-blur-xl">Panic blur aktivní</div></div>}
    </div>
  );
}

function FullscreenImageViewer({ image, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-2xl bg-white px-4 py-3 font-black text-gray-900"
      >
        Zavřít
      </button>
      <img
        src={image.src}
        alt={image.title || 'Fullscreen fotka'}
        className="max-h-[90vh] max-w-[95vw] rounded-3xl object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

function ChallengesPanel({ challenges, allChallenges, category, setCategory, addChallenge, updateChallenge, challengePartner, assignDebtTask, repayDebt, currentUserId, stats }) {
  const debtRewards = [
    { label: 'Masáž 20 minut', value: 20 },
    { label: 'Snídaně do postele', value: 25 },
    { label: 'Večer podle partnera', value: 30 },
    { label: 'Romantické překvapení', value: 40 },
  ];

  const activeDuels = allChallenges.filter((challenge) => challenge.challenge_status === 'active');
  const debts = allChallenges.filter((challenge) => ['failed', 'debt_assigned'].includes(challenge.challenge_status));

  return (
    <div className="grid gap-6">
      <Card>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-black text-purple-700 dark:bg-purple-500/20 dark:text-purple-200"><Trophy size={16} /> Výzvy 2.0</div>
            <h2 className="mt-3 text-3xl font-black">Souboj partnerů</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-300">Vyzvěte partnera, nastavte časový limit a soutěžte o body. Nesplněná výzva vytvoří dluh, který musí partner smazat nápravnou odměnou.</p>
          </div>
          <div className="rounded-[2rem] bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-6 text-white shadow-xl">
            <div className="text-sm font-bold text-white/80">Žebříček</div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-white/15 p-4"><div className="text-xs font-bold text-white/70">Já</div><div className="text-4xl font-black">{stats.myXp}</div></div>
              <div className="rounded-2xl bg-white/15 p-4"><div className="text-xs font-bold text-white/70">Partner/ka</div><div className="text-4xl font-black">{stats.partnerXp}</div></div>
            </div>
            <div className="mt-4 text-sm font-bold text-white/80">Dluh: Já {stats.myDebt} / Partner {stats.partnerDebt}</div>
          </div>
        </div>
      </Card>

      {(activeDuels.length > 0 || debts.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="flex items-center gap-2 text-xl font-black"><Clock className="text-pink-500" /> Aktivní časové výzvy</h3>
            <div className="mt-4 grid gap-3">
              {activeDuels.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-300">Žádná aktivní výzva s limitem.</p>}
              {activeDuels.map((challenge) => (
                <div key={challenge.id} className="rounded-3xl border border-pink-100 bg-pink-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="font-black">{challenge.title}</div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-300">Termín: {formatDate(challenge.challenge_deadline)} · penalizace -{challenge.penalty_points || challenge.xp} bodů</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="flex items-center gap-2 text-xl font-black"><Target className="text-purple-500" /> Dluhy a nápravy</h3>
            <div className="mt-4 grid gap-3">
              {debts.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-300">Nikdo není v mínusu.</p>}
              {debts.map((challenge) => {
                const isMyDebt = challenge.assigned_to === currentUserId;
                return (
                  <div key={challenge.id} className="rounded-3xl border border-purple-100 bg-purple-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="font-black">{challenge.title}</div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-300">Dluh: -{challenge.penalty_points || challenge.xp} bodů</div>
                    {challenge.debt_task ? (
                      <div className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold dark:bg-white/10">Náprava: {challenge.debt_task}</div>
                    ) : !isMyDebt ? (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {debtRewards.map((reward) => <button key={reward.label} onClick={() => assignDebtTask(challenge, reward.label)} className="rounded-2xl bg-gray-900 px-3 py-2 text-xs font-black text-white dark:bg-white dark:text-gray-900">{reward.label}</button>)}
                      </div>
                    ) : (
                      <div className="mt-3 text-sm font-bold text-pink-600 dark:text-pink-300">Čekáš na zadání nápravy od partnera.</div>
                    )}
                    {isMyDebt && challenge.debt_task && <button onClick={() => repayDebt(challenge)} className="mt-3 w-full rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-white">Splněno, smazat dluh</button>}
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      )}

      <ChallengeEditor addChallenge={addChallenge} />

      <Card>
        <div className="mb-5 flex flex-wrap gap-2">{challengeCategories.map((item) => <PillButton key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</PillButton>)}</div>
        <div className="grid gap-4 lg:grid-cols-2">
          {challenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} updateChallenge={updateChallenge} challengePartner={challengePartner} currentUserId={currentUserId} />)}
        </div>
      </Card>
    </div>
  );
}

function ChallengeCard({ challenge, updateChallenge, challengePartner, currentUserId }) {
  const [hours, setHours] = useState(24);
  const isAssignedToMe = challenge.assigned_to === currentUserId;
  const isActive = challenge.challenge_status === 'active';

  return (
    <article className="rounded-3xl border border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 p-5 dark:border-white/10 dark:from-white/10 dark:to-white/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-black">{challenge.title}</h4>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-pink-500 px-3 py-1 font-bold text-white">{challenge.category}</span>
            <span className="rounded-full bg-purple-500 px-3 py-1 font-bold text-white">+{challenge.xp || 10} XP</span>
            {isActive && <span className="rounded-full bg-amber-400 px-3 py-1 font-bold text-gray-900">Limit {formatDate(challenge.challenge_deadline)}</span>}
            {challenge.completed_by && <span className="rounded-full bg-emerald-500 px-3 py-1 font-bold text-white">Bod získán</span>}
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button onClick={() => updateChallenge(challenge.id, { accepted: !challenge.accepted })} disabled={challenge.completed} className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white disabled:opacity-40 dark:bg-white dark:text-gray-900">{challenge.accepted ? 'Odebrat' : 'Přijmout'}</button>
        <button onClick={() => updateChallenge(challenge.id, { completed: true, accepted: true, completed_at: new Date().toISOString(), challenge_status: 'completed' })} disabled={challenge.completed || (isActive && !isAssignedToMe)} className="rounded-2xl bg-pink-500 px-4 py-2 text-sm font-black text-white disabled:opacity-40">{challenge.completed ? 'Hotovo' : isActive && !isAssignedToMe ? 'Čeká na partnera' : 'Splnit za sebe'}</button>
      </div>
      {!challenge.completed && !isActive && (
        <div className="mt-4 rounded-2xl bg-white p-3 dark:bg-white/10">
          <div className="mb-2 text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-300">Vyzvat partnera</div>
          <div className="flex gap-2">
            <select value={hours} onChange={(event) => setHours(Number(event.target.value))} className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 dark:border-white/10 dark:bg-gray-900 dark:text-white">
              <option value={2}>2 hodiny</option>
              <option value={8}>Dnes</option>
              <option value={24}>24 hodin</option>
              <option value={72}>3 dny</option>
              <option value={168}>7 dní</option>
            </select>
            <button onClick={() => challengePartner(challenge, hours)} className="rounded-2xl bg-purple-500 px-4 py-2 text-sm font-black text-white">Vyzvat</button>
          </div>
        </div>
      )}
    </article>
  );
}

function ChallengeEditor({ addChallenge }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('spicy');
  const [difficulty, setDifficulty] = useState('Medium');
  const [xp, setXp] = useState(10);
  const [assignedTo, setAssignedTo] = useState('open');
  function submit() { addChallenge({ title, category, difficulty, xp, assignedTo }); setTitle(''); }
  return <Card><h3 className="mb-4 text-xl font-black">Vytvořit vlastní výzvu</h3><div className="grid gap-3 md:grid-cols-[1fr_150px_150px_130px_110px_auto]"><TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Napiš vlastní výzvu..." /><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-900 dark:border-white/10 dark:bg-gray-900 dark:text-white">{challengeCategories.filter((item) => item.id !== 'all').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-900 dark:border-white/10 dark:bg-gray-900 dark:text-white"><option>Easy</option><option>Medium</option><option>Hard</option><option>Extreme</option></select><select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-900 dark:border-white/10 dark:bg-gray-900 dark:text-white"><option value="open">Kdo dřív</option><option value="me">Pro mě</option></select><TextInput type="number" min="1" max="100" value={xp} onChange={(event) => setXp(Number(event.target.value))} /><button onClick={submit} className="rounded-2xl bg-purple-500 px-5 py-3 font-black text-white hover:bg-purple-600">Přidat</button></div></Card>;
}

function KamasutraPanel({ kamaProgress, kamaFilter, setKamaFilter, kamaDifficultyFilter, setKamaDifficultyFilter, oralOnly, setOralOnly, toggleKama, uploadKamaPhoto }) {
  const completed = kamaProgress.filter((item) => item.completed).length;
  const progress = Math.round((completed / Math.max(1, kamaPositions.length)) * 100);
  const typeFilters = ['all', 'Vaginální', 'Orální', 'Romantické'];
  const difficultyFilters = ['all', 'Začátečníci', 'Středně pokročilé', 'Pokročilé'];
  const filtered = kamaPositions
    .filter((position) => kamaFilter === 'all' || position.type === kamaFilter || position.tag === kamaFilter)
    .filter((position) => kamaDifficultyFilter === 'all' || position.difficulty === kamaDifficultyFilter)
    .filter((position) => !oralOnly || position.type === 'Orální');
  const progressById = Object.fromEntries(kamaProgress.map((item) => [item.position_id, item]));

  return <div className="grid gap-5"><Card><div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-sm font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-200"><Heart size={16} /> Kamasutra 2.0</div><h2 className="mt-3 text-3xl font-black sm:text-4xl">Kamasutra Journey</h2><p className="mt-2 text-sm text-gray-500 dark:text-gray-300">50 různorodých neanálních pozic, menší mobilní karty, detailnější popisy a filtry podle typu i náročnosti.</p></div><div className="rounded-[2rem] bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 p-5 text-white shadow-2xl"><div className="text-xs font-bold text-white/80">Splněno</div><div className="text-5xl font-black">{completed}</div><div className="text-sm font-bold text-white/80">z {kamaPositions.length}</div><div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} /></div></div></div></Card><div className="flex flex-wrap items-center gap-2">{typeFilters.map((filter) => <PillButton key={filter} active={kamaFilter === filter} onClick={() => setKamaFilter(filter)}>{filter === 'all' ? 'Vše' : filter}</PillButton>)}{difficultyFilters.map((filter) => <PillButton key={filter} active={kamaDifficultyFilter === filter} onClick={() => setKamaDifficultyFilter(filter)}>{filter === 'all' ? 'Všechny úrovně' : filter}</PillButton>)}<button onClick={() => setOralOnly(!oralOnly)} className={`rounded-2xl px-4 py-2 text-sm font-black transition ${oralOnly ? 'bg-fuchsia-500 text-white' : 'border border-gray-200 bg-white/80 dark:border-white/10 dark:bg-white/10'}`}>Pouze orální</button></div><section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">{filtered.map((position) => { const item = progressById[position.id]; return <Card key={position.id} className="overflow-hidden p-0"><PoseGuide pose={position.pose} title={position.title} compact /><div className="p-3 sm:p-4"><h3 className="text-base font-black sm:text-xl">{position.title}</h3><div className="mt-2 flex flex-wrap gap-1"><span className="rounded-full bg-pink-100 px-2 py-1 text-[10px] font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-200">{position.type}</span><span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-black text-purple-700 dark:bg-purple-500/20 dark:text-purple-200">{position.difficulty}</span></div><div className="mt-3 space-y-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300 sm:text-sm"><InstructionBlock number="1" title="Nastavení" text={position.description.setup} /><InstructionBlock number="2" title="Tempo" text={position.description.focus} /><InstructionBlock number="3" title="Komfort" text={position.description.comfort} /></div><button onClick={() => toggleKama(position.id)} className={`mt-3 w-full rounded-2xl py-2 text-xs font-black transition sm:text-sm ${item?.completed ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'}`}>{item?.completed ? '✓ Splněno' : 'Splnit'}</button>{item?.completed && <label className="mt-2 flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-pink-300 px-3 py-3 text-center text-[11px] font-bold text-pink-600 hover:bg-pink-100 dark:border-pink-500/30 dark:text-pink-200"><input type="file" accept="image/*" className="hidden" onChange={(event) => uploadKamaPhoto(position.id, event.target.files?.[0])} />{item?.signedUrl ? 'Změnit fotku' : 'Přidat fotku'}</label>}{item?.signedUrl && <img src={item.signedUrl} alt={position.title} className="mt-3 h-36 w-full rounded-2xl object-cover shadow-xl" />}{item?.locked && <div className="mt-3 rounded-2xl bg-gray-900 p-3 text-center text-xs font-bold text-white"><Lock className="mx-auto mb-1" size={16} />Šifrovaná fotka</div>}</div></Card>; })}</section></div>;
}


function InstructionBlock({ number, title, text }) {
  return <div className="rounded-3xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/5"><div className="flex items-start gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pink-500 text-sm font-black text-white">{number}</div><div><div className="font-black text-gray-900 dark:text-white">{title}</div><p className="mt-1">{text}</p></div></div></div>;
}

function PoseGuide({ pose, title, compact = false }) {
  const guides = { 'seated-face': { icon: Heart, label: 'Romantická blízkost' }, 'side-spoon': { icon: Moon, label: 'Pomalá intimita' }, 'edge-bed': { icon: Flame, label: 'Intenzivní energie' }, 'standing-mirror': { icon: Sparkles, label: 'Flirt a teasing' }, 'top-facing': { icon: Trophy, label: 'Partnerka vede tempo' }, 'kneeling-arch': { icon: Flame, label: 'Silná intenzita' }, tabletop: { icon: Sparkles, label: 'Hravá změna prostředí' }, 'side-facing': { icon: Moon, label: 'Jemné propojení' } };
  const guide = guides[pose] || { icon: Heart, label: 'Intimní moment' };
  const Icon = guide.icon;
  return <div className={`bg-[#fff7f3] dark:bg-[#120d18] ${compact ? 'p-3' : 'p-5'}`}><div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 p-4 text-center dark:border-pink-500/20 dark:from-pink-500/5 dark:to-purple-500/5 sm:p-6"><div className={`${compact ? 'h-14 w-14 sm:h-16 sm:w-16' : 'h-24 w-24'} flex items-center justify-center rounded-full bg-white shadow-xl dark:bg-white/10`}><Icon className="text-pink-500" size={compact ? 26 : 42} /></div><div className={`${compact ? 'mt-3 text-sm sm:text-lg' : 'mt-5 text-2xl'} font-black text-gray-900 dark:text-white`}>{title}</div><div className="mt-2 rounded-full bg-pink-100 px-3 py-1 text-[10px] font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-200 sm:text-xs">{guide.label}</div></div></div>;
}

function ProfilePanel({ profile, couple, coupleAvatarUrl, partnerName, setPartnerName, updateProfileName, uploadCoupleAvatar, encryptionPassphrase, saveEncryptionPassphrase, signOut }) {
  return (
    <Card>
      <h2 className="text-3xl font-black">Profil a nastavení</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-300">Správa účtu, páru a cloudových dat.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-[2rem] border border-pink-100 bg-pink-50 p-5 text-center dark:border-white/10 dark:bg-white/5">
          <div className="mx-auto grid h-40 w-40 place-items-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-xl">
            {coupleAvatarUrl ? <img src={coupleAvatarUrl} alt="Profilová fotka páru" className="h-full w-full object-cover" /> : <Heart size={54} />}
          </div>
          <div className="mt-4 text-lg font-black">Profil páru</div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{couple?.pair_code ? `Kód: ${couple.pair_code}` : 'Nejdřív vytvoř pár.'}</p>
          {couple && (
            <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 font-black text-white hover:bg-pink-600">
              <input type="file" accept="image/*" className="hidden" onChange={(event) => uploadCoupleAvatar(event.target.files?.[0])} />
              <Image size={18} /> {coupleAvatarUrl ? 'Změnit fotku' : 'Nahrát fotku'}
            </label>
          )}
        </div>

        <div>
          <div className="flex gap-3">
            <TextInput placeholder={profile?.display_name || 'Tvoje jméno'} value={partnerName} onChange={(event) => setPartnerName(event.target.value)} />
            <button onClick={() => updateProfileName(partnerName)} className="rounded-2xl bg-gray-900 px-5 py-3 font-black text-white dark:bg-white dark:text-gray-900">Uložit</button>
          </div>
          <div className="mt-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <h3 className="flex items-center gap-2 text-xl font-black"><ShieldCheck className="text-emerald-500" /> End-to-end šifrování fotek</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Zadejte společné heslo, které znáte jen vy dva. Galerie, Kamasutra fotky i profilová fotka páru se zašifrují v prohlížeči ještě před uploadem do Supabase.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <TextInput type="password" placeholder="Společné E2EE heslo" value={encryptionPassphrase} onChange={(event) => saveEncryptionPassphrase(event.target.value)} />
              <button type="button" onClick={() => saveEncryptionPassphrase('')} className="rounded-2xl bg-gray-900 px-5 py-3 font-black text-white dark:bg-white dark:text-gray-900">Vymazat z tohoto zařízení</button>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Heslo se neukládá do cloudu. Když ho zapomenete, staré šifrované fotky nepůjde obnovit.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <FeatureTile icon={ShieldCheck} title="E2EE fotky" text="Fotky se šifrují AES-GCM v prohlížeči ještě před uploadem." />
            <FeatureTile icon={Users} title="Pairing" text="Párovací kód připojí druhý účet do stejného páru." />
            <FeatureTile icon={Wand2} title="Realtime" text="Zprávy, fotky, výzvy a progress se synchronizují přes Supabase Realtime." />
          </div>
          <button onClick={signOut} className="mt-6 rounded-2xl bg-gray-900 px-5 py-3 font-black text-white dark:bg-white dark:text-gray-900">Odhlásit</button>
        </div>
      </div>
    </Card>
  );
}

function BottomNav({ activeTab, setActiveTab }) {
  return <nav className="fixed bottom-3 left-0 right-0 z-50 box-border px-2 sm:bottom-4 sm:px-4"><div className="mx-auto grid w-full max-w-[calc(100vw-1rem)] grid-cols-6 gap-1 rounded-3xl border border-white/70 bg-white/90 p-2 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-black/50 sm:flex sm:max-w-3xl sm:justify-around sm:p-3">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 transition sm:px-3 md:px-4 ${activeTab === item.id ? 'bg-pink-500 text-white' : 'hover:bg-pink-50 dark:hover:bg-white/10'}`}><Icon size={18} /><span className="max-w-full truncate text-[9px] font-bold sm:text-xs">{item.label}</span></button>; })}</div></nav>;
}

function InfoTile({ title, value, icon }) {
  return <div className="rounded-3xl border border-white/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/10"><p className="text-sm text-gray-500 dark:text-gray-300">{title}</p><p className="mt-2 flex items-center gap-2 text-2xl font-black">{icon}{value}</p></div>;
}

function FeatureTile({ icon: Icon, title, text }) {
  return <div className="rounded-3xl border border-pink-100 bg-pink-50 p-5 dark:border-white/10 dark:bg-white/10"><Icon className="text-pink-500" size={30} /><h3 className="mt-3 font-black">{title}</h3><p className="mt-2 text-sm text-gray-500 dark:text-gray-300">{text}</p></div>;
}
