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
  { id: 'kama-31', title: 'Jemný déšť', pose: 'side-facing', category: 'Romantic', difficulty: 'Easy', xp: 16, description: { setup: 'Ležení bokem velmi blízko u sebe.', focus: 'Pomalé tempo a dlouhé doteky.', comfort: 'Použijte měkké polštáře pod hlavu.' } },
  { id: 'kama-32', title: 'Venušin polibek', pose: 'side-facing', category: 'Oral', difficulty: 'Medium', xp: 30, description: { setup: 'Partneři leží proti sobě v pohodlné poloze.', focus: 'Vzájemné uspokojování a komunikace.', comfort: 'Začněte pomalu a střídejte tempo.' } },
  { id: 'kama-33', title: 'Královna', pose: 'top-facing', category: 'Rider', difficulty: 'Medium', xp: 32, description: { setup: 'Partnerka nahoře v dominantnější poloze.', focus: 'Kontrola rytmu a intenzity.', comfort: 'Držte stabilitu boků.' } },
  { id: 'kama-34', title: 'Noční objetí', pose: 'side-spoon', category: 'Soft', difficulty: 'Easy', xp: 14, description: { setup: 'Klasická poloha na lžičku.', focus: 'Blízkost a jemnost.', comfort: 'Vhodné i pro delší chvíle.' } },
  { id: 'kama-35', title: 'Hvězdný prach', pose: 'standing-mirror', category: 'Standing', difficulty: 'Hard', xp: 40, description: { setup: 'Poloha ve stoje s oporou.', focus: 'Silná chemie a kontakt očí.', comfort: 'Použijte zeď pro jistotu.' } },
  { id: 'kama-36', title: 'Samet', pose: 'edge-bed', category: 'Classic', difficulty: 'Easy', xp: 18, description: { setup: 'Ležící klasická pozice.', focus: 'Pomalý rytmus.', comfort: 'Uvolněte boky i stehna.' } },
  { id: 'kama-37', title: 'Polární záře', pose: 'side-facing', category: 'Romantic', difficulty: 'Medium', xp: 24, description: { setup: 'Bokem k sobě s propletenýma nohama.', focus: 'Mazlení a teasing.', comfort: 'Netlačte na ramena.' } },
  { id: 'kama-38', title: 'Tango', pose: 'standing-mirror', category: 'Standing', difficulty: 'Medium', xp: 34, description: { setup: 'Stojící poloha s těsným kontaktem.', focus: 'Rytmus a dominance.', comfort: 'Držte rovnováhu.' } },
  { id: 'kama-39', title: 'Čokoláda', pose: 'seated-face', category: 'Oral', difficulty: 'Easy', xp: 24, description: { setup: 'Pohodlné sezení nebo klek.', focus: 'Orální stimulace a teasing.', comfort: 'Používejte pohodlnou oporu.' } },
  { id: 'kama-40', title: 'Harmonie', pose: 'side-facing', category: 'Soft', difficulty: 'Easy', xp: 15, description: { setup: 'Klidná poloha bokem.', focus: 'Synchronizace pohybů.', comfort: 'Ideální pro pomalé tempo.' } },
  { id: 'kama-41', title: 'Mléčná dráha', pose: 'top-facing', category: 'Passion', difficulty: 'Hard', xp: 44, description: { setup: 'Aktivní poloha nahoře.', focus: 'Intenzita a rytmus.', comfort: 'Pravidelně měňte tempo.' } },
  { id: 'kama-42', title: 'Pokušení', pose: 'tabletop', category: 'Front', difficulty: 'Medium', xp: 30, description: { setup: 'Poloha na hraně postele nebo stolu.', focus: 'Hravost a vizuální kontakt.', comfort: 'Použijte stabilní povrch.' } },
  { id: 'kama-43', title: 'Karamel', pose: 'edge-bed', category: 'Oral', difficulty: 'Medium', xp: 28, description: { setup: 'Pohodlná poloha pro orální hrátky.', focus: 'Pomalejší intenzivní stimulace.', comfort: 'Komunikujte tempo.' } },
  { id: 'kama-44', title: 'Zen', pose: 'side-spoon', category: 'Soft', difficulty: 'Easy', xp: 12, description: { setup: 'Ležení za sebou.', focus: 'Relax a intimita.', comfort: 'Bez tlaku na záda.' } },
  { id: 'kama-45', title: 'Magnet', pose: 'seated-face', category: 'Romantic', difficulty: 'Medium', xp: 26, description: { setup: 'Sedící objetí čelem k sobě.', focus: 'Oční kontakt a blízkost.', comfort: 'Opřete se o čelo postele.' } },
  { id: 'kama-46', title: 'Pírko', pose: 'side-facing', category: 'Romantic', difficulty: 'Easy', xp: 14, description: { setup: 'Lehká a jemná poloha.', focus: 'Doteky a teasing.', comfort: 'Nechte tělo úplně uvolněné.' } },
  { id: 'kama-47', title: 'Bouře', pose: 'kneeling-arch', category: 'Passion', difficulty: 'Hard', xp: 46, description: { setup: 'Dynamická poloha zezadu.', focus: 'Silnější tempo.', comfort: 'Podložte kolena.' } },
  { id: 'kama-48', title: 'Vanilka', pose: 'edge-bed', category: 'Classic', difficulty: 'Easy', xp: 10, description: { setup: 'Jednoduchá pohodlná poloha.', focus: 'Pomalý kontakt.', comfort: 'Vhodné pro začátečníky.' } },
  { id: 'kama-49', title: 'Med', pose: 'side-facing', category: 'Oral', difficulty: 'Easy', xp: 22, description: { setup: 'Ležící poloha pro orální kontakt.', focus: 'Jemné tempo a teasing.', comfort: 'Pohodlný polštář pod hlavou.' } },
  { id: 'kama-50', title: 'Infinity', pose: 'top-facing', category: 'Rider', difficulty: 'Hard', xp: 48, description: { setup: 'Aktivní poloha s pohybem boků.', focus: 'Kontrola a intenzita.', comfort: 'Nepřetěžujte kolena.' } },

  {
    id: 'kama-1', title: 'Lotus', pose: 'seated-face', category: 'Romantic', difficulty: 'Medium', xp: 25,
    description: { setup: 'Partner sedí stabilně a partnerka se posadí do jeho klína čelem k němu.', focus: 'Pomalé tempo, objetí, líbání a oční kontakt.', comfort: 'Opřete záda o čelo postele nebo polštář.' },
  },
  {
    id: 'kama-2', title: 'Misionář', pose: 'edge-bed', category: 'Classic', difficulty: 'Easy', xp: 10,
    description: { setup: 'Partnerka leží na zádech a partner je nahoře mezi jejíma nohama.', focus: 'Blízkost tváří, snadná komunikace a pomalé ladění rytmu.', comfort: 'Polštář pod boky může zlepšit úhel a pohodlí.' },
  },
  {
    id: 'kama-3', title: 'Na pejska', pose: 'kneeling-arch', category: 'Passion', difficulty: 'Medium', xp: 25,
    description: { setup: 'Partnerka je na kolenou s oporou rukou, partner je za ní.', focus: 'Silnější energie, kontrola tempa a hlubší úhel.', comfort: 'Podložte kolena a průběžně komunikujte tempo.' },
  },
  {
    id: 'kama-4', title: 'Kovbojka', pose: 'top-facing', category: 'Passion', difficulty: 'Medium', xp: 30,
    description: { setup: 'Partner leží na zádech a partnerka sedí nahoře čelem k němu.', focus: 'Partnerka ovládá tempo, úhel a hloubku pohybu.', comfort: 'Ruce mohou být opřené o hrudník, stehna nebo matraci.' },
  },
  {
    id: 'kama-5', title: 'Obrácená kovbojka', pose: 'top-facing', category: 'Spicy', difficulty: 'Medium', xp: 35,
    description: { setup: 'Partner leží na zádech a partnerka sedí nahoře zády k němu.', focus: 'Vizuální teasing a jiný úhel kontaktu.', comfort: 'Začněte pomalu a držte stabilitu v kolenou.' },
  },
  {
    id: 'kama-6', title: 'Lžička', pose: 'side-spoon', category: 'Soft', difficulty: 'Easy', xp: 15,
    description: { setup: 'Oba leží na boku za sebou, partner je zezadu přitisknutý k partnerce.', focus: 'Jemnost, ranní intimita a dlouhý tělesný kontakt.', comfort: 'Polštář mezi koleny uleví kyčlím i bedrům.' },
  },
  {
    id: 'kama-7', title: 'Motýlek', pose: 'edge-bed', category: 'Passion', difficulty: 'Hard', xp: 40,
    description: { setup: 'Partnerka leží na kraji postele, partner stojí nebo klečí před ní.', focus: 'Přesnější kontrola úhlu a intenzity.', comfort: 'Stabilní okraj postele a podpora beder jsou zásadní.' },
  },
  {
    id: 'kama-8', title: 'Svíčka', pose: 'standing-mirror', category: 'Standing', difficulty: 'Medium', xp: 30,
    description: { setup: 'Oba stojí velmi blízko u sebe, těla jsou lehce natočená.', focus: 'Malé pohyby boků, kontakt rukama a spontánní energie.', comfort: 'Vhodné u zdi nebo zrcadla, aby byla opora jistá.' },
  },
  {
    id: 'kama-9', title: 'Háček', pose: 'standing-mirror', category: 'Standing', difficulty: 'Hard', xp: 38,
    description: { setup: 'Ve stoje se partnerka jednou nohou zahákne kolem partnera nebo se o něj opře.', focus: 'Těsné propojení, intenzivní kontakt a pocit spontánnosti.', comfort: 'Použijte zeď jako oporu a nepřetěžujte stojnou nohu.' },
  },
  {
    id: 'kama-10', title: 'Oheň', pose: 'standing-mirror', category: 'Standing', difficulty: 'Hard', xp: 45,
    description: { setup: 'Stojící varianta tváří v tvář, partner partnerku podpírá a vede její náklon.', focus: 'Vášnivá, taneční energie a silný vizuální kontakt.', comfort: 'Nedělejte zvedání bez jistoty a držte krátké intervaly.' },
  },
  {
    id: 'kama-11', title: 'Pevné objetí', pose: 'side-facing', category: 'Soft', difficulty: 'Easy', xp: 18,
    description: { setup: 'Ležíte na boku čelem nebo lehce bokem k sobě, těla jsou blízko.', focus: 'Mazlení, líbání, hlazení a pocit bezpečí.', comfort: 'Upravte ramena a kyčle tak, aby nikdo neležel na ruce.' },
  },
  {
    id: 'kama-12', title: 'Nekonečná slast', pose: 'side-facing', category: 'Side', difficulty: 'Medium', xp: 28,
    description: { setup: 'Bokem k sobě, jedna noha partnerky je výš nebo zachycená přes partnera.', focus: 'Hledání příjemného úhlu a pomalý, smyslný pohyb.', comfort: 'Netlačte na kyčle a nechte kolena volná.' },
  },
  {
    id: 'kama-13', title: 'Mexický styl', pose: 'seated-face', category: 'Rider', difficulty: 'Medium', xp: 28,
    description: { setup: 'Partner sedí v křesle nebo na pevné židli, partnerka si sedá do klína.', focus: 'Pohodlné vedení tempa partnerkou a volné ruce pro doteky.', comfort: 'Použijte stabilní židli bez koleček.' },
  },
  {
    id: 'kama-14', title: 'Vzdušný jezdec', pose: 'seated-face', category: 'Rider', difficulty: 'Hard', xp: 42,
    description: { setup: 'Partnerka nahoře více objímá partnera nohama a váha je částečně sdílená.', focus: 'Silný pocit propojení a větší fyzická intenzita.', comfort: 'Náročnější na sílu; držte krátce a bezpečně.' },
  },
  {
    id: 'kama-15', title: 'Španělský západ slunce', pose: 'top-facing', category: 'Rider', difficulty: 'Medium', xp: 34,
    description: { setup: 'Varianta nahoře zády k partnerovi, partner má dobrou oporu zad.', focus: 'Partnerka vede pohyb a partner má volné ruce pro doteky.', comfort: 'Držte plynulé tempo a chraňte kolena.' },
  },
  {
    id: 'kama-16', title: 'Šéfkuchař', pose: 'tabletop', category: 'Front', difficulty: 'Medium', xp: 30,
    description: { setup: 'Partnerka sedí na stabilním stole nebo hraně linky, partner stojí před ní.', focus: 'Hravost, změna prostředí a přímý kontakt tváří v tvář.', comfort: 'Povrch musí být pevný a bez kluzkých hran.' },
  },
  {
    id: 'kama-17', title: 'Zajetí', pose: 'edge-bed', category: 'Front', difficulty: 'Hard', xp: 40,
    description: { setup: 'Partnerka leží na okraji postele s boky blízko hrany, partner je před ní.', focus: 'Vášnivější úhel a pocit oddání se momentu.', comfort: 'Hlava, záda i krk musí mít bezpečnou oporu.' },
  },
  {
    id: 'kama-18', title: 'Ještěrky', pose: 'edge-bed', category: 'Front', difficulty: 'Easy', xp: 16,
    description: { setup: 'Oba jsou nízko u sebe v pohodlné ležící pozici.', focus: 'Klid, doteky, blízkost a minimum akrobacie.', comfort: 'Skvělé pro pomalé tempo a delší intimní chvíli.' },
  },
  {
    id: 'kama-19', title: 'Klapka', pose: 'kneeling-arch', category: 'Back', difficulty: 'Medium', xp: 30,
    description: { setup: 'Partnerka je níž a více schoulená, partner je za ní s oporou rukou.', focus: 'Zadní vstup s větší kontrolou tempa partnerem.', comfort: 'Nesmí tlačit na krk ani ramena; podložte kolena.' },
  },
  {
    id: 'kama-20', title: 'Krab', pose: 'side-facing', category: 'Back', difficulty: 'Medium', xp: 32,
    description: { setup: 'Těla jsou propletená bokem nebo zezadu s možností objímání.', focus: 'Smyslné vinutí těl, ruce volné pro hlazení.', comfort: 'Pomalé změny úhlu jsou lepší než prudký pohyb.' },
  },
  {
    id: 'kama-21', title: 'Líní psi', pose: 'edge-bed', category: 'Back', difficulty: 'Medium', xp: 28,
    description: { setup: 'Oba partneři jsou nízko u sebe, těla kopírují podobnou ležící pozici.', focus: 'Tělesná blízkost, pomalejší rytmus a kontakt celou vahou.', comfort: 'Horní partner nesmí tlačit celou vahou dolů.' },
  },
  {
    id: 'kama-22', title: 'Kruh 69', pose: 'side-facing', category: 'Oral', difficulty: 'Medium', xp: 35,
    description: { setup: 'Partneři jsou natočení proti sobě tak, aby se mohli vzájemně uspokojovat ústy.', focus: 'Vzájemnost, pomalé tempo a jasná komunikace.', comfort: 'Poloha na boku je bezpečnější a méně namáhavá než nahoře/dole.' },
  },
  {
    id: 'kama-23', title: 'Mořská panna', pose: 'edge-bed', category: 'Classic', difficulty: 'Medium', xp: 26,
    description: { setup: 'Partnerka leží s nohama více u sebe nebo lehce natočenými do strany.', focus: 'Těsnější kontakt a elegantnější, pomalejší pohyb.', comfort: 'Nevytáčejte kolena ani kyčle do bolesti.' },
  },
  {
    id: 'kama-24', title: 'Vodopád', pose: 'edge-bed', category: 'Advanced', difficulty: 'Hard', xp: 45,
    description: { setup: 'Ležící varianta na kraji postele s výraznějším náklonem těla.', focus: 'Pocit uvolnění a intenzivnější úhel.', comfort: 'Krk a záda musí být podepřené; není vhodné držet dlouho.' },
  },
  {
    id: 'kama-25', title: 'Bambusový výhonek', pose: 'edge-bed', category: 'Classic', difficulty: 'Medium', xp: 30,
    description: { setup: 'Partnerka leží na zádech a jedna noha je výš, opřená o partnera.', focus: 'Změna úhlu, lepší kontrola intenzity a blízký kontakt.', comfort: 'Noha musí být uvolněná, ne přetažená.' },
  },
  {
    id: 'kama-26', title: 'U zdi', pose: 'standing-mirror', category: 'Standing', difficulty: 'Hard', xp: 42,
    description: { setup: 'Partnerka se opírá o zeď, partner je těsně před nebo za ní.', focus: 'Spontánní, vášnivá energie a pevné držení.', comfort: 'Použijte zeď jako oporu, ne jako tlak do zad.' },
  },
  {
    id: 'kama-27', title: 'Houpačka', pose: 'seated-face', category: 'Rider', difficulty: 'Hard', xp: 44,
    description: { setup: 'Sedící varianta, kde partnerka v klíně mění rytmus dopředu a dozadu.', focus: 'Hravý pohyb, smích a experimentování s rytmem.', comfort: 'Potřebuje stabilní sed a dobrou rovnováhu.' },
  },
  {
    id: 'kama-28', title: 'Obkročmo', pose: 'top-facing', category: 'Rider', difficulty: 'Easy', xp: 20,
    description: { setup: 'Partnerka obkročí partnera nahoře nebo v sedě.', focus: 'Jednoduchá kontrola tempa a blízké doteky.', comfort: 'Nechte kolena volná a měňte úhel pánve.' },
  },
  {
    id: 'kama-29', title: 'Pravý úhel', pose: 'tabletop', category: 'Front', difficulty: 'Medium', xp: 34,
    description: { setup: 'Těla svírají výraznější úhel, typicky u hrany postele nebo stolu.', focus: 'Přesný kontakt a snadné vedení boků.', comfort: 'Vyberte stabilní výšku povrchu.' },
  },
  {
    id: 'kama-30', title: 'Tulipán', pose: 'side-facing', category: 'Romantic', difficulty: 'Easy', xp: 18,
    description: { setup: 'Ležící měkká pozice s nohama a rukama přirozeně propletenými.', focus: 'Romantika, pomalost a pocit bezpečí.', comfort: 'Vhodné pro delší chvíle bez velké námahy.' },
  },
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

function getChallengeStats(challenges, currentUserId) {
  const completed = challenges.filter((challenge) => challenge.completed);
  const coupleXp = completed.reduce((sum, challenge) => sum + (challenge.xp || 10), 0);
  const myXp = completed.filter((challenge) => challenge.completed_by === currentUserId).reduce((sum, challenge) => sum + (challenge.xp || 10), 0);
  const partnerXp = completed.filter((challenge) => challenge.completed_by && challenge.completed_by !== currentUserId).reduce((sum, challenge) => sum + (challenge.xp || 10), 0);
  const openXp = completed.filter((challenge) => !challenge.completed_by).reduce((sum, challenge) => sum + (challenge.xp || 10), 0);
  const currentTier = [...rewardTiers].reverse().find((tier) => coupleXp >= tier.minXp) || rewardTiers[0];
  const nextTier = rewardTiers.find((tier) => tier.minXp > coupleXp) || rewardTiers[rewardTiers.length - 1];
  const currentMin = currentTier.minXp;
  const nextMin = nextTier.minXp === currentMin ? currentMin + 1 : nextTier.minXp;
  const progress = Math.round(((coupleXp - currentMin) / Math.max(1, nextMin - currentMin)) * 100);

  const categoryScores = challengeCategories.filter((category) => category.id !== 'all').map((category) => ({
    ...category,
    xp: completed.filter((challenge) => challenge.category === category.id).reduce((sum, challenge) => sum + (challenge.xp || 10), 0),
  }));

  return { coupleXp, myXp, partnerXp, openXp, level: currentTier.level, title: currentTier.title, currentMin, nextMin, progress: Math.max(0, Math.min(100, progress)), categoryScores };
}

async function uploadToStorage(file, folder) {
  if (!supabase || !file) return null;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  return path;
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
  const [sortOrder, setSortOrder] = useState('newest');
  const [panicMode, setPanicMode] = useState(local.panicMode ?? true);
  const [vanishMode, setVanishMode] = useState(local.vanishMode ?? true);
  const [toast, setToast] = useState('');
  const [creatingCouple, setCreatingCouple] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const isBackendReady = Boolean(supabase);
  const selectedMood = moods.find((mood) => mood.id === selectedMoodId) || moods[0];
  const appClass = dark ? 'dark' : '';

  useEffect(() => {
    saveLocalState({ dark, activeTab, selectedMoodId, heat, closeness, panicMode, vanishMode });
    document.documentElement.classList.toggle('dark', Boolean(dark));
    document.body.classList.toggle('dark', Boolean(dark));
  }, [dark, activeTab, selectedMoodId, heat, closeness, panicMode, vanishMode]);

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
    if (!supabase || !couple?.id) return;

    const channel = supabase
      .channel(`couple-${couple.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `couple_id=eq.${couple.id}` }, () => loadPosts(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges', filter: `couple_id=eq.${couple.id}` }, () => loadChallenges(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kama_progress', filter: `couple_id=eq.${couple.id}` }, () => loadKamaProgress(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_status', filter: `couple_id=eq.${couple.id}` }, () => loadCoupleStatuses(couple.id))
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
      setCoupleAvatarUrl(activeCouple?.avatar_path ? await getSignedUrl(activeCouple.avatar_path) : null);

      if (activeCouple?.id) {
        await Promise.all([loadPosts(activeCouple.id), loadChallenges(activeCouple.id), loadKamaProgress(activeCouple.id), loadCoupleStatuses(activeCouple.id)]);
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

    const hydrated = await Promise.all((data || []).map(async (post) => ({ ...post, signedUrl: post.image_path ? await getSignedUrl(post.image_path) : null })));
    setPosts(hydrated);
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
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    setNotificationsEnabled(Notification.permission === 'granted' && Boolean(subscription));
  }

  async function enablePushNotifications() {
    if (!couple?.id || !session?.user?.id) return setToast('Nejdřív vytvoř nebo připoj pár.');
    if (!VAPID_PUBLIC_KEY) return setToast('Chybí VITE_VAPID_PUBLIC_KEY ve Vercel environment variables.');
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return setToast('Tenhle prohlížeč nepodporuje push notifikace.');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return setToast('Upozornění nejsou povolená. Povol je v nastavení prohlížeče.');

      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          couple_id: couple.id,
          user_id: session.user.id,
          subscription,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;
      setNotificationsEnabled(true);
      setToast('Mobilní upozornění jsou zapnutá.');
    } catch (error) {
      setToast(`Upozornění se nepodařilo zapnout: ${error.message}`);
    }
  }

  async function notifyPartner(eventType, title, body) {
    if (!couple?.id || !session?.user?.id) return;

    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          coupleId: couple.id,
          senderId: session.user.id,
          eventType,
          title,
          body,
          url: '/',
        },
      });
    } catch {
      // Notifikace nesmí blokovat hlavní akci v aplikaci.
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
      return;
    }

    setChallenges(data || []);
  }

  async function loadKamaProgress(coupleId) {
    const { data, error } = await supabase.from('kama_progress').select('*').eq('couple_id', coupleId);
    if (error) return setToast(error.message);

    const hydrated = await Promise.all((data || []).map(async (item) => ({ ...item, signedUrl: item.photo_path ? await getSignedUrl(item.photo_path) : null })));
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
      const avatarPath = await uploadToStorage(file, `${couple.id}/profile`);
      const { data, error } = await supabase
        .from('couples')
        .update({ avatar_path: avatarPath })
        .eq('id', couple.id)
        .select('*')
        .single();

      if (error) throw error;

      setCouple(data);
      setCoupleAvatarUrl(await getSignedUrl(avatarPath));
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
  }

  async function sendMessage() {
    if (!couple?.id || !message.trim()) return;
    const { error } = await supabase.from('posts').insert({ couple_id: couple.id, author_id: session.user.id, type: 'chat', text: message.trim() });
    if (error) return setToast(error.message);
    setMessage('');
    await loadPosts(couple.id);
  }

  async function addPhoto(file, options = {}) {
    if (!couple?.id) return setToast('Nejdřív vytvoř nebo připoj pár.');
    if (!file) return;
    try {
      const imagePath = await uploadToStorage(file, `${couple.id}/gallery`);
      const { error } = await supabase.from('posts').insert({
        couple_id: couple.id,
        author_id: session.user.id,
        type: 'photo',
        text: options.text?.trim() || 'Soukromá fotka v galerii',
        photo_category: options.photoCategory || (photoCategory === 'all' ? 'romantic' : photoCategory),
        image_path: imagePath,
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
  }

  async function updateChallenge(id, patch) {
    const normalizedPatch = patch.completed ? { ...patch, completed_by: session.user.id } : patch;
    const { error } = await supabase.from('challenges').update(normalizedPatch).eq('id', id);
    if (error) return setToast(error.message);
    await loadChallenges(couple.id);
  }

  async function toggleKama(positionId) {
    if (!couple?.id) return;
    const existing = kamaProgress.find((item) => item.position_id === positionId);
    if (existing) {
      await supabase.from('kama_progress').update({ completed: !existing.completed, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('kama_progress').insert({ couple_id: couple.id, position_id: positionId, completed: true });
    }
    await loadKamaProgress(couple.id);
  }

  async function uploadKamaPhoto(positionId, file) {
    if (!couple?.id || !file) return;
    try {
      const photoPath = await uploadToStorage(file, `${couple.id}/kamasutra`);
      const existing = kamaProgress.find((item) => item.position_id === positionId);
      if (existing) {
        await supabase.from('kama_progress').update({ photo_path: photoPath, completed: true, updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('kama_progress').insert({ couple_id: couple.id, position_id: positionId, photo_path: photoPath, completed: true });
      }
      await loadKamaProgress(couple.id);
    } catch (error) {
      setToast(error.message);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setCouple(null);
    setPosts([]);
    setChallenges([]);
    setKamaProgress([]);
    setCoupleStatuses([]);
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
          {activeTab === 'challenges' && <ChallengesPanel challenges={filteredChallenges} allChallenges={challenges} category={challengeCategory} setCategory={setChallengeCategory} addChallenge={addChallenge} updateChallenge={updateChallenge} stats={challengeStats} />}
          {activeTab === 'kamasutra' && <KamasutraPanel kamaProgress={kamaProgress} kamaFilter={kamaFilter} setKamaFilter={setKamaFilter} oralOnly={oralOnly} setOralOnly={setOralOnly} toggleKama={toggleKama} uploadKamaPhoto={uploadKamaPhoto} />}
          {activeTab === 'profile' && <ProfilePanel profile={profile} couple={couple} coupleAvatarUrl={coupleAvatarUrl} partnerName={partnerName} setPartnerName={setPartnerName} updateProfileName={updateProfileName} uploadCoupleAvatar={uploadCoupleAvatar} signOut={signOut} />}
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

function CompactHeader({ profile, couple, coupleAvatarUrl, dark, setDark, panicMode, setPanicMode, notificationsEnabled, enablePushNotifications, signOut }) {
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
  const ownMood = myLiveStatus?.mood_label ? getMoodByLabel(myLiveStatus.mood_label) : latestOwnMoodPost ? getMoodByLabel(latestOwnMoodPost.mood_label) : selectedMood;
  const partnerMood = partnerLiveStatus?.mood_label ? getMoodByLabel(partnerLiveStatus.mood_label) : latestPartnerMoodPost ? getMoodByLabel(latestPartnerMoodPost.mood_label) : null;
  const ownHeat = myLiveStatus?.heat ?? heat;
  const ownCloseness = myLiveStatus?.closeness ?? closeness;
  const partnerHeat = partnerLiveStatus?.heat ?? 0;
  const partnerCloseness = partnerLiveStatus?.closeness ?? 0;

  return (
    <>
      <section className="grid min-w-0 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <PartnerCard
          name={couple ? 'Partner/ka' : 'Čeká na spárování'}
          status={partnerLiveStatus ? `Aktualizováno ${formatDate(partnerLiveStatus.updated_at)}` : couple ? 'Čekám na první změnu' : 'Zadej párovací kód'}
          mood={partnerMood || selectedMood}
          heat={partnerHeat}
          closeness={partnerCloseness}
          note={latestPartnerMoodPost?.text || (couple ? 'Jakmile partner/ka změní náladu nebo teploměr, uvidíš to tady nahoře.' : 'Pár zatím není propojený.')}
          waiting={!couple || !partnerLiveStatus}
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

      <RelationshipOverview ownHeat={ownHeat} ownCloseness={ownCloseness} partnerHeat={partnerHeat} partnerCloseness={partnerCloseness} hasPartnerMood={Boolean(partnerLiveStatus)} />

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
              <MediaCard imageUrl={post.signedUrl} blurred={panicMode} expiresIn={vanishMode ? '24 h' : 'saved'} category={post.photo_category || 'photo'} openImage={openImage} compact />
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
              {post.type === 'photo' && <MediaCard imageUrl={post.signedUrl} blurred={panicMode} expiresIn={vanishMode ? '24 h' : 'saved'} category={post.photo_category || 'photo'} openImage={openImage} />}
            </>
          )}
        </article>
      ))}
    </div>
  );
}

function MediaCard({ blurred, expiresIn, category, imageUrl, openImage, compact = false }) {
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
        <div className="grid h-full place-items-center text-white"><Image size={48} /></div>
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

function ChallengesPanel({ challenges, allChallenges, category, setCategory, addChallenge, updateChallenge, stats }) {
  return <div className="grid gap-6"><Card><div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"><div><div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-black text-purple-700 dark:bg-purple-500/20 dark:text-purple-200"><Trophy size={16} /> Couple progression</div><h2 className="mt-3 text-3xl font-black">Level {stats.level}: {stats.title}</h2><p className="mt-2 text-gray-500 dark:text-gray-300">Plňte vlastní výzvy, sbírejte XP a soutěžte, kdo bude mít víc bodů.</p></div><div className="rounded-[2rem] bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-6 text-white shadow-xl"><div className="flex items-center justify-between"><div><div className="text-sm font-bold text-white/80">Souboj XP</div><div className="text-5xl font-black">{stats.myXp}:{stats.partnerXp}</div><div className="mt-1 text-xs font-bold text-white/80">Já vs Partner/ka</div></div><Award size={46} /></div><div className="mt-5 h-4 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white" style={{ width: `${stats.progress}%` }} /></div><div className="mt-2 flex justify-between text-xs font-bold text-white/80"><span>{stats.currentMin} XP</span><span>{stats.nextMin} XP</span></div></div></div></Card><section className="grid gap-6 lg:grid-cols-3"><Card><h3 className="flex items-center gap-2 text-xl font-black"><Star className="text-pink-500" /> Kategorie skóre</h3><div className="mt-5 space-y-4">{stats.categoryScores.map((score) => <div key={score.id}><div className="mb-2 flex justify-between text-sm font-bold"><span>{score.label}</span><span>{score.xp} XP</span></div><div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10"><div className={`h-full rounded-full bg-gradient-to-r ${score.color}`} style={{ width: `${Math.min(100, score.xp)}%` }} /></div></div>)}</div></Card><Card className="lg:col-span-2"><h3 className="flex items-center gap-2 text-xl font-black"><Gift className="text-purple-500" /> Odměny a levely</h3><div className="mt-5 grid gap-3 md:grid-cols-2">{rewardTiers.map((tier) => <div key={tier.level} className={`rounded-3xl border p-4 ${stats.coupleXp >= tier.minXp ? 'border-pink-200 bg-pink-50 dark:border-pink-500/30 dark:bg-pink-500/10' : 'border-gray-200 bg-white/70 opacity-60 dark:border-white/10 dark:bg-white/5'}`}><div className="text-sm font-black text-gray-500 dark:text-gray-300">Level {tier.level} · {tier.minXp} XP</div><h4 className="mt-1 text-lg font-black">{tier.title}</h4><p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{tier.reward}</p></div>)}</div></Card></section><ChallengeEditor addChallenge={addChallenge} /><Card><div className="mb-5 flex flex-wrap gap-2">{challengeCategories.map((item) => <PillButton key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</PillButton>)}</div><div className="grid gap-4 lg:grid-cols-2">{challenges.map((challenge) => <article key={challenge.id} className="rounded-3xl border border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 p-5 dark:border-white/10 dark:from-white/10 dark:to-white/5"><h4 className="text-lg font-black">{challenge.title}</h4><div className="mt-2 flex flex-wrap gap-2 text-sm"><span className="rounded-full bg-pink-500 px-3 py-1 font-bold text-white">{challenge.category}</span><span className="rounded-full bg-purple-500 px-3 py-1 font-bold text-white">+{challenge.xp || 10} XP</span><span className="rounded-full bg-white px-3 py-1 font-bold text-gray-700 dark:bg-white/10 dark:text-gray-200">{challenge.assigned_to ? 'Osobní výzva' : 'Otevřená výzva'}</span>{challenge.completed_by && <span className="rounded-full bg-emerald-500 px-3 py-1 font-bold text-white">Bod získán</span>}</div><div className="mt-4 flex gap-2"><button onClick={() => updateChallenge(challenge.id, { accepted: !challenge.accepted })} disabled={challenge.completed} className="flex-1 rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white disabled:opacity-40 dark:bg-white dark:text-gray-900">{challenge.accepted ? 'Odebrat' : 'Přijmout'}</button><button onClick={() => updateChallenge(challenge.id, { completed: true, accepted: true, completed_at: new Date().toISOString() })} disabled={challenge.completed} className="flex-1 rounded-2xl bg-pink-500 px-4 py-2 text-sm font-black text-white disabled:opacity-40">{challenge.completed ? 'Hotovo' : 'Splnit za sebe'}</button></div></article>)}</div></Card></div>;
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

function KamasutraPanel({ kamaProgress, kamaFilter, setKamaFilter, oralOnly, setOralOnly, toggleKama, uploadKamaPhoto }) {
  const completed = kamaProgress.filter((item) => item.completed).length;
  const progress = Math.round((completed / Math.max(1, kamaPositions.length)) * 100);
  const categories = ['all', ...new Set(kamaPositions.map((position) => position.category))];
  const filteredBase = kamaFilter === 'all' ? kamaPositions : kamaPositions.filter((position) => position.category === kamaFilter);
  const filtered = oralOnly ? filteredBase.filter((position) => position.category === 'Oral') : filteredBase;
  const progressById = Object.fromEntries(kamaProgress.map((item) => [item.position_id, item]));

  return <div className="grid gap-6"><Card><div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center"><div><div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-sm font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-200"><Heart size={16} /> Intimacy Explorer</div><h2 className="mt-4 text-4xl font-black">Kamasutra Journey</h2><p className="mt-3 max-w-2xl text-gray-500 dark:text-gray-300">Tracker poloh, fotek po splnění a společných vzpomínek uložený v cloudu.</p></div><div className="rounded-[2rem] bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 p-6 text-white shadow-2xl"><div className="text-sm font-bold text-white/80">Splněno</div><div className="mt-2 text-7xl font-black">{completed}</div><div className="text-lg font-bold text-white/80">z {kamaPositions.length} poloh</div><div className="mt-5 h-4 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} /></div></div></div></Card><div className="flex flex-wrap gap-2 items-center">{categories.map((category) => <PillButton key={category} active={kamaFilter === category} onClick={() => setKamaFilter(category)}>{category === 'all' ? 'Všechny' : category}</PillButton>)}<button onClick={() => setOralOnly(!oralOnly)} className={`rounded-2xl px-4 py-2 text-sm font-black transition ${oralOnly ? 'bg-fuchsia-500 text-white' : 'border border-gray-200 bg-white/80 dark:border-white/10 dark:bg-white/10'}`}>Pouze orální</button></div><section className="grid gap-6 lg:grid-cols-2">{filtered.map((position) => { const item = progressById[position.id]; return <Card key={position.id} className="overflow-hidden p-0"><div className="grid xl:grid-cols-[0.9fr_1.1fr]"><div className="bg-[#fff7f3] p-5 dark:bg-[#120d18]"><PoseGuide pose={position.pose} title={position.title} /></div><div className="p-6"><h3 className="text-2xl font-black">{position.title}</h3><div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-200">{position.difficulty}</span><span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700 dark:bg-purple-500/20 dark:text-purple-200">+{position.xp} XP</span></div><div className="mt-5 space-y-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300"><InstructionBlock number="1" title="Nastavení" text={position.description.setup} /><InstructionBlock number="2" title="Pohyb a tempo" text={position.description.focus} /><InstructionBlock number="3" title="Komfort a bezpečí" text={position.description.comfort} /></div><div className="mt-6 space-y-4"><button onClick={() => toggleKama(position.id)} className={`w-full rounded-2xl py-3 font-black transition ${item?.completed ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'}`}>{item?.completed ? '✓ Splněno' : 'Označit jako splněné'}</button>{item?.completed && <div className="rounded-3xl border border-pink-200 bg-pink-50 p-4 dark:border-pink-500/20 dark:bg-pink-500/10"><div className="mb-3 text-sm font-black text-pink-700 dark:text-pink-200">Vaše vzpomínka k poloze</div><label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-pink-300 px-4 py-6 text-center text-sm font-bold text-pink-600 hover:bg-pink-100 dark:border-pink-500/30 dark:text-pink-200"><input type="file" accept="image/*" className="hidden" onChange={(event) => uploadKamaPhoto(position.id, event.target.files?.[0])} />{item?.signedUrl ? 'Změnit fotku páru' : 'Přidat fotku páru'}</label>{item?.signedUrl && <img src={item.signedUrl} alt={position.title} className="mt-4 h-72 w-full rounded-3xl object-cover shadow-2xl" />}</div>}</div></div></div></Card>; })}</section></div>;
}

function InstructionBlock({ number, title, text }) {
  return <div className="rounded-3xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/5"><div className="flex items-start gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pink-500 text-sm font-black text-white">{number}</div><div><div className="font-black text-gray-900 dark:text-white">{title}</div><p className="mt-1">{text}</p></div></div></div>;
}

function PoseGuide({ pose, title }) {
  const guides = { 'seated-face': { icon: Heart, label: 'Romantická blízkost' }, 'side-spoon': { icon: Moon, label: 'Pomalá intimita' }, 'edge-bed': { icon: Flame, label: 'Intenzivní energie' }, 'standing-mirror': { icon: Sparkles, label: 'Flirt a teasing' }, 'top-facing': { icon: Trophy, label: 'Partnerka vede tempo' }, 'kneeling-arch': { icon: Flame, label: 'Silná intenzita' }, tabletop: { icon: Sparkles, label: 'Hravá změna prostředí' }, 'side-facing': { icon: Moon, label: 'Jemné propojení' } };
  const guide = guides[pose] || { icon: Heart, label: 'Intimní moment' };
  const Icon = guide.icon;
  return <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-inner dark:border-white/10 dark:bg-white/5"><div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 p-10 text-center dark:border-pink-500/20 dark:from-pink-500/5 dark:to-purple-500/5"><div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl dark:bg-white/10"><Icon className="text-pink-500" size={42} /></div><div className="mt-5 text-2xl font-black text-gray-900 dark:text-white">{title}</div><div className="mt-2 rounded-full bg-pink-100 px-4 py-2 text-sm font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-200">{guide.label}</div><p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600 dark:text-gray-300">Ikonový režim. Vlastní fotku můžete přidat po splnění.</p></div></div>;
}

function ProfilePanel({ profile, couple, coupleAvatarUrl, partnerName, setPartnerName, updateProfileName, uploadCoupleAvatar, signOut }) {
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
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <FeatureTile icon={ShieldCheck} title="Supabase RLS" text="Databáze používá Row Level Security a Storage policies podle ID páru, aby pár viděl jen vlastní data." />
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
