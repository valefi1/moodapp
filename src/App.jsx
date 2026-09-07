import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  AlertCircle,
  BatteryLow,
  CloudRain,
  Frown,
  ZapOff,
  Bell,
  CalendarDays,
  Camera,
  Clock,
  Dice5,
  ExternalLink,
  Eye,
  Flame,
  Gift,
  Heart,
  Image,
  Lock,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Moon,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  Video,
  Wand2,
  X,
} from 'lucide-react';
import { PostMediaCard } from './components/media/MediaCards';
import { DailyMomentGalleryArchive } from './features/moments/DailyMomentGalleryArchive';
import { decryptSignedUrlToObjectUrl, encryptFileForCouple } from './lib/crypto';
import { Card, EmptyState, PillButton, TextInput } from './components/ui/Primitives';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const LOCAL_KEY = 'moodsync-ui-v2';
const STORAGE_BUCKET = 'couple-media';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const ENC_KEY_SESSION = 'moodsync-e2ee-passphrase';
const ENC_KEY_DEVICE = 'moodsync-e2ee-passphrase-device';
const STATUS_NOTIFY_DELAY_MS = 1800;
const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_MOMENT_VIDEO_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_MOMENT_DURATION_SECONDS = 30;
const MAX_POSTS = 250;
const MEDIA_CONCURRENCY = 3;
const GALLERY_IMAGE_MAX_EDGE = 1600;
const AVATAR_IMAGE_MAX_EDGE = 800;

const moods = [
  { id: 'love', icon: Heart, label: 'Zamilovaný/á', color: 'from-pink-400 to-rose-500', tone: 'positive' },
  { id: 'calm', icon: Sparkles, label: 'V pohodě', color: 'from-sky-300 to-blue-400', tone: 'positive' },
  { id: 'hug', icon: Heart, label: 'Potřebuju obejmout', color: 'from-violet-300 to-purple-500', tone: 'soft' },
  { id: 'flirt', icon: Flame, label: 'Mám chuť flirtovat', color: 'from-fuchsia-400 to-pink-600', tone: 'spicy' },
  { id: 'hot', icon: Flame, label: 'Mega nadržený/á', color: 'from-orange-400 to-red-500', tone: 'spicy' },
  { id: 'close', icon: Users, label: 'Chci blízkost', color: 'from-emerald-300 to-teal-500', tone: 'soft' },
  { id: 'sad', icon: CloudRain, label: 'Smutný/á', color: 'from-blue-400 to-slate-600', tone: 'negative' },
  { id: 'tired', icon: BatteryLow, label: 'Unavený/á', color: 'from-amber-300 to-orange-500', tone: 'negative' },
  { id: 'drained', icon: ZapOff, label: 'Vyčerpaný/á', color: 'from-slate-400 to-gray-700', tone: 'negative' },
  { id: 'angry', icon: Frown, label: 'Naštvaný/á', color: 'from-red-500 to-orange-700', tone: 'negative' },
];

function getMoodByLabel(label) {
  if (label === 'Flirt mood') return moods.find((mood) => mood.id === 'flirt');
  return moods.find((mood) => mood.label === label) || moods[0];
}

function isStatusFresh(status) {
  if (!status?.updated_at) return false;
  return Date.now() - new Date(status.updated_at).getTime() < 24 * 60 * 60 * 1000;
}

const photoCategories = [
  { id: 'all', label: 'Všechny' },
  { id: 'boobs', label: 'Prsa' },
  { id: 'ass', label: 'Zadeček' },
  { id: 'dick', label: 'Penis' },
  { id: 'couple', label: 'Společné' },
  { id: 'lingerie', label: 'Prádlo' },
  { id: 'mirror', label: 'V zrcadle' },
  { id: 'romantic', label: 'Romantické' },
  { id: 'moments', label: 'Dnešní moment' },
];

const challengeCategories = [
  { id: 'all', label: 'Vše', color: 'from-pink-400 to-rose-500' },
  { id: 'romantic', label: 'Romantické', color: 'from-pink-400 to-rose-500' },
  { id: 'flirty', label: 'Flirt', color: 'from-fuchsia-400 to-pink-600' },
  { id: 'spicy', label: 'Odvážné', color: 'from-orange-400 to-red-500' },
  { id: 'deep', label: 'Hlubší rozhovor', color: 'from-violet-400 to-purple-600' },
  { id: 'fun', label: 'Zábava', color: 'from-sky-400 to-blue-500' },
];

const rewardTiers = [
  { level: 1, title: 'Nový pár', minXp: 0, reward: 'Odemčeno: denní check-in' },
  { level: 2, title: 'Jiskra', minXp: 50, reward: 'Odemčeno: odznak flirtu' },
  { level: 3, title: 'Chemie', minXp: 120, reward: 'Odemčeno: odvážnější výzvy' },
  { level: 4, title: 'Magnetismus', minXp: 220, reward: 'Odemčeno: Soukromé rituály' },
  { level: 5, title: 'Silný pár', minXp: 360, reward: 'Odemčeno: společný trezor intimity' },
];

const partnerDayCards = [
  {
    task: 'Udělej dnes pro partnera jeden malý, konkrétní skutek lásky: pomoc, zpráva, objetí, kompliment nebo 10 minut plné pozornosti.',
    xp: 10,
  },
];


const dailyStatusOptions = [
  { id: 'open', label: 'Jsem otevřený/á', icon: '🟢', message: 'Dnešní status: jsem otevřený/á blízkosti a kontaktu.' },
  { id: 'soft', label: 'Potřebuju jemnost', icon: '🟡', message: 'Dnešní status: potřebuju spíš jemnost, klid a trpělivost.' },
  { id: 'hug', label: 'Chci obejmout', icon: '🤗', message: 'Dnešní status: nejvíc by mi pomohlo objetí a blízkost.' },
  { id: 'flirt', label: 'Chci flirt', icon: '🔥', message: 'Dnešní status: mám chuť flirtovat a hrát si.' },
  { id: 'talk', label: 'Chci si promluvit', icon: '💬', message: 'Dnešní status: chtěl/a bych si v klidu promluvit.' },
  { id: 'quiet', label: 'Dnes jen klid', icon: '🔴', message: 'Dnešní status: dnes prosím jen klid, bez tlaku.' },
];

const eveningRitualItems = [
  { id: 'thermo', label: 'Nastavit teploměr', helper: 'Aktualizujte blízkost a chuť, ať se nemusíte dohadovat.' },
  { id: 'thanks', label: 'Jedna věc díky', helper: 'Napište jednu konkrétní věc, za kterou jste dnes vděční.' },
  { id: 'touch', label: '10 minut pro nás', helper: 'Domluvte si krátký čas bez mobilu, jen pro vás dva.' },
];

const chatReactions = ['❤️', '🔥', '🥺', '😘', '🤗', '😂'];

const dailyMomentPrompts = [
  'Potěš mě něč hezkým, co mi dnes chceš ukázat.',
  'Vzruš mě pohledem, úsměvem nebo krátkým vzkazem.',
  'Ukaž mi, jak bys mě dnes chtěl/a nalákat k sobě.',
  'Pošli mi malý tajný moment jen pro mě.',
  'Co bys mi dnes udělal/a, kdybych byl/a právě vedle tebe?',
  'Navnadíš mě na naše příští společné chvíle?',
  'Ukaž mi svou dnešní nejvíc sexy náladu.',
];

const supportedMomentMimeTypes = new Set(['video/webm', 'video/mp4', 'video/quicktime', 'video/x-m4v']);

const wishCategories = [
  { id: 'experience', label: 'Chci zažít', prefix: 'Chci zažít' },
  { id: 'get', label: 'Chci dostat', prefix: 'Chci dostat' },
  { id: 'try', label: 'Chci vyzkoušet', prefix: 'Chci vyzkoušet' },
  { id: 'know', label: 'Chci, abys věděl/a', prefix: 'Chci, abys věděl/a' },
];

const surpriseIdeas = [
  { type: 'Otázka', text: 'Jaký malý dotek nebo gesto ti nejvíc dává pocit, že jsem tu pro tebe?' },
  { type: 'Mini výzva', text: 'Pošli partnerovi jeden kompliment a jednu věc, na kterou se spolu těšíš.' },
  { type: 'Romantika', text: 'Dejte si dnes večer deset minut jen objetí, bez telefonu a bez řešení povinností.' },
  { type: 'Flirt', text: 'Pošli partnerovi nenápadnou flirtovací zprávu během dne.' },
  { type: 'Kamasutra tip', text: 'Vyberte jednu romantickou nebo začátečnickou polohu a označte ji jako plán na později.' },
];

function getTodaySeed() {
  const today = getLocalDateKey();
  return today.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRecentDateKeys(days = 7) {
  return new Set(Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return getLocalDateKey(date);
  }));
}

function normalizeSearchText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const LOVINO_KAMASUTRA_URLS = {
  vodnar: 'https://www.lovino.cz/polohy/vodnar',
  kyvadlo: 'https://www.lovino.cz/polohy/kyvadlo',
  misionar: 'https://www.lovino.cz/polohy/misionarska-poloha',
  'na-pejska': 'https://www.lovino.cz/polohy/na-pejska',
  lzicka: 'https://www.lovino.cz/polohy/lzicka',
  kovbojka: 'https://www.lovino.cz/polohy/kovbojka',
  'obracena-kovbojka': 'https://www.lovino.cz/polohy/obracena-kovbojka',
  'morska-panna': 'https://www.lovino.cz/polohy/morska-panna',
  most: 'https://www.lovino.cz/polohy/most',
  sefkuchar: 'https://www.lovino.cz/polohy/sefkuchar',
  hacek: 'https://www.lovino.cz/polohy/hacek',
  ohen: 'https://www.lovino.cz/polohy/ohen',
  'pevne-objeti': 'https://www.lovino.cz/polohy/pevne-objeti',
  tulipan: 'https://www.lovino.cz/polohy/tulipan',
  krab: 'https://www.lovino.cz/polohy/krab',
  klapka: 'https://www.lovino.cz/polohy/klapka',
  houpacka: 'https://www.lovino.cz/polohy/houpacka',
  'mexicky-styl': 'https://www.lovino.cz/polohy/mexicky-styl',
  'vzdusny-jezdec': 'https://www.lovino.cz/polohy/vzdusny-jezdec',
  'spanelsky-zapad-slunce': 'https://www.lovino.cz/polohy/spanelsky-zapad-slunce',
  amazonka: 'https://www.lovino.cz/polohy/amazonka',
};

function getLovinoKamasutraSlug(position) {
  return normalizeSearchText(position?.title || '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createLovinoKamasutraUrl(position) {
  const slug = getLovinoKamasutraSlug(position);
  return LOVINO_KAMASUTRA_URLS[slug] || 'https://www.lovino.cz/kamasutra';
}

function hasVerifiedLovinoPositionUrl(position) {
  return Boolean(LOVINO_KAMASUTRA_URLS[getLovinoKamasutraSlug(position)]);
}

function getPartnerDayCard() {
  return partnerDayCards[getTodaySeed() % partnerDayCards.length];
}

function getDailyMomentPrompt() {
  const localDate = getLocalDateKey();
  const seed = localDate.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return dailyMomentPrompts[seed % dailyMomentPrompts.length];
}

function getRelationshipScoreData({ ownCloseness, ownHeat, partnerCloseness, partnerHeat, posts, challenges }) {
  const recentPosts = posts.filter((post) => Date.now() - new Date(post.created_at).getTime() < 7 * 24 * 60 * 60 * 1000).length;
  const completedChallenges = challenges.filter((challenge) => challenge.completed).length;
  const activeChallenges = challenges.filter((challenge) => challenge.challenge_status === 'active').length;
  const closenessScore = Math.round(((Number(ownCloseness) || 0) + (Number(partnerCloseness) || 0)) / 2);
  const heatBalance = Math.max(0, 100 - Math.abs((Number(ownHeat) || 0) - (Number(partnerHeat) || 0)));
  const activityScore = Math.min(100, recentPosts * 8 + completedChallenges * 6 + activeChallenges * 4);
  const score = Math.round(closenessScore * 0.55 + heatBalance * 0.2 + activityScore * 0.25);
  const trend = Math.max(-12, Math.min(18, Math.round((recentPosts + completedChallenges) / 2) - 3));
  return { score: Math.max(0, Math.min(100, score)), trend };
}

function buildRelationshipHistory(posts, ownCloseness, partnerCloseness, ownHeat, partnerHeat) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = getLocalDateKey(date);
    const dayPosts = posts.filter((post) => String(post.created_at || '').startsWith(key));
    const moodPosts = dayPosts.filter((post) => post.type === 'mood');
    const activityBoost = Math.min(20, dayPosts.length * 4);
    const base = Math.round(((ownCloseness || 0) + (partnerCloseness || 0) + (100 - Math.abs((ownHeat || 0) - (partnerHeat || 0)))) / 3);
    const moodBoost = Math.min(15, moodPosts.length * 5);
    return {
      label: date.toLocaleDateString('cs-CZ', { weekday: 'short' }),
      value: Math.max(8, Math.min(100, base + activityBoost + moodBoost - (6 - index) * 2)),
    };
  });
  return days;
}

const starterChallenges = [
  { title: 'Pošli partnerovi tři konkrétní věci, kterých si na něm dnes vážíš.', category: 'romantic', difficulty: 'Easy', xp: 12 },
  { title: 'Připrav partnerovi malou pozornost bez očekávání odměny.', category: 'romantic', difficulty: 'Easy', xp: 14 },
  { title: 'Dejte si 15 minut bez mobilu jen na sebe.', category: 'deep', difficulty: 'Easy', xp: 15 },
  { title: 'Zeptej se partnera, co by mu dnes udělalo radost, a jednu věc opravdu udělej.', category: 'deep', difficulty: 'Medium', xp: 18 },
  { title: 'Naplánuj mini rande nebo společný rituál na tento týden.', category: 'fun', difficulty: 'Medium', xp: 16 },
  { title: 'Pošli partnerovi hravou zprávu, která mu zlepší den.', category: 'flirty', difficulty: 'Easy', xp: 10 },
  { title: 'Dopřej partnerovi masáž, objetí nebo jiný příjemný dotek podle jeho nálady.', category: 'romantic', difficulty: 'Medium', xp: 18 },
  { title: 'Řekněte si navzájem jednu věc, kterou chcete ve vztahu zažívat častěji.', category: 'deep', difficulty: 'Medium', xp: 20 },
  { title: 'Vyber společnou aktivitu z wishlistu a domluv konkrétní termín.', category: 'fun', difficulty: 'Easy', xp: 12 },
  { title: 'Vymysli partnerovi bezpečnou flirtovací výzvu na večer.', category: 'flirty', difficulty: 'Medium', xp: 16 },
];

function normalizeStarterChallenge(challenge, coupleId) {
  return {
    couple_id: coupleId,
    title: challenge.title,
    category: challenge.category,
    difficulty: challenge.difficulty,
    xp: challenge.xp,
    assigned_to: null,
    accepted: false,
    completed: false,
  };
}

const kamaPositions = [
  { id: 'kama-1', title: 'Vodnář', pose: 'edge-bed', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 32, tag: 'Vizuální', description: { setup: 'Partnerka si lehne na záda blíž k okraji postele, zvedne boky a podepře si bedra rukama nebo polštářem. Partner klečí mezi jejími nohami a rukama jí pomáhá držet stabilní náklon pánve.', focus: 'Poloha je zaměřená na výraznější úhel, dobrý výhled na partnera a pomalé vedení pohybu. Začněte v menším rozsahu a společně najděte bod, kde je kontakt příjemný pro oba.', comfort: 'Podložte bedra a nenechávejte váhu jen na krku. Pokud začne bolet spodní část zad, snižte boky nebo přejděte do jednodušší varianty.' } },
  { id: 'kama-2', title: 'Kyvadlo', pose: 'top-facing', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 30, tag: 'Romantické', description: { setup: 'Partner leží na zádech s mírně pokrčenými koleny. Partnerka si lehne nebo posadí nahoře čelem k němu, jednu ruku má opřenou o podložku a druhou o jeho hrudník.', focus: 'Partnerka přebírá vedení a pohybuje se spíš plynule dopředu a dozadu než rychle nahoru a dolů. Hodí se jako odpočinková poloha mezi fyzicky náročnějšími pozicemi.', comfort: 'Držte pohyb nízko a měkce. Partner může pomáhat jemným vedením boků, ale tempo by měla určovat partnerka.' } },
  { id: 'kama-3', title: 'Lotus', pose: 'seated-face', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 28, tag: 'Romantické', description: { setup: 'Partner sedí opřený o čelo postele nebo zeď. Partnerka si sedne do jeho klína čelem k němu a nohama ho obejme kolem pasu nebo boků.', focus: 'Tahle poloha je hlavně o blízkosti, polibcích a očním kontaktu. Pohyb je menší, pomalejší a hodí se pro chvíle, kdy chcete být spíš propojení než výkonní.', comfort: 'Záda podepřete polštáři a držte rovná ramena. Pokud začnou bolet kyčle, uvolněte nohy a změňte úhel sedu.' } },
  { id: 'kama-4', title: 'Misionář', pose: 'edge-bed', category: 'Vaginální', type: 'Vaginální', difficulty: 'Začátečníci', xp: 12, tag: 'Romantické', description: { setup: 'Partnerka leží na zádech a partner je nad ní tváří v tvář. Váhu drží na rukou nebo předloktích, aby zůstala poloha pohodlná.', focus: 'Je to nejjednodušší poloha pro líbání, komunikaci a střídání tempa. Dobře funguje, když chcete pomalý start a snadno číst reakce druhého.', comfort: 'Polštář pod boky může pomoci s úhlem. Horní partner by neměl tlačit celou vahou dolů.' } },
  { id: 'kama-5', title: 'Motýlek', pose: 'edge-bed', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 34, tag: 'Vášnivé', description: { setup: 'Partnerka leží na okraji postele s boky blízko hrany. Partner stojí nebo klečí před ní a drží její boky nebo stehna.', focus: 'Poloha umožní přesnější práci s úhlem a tempem. Hodí se pro chvíle, kdy chcete víc intenzity, ale stále dobrou stabilitu.', comfort: 'Okraj postele musí být pevný. Podložte bedra a domluvte si signál pro zpomalení.' } },
  { id: 'kama-6', title: 'Na pejska', pose: 'kneeling-arch', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 30, tag: 'Vášnivé', description: { setup: 'Partnerka klečí na všech čtyřech nebo se opírá o předloktí. Partner klečí za ní a drží ji za boky, aby mohl bezpečně vést rytmus.', focus: 'Pozice je energičtější a nabízí silnější fyzický kontakt. Dobře funguje, když oba chtějí jasnější rytmus a výraznější vedení.', comfort: 'Podložte kolena a nepřetěžujte zápěstí. Začněte pomalu a pravidelně se ptejte na intenzitu.' } },
  { id: 'kama-7', title: 'Lžička', pose: 'side-spoon', category: 'Vaginální', type: 'Vaginální', difficulty: 'Začátečníci', xp: 16, tag: 'Romantické', description: { setup: 'Oba leží na boku za sebou. Zadní partner se přitiskne k partnerce a obejme ji přes pas nebo hrudník.', focus: 'Jemná a pohodlná poloha pro ráno, večer nebo chvíle, kdy chcete intimitu bez velké námahy. Pohyb je malý a plynulý.', comfort: 'Polštář mezi koleny uvolní boky. Dávejte pozor, aby nikdo neležel na ruce.' } },
  { id: 'kama-8', title: 'Kovbojka', pose: 'top-facing', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 30, tag: 'Vášnivé', description: { setup: 'Partner leží na zádech a partnerka sedí nahoře čelem k němu. Může být vzpřímená nebo se lehce předklonit.', focus: 'Partnerka má kontrolu nad tempem a úhlem. Partner může pomáhat rukama na bocích, ale vedení by mělo zůstat na ní.', comfort: 'Nepřetěžujte kolena. Pomůže opora rukama o hrudník partnera nebo matraci.' } },
  { id: 'kama-9', title: 'Obrácená kovbojka', pose: 'top-facing', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 34, tag: 'Vizuální', description: { setup: 'Partner leží na zádech a partnerka sedí nahoře zády k němu. Ruce může opřít o jeho stehna nebo o postel.', focus: 'Tahle varianta nabízí jiný úhel a silnější vizuální teasing. Pohyb by měl být plynulý a kontrolovaný.', comfort: 'Vyhněte se prudkým pohybům dozadu. Pokud se objeví tlak v kolenou nebo bedrech, změňte sklon.' } },
  { id: 'kama-10', title: 'Bambusový výhonek', pose: 'edge-bed', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 28, tag: 'Hravé', description: { setup: 'Partnerka leží na zádech a jednu nohu zvedne výš, například na rameno partnera nebo vedle jeho těla. Druhá noha zůstává uvolněná.', focus: 'Změna polohy nohy upraví úhel a může zintenzivnit kontakt. Hodí se pro pomalé zkoušení toho, co je příjemné.', comfort: 'Noha nesmí být přetažená. Pokud tahá kyčel nebo stehno, položte ji níž.' } },
  { id: 'kama-11', title: 'Mořská panna', pose: 'edge-bed', category: 'Vaginální', type: 'Vaginální', difficulty: 'Začátečníci', xp: 22, tag: 'Soft', description: { setup: 'Partnerka leží na zádech s nohama blíž u sebe a boky lehce natočenými. Partner je nad ní nebo před ní podle výšky postele.', focus: 'Těsnější kontakt a pomalejší tempo vytváří elegantnější, klidnější pocit. Hodí se pro pomalé večerní chvíle.', comfort: 'Nevytáčejte kolena do bolesti. Malé změny úhlu často stačí.' } },
  { id: 'kama-12', title: 'Most', pose: 'edge-bed', category: 'Vaginální', type: 'Vaginální', difficulty: 'Pokročilé', xp: 44, tag: 'Akčnější', description: { setup: 'Partnerka zvedne boky do mírného mostu a opírá se o ramena, chodidla a případně ruce. Partner klečí nebo stojí před ní.', focus: 'Pozice je fyzicky náročnější a nabízí výrazný náklon pánve. Používejte ji spíš krátce a jako intenzivní variaci.', comfort: 'Nezatěžujte krk. Jakmile bolí bedra, snižte boky nebo použijte polštář.' } },
  { id: 'kama-13', title: 'Šéfkuchař', pose: 'tabletop', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 30, tag: 'Hravé', description: { setup: 'Partnerka sedí na stabilní hraně stolu, linky nebo postele. Partner stojí před ní a oba se drží za boky nebo ramena.', focus: 'Změna prostředí přidává hravost a přímý výhled na partnera. Tempo se dobře reguluje díky pevnému povrchu.', comfort: 'Povrch musí být stabilní a nesmí klouzat. Pozor na ostré hrany.' } },
  { id: 'kama-14', title: 'Pravý úhel', pose: 'tabletop', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 32, tag: 'Vizuální', description: { setup: 'Partnerka leží nebo sedí na hraně vyvýšené plochy a partner stojí před ní tak, aby těla vytvořila přirozený úhel.', focus: 'Poloha dává dobrou kontrolu nad vzdáleností a výškou. Funguje dobře pro pomalejší i intenzivnější rytmus.', comfort: 'Vyberte správnou výšku povrchu. Když partner musí stát na špičkách nebo se hrbit, poloha nebude pohodlná.' } },
  { id: 'kama-15', title: 'U zdi', pose: 'standing-mirror', category: 'Vaginální', type: 'Vaginální', difficulty: 'Pokročilé', xp: 40, tag: 'Akčnější', description: { setup: 'Partnerka se opírá zády nebo předloktím o zeď. Partner stojí těsně u ní a rukama pomáhá držet boky ve stabilní poloze.', focus: 'Spontánní poloha s výraznou vášní a blízkostí. Nejlépe funguje krátce, jako rychlá a intenzivní varianta.', comfort: 'Použijte zeď pro stabilitu, ne pro tlak do zad. Nezkoušejte zvedání bez jistoty.' } },
  { id: 'kama-16', title: 'Tango', pose: 'standing-mirror', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 32, tag: 'Hravé', description: { setup: 'Oba stojí tváří v tvář nebo lehce bokem. Těla jsou blízko a pohyb připomíná pomalý tanec.', focus: 'Důležitý je rytmus, ruce na bocích a flirt. Poloha je víc o chemii a pohledu než o síle.', comfort: 'Držte pohyby malé. Stabilní podlaha a opora rukou jsou základ.' } },
  { id: 'kama-17', title: 'Háček', pose: 'standing-mirror', category: 'Vaginální', type: 'Vaginální', difficulty: 'Pokročilé', xp: 38, tag: 'Akčnější', description: { setup: 'Ve stoje se partnerka jednou nohou jemně zahákne kolem partnera nebo si ji opře o jeho bok. Partner ji drží za pas.', focus: 'Pozice vytváří velmi těsný kontakt a intenzivní pocit blízkosti. Hodí se spíš na kratší chvíle.', comfort: 'Nepřetěžujte stojnou nohu. Pokud ztrácíte rovnováhu, vraťte se ke zdi nebo sedící variantě.' } },
  { id: 'kama-18', title: 'Oheň', pose: 'standing-mirror', category: 'Vaginální', type: 'Vaginální', difficulty: 'Pokročilé', xp: 42, tag: 'Vášnivé', description: { setup: 'Stojící varianta s pevnou oporou, kde partner vede boky partnerky a drží ji blízko u sebe.', focus: 'Silná energie, rychlejší přechod do vášně a intenzivní vizuální kontakt. Udržujte pohyb kontrolovaný.', comfort: 'Krátké intervaly jsou lepší než dlouhé držení. Vyhněte se zvedání, pokud si nejste jistí stabilitou.' } },
  { id: 'kama-19', title: 'Pevné objetí', pose: 'side-facing', category: 'Vaginální', type: 'Vaginální', difficulty: 'Začátečníci', xp: 18, tag: 'Romantické', description: { setup: 'Ležíte na boku čelem k sobě a nohy máte volně propletené. Ruce zůstávají volné pro objetí.', focus: 'Poloha podporuje mazlení, líbání a klidný rytmus. Hodí se pro intimní rozhovor i pomalý sex.', comfort: 'Najděte polohu ramen, kde nikomu nebrní ruce. Polštář pod hlavou pomůže krku.' } },
  { id: 'kama-20', title: 'Nekonečná slast', pose: 'side-facing', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 28, tag: 'Romantické', description: { setup: 'Oba leží bokem k sobě, jedna noha partnerky může být výš přes partnerův bok nebo stehno.', focus: 'Pomalé hledání správného úhlu je hlavní součástí polohy. Pohyb je menší, ale velmi kontaktní.', comfort: 'Kyčle držte uvolněné. Pokud tahá stehno, položte nohu níž.' } },
  { id: 'kama-21', title: 'Tulipán', pose: 'side-facing', category: 'Vaginální', type: 'Vaginální', difficulty: 'Začátečníci', xp: 18, tag: 'Romantické', description: { setup: 'Ležící poloha, kde se těla přirozeně proplétají a partneři zůstávají velmi blízko.', focus: 'Vhodná pro něhu, pomalý rytmus a dlouhé doteky. Nevyžaduje velkou flexibilitu.', comfort: 'Nechte kolena měkká a pravidelně měňte stranu, aby se nepřetěžovaly boky.' } },
  { id: 'kama-22', title: 'Krab', pose: 'side-facing', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 30, tag: 'Hravé', description: { setup: 'Těla jsou částečně bokem a částečně proti sobě, nohy jsou propletené tak, aby vznikl stabilní úhel.', focus: 'Poloha je hravá a vyžaduje trochu hledání. Odměnou je těsný kontakt a netradiční pocit.', comfort: 'Nespěchejte s nastavením. Když se nohy pletou nebo tahají kyčle, zjednodušte pozici.' } },
  { id: 'kama-23', title: 'Klapka', pose: 'kneeling-arch', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 30, tag: 'Vášnivé', description: { setup: 'Partnerka je v nižším kleku s oporou loktů nebo hrudníku o polštář. Partner klečí za ní.', focus: 'Nižší poloha umožní pevnější kontakt a jasnější vedení tempa. Je vhodná pro vášnivější chvíle.', comfort: 'Nesmí tlačit krk ani ramena. Polštář pod hrudníkem a koleny výrazně pomůže.' } },
  { id: 'kama-24', title: 'Líní psi', pose: 'edge-bed', category: 'Vaginální', type: 'Vaginální', difficulty: 'Začátečníci', xp: 20, tag: 'Soft', description: { setup: 'Oba partneři jsou nízko u sebe na posteli, těla kopírují podobnou ležící pozici a nejsou v napětí.', focus: 'Tahle poloha je pohodlnější varianta zezadu, vhodná pro pomalý rytmus a těsný kontakt.', comfort: 'Horní partner nesmí tlačit celou vahou. Používejte polštáře pod boky a hrudník.' } },
  { id: 'kama-25', title: 'Houpačka', pose: 'seated-face', category: 'Vaginální', type: 'Vaginální', difficulty: 'Pokročilé', xp: 40, tag: 'Hravé', description: { setup: 'Partner sedí stabilně a partnerka je v jeho klíně. Pohyb vychází hlavně z pánve a z jemného přenášení váhy.', focus: 'Poloha působí jako pomalé houpání a je vhodná pro hravější páry. Důležitá je rovnováha a důvěra.', comfort: 'Použijte pevnou židli nebo okraj postele. Pokud ztrácíte stabilitu, přejděte do klasického Lotusu.' } },
  { id: 'kama-26', title: 'Mexický styl', pose: 'seated-face', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 26, tag: 'Hravé', description: { setup: 'Partner sedí na pevné židli nebo v křesle a partnerka si sedá do jeho klína čelem nebo lehce bokem.', focus: 'Dobrá poloha pro flirt, smích a kontrolu tempa partnerkou. Ruce zůstávají volné pro doteky.', comfort: 'Židle musí být stabilní a bez koleček. Chodidla mějte na zemi.' } },
  { id: 'kama-27', title: 'Vzdušný jezdec', pose: 'seated-face', category: 'Vaginální', type: 'Vaginální', difficulty: 'Pokročilé', xp: 44, tag: 'Akčnější', description: { setup: 'Partnerka v klíně partnera více zapojuje nohy a trup, jako by se nadlehčovala a znovu dosedala.', focus: 'Poloha je fyzicky výraznější a dává pocit intenzivní kontroly. Funguje krátce jako hravá varianta.', comfort: 'Nedržte dlouho. Pokud bolí stehna nebo bedra, snižte pohyb a vraťte se do stabilního sedu.' } },
  { id: 'kama-28', title: 'Španělský západ slunce', pose: 'top-facing', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 34, tag: 'Vizuální', description: { setup: 'Partner leží nebo sedí opřený a partnerka je nahoře zády nebo bokem k němu, podle pohodlí.', focus: 'Partnerka vede rytmus a partner má volné ruce pro jemné vedení boků. Hodí se pro vizuální teasing.', comfort: 'Pohyb držte plynulý a chraňte kolena. Dlouhé setrvání může být únavné.' } },
  { id: 'kama-29', title: 'Amazonka', pose: 'top-facing', category: 'Vaginální', type: 'Vaginální', difficulty: 'Pokročilé', xp: 46, tag: 'Vášnivé', description: { setup: 'Partner je níž a partnerka nahoře v aktivnější, sebevědomé poloze s výraznou kontrolou pohybu.', focus: 'Hodí se pro páry, které chtějí vyměnit vedení a dát iniciativu partnerce. Důležitá je stabilita a komunikace.', comfort: 'Náročnější na stehna a kolena. Dělejte pauzy a opírejte ruce o podložku.' } },
  { id: 'kama-30', title: 'Kolébka', pose: 'seated-face', category: 'Vaginální', type: 'Vaginální', difficulty: 'Začátečníci', xp: 20, tag: 'Romantické', description: { setup: 'Oba sedí blízko u sebe, partnerka je v klíně nebo těsně před partnerem a těla se drží v objetí.', focus: 'Velmi něžná varianta pro pomalou intimitu a dlouhé polibky. Pohyb je spíš jemné kolébání.', comfort: 'Záda opřete o polštáře a držte ramena uvolněná.' } },
  { id: 'kama-31', title: 'Kruh 69', pose: 'side-facing', category: 'Orální', type: 'Orální', difficulty: 'Středně pokročilé', xp: 32, tag: 'Orální', description: { setup: 'Oba partneři si lehnou na bok proti sobě v opačném směru tak, aby měl každý pohodlný přístup k intimní oblasti druhého. Boková varianta je stabilnější než ležení jeden na druhém.', focus: 'Jde o vzájemnou orální pozornost, kde je důležitá komunikace a schopnost zpomalit. Začněte spíš jemně a průběžně reagujte na signály partnera.', comfort: 'Použijte polštář pod hlavu a nenechávejte krk v nepříjemném úhlu. Pokud se jeden z vás nemůže soustředit, střídejte se místo současného tempa.' } },
  { id: 'kama-32', title: 'Venušin polibek', pose: 'side-facing', category: 'Orální', type: 'Orální', difficulty: 'Začátečníci', xp: 24, tag: 'Orální', description: { setup: 'Partnerka leží pohodlně na zádech nebo na boku s lehce pokrčenými koleny. Partner se uloží mezi její stehna nebo vedle ní tak, aby nemusel ohýbat krk.', focus: 'Poloha je vhodná pro pomalý orální teasing, kdy má přijímající partner dost prostoru se uvolnit a dávat zpětnou vazbu.', comfort: 'Podložte kolena nebo boky polštářem. Partner, který dává pozornost, by měl mít opřená ramena a možnost kdykoliv změnit úhel.' } },
  { id: 'kama-33', title: 'Jantar', pose: 'edge-bed', category: 'Orální', type: 'Orální', difficulty: 'Začátečníci', xp: 22, tag: 'Orální', description: { setup: 'Přijímající partner leží u okraje postele, boky jsou blízko hrany a nohy volně pokrčené. Druhý partner sedí nebo klečí před postelí v pohodlné výšce.', focus: 'Výhodou je stabilita a dobrý přístup bez nutnosti složitě držet tělo. Hodí se pro delší, pomalejší orální stimulaci.', comfort: 'Podložte kolena partnera, který klečí. Hrana postele nesmí tlačit do stehen nebo beder.' } },
  { id: 'kama-34', title: 'Čokoláda', pose: 'seated-face', category: 'Orální', type: 'Orální', difficulty: 'Začátečníci', xp: 24, tag: 'Orální', description: { setup: 'Jeden partner sedí opřený nebo leží v polosedu. Druhý partner klečí nebo sedí níž před ním tak, aby měl pohodlnou oporu rukou a zad.', focus: 'Poloha je hravá a dobře kombinuje orální pozornost s doteky na stehnech, břiše a bocích. Tempo by mělo zůstat komunikované.', comfort: 'Neseďte v poloze, která nutí krk do ostrého úhlu. Když je potřeba, použijte polštář pod kolena.' } },
  { id: 'kama-35', title: 'Med', pose: 'side-facing', category: 'Orální', type: 'Orální', difficulty: 'Začátečníci', xp: 20, tag: 'Orální', description: { setup: 'Oba leží na boku, jeden partner přijímá a druhý se nastaví níž tak, aby mohl pohodlně dávat pozornost bez tlaku na krk.', focus: 'Měkká, klidná orální poloha vhodná pro pomalý začátek. Díky ležení na boku působí méně náročně a intimněji.', comfort: 'Hlava a krk musí mít dobrou oporu. Pokud se úhel nedaří, přesuňte se blíž k okraji postele.' } },
  { id: 'kama-36', title: 'Karamel', pose: 'edge-bed', category: 'Orální', type: 'Orální', difficulty: 'Středně pokročilé', xp: 28, tag: 'Orální', description: { setup: 'Přijímající partner leží s boky podloženými polštářem. Druhý partner klečí před ním a může si opřít ruce o postel pro stabilitu.', focus: 'Podložení boků mění úhel a usnadňuje plynulejší orální pozornost. Funguje pro delší, soustředěnější chvíle.', comfort: 'Polštář nesmí tlačit do beder. Střídejte tlak, tempo a přestávky.' } },
  { id: 'kama-37', title: 'Perla', pose: 'seated-face', category: 'Orální', type: 'Orální', difficulty: 'Středně pokročilé', xp: 30, tag: 'Orální', description: { setup: 'Přijímající partner sedí na stabilní hraně postele nebo židle. Druhý partner klečí před ním a má volné ruce pro jemné držení stehen.', focus: 'Pozice je velmi kontaktní a umožňuje oční kontakt i slovní vedení. Hodí se pro páry, které chtějí víc teasingu.', comfort: 'Použijte měkkou podložku pod kolena. Pokud přijímající partner sedí příliš vysoko, snižte výšku nebo změňte místo.' } },
  { id: 'kama-38', title: 'Orchidej', pose: 'side-facing', category: 'Orální', type: 'Orální', difficulty: 'Středně pokročilé', xp: 30, tag: 'Orální', description: { setup: 'Partnerka leží na zádech s jednou nohou mírně do strany nebo přes rameno partnera, pokud je to pohodlné. Partner je níž mezi stehny.', focus: 'Poloha poskytuje lepší přístup a stále umožňuje doteky rukama. Tempo by mělo být jemné a řízené reakcemi.', comfort: 'Noha nesmí být v nepříjemném tahu. Pokud je kyčel napjatá, položte nohu níž nebo na polštář.' } },
  { id: 'kama-39', title: 'Něžná vlna', pose: 'side-spoon', category: 'Vaginální', type: 'Vaginální', difficulty: 'Začátečníci', xp: 16, tag: 'Soft', description: { setup: 'Varianta lžičky, kde zadní partner drží partnerku jednou rukou přes pas a druhou nechává volnou pro doteky.', focus: 'Pomalé, opakované pohyby vytvářejí pocit bezpečí a tělesného tepla. Dobré pro uvolněný večer.', comfort: 'Nepřetáčejte horní část těla. Pokud rameno tlačí, změňte stranu.' } },
  { id: 'kama-40', title: 'Hvězda', pose: 'side-facing', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 26, tag: 'Hravé', description: { setup: 'Partneři leží částečně proti sobě a částečně do úhlu, nohy jsou volně rozevřené jako hvězda.', focus: 'Pozice umožňuje experimentovat s náklonem pánve a vzdáleností těl. Hodí se pro hravé hledání.', comfort: 'Nechte dost prostoru pro kolena a nepřetěžujte kyčle.' } },
  { id: 'kama-41', title: 'Sfinga', pose: 'kneeling-arch', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 30, tag: 'Vizuální', description: { setup: 'Partnerka leží na břiše nebo nízko na předloktích s pánví lehce zvednutou. Partner je za ní v kleku.', focus: 'Nízký úhel vytváří těsný kontakt a pomalejší, smyslnější rytmus. Je méně akrobatická než klasický klek zezadu.', comfort: 'Podložte břicho nebo boky polštářem a nechte krk v neutrální poloze.' } },
  { id: 'kama-42', title: 'Tanečnice', pose: 'standing-mirror', category: 'Vaginální', type: 'Vaginální', difficulty: 'Pokročilé', xp: 40, tag: 'Hravé', description: { setup: 'Stojíte blízko u sebe, partnerka se jednou rukou opírá o zeď nebo partnera a druhou může obejmout jeho krk.', focus: 'Poloha je o pohybu, flirtu a rytmu. Nejde o velký rozsah, spíš o kontrolované malé kroky.', comfort: 'Neklouzavá podlaha je nutná. Pokud se ztratí rovnováha, vraťte se k posteli.' } },
  { id: 'kama-43', title: 'Vlaštovka', pose: 'edge-bed', category: 'Vaginální', type: 'Vaginální', difficulty: 'Pokročilé', xp: 42, tag: 'Akčnější', description: { setup: 'Partnerka leží na zádech a nohy drží výš, opřené o partnera nebo pokrčené směrem k hrudníku. Partner klečí před ní.', focus: 'Výraznější úhel a otevřenější nastavení těla vytváří intenzivnější variantu. Používejte ji krátce.', comfort: 'Netahejte kolena k hrudníku silou. Pokud je tlak v bedrech, snižte nohy.' } },
  { id: 'kama-44', title: 'Kompas', pose: 'side-facing', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 28, tag: 'Hravé', description: { setup: 'Partneři leží do mírného úhlu, jeden více na zádech a druhý bokem. Nohy se nastaví tak, aby nevznikal tah v kyčlích.', focus: 'Poloha je vhodná pro páry, které chtějí zkoušet nové úhly bez velké fyzické námahy.', comfort: 'Nechte si čas na nastavení. Když úhel nesedí, změňte pozici nohou.' } },
  { id: 'kama-45', title: 'Samet', pose: 'edge-bed', category: 'Vaginální', type: 'Vaginální', difficulty: 'Začátečníci', xp: 18, tag: 'Romantické', description: { setup: 'Partnerka leží pohodlně na zádech, partner je nad ní a oba zůstávají v blízkém kontaktu.', focus: 'Samet je pomalá, jednoduchá poloha pro něhu, líbání a pozvolný rytmus.', comfort: 'Podložte hlavu i boky a držte tempo spíš měkké než silové.' } },
  { id: 'kama-46', title: 'Bouře', pose: 'kneeling-arch', category: 'Vaginální', type: 'Vaginální', difficulty: 'Pokročilé', xp: 46, tag: 'Vášnivé', description: { setup: 'Dynamická varianta zezadu, kde je partnerka stabilně opřená o ruce nebo o polštáře a partner má pevné postavení v kleku.', focus: 'Silnější rytmus, jasná komunikace a větší fyzická energie. Hodí se pro páry, které už znají své hranice.', comfort: 'Podložte kolena a zápěstí. Pravidelně zpomalte, aby se poloha nestala nepříjemnou.' } },
  { id: 'kama-47', title: 'Magnet', pose: 'seated-face', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 26, tag: 'Romantické', description: { setup: 'Sedící poloha čelem k sobě, kde se partneři drží velmi blízko a pohyb vychází hlavně z pánve.', focus: 'Silný oční kontakt a pomalé tempo. Poloha působí intimně a velmi partnersky.', comfort: 'Opřete záda a nechte nohy volnější, aby netuhly kyčle.' } },
  { id: 'kama-48', title: 'Pokušení', pose: 'tabletop', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 30, tag: 'Vizuální', description: { setup: 'Partnerka sedí na pevné hraně, partner stojí před ní a ruce zůstávají na bocích, stehnech nebo kolem krku.', focus: 'Hravá poloha s přímým výhledem a rychlou změnou atmosféry. Dobrá pro flirt a spontánnost.', comfort: 'Zkontrolujte stabilitu nábytku a dejte pozor na hrany.' } },
  { id: 'kama-49', title: 'Noční objetí', pose: 'side-spoon', category: 'Vaginální', type: 'Vaginální', difficulty: 'Začátečníci', xp: 14, tag: 'Romantické', description: { setup: 'Lžičková varianta s hlubším objetím přes pas nebo hrudník. Těla zůstávají blízko a v teple.', focus: 'Ideální před spaním, po náročném dni nebo pro pomalé probouzení touhy.', comfort: 'Udržujte ramena měkká a ruce položte tak, aby nebrněly.' } },
  { id: 'kama-50', title: 'Polární záře', pose: 'side-facing', category: 'Vaginální', type: 'Vaginální', difficulty: 'Středně pokročilé', xp: 24, tag: 'Romantické', description: { setup: 'Ležení bokem s propletenýma nohama a možností lehce měnit náklon pánve.', focus: 'Romantická poloha pro pomalé objevování, mazlení a teasing. Každá malá změna úhlu může působit jinak.', comfort: 'Netlačte na ramena a kyčle. Pokud poloha začne být složitá, vraťte se k jednoduchému objetí.' } }
];

const navItems = [
  { id: 'home', label: 'Dnes', icon: Heart },
  { id: 'chat', label: 'Chat', icon: Send },
  { id: 'gallery', label: 'Fotky', icon: Image },
  { id: 'challenges', label: 'Hry', icon: Flame },
  { id: 'more', label: 'Více', icon: Sparkles },
];

const secondaryTabs = [
  { id: 'moments', label: 'Dnešní moment', icon: Video },
  { id: 'feed', label: 'Deník páru', icon: MessageCircle },
  { id: 'kamasutra', label: 'Kamasutra', icon: Heart },
  { id: 'profile', label: 'Profil', icon: User },
];

const validTabIds = new Set([...navItems, ...secondaryTabs].map((item) => item.id));

function getInitialActiveTab(fallback = 'home') {
  if (typeof window === 'undefined') return fallback;
  const tabFromUrl = new URLSearchParams(window.location.search).get('tab');
  return validTabIds.has(tabFromUrl) ? tabFromUrl : fallback;
}

function createPairCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `LOVE-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
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
  if (!value) return 'bez termínu';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'bez termínu';
  return new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
}


function formatTimeLeft(value) {
  if (!value) return 'bez termínu';
  const diff = new Date(value).getTime() - Date.now();
  if (Number.isNaN(diff)) return 'bez termínu';
  if (diff <= 0) return 'termín vypršel';
  const minutes = Math.ceil(diff / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours < 24) return restMinutes ? `${hours} h ${restMinutes} min` : `${hours} h`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days} d ${restHours} h` : `${days} d`;
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

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalonePwa() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null;

  const existing = await navigator.serviceWorker.getRegistration('/');
  const registration = existing || await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none',
  });

  try {
    await registration.update();
  } catch {
    // Aktualizace SW není kritická pro zapnutí notifikací.
  }

  return await navigator.serviceWorker.ready;
}

function getPushEndpoint(subscription) {
  return subscription?.endpoint || subscription?.toJSON?.().endpoint || '';
}


async function getFunctionErrorMessage(error) {
  if (!error) return 'neznámá chyba';

  try {
    if (error.context && typeof error.context.json === 'function') {
      const payload = await error.context.json();
      return payload?.error || payload?.message || JSON.stringify(payload);
    }
  } catch {
    // Supabase FunctionsHttpError může mít body čitelné jen jednou.
  }

  return error.message || String(error);
}

function isMismatchedVapidError(error) {
  const message = `${error?.name || ''} ${error?.message || ''}`.toLowerCase();
  return message.includes('applicationserverkey')
    || message.includes('different application server key')
    || message.includes('registration failed')
    || message.includes('invalidstateerror');
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

function getChallengeStats(challenges, currentUserId, partnerDayCompletions = []) {
  const completed = challenges.filter((challenge) => challenge.completed);
  const activeDuels = challenges.filter((challenge) => challenge.challenge_status === 'active');
  const failedDuels = challenges.filter((challenge) => ['failed', 'debt_assigned'].includes(challenge.challenge_status));
  const repaidDuels = challenges.filter((challenge) => challenge.challenge_status === 'debt_repaid');

  const completedXpFor = (userId) => completed
    .filter((challenge) => challenge.completed_by === userId)
    .reduce((sum, challenge) => sum + (challenge.xp || 10), 0)
    + partnerDayCompletions
      .filter((item) => item.user_id === userId)
      .reduce((sum, item) => sum + (item.xp || 0), 0);

  const penaltyFor = (userId) => failedDuels
    .filter((challenge) => challenge.assigned_to === userId)
    .reduce((sum, challenge) => sum + (challenge.penalty_points || challenge.xp || 10), 0);

  const repaidFor = (userId) => repaidDuels
    .filter((challenge) => challenge.assigned_to === userId)
    .reduce((sum, challenge) => sum + (challenge.penalty_points || challenge.xp || 10), 0);

  const myXp = completedXpFor(currentUserId) - penaltyFor(currentUserId) + repaidFor(currentUserId);
  const partnerIds = [...new Set([
    ...challenges.flatMap((challenge) => [challenge.completed_by, challenge.assigned_to, challenge.challenged_by]).filter(Boolean),
    ...partnerDayCompletions.map((item) => item.user_id).filter(Boolean),
  ])].filter((id) => id !== currentUserId);
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

async function optimizeImageForUpload(file, maxEdge = GALLERY_IMAGE_MAX_EDGE) {
  if (!file || !String(file.type || '').startsWith('image/')) return file;
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
    if (!blob || (scale === 1 && blob.size >= file.size)) return file;
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'fotka';
    return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: file.lastModified });
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
  }
}

async function uploadToStorage(file, folder, options = {}) {
  if (!supabase || !file) return null;
  if (!String(file.type || '').startsWith('image/')) throw new Error('Vybraný soubor není podporovaný obrázek.');
  if (file.size > MAX_IMAGE_SIZE_BYTES) throw new Error('Fotka je příliš velká. Maximální velikost je 15 MB.');
  const optimizedFile = await optimizeImageForUpload(file, options.maxEdge);
  const safeName = optimizedFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  let uploadFile = optimizedFile;
  let uploadName = safeName;
  let encryption = { encrypted: false, encryptionIv: null, mimeType: optimizedFile.type || null };

  if (options.encrypt) {
    if (!options.coupleId || !options.passphrase) throw new Error('Nejdřív nastav společné E2EE heslo v profilu.');
    const encrypted = await encryptFileForCouple(optimizedFile, options.coupleId, options.passphrase);
    uploadFile = encrypted.blob;
    uploadName = `${safeName}.enc`;
    encryption = { encrypted: true, encryptionIv: encrypted.iv, mimeType: encrypted.mimeType };
  }

  const path = `${folder}/${crypto.randomUUID()}-${uploadName}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, uploadFile, {
    cacheControl: '3600',
    upsert: false,
    contentType: encryption.encrypted ? 'application/octet-stream' : optimizedFile.type,
  });
  if (error) throw error;
  return { path, ...encryption };
}

async function getSignedUrl(path) {
  if (!supabase || !path) return null;
  const { data } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 5);
  return data?.signedUrl || null;
}

function getMomentMediaKind(file) {
  const mimeType = String(file?.type || '').toLowerCase().split(';')[0];
  if (mimeType.startsWith('image/')) return 'image';
  if (supportedMomentMimeTypes.has(mimeType)) return 'video';
  return null;
}

function getStoredMomentMediaKind(moment) {
  if (moment?.media_kind === 'image' || moment?.media_kind === 'video') return moment.media_kind;
  const mimeType = String(moment?.media_mime_type || moment?.video_mime_type || '').toLowerCase();
  return mimeType.startsWith('image/') ? 'image' : 'video';
}

function getMomentStoragePath(moment) {
  return moment?.media_path || moment?.video_path || null;
}

function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Délku videa se nepodařilo ověřit. Zkus jiné video.'));
    }, 10000);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = video.duration;
      window.clearTimeout(timeout);
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error('Délku videa se nepodařilo ověřit. Zkus jiné video.'));
      } else {
        resolve(duration);
      }
    };
    video.onerror = () => {
      window.clearTimeout(timeout);
      cleanup();
      reject(new Error('Video se nepodařilo načíst. Zkontroluj jeho formát.'));
    };
    video.src = objectUrl;
  });
}

async function validateMomentMedia(file, durationHint = null) {
  const mimeType = String(file?.type || '').toLowerCase().split(';')[0];
  const kind = getMomentMediaKind(file);
  if (!file || !kind) {
    throw new Error('Použij fotku nebo video ve formátu WebM, MP4, MOV či M4V.');
  }
  if (kind === 'image') {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('Fotka je příliš velká. Maximální velikost je 15 MB.');
    }
    return { kind, mimeType, duration: null };
  }
  if (file.size > MAX_MOMENT_VIDEO_SIZE_BYTES) {
    throw new Error('Video je příliš velké. Maximální velikost je 25 MB.');
  }
  const duration = Number.isFinite(durationHint) && durationHint > 0 ? durationHint : await readVideoDuration(file);
  if (duration > MAX_MOMENT_DURATION_SECONDS + 0.25) {
    throw new Error('Dnešní moment může mít nejvýše 30 sekund.');
  }
  return { kind, mimeType, duration: Math.min(MAX_MOMENT_DURATION_SECONDS, Math.max(0.1, duration)) };
}

function getSafeRedgifsEmbedUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || !['redgifs.com', 'www.redgifs.com'].includes(hostname)) return null;
    if (!/^\/ifr\/[a-z0-9]+\/?$/i.test(url.pathname)) return null;
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function getSafeRedgifsSourceUrl(value, externalId = '') {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol === 'https:' && ['redgifs.com', 'www.redgifs.com'].includes(hostname) && /^\/watch\/[a-z0-9]+\/?$/i.test(url.pathname)) {
      url.username = '';
      url.password = '';
      url.search = '';
      url.hash = '';
      return url.toString();
    }
  } catch {
    // A safe canonical source can still be built from the validated RedGIFs id.
  }
  return /^[a-z0-9]+$/i.test(externalId) ? `https://www.redgifs.com/watch/${externalId.toLowerCase()}` : null;
}

export default function App() {
  const local = getLocalState();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [dark, setDark] = useState(local.dark ?? true);
  const [activeTab, setActiveTab] = useState(getInitialActiveTab(local.activeTab || 'home'));
  const [profile, setProfile] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [couple, setCouple] = useState(null);
  const [coupleAvatarUrl, setCoupleAvatarUrl] = useState(null);
  const [partnerName, setPartnerName] = useState('');
  const [pairCodeInput, setPairCodeInput] = useState('');
  const [posts, setPosts] = useState([]);
  const [coupleStatuses, setCoupleStatuses] = useState([]);
  const [coupleMembers, setCoupleMembers] = useState([]);
  const [dailyMoments, setDailyMoments] = useState([]);
  const [dailyMomentsLoading, setDailyMomentsLoading] = useState(false);
  const [dailyMomentsError, setDailyMomentsError] = useState('');
  const [challenges, setChallenges] = useState([]);
  const [kamaProgress, setKamaProgress] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [partnerDayCompletions, setPartnerDayCompletions] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [surpriseCard, setSurpriseCard] = useState(null);
  const [selectedMoodId, setSelectedMoodId] = useState(local.selectedMoodId || 'love');
  const [heat, setHeat] = useState(local.heat ?? 50);
  const [closeness, setCloseness] = useState(local.closeness ?? 70);
  const [thought, setThought] = useState('');
  const [message, setMessage] = useState('');
  const [photoCategory, setPhotoCategory] = useState('all');
  const [challengeCategory, setChallengeCategory] = useState('all');
  const [kamaFilter, setKamaFilter] = useState('all');
  const [kamaSearch, setKamaSearch] = useState('');
  const [oralOnly, setOralOnly] = useState(false);
  const [kamaDifficultyFilter, setKamaDifficultyFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [panicMode, setPanicMode] = useState(local.panicMode ?? true);
  const [toast, setToast] = useState('');
  const [e2eePrompt, setE2eePrompt] = useState('');
  const [creatingCouple, setCreatingCouple] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [encryptionPassphrase, setEncryptionPassphrase] = useState(() => sessionStorage.getItem(ENC_KEY_SESSION) || localStorage.getItem(ENC_KEY_DEVICE) || '');
  const statusNotifyTimers = useRef({});
  const postMediaCache = useRef(new Map());
  const dailyMomentMediaCache = useRef(new Map());
  const postLoadVersion = useRef(0);

  const isBackendReady = Boolean(supabase);
  const selectedMood = moods.find((mood) => mood.id === selectedMoodId) || moods[0];
  const appClass = dark ? 'dark' : '';
  const encryptionReady = Boolean(couple?.id && encryptionPassphrase);

  useEffect(() => () => {
    Object.values(statusNotifyTimers.current).forEach((timer) => window.clearTimeout(timer));
    statusNotifyTimers.current = {};
  }, []);

  function showE2eePrompt(context = 'fotky') {
    setE2eePrompt(context);
    setToast('Fotku jsem nenahrál/a: nejdřív aktivuj společné E2EE heslo v profilu.');
  }

  useEffect(() => {
    saveLocalState({ dark, activeTab, selectedMoodId, heat, closeness, panicMode });
    document.documentElement.classList.toggle('dark', Boolean(dark));
    document.body.classList.toggle('dark', Boolean(dark));
  }, [dark, activeTab, selectedMoodId, heat, closeness, panicMode]);

  useEffect(() => () => {
    postMediaCache.current.forEach((url) => {
      if (String(url || '').startsWith('blob:')) URL.revokeObjectURL(url);
    });
    postMediaCache.current.clear();
    dailyMomentMediaCache.current.forEach((url) => {
      if (String(url || '').startsWith('blob:')) URL.revokeObjectURL(url);
    });
    dailyMomentMediaCache.current.clear();
  }, []);

  useEffect(() => () => {
    kamaProgress.forEach((item) => {
      if (String(item.signedUrl || '').startsWith('blob:')) URL.revokeObjectURL(item.signedUrl);
    });
  }, [kamaProgress]);

  useEffect(() => () => {
    if (String(coupleAvatarUrl || '').startsWith('blob:')) URL.revokeObjectURL(coupleAvatarUrl);
  }, [coupleAvatarUrl]);

  useEffect(() => {
    const tabFromUrl = new URLSearchParams(window.location.search).get('tab');
    if (tabFromUrl && validTabIds.has(tabFromUrl)) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    getServiceWorkerRegistration().catch(() => {
      // Service Worker registrace není kritická pro načtení aplikace.
    });
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession || null);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    loadCloudData();
    checkNotificationState();
    // Both functions intentionally use the current authenticated session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  useEffect(() => {
    if (!couple?.id) return;
    postMediaCache.current.forEach((url) => {
      if (String(url || '').startsWith('blob:')) URL.revokeObjectURL(url);
    });
    postMediaCache.current.clear();
    dailyMomentMediaCache.current.forEach((url) => {
      if (String(url || '').startsWith('blob:')) URL.revokeObjectURL(url);
    });
    dailyMomentMediaCache.current.clear();
    loadPosts(couple.id);
    loadDailyMoments(couple.id);
    loadKamaProgress(couple.id);
    if (couple.avatar_path) loadCoupleAvatar(couple);
    // Media must be rehydrated whenever the active encryption key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encryptionPassphrase, couple?.id]);

  useEffect(() => {
    if (!supabase || !couple?.id) return;

    const channel = supabase
      .channel(`couple-${couple.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `couple_id=eq.${couple.id}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setPosts((current) => current.filter((post) => post.id !== payload.old?.id));
          return;
        }
        if (payload.new?.id) {
          mergePostRecord(payload.new);
          hydratePostMedia(payload.new, couple.id, postLoadVersion.current);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges', filter: `couple_id=eq.${couple.id}` }, () => loadChallenges(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kama_progress', filter: `couple_id=eq.${couple.id}` }, () => loadKamaProgress(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_status', filter: `couple_id=eq.${couple.id}` }, () => loadCoupleStatuses(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_members', filter: `couple_id=eq.${couple.id}` }, () => loadCoupleMembers(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_wishlist', filter: `couple_id=eq.${couple.id}` }, () => loadWishlistItems(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_milestones', filter: `couple_id=eq.${couple.id}` }, () => loadMilestones(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_day_completions', filter: `couple_id=eq.${couple.id}` }, () => loadPartnerDayCompletions(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_moments', filter: `couple_id=eq.${couple.id}` }, () => loadDailyMoments(couple.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_moment_ratings' }, () => loadDailyMoments(couple.id))
      .subscribe();

    return () => supabase.removeChannel(channel);
    // Subscriptions are scoped to the current couple; handlers read fresh app state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id]);

  async function loadCloudData() {
    if (!supabase || !session?.user) return;
    setLoading(true);
    try {
      const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      const userProfile = existingProfile || await createProfile();
      setProfile(userProfile);
      setProfileName(userProfile.display_name || '');

      const { data: membership } = await supabase
        .from('couple_members')
        .select('couple_id, couples(*)')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const activeCouple = membership?.couples || null;
      setCouple(activeCouple);
      setPartnerName('');
      setCoupleAvatarUrl(activeCouple?.avatar_path ? await getCoupleAvatarUrl(activeCouple) : null);

      if (activeCouple?.id) {
        await Promise.all([loadChallenges(activeCouple.id), loadCoupleStatuses(activeCouple.id), loadCoupleMembers(activeCouple.id), loadPartnerDisplayName(activeCouple.id), loadWishlistItems(activeCouple.id), loadMilestones(activeCouple.id), loadPartnerDayCompletions(activeCouple.id)]);
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
    setProfileName(data.display_name || '');
  }

  function mergePostRecord(nextPost) {
    if (!nextPost?.id) return;
    setPosts((current) => {
      const existing = current.find((post) => post.id === nextPost.id);
      const merged = existing?.image_path === nextPost.image_path
        ? { ...existing, ...nextPost }
        : { ...nextPost, signedUrl: null, locked: Boolean(nextPost.encrypted && !encryptionPassphrase), mediaLoading: Boolean(nextPost.image_path) };
      return [merged, ...current.filter((post) => post.id !== nextPost.id)]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    });
  }

  async function hydratePostMedia(post, coupleId, loadVersion) {
    if (!post?.image_path) return;
    const cacheKey = `${post.image_path}:${encryptionPassphrase || 'no-key'}`;
    const cachedUrl = postMediaCache.current.get(cacheKey);
    if (cachedUrl) {
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, signedUrl: cachedUrl, locked: false, mediaLoading: false } : item));
      return;
    }
    if (post.encrypted && !encryptionPassphrase) {
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, signedUrl: null, locked: true, mediaLoading: false } : item));
      return;
    }

    try {
      const rawSignedUrl = await getSignedUrl(post.image_path);
      let displayUrl = rawSignedUrl;
      if (post.encrypted && rawSignedUrl) {
        displayUrl = await decryptSignedUrlToObjectUrl(rawSignedUrl, coupleId, encryptionPassphrase, post.encryption_iv, post.mime_type);
      }
      if (loadVersion !== postLoadVersion.current) {
        if (String(displayUrl || '').startsWith('blob:')) URL.revokeObjectURL(displayUrl);
        return;
      }
      if (displayUrl) postMediaCache.current.set(cacheKey, displayUrl);
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, signedUrl: displayUrl, locked: !displayUrl, mediaLoading: false } : item));
    } catch {
      if (loadVersion !== postLoadVersion.current) return;
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, signedUrl: null, locked: true, mediaLoading: false } : item));
    }
  }

  async function hydratePostsMedia(sourcePosts, coupleId, loadVersion) {
    const mediaPosts = sourcePosts.filter((post) => post.image_path);
    let index = 0;
    const worker = async () => {
      while (index < mediaPosts.length && loadVersion === postLoadVersion.current) {
        const post = mediaPosts[index];
        index += 1;
        await hydratePostMedia(post, coupleId, loadVersion);
      }
    };
    await Promise.all(Array.from({ length: Math.min(MEDIA_CONCURRENCY, mediaPosts.length) }, worker));
  }

  async function loadPosts(coupleId) {
    const loadVersion = ++postLoadVersion.current;
    setPostsLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })
      .limit(MAX_POSTS);
    if (loadVersion !== postLoadVersion.current) return;
    if (error) {
      setPostsLoading(false);
      return setToast(error.message);
    }

    const sourcePosts = (data || []).map((post) => ({
      ...post,
      signedUrl: null,
      locked: Boolean(post.encrypted && !encryptionPassphrase),
      mediaLoading: Boolean(post.image_path),
    }));
    setPosts(sourcePosts);
    setHasMorePosts(sourcePosts.length === MAX_POSTS);
    setPostsLoading(false);
    hydratePostsMedia(sourcePosts, coupleId, loadVersion);
  }

  async function loadOlderPosts() {
    if (!couple?.id || postsLoading || !hasMorePosts) return;
    const oldestPost = posts.at(-1);
    if (!oldestPost?.created_at) return setHasMorePosts(false);
    setPostsLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('couple_id', couple.id)
      .lt('created_at', oldestPost.created_at)
      .order('created_at', { ascending: false })
      .limit(MAX_POSTS);
    setPostsLoading(false);
    if (error) return setToast(error.message);
    const olderPosts = (data || []).map((post) => ({
      ...post,
      signedUrl: null,
      locked: Boolean(post.encrypted && !encryptionPassphrase),
      mediaLoading: Boolean(post.image_path),
    }));
    setPosts((current) => [...current, ...olderPosts.filter((post) => !current.some((item) => item.id === post.id))]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setHasMorePosts(olderPosts.length === MAX_POSTS);
    hydratePostsMedia(olderPosts, couple.id, postLoadVersion.current);
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

  async function loadPartnerDisplayName(coupleId) {
    const { data: members } = await supabase
      .from('couple_members')
      .select('user_id')
      .eq('couple_id', coupleId);
    const partnerId = (members || []).map((member) => member.user_id).find((userId) => userId !== session?.user?.id);
    if (!partnerId) return;
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', partnerId)
      .maybeSingle();
    setPartnerName(partnerProfile?.display_name || 'partner/ka');
  }

  async function loadDailyMoments(coupleId) {
    if (!supabase || !coupleId) return;
    setDailyMomentsLoading(true);
    setDailyMomentsError('');
    const { data, error } = await supabase
      .from('daily_moments')
      .select('*, daily_moment_ratings(*)')
      .eq('couple_id', coupleId)
      .order('moment_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(90);

    if (error) {
      setDailyMoments([]);
      setDailyMomentsLoading(false);
      setDailyMomentsError(`Dnešní momenty se nepodařilo načíst: ${error.message}`);
      return;
    }

    const hydrated = await Promise.all((data || []).map(async (moment) => {
      const mediaPath = getMomentStoragePath(moment);
      const cacheKey = `${moment.id}:${encryptionPassphrase || 'no-key'}`;
      const cachedUrl = dailyMomentMediaCache.current.get(cacheKey);
      if (cachedUrl) {
        return { ...moment, signedUrl: cachedUrl, locked: false, ratings: moment.daily_moment_ratings || [] };
      }
      if (!mediaPath) {
        return {
          ...moment,
          signedUrl: null,
          locked: Boolean(moment.encrypted),
          ratings: moment.daily_moment_ratings || [],
        };
      }
      if (moment.encrypted && !encryptionPassphrase) {
        return { ...moment, signedUrl: null, locked: true, ratings: moment.daily_moment_ratings || [] };
      }
      const { data: signedData, error: signedError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(mediaPath, 60 * 60);
      let displayUrl = signedError ? null : signedData?.signedUrl || null;
      if (moment.encrypted && displayUrl) {
        try {
          displayUrl = await decryptSignedUrlToObjectUrl(displayUrl, coupleId, encryptionPassphrase, moment.encryption_iv, moment.media_mime_type);
        } catch {
          displayUrl = null;
        }
      }
      if (displayUrl) dailyMomentMediaCache.current.set(cacheKey, displayUrl);
      return {
        ...moment,
        signedUrl: displayUrl,
        locked: Boolean(moment.encrypted && !displayUrl),
        ratings: moment.daily_moment_ratings || [],
      };
    }));
    setDailyMoments(hydrated);
    setDailyMomentsLoading(false);
  }


  async function loadWishlistItems(coupleId) {
    if (!supabase || !coupleId) return;
    const { data, error } = await supabase
      .from('couple_wishlist')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Wishlist not loaded:', error.message || error);
      return;
    }
    setWishlistItems(data || []);
  }

  async function loadMilestones(coupleId) {
    if (!supabase || !coupleId) return;
    const { data, error } = await supabase
      .from('couple_milestones')
      .select('*')
      .eq('couple_id', coupleId)
      .order('date', { ascending: true });
    if (error) {
      console.warn('Milestones not loaded:', error.message || error);
      return;
    }
    setMilestones(data || []);
  }

  async function loadPartnerDayCompletions(coupleId) {
    if (!supabase || !coupleId) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data, error } = await supabase
      .from('partner_day_completions')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('completion_date', thirtyDaysAgo.toISOString().slice(0, 10))
      .order('completion_date', { ascending: false });
    if (error) {
      console.warn('Partner day completions not loaded:', error.message || error);
      return;
    }
    setPartnerDayCompletions(data || []);
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
        await addSystemPost('challenge', `Výzva nebyla splněna včas: ${challenge.title} · vznikl dluh -${challenge.penalty_points || challenge.xp || 10} bodů`);
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

      try {
        // Pokud byl na serveru změněný VAPID klíč, stará registrace může být neplatná.
        // Krátký resubscribe test ji odhalí a vytvoří čistou subscription.
        if (!getPushEndpoint(subscription)) throw new Error('Push subscription nemá endpoint.');
      } catch (error) {
        if (isMismatchedVapidError(error) && subscription) await subscription.unsubscribe();
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const endpoint = getPushEndpoint(subscription);
      if (!endpoint) throw new Error('Prohlížeč nevytvořil push endpoint.');

      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          couple_id: couple.id,
          user_id: session.user.id,
          endpoint,
          subscription: subscription.toJSON(),
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

      if (error) throw error;

      setNotificationsEnabled(true);
      setToast('Mobilní upozornění jsou zapnutá na tomto zařízení. Pro iPhone musí být aplikace spuštěná z ikony na ploše.');
    } catch (error) {
      setNotificationsEnabled(false);

      if (isMismatchedVapidError(error)) {
        setToast('Upozornění se nepodařilo zapnout kvůli staré registraci. Zavři aplikaci, otevři ji znovu z ikony na ploše a klepni znovu na Notif.');
      } else {
        setToast(`Upozornění se nepodařilo zapnout: ${error.message}`);
      }
    }
  }

  async function notifyPartner(eventType, title, body) {
    if (!couple?.id || !session?.user?.id || !supabase) return { ok: false, error: 'Chybí pár, uživatel nebo Supabase.' };

    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          coupleId: couple.id,
          // Kept for compatibility with the currently deployed function.
          // The hardened function validates this claim against the JWT.
          senderId: session.user.id,
          eventType,
          title,
          body,
        },
      });

      if (error) {
        const errorMessage = await getFunctionErrorMessage(error);
        console.warn('Push notification failed:', errorMessage, error);
        return { ok: false, error: errorMessage };
      }

      if (data?.error) {
        console.warn('Push notification failed:', data.error);
        return { ok: false, error: data.error, data };
      }

      return { ok: true, data };
    } catch (error) {
      console.warn('Push notification failed:', error);
      return { ok: false, error: error.message || String(error) };
    }
  }



  async function addSystemPost(type, text) {
    if (!couple?.id || !session?.user?.id || !text) return;
    try {
      const { data, error } = await supabase.from('posts').insert({
        couple_id: couple.id,
        author_id: session.user.id,
        type,
        text,
      }).select('*').single();
      if (error) throw error;
      mergePostRecord(data);
    } catch (error) {
      console.warn('System post failed:', error.message || error);
    }
  }

  function scheduleStatusNotification(field, value) {
    const normalizedValue = Number(value);
    if (!Number.isFinite(normalizedValue)) return;

    clearTimeout(statusNotifyTimers.current[field]);
    statusNotifyTimers.current[field] = window.setTimeout(async () => {
      try {
        await saveMyStatus({ [field]: normalizedValue });
        if (field === 'heat') {
          await notifyPartner('heat_changed', 'MoodSync', `Partner/ka nastavil/a teploměr nadrženosti na ${normalizedValue} %.`);
        } else {
          await notifyPartner('closeness_changed', 'MoodSync', `Partner/ka nastavil/a teploměr blízkosti na ${normalizedValue} %.`);
        }
      } catch (error) {
        setToast(`Změnu teploměru se nepodařilo uložit: ${error.message}`);
      }
    }, STATUS_NOTIFY_DELAY_MS);
  }

  function updateHeatValue(value) {
    const nextValue = Number(value);
    setHeat(nextValue);
    scheduleStatusNotification('heat', nextValue);
  }

  function updateClosenessValue(value) {
    const nextValue = Number(value);
    setCloseness(nextValue);
    scheduleStatusNotification('closeness', nextValue);
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
    const rows = starterChallenges.map((challenge) => normalizeStarterChallenge(challenge, coupleId));
    const { error } = await supabase.from('challenges').insert(rows);
    if (error && !String(error.message).includes('duplicate')) {
      setToast(`Výzvy se nepodařilo založit: ${error.message}`);
    }
  }

  async function uploadCoupleAvatar(file) {
    if (!couple?.id || !file) return;

    try {
      if (!encryptionPassphrase) { showE2eePrompt('profilová fotka páru'); return; }
      const uploaded = await uploadToStorage(file, `${couple.id}/profile`, { encrypt: true, coupleId: couple.id, passphrase: encryptionPassphrase, maxEdge: AVATAR_IMAGE_MAX_EDGE });
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
    const { data, error } = await supabase.from('posts').insert({
      couple_id: couple.id,
      author_id: session.user.id,
      type: 'mood',
      text,
      mood_label: selectedMood.label,
      heat,
      closeness,
    }).select('*').single();
    if (error) return setToast(error.message);
    mergePostRecord(data);
    setThought('');
    await notifyPartner('thought_added', 'MoodSync', 'Partner/ka ti poslal/a novou myšlenku.');
  }

  async function sendMessage(nextText) {
    const cleanText = typeof nextText === 'string' ? nextText.trim() : message.trim();
    if (!couple?.id || !cleanText) return;
    const { data, error } = await supabase.from('posts').insert({ couple_id: couple.id, author_id: session.user.id, type: 'chat', text: cleanText }).select('*').single();
    if (error) return setToast(error.message);
    mergePostRecord(data);
    setMessage('');
    await notifyPartner('message_added', 'MoodSync', 'Partner/ka ti poslal/a novou zprávu.');
  }

  async function searchGifs(query, count = 12) {
    if (!couple?.id || !session?.user?.id) throw new Error('GIFy jsou dostupné až po připojení páru.');
    const { data, error } = await supabase.functions.invoke('redgifs-search', {
      body: { coupleId: couple.id, query, count },
    });
    if (error) throw new Error(await getFunctionErrorMessage(error));
    if (data?.error) throw new Error(data.error);
    return Array.isArray(data?.results) ? data.results : [];
  }

  async function sendGif(gif) {
    const embedUrl = getSafeRedgifsEmbedUrl(gif?.embedUrl);
    const sourceUrl = getSafeRedgifsSourceUrl(gif?.sourceUrl, gif?.externalId);
    if (!couple?.id || !session?.user?.id || !gif?.externalId || !sourceUrl || (!gif?.mediaUrl && !gif?.thumbnailUrl && !embedUrl)) return false;
    const { data, error } = await supabase.from('posts').insert({
      couple_id: couple.id,
      author_id: session.user.id,
      type: 'gif',
      text: 'GIF z RedGIFs',
      gif_external_id: gif.externalId,
      gif_source_url: sourceUrl,
      gif_media_url: gif.mediaUrl,
      gif_thumbnail_url: gif.thumbnailUrl,
      gif_embed_url: embedUrl,
      gif_duration: gif.duration,
      gif_width: gif.width,
      gif_height: gif.height,
    }).select('*').single();
    if (error) {
      setToast(error.message);
      return false;
    }
    mergePostRecord(data);
    await notifyPartner('message_added', 'MoodSync', 'Partner/ka ti poslal/a GIF.');
    return true;
  }


  async function sendDailyStatus(status) {
    if (!couple?.id || !session?.user?.id || !status?.message) return;
    const { data, error } = await supabase.from('posts').insert({
      couple_id: couple.id,
      author_id: session.user.id,
      type: 'status',
      text: `${status.icon} ${status.message}`,
    }).select('*').single();
    if (error) return setToast(error.message);
    mergePostRecord(data);
    await notifyPartner('daily_status', 'MoodSync status', `${status.icon} ${status.label}`);
    setToast(`Status odeslán: ${status.label}`);
  }

  async function completeEveningRitual(item) {
    if (!couple?.id || !session?.user?.id || !item) return;
    const { data, error } = await supabase.from('posts').insert({
      couple_id: couple.id,
      author_id: session.user.id,
      type: 'ritual',
      text: `Večerní rituál: ${item.label}`,
    }).select('*').single();
    if (error) return setToast(error.message);
    mergePostRecord(data);
    await notifyPartner('evening_ritual', 'MoodSync rituál', `Partner/ka označil/a krok večerního rituálu: ${item.label}.`);
    setToast(`Rituál označen: ${item.label}`);
  }

  async function addPhoto(file, options = {}) {
    if (!couple?.id) return setToast('Nejdřív vytvoř nebo připoj pár.');
    if (!file) return;
    try {
      if (!encryptionPassphrase) { showE2eePrompt('galerie a feed'); return; }
      const uploaded = await uploadToStorage(file, `${couple.id}/gallery`, { encrypt: true, coupleId: couple.id, passphrase: encryptionPassphrase, maxEdge: GALLERY_IMAGE_MAX_EDGE });
      const imagePath = uploaded.path;
      const { data, error } = await supabase.from('posts').insert({
        couple_id: couple.id,
        author_id: session.user.id,
        type: 'photo',
        text: options.text?.trim() || 'Soukromá fotka v galerii',
        photo_category: options.photoCategory || (photoCategory === 'all' ? 'romantic' : photoCategory),
        image_path: imagePath,
        encrypted: uploaded.encrypted,
        encryption_iv: uploaded.encryptionIv,
        mime_type: uploaded.mimeType,
      }).select('*').single();
      if (error) throw error;
      mergePostRecord(data);
      hydratePostMedia(data, couple.id, postLoadVersion.current);
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

      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (error) {
      setToast(`Mazání se nepodařilo: ${error.message}`);
    }
  }

  async function uploadDailyMoment(file, caption, durationHint = null) {
    if (!couple?.id || !session?.user?.id) throw new Error('Nejdřív vytvoř nebo připoj pár.');
    if (!encryptionPassphrase) {
      showE2eePrompt('Dnešní moment');
      throw new Error('Nejdřív nastav společné E2EE heslo v profilu.');
    }
    const media = await validateMomentMedia(file, durationHint);
    const encrypted = await encryptFileForCouple(file, couple.id, encryptionPassphrase);
    const today = getLocalDateKey();
    const mediaPath = `${couple.id}/daily-moments/${today}/${session.user.id}-${crypto.randomUUID()}.enc`;
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(mediaPath, encrypted.blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/octet-stream',
    });
    if (uploadError) throw uploadError;

    const { data: moment, error: insertError } = await supabase.from('daily_moments').insert({
      couple_id: couple.id,
      moment_date: today,
      media_path: mediaPath,
      media_kind: media.kind,
      media_mime_type: media.mimeType,
      video_path: media.kind === 'video' ? mediaPath : null,
      video_mime_type: media.kind === 'video' ? media.mimeType : null,
      duration_seconds: media.duration === null ? null : Number(media.duration.toFixed(2)),
      encrypted: true,
      encryption_iv: encrypted.iv,
      caption: caption.trim() || null,
    }).select('id').single();
    if (insertError) {
      await supabase.storage.from(STORAGE_BUCKET).remove([mediaPath]);
      throw insertError;
    }

    const { error: galleryError } = await supabase.from('posts').insert({
      couple_id: couple.id,
      author_id: session.user.id,
      type: 'photo',
      text: caption.trim() || 'Dnešní moment',
      photo_category: 'moments',
      image_path: mediaPath,
      encrypted: true,
      encryption_iv: encrypted.iv,
      mime_type: media.mimeType,
      media_kind: media.kind,
      media_mime_type: media.mimeType,
      daily_moment_id: moment.id,
    });
    if (galleryError) {
      await supabase.from('daily_moments').delete().eq('id', moment.id).eq('author_id', session.user.id);
      await supabase.storage.from(STORAGE_BUCKET).remove([mediaPath]);
      throw galleryError;
    }

    await loadDailyMoments(couple.id);
    await loadPosts(couple.id);
    setToast('Dnešní moment je sdílený s partnerem/partnerkou.');
    await notifyPartner('daily_moment_added', 'MoodSync', 'Partner/ka přidal/a Dnešní moment.');
  }

  async function deleteDailyMoment(moment) {
    if (!couple?.id || !session?.user?.id || !moment?.id || moment.author_id !== session.user.id) return;
    if (!window.confirm('Opravdu smazat svůj dnešní moment?')) return;
    const { error } = await supabase
      .from('daily_moments')
      .delete()
      .eq('id', moment.id)
      .eq('couple_id', couple.id)
      .eq('author_id', session.user.id);
    if (error) throw error;
    const { error: galleryError } = await supabase
      .from('posts')
      .delete()
      .eq('daily_moment_id', moment.id)
      .eq('couple_id', couple.id)
      .eq('author_id', session.user.id);
    const paths = [...new Set([moment.media_path, moment.video_path].filter(Boolean))];
    const { error: storageError } = paths.length
      ? await supabase.storage.from(STORAGE_BUCKET).remove(paths)
      : { error: null };
    await loadDailyMoments(couple.id);
    await loadPosts(couple.id);
    if (storageError) {
      setToast('Moment je smazaný, ale soubor se nepodařilo odstranit ze Storage.');
    } else if (galleryError) {
      setToast('Moment je smazaný, ale galerie se nepodařila synchronizovat.');
    } else {
      setToast('Dnešní moment byl smazaný.');
    }
  }

  async function saveDailyMomentRating(moment, score, reaction) {
    if (!couple?.id || !session?.user?.id || !moment?.id || moment.author_id === session.user.id) return;
    const cleanReaction = reaction.trim();
    const normalizedScore = Number(score);
    if (!Number.isInteger(normalizedScore) || normalizedScore < 1 || normalizedScore > 5) {
      throw new Error('Vyber hodnocení od 1 do 5 srdcí.');
    }
    if (cleanReaction.length > 280) throw new Error('Reakce může mít nejvýše 280 znaků.');

    const existing = moment.ratings?.find((rating) => rating.rater_id === session.user.id);
    const query = existing
      ? supabase.from('daily_moment_ratings').update({ score: normalizedScore, reaction: cleanReaction || null }).eq('id', existing.id).eq('rater_id', session.user.id)
      : supabase.from('daily_moment_ratings').insert({ moment_id: moment.id, score: normalizedScore, reaction: cleanReaction || null });
    const { error } = await query;
    if (error) throw error;
    await loadDailyMoments(couple.id);
    setToast('Hodnocení momentu je uložené.');
  }

  async function addChallenge(payload) {
    if (!couple?.id || !payload.title?.trim()) return;
    const { error } = await supabase.from('challenges').insert({
      couple_id: couple.id,
      title: payload.title.trim(),
      category: payload.category,
      difficulty: payload.difficulty,
      xp: Number(payload.xp) || 10,
      assigned_to: null,
      challenged_by: session.user.id,
      challenge_status: 'open',
      accepted: false,
      completed: false,
    });
    if (error) return setToast(error.message);
    await loadChallenges(couple.id);
    await addSystemPost('challenge', `Nová výzva k udělení partnerovi: ${payload.title.trim()} · +${Number(payload.xp) || 10} XP`);
    await notifyPartner('challenge_added', 'MoodSync', 'Partner/ka přidal/a novou výzvu. Body se udělují až po potvrzení partnerem.');
  }

  async function updateChallenge(id, patch) {
    const normalizedPatch = patch.completed ? { ...patch, completed_by: patch.completed_by || session.user.id, completed_confirmed_by: session.user.id } : patch;
    const { error } = await supabase.from('challenges').update(normalizedPatch).eq('id', id).eq('couple_id', couple.id);
    if (error) return setToast(error.message);
    await loadChallenges(couple.id);
    if (patch.completed) {
      const completedChallenge = challenges.find((item) => item.id === id);
      await addSystemPost('challenge', `Body uděleny za výzvu: ${completedChallenge?.title || 'výzva'} · +${completedChallenge?.xp || 10} XP`);
      await notifyPartner('challenge_completed', 'MoodSync', `Partner/ka ti udělil/a +${completedChallenge?.xp || 10} XP za splněnou výzvu.`);
    }
  }
  async function requestChallengeConfirmation(challenge) {
    if (!challenge?.id) return;
    const result = await notifyPartner('challenge_confirmation_requested', 'MoodSync výzva', `Hotovo: ${challenge.title}. Potvrď partnerovi/partnerce splnění a případně uděl XP.`);
    setToast(result.ok ? 'Partner/ka dostal/a žádost o potvrzení.' : `Žádost se nepodařilo odeslat: ${result.error}`);
    return result;
  }


  async function challengePartner(challenge, hours = 24) {
    if (!couple?.id || !session?.user?.id || !challenge?.id) return;

    const partnerId = getPartnerUserId();
    if (!partnerId) {
      setToast('Partner/ka zatím není v páru aktivní. Jakmile se přihlásí nebo provede první akci, půjde ho/ji vyzvat.');
      return;
    }

    const deadline = new Date(Date.now() + Number(hours || 24) * 60 * 60 * 1000).toISOString();
    const penalty = Number(challenge.penalty_points || challenge.xp || 10);

    const { error } = await supabase
      .from('challenges')
      .update({
        assigned_to: partnerId,
        challenged_by: session.user.id,
        challenge_deadline: deadline,
        challenge_status: 'active',
        penalty_points: penalty,
        accepted: true,
        completed: false,
        completed_by: null,
        completed_at: null,
        failed_at: null,
        debt_task: null,
        debt_repaid_at: null,
      })
      .eq('id', challenge.id)
      .eq('couple_id', couple.id);

    if (error) return setToast(`Partnera se nepodařilo vyzvat: ${error.message}`);

    await loadChallenges(couple.id);
    await addSystemPost('challenge', `Výzva pro partnera: ${challenge.title} · limit ${hours} h · penalizace -${penalty} bodů`);
    await notifyPartner('challenge_invited', 'MoodSync výzva', `Partner/ka tě vyzval/a: ${challenge.title}. Termín je ${formatDate(deadline)}.`);
  }

  async function assignDebtTask(challenge, task) {
    if (!couple?.id || !challenge?.id || !task) return;

    const { error } = await supabase
      .from('challenges')
      .update({
        debt_task: task,
        challenge_status: 'debt_assigned',
      })
      .eq('id', challenge.id)
      .eq('couple_id', couple.id);

    if (error) return setToast(`Nápravu se nepodařilo zadat: ${error.message}`);

    await loadChallenges(couple.id);
    await addSystemPost('challenge', `Náprava za nesplněnou výzvu: ${challenge.title} · ${task}`);
    await notifyPartner('debt_task_assigned', 'MoodSync', `Partner/ka ti zadal/a nápravu za nesplněnou výzvu: ${task}.`);
  }

  async function repayDebt(challenge) {
    if (!couple?.id || !session?.user?.id || !challenge?.id) return;

    const { error } = await supabase
      .from('challenges')
      .update({
        challenge_status: 'debt_repaid',
        debt_repaid_at: new Date().toISOString(),
        completed: true,
        completed_by: session.user.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', challenge.id)
      .eq('couple_id', couple.id);

    if (error) return setToast(`Dluh se nepodařilo smazat: ${error.message}`);

    await loadChallenges(couple.id);
    await addSystemPost('challenge', `Dluh smazán: ${challenge.title}`);
    await notifyPartner('debt_repaid', 'MoodSync', 'Partner/ka splnil/a nápravu a smazal/a dluh.');
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

  async function updateKamaPreference(positionId, patch) {
    if (!couple?.id || !positionId) return;
    const existing = kamaProgress.find((item) => item.position_id === positionId);
    const payload = { ...patch, updated_at: new Date().toISOString() };

    if (existing) {
      const { error } = await supabase.from('kama_progress').update(payload).eq('id', existing.id);
      if (error) return setToast(`Kamasutra se nepodařila upravit: ${error.message}`);
    } else {
      const { error } = await supabase.from('kama_progress').insert({
        couple_id: couple.id,
        position_id: positionId,
        ...patch,
      });
      if (error) return setToast(`Kamasutra se nepodařila upravit: ${error.message}`);
    }

    await loadKamaProgress(couple.id);

    const position = kamaPositions.find((item) => item.id === positionId);
    if (patch.desire_status === 'want') {
      await notifyPartner('kamasutra_want_to_try', 'MoodSync Kamasutra', `Partner/ka chce někdy zkusit polohu ${position?.title || ''}.`);
    }
    if (patch.favorite === true) {
      await notifyPartner('kamasutra_favorite', 'MoodSync Kamasutra', `Partner/ka si označil/a polohu ${position?.title || ''} jako oblíbenou.`);
    }
  }

  async function uploadKamaPhoto(positionId, file) {
    if (!couple?.id || !file) return;
    try {
      if (!encryptionPassphrase) { showE2eePrompt('Kamasutra fotky'); return; }
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


  async function addWishlistItem(title) {
    if (!couple?.id || !session?.user?.id || !title?.trim()) return;
    const { error } = await supabase.from('couple_wishlist').insert({
      couple_id: couple.id,
      user_id: session.user.id,
      title: title.trim(),
      fulfilled: false,
    });
    if (error) return setToast(`Přání se nepodařilo uložit: ${error.message}`);
    await loadWishlistItems(couple.id);
    await addSystemPost('wishlist', `Nové přání ve wishlistu: ${title.trim()}`);
    await notifyPartner('wishlist_added', 'MoodSync přání', `Partner/ka přidal/a nové přání: ${title.trim()}.`);
  }

  async function completeWishlistItem(item) {
    if (!couple?.id || !session?.user?.id || !item?.id) return;
    const { error } = await supabase.from('couple_wishlist').update({
      fulfilled: true,
      fulfilled_by: session.user.id,
      fulfilled_at: new Date().toISOString(),
    }).eq('id', item.id).eq('couple_id', couple.id);
    if (error) return setToast(`Přání se nepodařilo splnit: ${error.message}`);
    await loadWishlistItems(couple.id);
    await addSystemPost('wishlist', `Splněné přání: ${item.title}`);
    await notifyPartner('wishlist_completed', 'MoodSync přání', `Partner/ka splnil/a přání: ${item.title}.`);
  }

  async function addMilestone(title, date) {
    if (!couple?.id || !session?.user?.id || !title?.trim() || !date) return;
    const { error } = await supabase.from('couple_milestones').insert({
      couple_id: couple.id,
      user_id: session.user.id,
      title: title.trim(),
      date,
    });
    if (error) return setToast(`Vzpomínku se nepodařilo uložit: ${error.message}`);
    await loadMilestones(couple.id);
    await addSystemPost('milestone', `Nový důležitý den: ${title.trim()} · ${new Date(date).toLocaleDateString('cs-CZ')}`);
    await notifyPartner('milestone_added', 'MoodSync vzpomínka', `Partner/ka přidal/a důležitý den: ${title.trim()}.`);
  }

  async function createSurprise() {
    const ideas = [...surpriseIdeas];
    const kamaPick = kamaPositions[(getTodaySeed() + posts.length + challenges.length) % kamaPositions.length];
    ideas.push({ type: 'Kamasutra', text: `Zkuste si prohlédnout polohu ${kamaPick.title} a domluvit, jestli vás láká.` });
    const idea = ideas[Math.floor(Math.random() * ideas.length)];
    setSurpriseCard(idea);
    await addSystemPost('surprise', `Překvap nás: ${idea.type} · ${idea.text}`);
    await notifyPartner('surprise_generated', 'MoodSync překvapení', `Partner/ka vygeneroval/a překvapení: ${idea.type}.`);
  }

  async function completePartnerDay(card) {
    if (!couple?.id || !session?.user?.id || !card) return;
    const partnerId = getPartnerUserId();
    if (!partnerId) return setToast('Partner/ka zatím není v páru aktivní. Body půjde udělit, až se přihlásí nebo provede první akci.');

    const completionDate = getLocalDateKey();
    const { error } = await supabase.from('partner_day_completions').upsert(
      {
        couple_id: couple.id,
        user_id: partnerId,
        awarded_by: session.user.id,
        completion_date: completionDate,
        card_key: `${completionDate}-${card.task}`,
        xp: Number(card.xp) || 10,
        completed_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      },
      { onConflict: 'couple_id,user_id,completion_date' }
    );
    if (error) return setToast(`Body pro partnera se nepodařilo udělit: ${error.message}`);
    await loadPartnerDayCompletions(couple.id);
    await addSystemPost('partner_day', `Partner dne: uděleno +${card.xp || 10} XP partnerovi za dnešní úkol.`);
    await notifyPartner('partner_day_completed', 'MoodSync Partner dne', `Partner/ka ti udělil/a +${card.xp || 10} XP za dnešní úkol.`);
    setToast(`Partnerovi/partnerce bylo uděleno +${card.xp || 10} XP.`);
  }

  async function testPushNotification() {
    try {
      const registration = await getServiceWorkerRegistration();
      if (Notification.permission === 'granted' && registration) {
        await registration.showNotification('MoodSync test na tomto zařízení', {
          body: 'Lokální test funguje. Teď zkouším push partnerovi/partnerce.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'local-push-test',
          data: { url: window.location.origin },
        });
      }

      const result = await notifyPartner('push_test', 'MoodSync test', `${profile?.display_name || 'Partner/ka'} testuje push notifikace.`);
      const sentTo = result?.data?.sentTo ?? 0;
      const delivered = result?.data?.delivered ?? 0;

      if (!result?.ok) {
        return setToast(`Lokální test proběhl, ale odeslání partnerovi selhalo: ${result?.error || 'neznámá chyba'}`);
      }

      if (!sentTo) {
        return setToast('Lokální test proběhl. Partner/ka ale ještě nemá na žádném zařízení zapnuté notifikace.');
      }

      setToast(`Lokální test proběhl. Push partnerovi/partnerce: ${delivered}/${sentTo} zařízení přijalo požadavek.`);
    } catch (error) {
      setToast(`Test notifikace selhal: ${error.message}`);
    }
  }

  function saveEncryptionPassphrase(value, rememberOnDevice = false) {
    const cleanValue = value.trim();
    setEncryptionPassphrase(cleanValue);
    if (cleanValue) {
      sessionStorage.setItem(ENC_KEY_SESSION, cleanValue);
      if (rememberOnDevice) {
        localStorage.setItem(ENC_KEY_DEVICE, cleanValue);
        setToast('E2EE heslo je aktivní a zapamatované na tomto zařízení. Používej to jen na vlastním mobilu.');
      } else {
        localStorage.removeItem(ENC_KEY_DEVICE);
        setToast('E2EE heslo je aktivní do zavření aplikace. Nové fotky se budou šifrovat před uploadem.');
      }
    } else {
      sessionStorage.removeItem(ENC_KEY_SESSION);
      localStorage.removeItem(ENC_KEY_DEVICE);
      setToast('E2EE heslo bylo vymazané z tohoto zařízení.');
    }
  }

  async function signOut() {
    sessionStorage.removeItem(ENC_KEY_SESSION);
    localStorage.removeItem(ENC_KEY_DEVICE);
    setEncryptionPassphrase('');
    await supabase.auth.signOut();
    setSession(null);
    setCouple(null);
    setPosts([]);
    setHasMorePosts(false);
    setChallenges([]);
    setKamaProgress([]);
    setCoupleStatuses([]);
    setCoupleMembers([]);
    setDailyMoments([]);
    setDailyMomentsError('');
    setWishlistItems([]);
    setMilestones([]);
    setPartnerDayCompletions([]);
    setSurpriseCard(null);
    postMediaCache.current.forEach((url) => {
      if (String(url || '').startsWith('blob:')) URL.revokeObjectURL(url);
    });
    postMediaCache.current.clear();
  }

  const filteredPosts = useMemo(() => {
    return [...posts]
      .filter((item) => photoCategory === 'all' || item.photo_category === photoCategory || item.type !== 'photo')
      .sort((a, b) => sortOrder === 'newest' ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at));
  }, [posts, photoCategory, sortOrder]);

  const photoPosts = filteredPosts.filter((post) => post.type === 'photo');
  const chatPosts = posts.filter((post) => post.type === 'chat' || post.type === 'gif');
  const todayDailyMoments = useMemo(
    () => dailyMoments.filter((moment) => moment.moment_date === getLocalDateKey()),
    [dailyMoments]
  );
  const filteredChallenges = challenges.filter((challenge) => challengeCategory === 'all' || challenge.category === challengeCategory);
  const challengeStats = getChallengeStats(challenges, session?.user?.id, partnerDayCompletions);

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

  if (passwordRecovery) {
    return <PasswordRecoveryScreen dark={dark} onComplete={() => setPasswordRecovery(false)} />;
  }

  return (
    <div className={appClass}>
      <main className="box-border min-h-screen w-screen max-w-[100vw] overflow-x-hidden bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 px-3 py-3 pb-[calc(7.5rem+env(safe-area-inset-bottom))] text-gray-900 transition dark:from-gray-950 dark:via-purple-950 dark:to-rose-950 dark:text-white sm:px-4 sm:py-4 md:px-8 md:py-8 md:pb-28">
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
            testPushNotification={testPushNotification}
            signOut={signOut}
          />

          {!couple && <PairingPanel pairCodeInput={pairCodeInput} setPairCodeInput={setPairCodeInput} createCouple={createCouple} joinCouple={joinCouple} creatingCouple={creatingCouple} />}

          {toast && (
            <div role="status" aria-live="polite" className="rounded-2xl border border-pink-200 bg-white p-4 font-bold text-pink-600 shadow-lg dark:border-white/10 dark:bg-white/10 dark:text-pink-200">
              {toast} <button className="ml-3 underline" onClick={() => setToast('')}>zavřít</button>
            </div>
          )}

          {e2eePrompt && (
            <E2eePhotoGuardBanner
              context={e2eePrompt}
              onProfile={() => { setActiveTab('profile'); setE2eePrompt(''); }}
              onClose={() => setE2eePrompt('')}
            />
          )}

          {postsLoading && couple && (
            <div role="status" className="flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-pink-600 shadow-sm dark:bg-white/10 dark:text-pink-200">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-pink-500" /> Načítám poslední zprávy…
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
              activeChallenges={challenges}
              currentUserId={session?.user?.id}
              updateChallenge={updateChallenge}
              openChallenges={() => setActiveTab('challenges')}
              posts={posts}
              challenges={challenges}
              challengeStats={challengeStats}
              wishlistItems={wishlistItems}
              addWishlistItem={addWishlistItem}
              completeWishlistItem={completeWishlistItem}
              milestones={milestones}
              addMilestone={addMilestone}
              surpriseCard={surpriseCard}
              createSurprise={createSurprise}
              partnerDayCompletions={partnerDayCompletions}
              completePartnerDay={completePartnerDay}
              sendDailyStatus={sendDailyStatus}
              completeEveningRitual={completeEveningRitual}
              dailyMoments={todayDailyMoments}
              dailyMomentsLoading={dailyMomentsLoading}
              openMoments={() => setActiveTab('moments')}
            />
          )}

          <AppErrorBoundary resetKey={activeTab}>
            {activeTab === 'chat' && <ChatPanel posts={chatPosts} message={message} setMessage={setMessage} sendMessage={sendMessage} searchGifs={searchGifs} sendGif={sendGif} gifPickerEnabled={Boolean(couple?.id && session?.user?.id)} deletePost={deletePost} currentUserId={session?.user?.id} partnerName={partnerName} hasMorePosts={hasMorePosts} loadOlderPosts={loadOlderPosts} />}
            {activeTab === 'feed' && <FeedPanel posts={filteredPosts} currentUserId={session?.user?.id} message={message} setMessage={setMessage} sendMessage={sendMessage} addPhoto={addPhoto} deletePost={deletePost} panicMode={panicMode} openImage={setFullscreenImage} encryptionReady={encryptionReady} onMissingE2EE={() => showE2eePrompt('feed fotka')} hasMorePosts={hasMorePosts} loadOlderPosts={loadOlderPosts} />}
            {activeTab === 'gallery' && <GalleryPanel posts={photoPosts} dailyMoments={dailyMoments} currentUserId={session?.user?.id} openMoments={() => setActiveTab('moments')} addPhoto={addPhoto} deletePost={deletePost} photoCategory={photoCategory} setPhotoCategory={setPhotoCategory} sortOrder={sortOrder} setSortOrder={setSortOrder} panicMode={panicMode} openImage={setFullscreenImage} encryptionReady={encryptionReady} onMissingE2EE={() => showE2eePrompt('galerie')} hasMorePosts={hasMorePosts} loadOlderPosts={loadOlderPosts} />}
            {activeTab === 'challenges' && <ChallengesPanel challenges={filteredChallenges} allChallenges={challenges} category={challengeCategory} setCategory={setChallengeCategory} addChallenge={addChallenge} updateChallenge={updateChallenge} requestChallengeConfirmation={requestChallengeConfirmation} challengePartner={challengePartner} assignDebtTask={assignDebtTask} repayDebt={repayDebt} currentUserId={session?.user?.id} stats={challengeStats} />}
            {activeTab === 'more' && <MorePanel setActiveTab={setActiveTab} />}
            {activeTab === 'moments' && <DailyMomentsPanel couple={couple} moments={todayDailyMoments} loading={dailyMomentsLoading} loadError={dailyMomentsError} currentUserId={session?.user?.id} panicMode={panicMode} uploadMoment={uploadDailyMoment} deleteMoment={deleteDailyMoment} saveRating={saveDailyMomentRating} />}
            {activeTab === 'kamasutra' && <KamasutraPanel kamaProgress={kamaProgress} kamaFilter={kamaFilter} setKamaFilter={setKamaFilter} kamaSearch={kamaSearch} setKamaSearch={setKamaSearch} kamaDifficultyFilter={kamaDifficultyFilter} setKamaDifficultyFilter={setKamaDifficultyFilter} oralOnly={oralOnly} setOralOnly={setOralOnly} toggleKama={toggleKama} updateKamaPreference={updateKamaPreference} uploadKamaPhoto={uploadKamaPhoto} encryptionReady={encryptionReady} onMissingE2EE={() => showE2eePrompt('Kamasutra fotka')} />}
            {activeTab === 'profile' && <ProfilePanel profile={profile} couple={couple} coupleAvatarUrl={coupleAvatarUrl} profileName={profileName} setProfileName={setProfileName} updateProfileName={updateProfileName} partnerName={partnerName} uploadCoupleAvatar={uploadCoupleAvatar} encryptionPassphrase={encryptionPassphrase} saveEncryptionPassphrase={saveEncryptionPassphrase} signOut={signOut} />}
          </AppErrorBoundary>
        </div>

        {fullscreenImage && <FullscreenImageViewer image={fullscreenImage} onClose={() => setFullscreenImage(null)} />}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>
    </div>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error, info) {
    console.error('MoodSync section error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Card>
          <h2 className="flex items-center gap-2 text-2xl font-black"><AlertCircle className="text-red-500" /> Něco se nepodařilo načíst</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-300">Sekce narazila na chybu místo bílé obrazovky. Zkus obnovit stránku; pokud chyba trvá, zkontroluj SQL migrace v Supabase.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-2xl bg-gray-900 px-5 py-3 font-black text-white dark:bg-white dark:text-gray-900">Obnovit aplikaci</button>
        </Card>
      );
    }
    return this.props.children;
  }
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


function E2eePhotoGuardBanner({ context, onProfile, onClose }) {
  return (
    <div className="rounded-[2rem] border-2 border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-lg dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-gray-900"><Lock size={20} /></div>
          <div className="min-w-0">
            <div className="font-black">Fotka se nenahrála — chybí E2EE heslo</div>
            <p className="mt-1 text-sm font-bold text-amber-800 dark:text-amber-100/80">
              Pro {context || 'fotky'} nejdřív aktivuj společné E2EE heslo v profilu. Bez něj aplikace fotky z bezpečnostních důvodů neuloží do Supabase.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={onProfile} className="rounded-2xl bg-gray-900 px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-gray-900">Nastavit heslo</button>
          <button type="button" onClick={onClose} className="rounded-2xl border border-amber-300 px-4 py-3 text-sm font-black dark:border-amber-400/30">Zavřít</button>
        </div>
      </div>
    </div>
  );
}

function E2eeInlineNotice({ encryptionReady, onProfile, compact = false }) {
  if (encryptionReady) return (
    <div className={`rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200 ${compact ? '' : 'mb-5'}`}>
      🔒 E2EE heslo je aktivní. Nové fotky se před uploadem šifrují v prohlížeči.
    </div>
  );

  return (
    <div className={`rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100 ${compact ? '' : 'mb-5'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>🔒 Fotky jsou zamčené. Nejdřív aktivuj společné E2EE heslo v profilu.</span>
        <button type="button" onClick={onProfile} className="rounded-xl bg-gray-900 px-4 py-2 text-white dark:bg-white dark:text-gray-900">Nastavit heslo</button>
      </div>
    </div>
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

  async function submitAuth(event) {
    event?.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setError('Vyplň email i heslo.');
      return;
    }

    if (password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků.');
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
            throw new Error('E-mail nebo heslo nesouhlasí. Zkontroluj údaje, případně si nech poslat odkaz pro nastavení nového hesla.');
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

  async function requestPasswordReset() {
    setError('');
    setMessage('');
    if (!email.trim()) return setError('Nejdřív vyplň svůj e-mail.');

    setLoadingAuth(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
      setMessage('Odkaz pro nastavení nového hesla je na cestě. Zkontroluj i složku Spam.');
    } catch (resetError) {
      setError(resetError.message);
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
                <Lock size={16} /> Soukromý prostor pro dva
              </div>
              <h1 className="mt-4 text-5xl font-black">MoodSync</h1>
              <p className="mt-3 text-gray-500 dark:text-gray-300">
                Nálady, zprávy a společné chvíle bezpečně na jednom místě.
              </p>
            </div>
            <button type="button" aria-label={dark ? 'Zapnout světlý režim' : 'Zapnout tmavý režim'} className="rounded-2xl bg-gray-900 p-3 text-white dark:bg-white dark:text-gray-900" onClick={() => setDark(!dark)}>
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

          <form className="mt-6 grid gap-3" onSubmit={submitAuth}>
            {mode === 'register' && (
              <TextInput
                placeholder="Tvoje jméno"
                aria-label="Tvoje jméno"
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            )}

            <TextInput
              type="email"
              placeholder="tvuj@email.cz"
              aria-label="E-mail"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <TextInput
              type="password"
              placeholder="Heslo"
              aria-label="Heslo"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button
              type="submit"
              disabled={loadingAuth}
              className="rounded-2xl bg-pink-500 px-5 py-3 font-black text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingAuth ? 'Pracuju...' : mode === 'login' ? 'Přihlásit se' : 'Vytvořit účet'}
            </button>
            {mode === 'login' && (
              <button type="button" disabled={loadingAuth} onClick={requestPasswordReset} className="justify-self-center rounded-xl px-3 py-2 text-sm font-bold text-pink-600 underline-offset-4 hover:underline dark:text-pink-200">
                Zapomenuté heslo
              </button>
            )}
          </form>

          {message && <p role="status" className="mt-4 rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-700">{message}</p>}
          {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}

          <p className="mt-5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            Tvoje přihlášení spravuje Supabase. Nikdy nikomu neposílej heslo ani společné E2EE heslo k fotkám.
          </p>
        </Card>
      </main>
    </div>
  );
}

function PasswordRecoveryScreen({ dark, onComplete }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function updatePassword(event) {
    event.preventDefault();
    setError('');
    if (password.length < 8) return setError('Nové heslo musí mít alespoň 8 znaků.');
    if (password !== confirmPassword) return setError('Zadaná hesla se neshodují.');
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) return setError(updateError.message);
    onComplete();
  }

  return (
    <div className={dark ? 'dark' : ''}>
      <main className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-6 text-gray-900 dark:from-gray-950 dark:via-purple-950 dark:to-rose-950 dark:text-white">
        <Card className="w-full max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-sm font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-200"><Lock size={16} /> Obnova přístupu</div>
          <h1 className="mt-4 text-4xl font-black">Nastav nové heslo</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-300">Použij alespoň osm znaků a heslo, které nepoužíváš jinde.</p>
          <form onSubmit={updatePassword} className="mt-6 grid gap-3">
            <TextInput type="password" aria-label="Nové heslo" autoComplete="new-password" minLength={8} required placeholder="Nové heslo" value={password} onChange={(event) => setPassword(event.target.value)} />
            <TextInput type="password" aria-label="Nové heslo znovu" autoComplete="new-password" minLength={8} required placeholder="Nové heslo znovu" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            <button type="submit" disabled={saving} className="rounded-2xl bg-pink-500 px-5 py-3 font-black text-white hover:bg-pink-600 disabled:opacity-60">{saving ? 'Ukládám...' : 'Uložit nové heslo'}</button>
          </form>
          {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}
        </Card>
      </main>
    </div>
  );
}

function CompactHeader({ encryptionReady, profile, couple, coupleAvatarUrl, dark, setDark, panicMode, setPanicMode, notificationsEnabled, enablePushNotifications, testPushNotification, signOut }) {
  const [actionsOpen, setActionsOpen] = useState(false);
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
        <div className="hidden min-w-0 shrink-0 items-center gap-1 sm:flex sm:gap-2">
          <span aria-label={encryptionReady ? 'Šifrování fotek je aktivní' : 'Chybí heslo pro šifrování fotek'} title={encryptionReady ? 'Šifrování fotek je aktivní' : 'Chybí heslo pro šifrování fotek'} className={`flex h-9 shrink-0 items-center gap-1 rounded-xl px-2 text-[11px] font-black sm:h-auto sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xs ${encryptionReady ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-gray-900'}`}><Lock size={15} /><span className="hidden sm:inline">{encryptionReady ? 'E2EE' : 'Bez klíče'}</span></span>
          <button type="button" aria-label={panicMode ? 'Ukázat soukromé fotky' : 'Rozmazat soukromé fotky'} aria-pressed={panicMode} title="Rozmazání soukromých fotek" onClick={() => setPanicMode(!panicMode)} className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-gray-900 px-2 text-[11px] font-black text-white dark:bg-white dark:text-gray-900 sm:h-auto sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xs"><Image size={15} /><span className="hidden sm:inline">{panicMode ? 'Skrýt' : 'Ukázat'}</span></button>
          <button type="button" aria-label={notificationsEnabled ? 'Oznámení jsou zapnutá' : 'Zapnout oznámení'} title="Nastavení oznámení" onClick={enablePushNotifications} className={`flex h-9 shrink-0 items-center gap-1 rounded-xl px-2 text-[11px] font-black sm:h-auto sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xs ${notificationsEnabled ? 'bg-emerald-500 text-white' : 'bg-pink-500 text-white'}`}><Bell size={15} /><span className="hidden sm:inline">{notificationsEnabled ? 'Zapnuto' : 'Oznámení'}</span></button>
          {notificationsEnabled && <button type="button" title="Otestovat oznámení" onClick={testPushNotification} className="hidden rounded-xl bg-violet-500 px-2 py-2 text-[11px] font-black text-white sm:block sm:rounded-2xl sm:px-3 sm:text-xs">Test</button>}
          <button type="button" aria-label={dark ? 'Zapnout světlý režim' : 'Zapnout tmavý režim'} onClick={() => setDark(!dark)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 sm:h-10 sm:w-10 sm:rounded-2xl">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button type="button" aria-label="Odhlásit se" onClick={signOut} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-gray-200 dark:border-white/10 sm:h-10 sm:w-10 sm:rounded-2xl"><LogOut size={18} /></button>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:hidden">
          <span aria-label={encryptionReady ? 'Šifrování fotek je aktivní' : 'Chybí heslo pro šifrování fotek'} title={encryptionReady ? 'Šifrování fotek je aktivní' : 'Chybí heslo pro šifrování fotek'} className={`grid h-9 w-9 place-items-center rounded-xl ${encryptionReady ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-gray-900'}`}><Lock size={15} /></span>
          <button type="button" aria-label="Otevřít rychlé nastavení" aria-expanded={actionsOpen} onClick={() => setActionsOpen((open) => !open)} className="grid h-9 w-9 place-items-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900"><MoreHorizontal size={19} /></button>
        </div>
      </div>
      {actionsOpen && <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-200/70 pt-3 dark:border-white/10 sm:hidden">
        <button type="button" aria-pressed={panicMode} onClick={() => setPanicMode(!panicMode)} className="rounded-2xl bg-gray-900 px-3 py-3 text-xs font-black text-white dark:bg-white dark:text-gray-900"><Image className="mx-auto mb-1" size={16} />{panicMode ? 'Skrýt fotky' : 'Ukázat fotky'}</button>
        <button type="button" onClick={enablePushNotifications} className={`rounded-2xl px-3 py-3 text-xs font-black text-white ${notificationsEnabled ? 'bg-emerald-500' : 'bg-pink-500'}`}><Bell className="mx-auto mb-1" size={16} />{notificationsEnabled ? 'Oznámení zapnuta' : 'Zapnout oznámení'}</button>
        {notificationsEnabled && <button type="button" onClick={testPushNotification} className="rounded-2xl bg-violet-500 px-3 py-3 text-xs font-black text-white">Test oznámení</button>}
        <button type="button" onClick={() => setDark(!dark)} className="rounded-2xl border border-gray-200 px-3 py-3 text-xs font-black dark:border-white/10">{dark ? 'Světlý režim' : 'Tmavý režim'}</button>
        <button type="button" onClick={signOut} className="col-span-2 rounded-2xl border border-rose-200 px-3 py-3 text-xs font-black text-rose-600 dark:border-rose-400/20 dark:text-rose-200"><LogOut className="mr-1 inline" size={15} /> Odhlásit se</button>
      </div>}
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
          <div className="flex flex-col gap-3 sm:flex-row">
            <TextInput className="min-w-0 flex-1" aria-label="Párovací kód" autoCapitalize="characters" placeholder="LOVE-12AB34CD" value={pairCodeInput} onChange={(event) => setPairCodeInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && joinCouple()} />
            <button onClick={joinCouple} className="w-full shrink-0 rounded-2xl bg-gray-900 px-5 py-3 font-black text-white dark:bg-white dark:text-gray-900 sm:w-auto">Připojit</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function getMomentStatus(moment, otherMoment) {
  if (!moment) return { label: 'Chybí', className: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-200' };
  if ((moment.ratings || []).length > 0) return { label: 'Ohodnoceno', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' };
  if (!otherMoment) return { label: 'Čeká na partnera', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200' };
  return { label: 'Čeká na hodnocení', className: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-100' };
}

function DailyMomentHomeCard({ moments, loading, currentUserId, openMoments, primary = false }) {
  const ownMoment = moments.find((moment) => moment.author_id === currentUserId);
  const partnerMoment = moments.find((moment) => moment.author_id !== currentUserId);
  const ownStatus = getMomentStatus(ownMoment, partnerMoment);
  const partnerStatus = getMomentStatus(partnerMoment, ownMoment);

  return (
    <Card className={`overflow-hidden border-fuchsia-200/70 bg-gradient-to-br from-fuchsia-50 to-pink-100 dark:border-fuchsia-400/20 dark:from-fuchsia-500/10 dark:to-pink-500/10 ${primary ? 'ring-4 ring-fuchsia-200/70 shadow-2xl dark:ring-fuchsia-400/20' : ''}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500 px-3 py-1 text-xs font-black text-white"><Video size={15} /> Dnešní moment · hlavní dnešní akce</div>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{getDailyMomentPrompt()}</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">Pošli fotku nebo krátké video. Po odeslání se stejný šifrovaný moment objeví i v galerii.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
            <span className={`rounded-full px-3 py-1.5 ${ownStatus.className}`}>Ty: {loading ? 'Načítám…' : ownStatus.label}</span>
            <span className={`rounded-full px-3 py-1.5 ${partnerStatus.className}`}>Partner/ka: {loading ? 'Načítám…' : partnerStatus.label}</span>
          </div>
        </div>
        <button type="button" onClick={openMoments} className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5 dark:bg-white dark:text-gray-900 sm:w-auto sm:px-6 sm:py-4 sm:text-lg">
          <Camera size={20} /> {ownMoment ? 'Zobrazit dnešní moment' : 'Přidat dnešní moment'}
        </button>
      </div>
    </Card>
  );
}

function DailyMomentsPanel({ couple, moments, loading, loadError, currentUserId, panicMode, uploadMoment, deleteMoment, saveRating }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const cameraPreviewRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const recordingTimerRef = useRef(null);
  const cancelRecordingRef = useRef(false);
  const ownMoment = moments.find((moment) => moment.author_id === currentUserId) || null;
  const partnerMoment = moments.find((moment) => moment.author_id && moment.author_id !== currentUserId) || null;

  useEffect(() => () => {
    window.clearInterval(recordingTimerRef.current);
    cancelRecordingRef.current = true;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!recording || !cameraPreviewRef.current || !streamRef.current) return;
    cameraPreviewRef.current.srcObject = streamRef.current;
    cameraPreviewRef.current.play().catch(() => {
      // Recording still works when a browser blocks the live preview.
    });
  }, [recording]);

  async function prepareFile(file, durationHint = null) {
    setError('');
    try {
      const media = await validateMomentMedia(file, durationHint);
      setSelectedFile(file);
      setSelectedDuration(media.duration);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (validationError) {
      setSelectedFile(null);
      setSelectedDuration(null);
      setPreviewUrl('');
      setError(validationError.message);
    }
  }

  function finishCamera() {
    window.clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (cameraPreviewRef.current) cameraPreviewRef.current.srcObject = null;
    setRecording(false);
  }

  async function startRecording() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || !('MediaRecorder' in window)) {
      setError('Nahrávání v tomto prohlížeči není dostupné. Vyber video ze zařízení.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' } },
        audio: true,
      });
      const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/mp4', 'video/webm'];
      const mimeType = candidates.find((candidate) => window.MediaRecorder.isTypeSupported(candidate));
      const recorder = mimeType ? new window.MediaRecorder(stream, { mimeType }) : new window.MediaRecorder(stream);
      const baseMimeType = String(recorder.mimeType || mimeType || 'video/webm').split(';')[0];
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      cancelRecordingRef.current = false;
      recordingStartedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const elapsed = Math.min(MAX_MOMENT_DURATION_SECONDS, (Date.now() - recordingStartedAtRef.current) / 1000);
        const chunks = chunksRef.current;
        const cancelled = cancelRecordingRef.current;
        finishCamera();
        if (cancelled || chunks.length === 0) return;
        const blob = new Blob(chunks, { type: baseMimeType });
        const extension = baseMimeType === 'video/mp4' ? 'mp4' : 'webm';
        const file = new File([blob], `dnesni-moment.${extension}`, { type: baseMimeType, lastModified: Date.now() });
        prepareFile(file, elapsed);
      };
      recorder.start(250);
      setRecordingSeconds(0);
      setRecording(true);
      recordingTimerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - recordingStartedAtRef.current) / 1000;
        setRecordingSeconds(Math.min(MAX_MOMENT_DURATION_SECONDS, Math.ceil(elapsed)));
        if (elapsed >= MAX_MOMENT_DURATION_SECONDS && recorder.state === 'recording') recorder.stop();
      }, 250);
    } catch (recordingError) {
      finishCamera();
      setError(recordingError.name === 'NotAllowedError' ? 'Kamera nebo mikrofon nebyly povolené.' : `Nahrávání se nepodařilo spustit: ${recordingError.message}`);
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }

  function cancelRecording() {
    cancelRecordingRef.current = true;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    else finishCamera();
    setRecordingSeconds(0);
  }

  function discardSelection() {
    setSelectedFile(null);
    setSelectedDuration(null);
    setPreviewUrl('');
    setError('');
  }

  async function handleUpload() {
    if (!selectedFile || uploading) return;
    setUploading(true);
    setError('');
    try {
      await uploadMoment(selectedFile, caption, selectedDuration);
      discardSelection();
      setCaption('');
    } catch (uploadError) {
      setError(`Moment se nepodařilo uložit: ${uploadError.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 text-white">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black"><Camera size={15} /> Dnešní moment · {getLocalDateKey()}</div>
        <h1 className="mt-3 text-3xl font-black">{getDailyMomentPrompt()}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85">Sdílej krátké video nebo fotku ze svého dne. Moment uvidí jen členové vašeho páru a před uložením se zašifruje společným E2EE heslem. Po uložení se objeví také v galerii.</p>
      </Card>

      {!couple && <EmptyState title="Nejdřív propojte pár" text="Dnešní moment můžete sdílet po vytvoření nebo připojení páru." icon={Users} />}
      {loadError && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">{loadError}</div>}

      {couple && !ownMoment && (
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black"><Camera className="text-pink-500" /> Přidej svůj moment</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">Fotka může mít nejvýše 15 MB. Video maximálně 30 sekund a 25 MB (WebM, MP4, MOV nebo M4V).</p>

          {recording && (
            <div className="mt-4 overflow-hidden rounded-3xl bg-black">
              <video ref={cameraPreviewRef} muted playsInline className="aspect-[3/4] max-h-[65dvh] w-full object-cover sm:aspect-video" />
              <div className="flex items-center justify-between gap-3 bg-gray-950 p-3 text-white">
                <span className="inline-flex items-center gap-2 font-black"><span className="h-3 w-3 animate-pulse rounded-full bg-red-500" /> {recordingSeconds}/30 s</span>
                <div className="flex gap-2">
                  <button type="button" onClick={cancelRecording} className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-sm font-black"><X size={16} /> Zrušit</button>
                  <button type="button" onClick={stopRecording} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-black">Zastavit</button>
                </div>
              </div>
            </div>
          )}

          {!recording && !selectedFile && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={startRecording} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 font-black text-white"><Camera size={19} /> Spustit kameru</button>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-white px-5 py-3 font-black text-pink-600 dark:border-white/10 dark:bg-white/10 dark:text-pink-100">
                <Upload size={19} /> Vybrat fotku nebo video
                <input type="file" accept="image/*,video/webm,video/mp4,video/quicktime,video/x-m4v" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) prepareFile(file); event.target.value = ''; }} />
              </label>
            </div>
          )}

          {selectedFile && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
              {getMomentMediaKind(selectedFile) === 'image'
                ? <img src={previewUrl} alt="Náhled vybrané fotky" className="max-h-[32rem] w-full rounded-3xl bg-black object-contain" />
                : <video src={previewUrl} controls playsInline preload="metadata" className="max-h-[32rem] w-full rounded-3xl bg-black object-contain" />}
              <div>
                <div className="flex items-center justify-between gap-3 text-sm font-bold"><span className="min-w-0 truncate">{selectedFile.name}</span><span className="shrink-0">{selectedDuration ? `${Math.ceil(selectedDuration)} s · ` : ''}{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span></div>
                <textarea value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={280} placeholder="Krátký popisek (nepovinné)…" className="mt-3 min-h-24 w-full rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 outline-none focus:ring-4 focus:ring-pink-200 dark:border-white/10 dark:bg-gray-900 dark:text-white" />
                <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                  <button type="button" disabled={uploading} onClick={discardSelection} className="rounded-2xl border border-gray-200 px-4 py-3 font-black disabled:opacity-60 dark:border-white/10">Zahodit</button>
                  <button type="button" disabled={uploading} onClick={handleUpload} className="rounded-2xl bg-pink-500 px-5 py-3 font-black text-white disabled:opacity-60">{uploading ? 'Nahrávám…' : 'Sdílet dnešní moment'}</button>
                </div>
              </div>
            </div>
          )}
          {error && <p role="alert" className="mt-3 text-sm font-bold text-rose-600 dark:text-rose-300">{error}</p>}
        </Card>
      )}

      {loading && <div role="status" className="rounded-2xl bg-white/70 p-4 text-center font-bold text-pink-600 dark:bg-white/10 dark:text-pink-200">Načítám dnešní momenty…</div>}
      {!loading && couple && (
        <section className="grid gap-4 lg:grid-cols-2">
          <DailyMomentCard key={`own-${ownMoment?.id || 'missing'}-${ownMoment?.ratings?.map((rating) => `${rating.id}:${rating.score}:${rating.reaction}`).join('|') || ''}`} label="Tvůj moment" moment={ownMoment} otherMoment={partnerMoment} own currentUserId={currentUserId} panicMode={panicMode} deleteMoment={deleteMoment} />
          <DailyMomentCard key={`partner-${partnerMoment?.id || 'missing'}-${partnerMoment?.ratings?.map((rating) => `${rating.id}:${rating.score}:${rating.reaction}`).join('|') || ''}`} label="Moment partnera/partnerky" moment={partnerMoment} otherMoment={ownMoment} currentUserId={currentUserId} panicMode={panicMode} saveRating={saveRating} />
        </section>
      )}
    </div>
  );
}

function DailyMomentCard({ label, moment, otherMoment, own = false, currentUserId, panicMode, deleteMoment, saveRating }) {
  const existingRating = own
    ? moment?.ratings?.[0] || null
    : moment?.ratings?.find((rating) => rating.rater_id === currentUserId) || null;
  const [score, setScore] = useState(existingRating?.score || 0);
  const [reaction, setReaction] = useState(existingRating?.reaction || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(false);
  const status = getMomentStatus(moment, otherMoment);
  const mediaBlurred = Boolean(panicMode && !revealed);

  async function handleRatingSave() {
    setSaving(true);
    setError('');
    try {
      await saveRating(moment, score, reaction);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await deleteMoment(moment);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black">{label}</h2>
        <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${status.className}`}>{status.label}</span>
      </div>
      {!moment ? (
        <div className="mt-4 rounded-3xl border border-dashed border-pink-200 bg-pink-50/60 p-8 text-center dark:border-white/10 dark:bg-white/5">
          <Camera className="mx-auto text-pink-400" size={32} />
          <p className="mt-3 font-black">{own ? 'Tvůj moment zatím chybí.' : 'Partner/ka zatím nic nesdílel/a.'}</p>
        </div>
      ) : (
        <>
          {moment.signedUrl
            ? <div className="relative mt-4 overflow-hidden rounded-3xl bg-black">
                {getStoredMomentMediaKind(moment) === 'image'
                  ? <img src={moment.signedUrl} alt={moment.caption || 'Dnešní moment'} loading="lazy" decoding="async" className={`max-h-[34rem] w-full object-contain transition duration-500 ${mediaBlurred ? 'scale-105 blur-2xl' : ''}`} />
                  : <video src={moment.signedUrl} controls={!mediaBlurred} playsInline preload="metadata" className={`max-h-[34rem] w-full object-contain transition duration-500 ${mediaBlurred ? 'scale-105 blur-2xl' : ''}`} />}
                {mediaBlurred && <button type="button" onClick={() => setRevealed(true)} className="absolute inset-0 grid place-items-center bg-black/25 p-4 text-center text-white backdrop-blur-sm" aria-label="Odemknout náhled dnešního momentu">
                  <span className="rounded-2xl bg-black/65 px-5 py-3 text-sm font-black shadow-xl"><Eye className="mx-auto mb-1" size={20} />Klepnutím zobrazit moment</span>
                </button>}
                {!mediaBlurred && panicMode && <button type="button" onClick={() => setRevealed(false)} className="absolute right-3 top-3 rounded-xl bg-black/65 px-3 py-2 text-xs font-black text-white" aria-label="Znovu rozmazat náhled">Rozmazat</button>}
              </div>
            : <div className="mt-4 rounded-3xl bg-gray-100 p-8 text-center text-sm font-bold dark:bg-white/10">{moment.locked ? 'Toto médium je šifrované. Nastav stejné E2EE heslo v profilu.' : 'Podepsaný odkaz na médium se nepodařilo vytvořit.'}</div>}
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              {moment.caption && <p className="whitespace-pre-wrap break-words font-bold">{moment.caption}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">{getStoredMomentMediaKind(moment) === 'video' ? `${Math.ceil(Number(moment.duration_seconds) || 0)} s · ` : 'Fotka · '}{formatDate(moment.created_at)}</p>
            </div>
            {own && <button type="button" disabled={deleting} onClick={handleDelete} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 disabled:opacity-60 dark:border-rose-400/20 dark:text-rose-200"><Trash2 size={15} /> {deleting ? 'Mažu…' : 'Smazat'}</button>}
          </div>

          {own && existingRating && (
            <div className="mt-4 rounded-3xl bg-pink-50 p-4 dark:bg-pink-500/10">
              <div className="text-sm font-black">Hodnocení od partnera/partnerky</div>
              <div className="mt-2 text-xl" aria-label={`${existingRating.score} z 5 srdcí`}>{'❤️'.repeat(existingRating.score)}{'🤍'.repeat(5 - existingRating.score)}</div>
              {existingRating.reaction && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{existingRating.reaction}</p>}
            </div>
          )}

          {!own && (
            <div className="mt-4 border-t border-pink-100 pt-4 dark:border-white/10">
              <div className="text-sm font-black">{existingRating ? 'Tvoje hodnocení' : 'Ohodnoť moment'}</div>
              <div className="mt-2 flex gap-1" role="group" aria-label="Hodnocení momentu">
                {[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setScore(value)} aria-label={`${value} z 5 srdcí`} aria-pressed={score === value} className={`rounded-xl p-1 text-3xl transition ${value <= score ? 'scale-105' : 'grayscale opacity-35'}`}>❤️</button>)}
              </div>
              <textarea value={reaction} onChange={(event) => setReaction(event.target.value)} maxLength={280} placeholder="Napiš krátkou reakci…" className="mt-3 min-h-24 w-full rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 outline-none focus:ring-4 focus:ring-pink-200 dark:border-white/10 dark:bg-gray-900 dark:text-white" />
              <div className="mt-1 text-right text-xs text-gray-400">{reaction.length}/280</div>
              <button type="button" disabled={saving || score < 1} onClick={handleRatingSave} className="mt-2 w-full rounded-2xl bg-pink-500 px-5 py-3 font-black text-white disabled:opacity-50">{saving ? 'Ukládám…' : existingRating ? 'Uložit změny' : 'Uložit hodnocení'}</button>
            </div>
          )}
          {error && <p role="alert" className="mt-3 text-sm font-bold text-rose-600 dark:text-rose-300">{error}</p>}
        </>
      )}
    </Card>
  );
}

function HomePanel({ couple, latestPartnerMoodPost, myLiveStatus, partnerLiveStatus, selectedMood, setSelectedMoodId, heat, setHeat, closeness, setCloseness, thought, setThought, addPost, activeChallenges = [], currentUserId, openChallenges, posts = [], challenges = [], wishlistItems = [], addWishlistItem, completeWishlistItem, milestones = [], addMilestone, surpriseCard, createSurprise, partnerDayCompletions = [], completePartnerDay, sendDailyStatus, completeEveningRitual, dailyMoments = [], dailyMomentsLoading, openMoments }) {
  const freshOwnStatus = isStatusFresh(myLiveStatus) ? myLiveStatus : null;
  const freshPartnerStatus = isStatusFresh(partnerLiveStatus) ? partnerLiveStatus : null;
  const partnerMood = freshPartnerStatus?.mood_label ? getMoodByLabel(freshPartnerStatus.mood_label) : latestPartnerMoodPost ? getMoodByLabel(latestPartnerMoodPost.mood_label) : null;
  const ownHeat = freshOwnStatus?.heat ?? heat;
  const ownCloseness = freshOwnStatus?.closeness ?? closeness;
  const partnerHeat = freshPartnerStatus?.heat ?? 0;
  const partnerCloseness = freshPartnerStatus?.closeness ?? 0;
  const incomingChallenge = activeChallenges.find((challenge) => challenge.challenge_status === 'active' && challenge.assigned_to === currentUserId && !challenge.completed) || null;
  const outgoingCount = activeChallenges.filter((challenge) => challenge.challenge_status === 'active' && challenge.challenged_by === currentUserId && !challenge.completed).length;
  const relationshipScore = getRelationshipScoreData({ ownCloseness, ownHeat, partnerCloseness, partnerHeat, posts, challenges });
  const relationshipHistory = buildRelationshipHistory(posts, ownCloseness, partnerCloseness, ownHeat, partnerHeat);
  const partnerDay = getPartnerDayCard();
  const todayKey = getLocalDateKey();
  const partnerDayCompletion = partnerDayCompletions.find((item) => item.user_id === currentUserId && item.completion_date === todayKey) || null;
  const partnerDayAwardedByMe = partnerDayCompletions.find((item) => item.awarded_by === currentUserId && item.completion_date === todayKey) || null;
  const recentDateKeys = getRecentDateKeys();
  const recentDayKeys = new Set(posts.map((post) => String(post.created_at || '').slice(0, 10)).filter((dateKey) => recentDateKeys.has(dateKey)));

  return (
    <>
      <DailyMomentHomeCard moments={dailyMoments} loading={dailyMomentsLoading} currentUserId={currentUserId} openMoments={openMoments} primary />

      <Card className="overflow-hidden bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur"><Sparkles size={15} /> Dnešní jiskra</div>
            <h1 className="mt-3 text-3xl font-black">Jeden malý signál stačí.</h1>
            <p className="mt-2 max-w-xl text-sm text-white/85">Řekni, jak ti je, nebo udělejte jeden krátký rituál. Bez tlaku na výkon.</p>
          </div>
          <div className="shrink-0 rounded-3xl bg-white/15 px-5 py-4 text-center backdrop-blur">
            <div className="text-3xl font-black">{recentDayKeys.size}/7</div>
            <div className="text-xs font-bold text-white/80">společných dnů</div>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <DailyStatusCard sendDailyStatus={sendDailyStatus} />
        <EveningRitualCard completeEveningRitual={completeEveningRitual} posts={posts} />
      </section>

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
          <h2 className="flex items-center gap-2 text-xl font-black"><Heart className="text-pink-500" /> Jak mi právě je</h2>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {moods.map((mood) => {
              const Icon = mood.icon;
              return <button type="button" aria-label={mood.label} title={mood.label} key={mood.id} onClick={() => setSelectedMoodId(mood.id)} className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md transition ${mood.color} ${selectedMood.id === mood.id ? 'scale-105 ring-4 ring-pink-200 dark:ring-white/30' : 'opacity-70 hover:opacity-100'}`}><Icon size={22} /></button>;
            })}
          </div>
          <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:gap-3">
            <CompactMeter title="Blízkost" value={closeness} setValue={setCloseness} />
            <CompactMeter title="Nadrženost" value={heat} setValue={setHeat} />
          </div>
          <textarea value={thought} onChange={(event) => setThought(event.target.value)} placeholder="Myšlenka pro partnera..." className="mt-4 min-h-[96px] w-full rounded-3xl border border-gray-200 bg-white p-4 text-gray-900 outline-none focus:ring-4 focus:ring-pink-200 dark:border-white/10 dark:bg-gray-900 dark:text-white" />
          <button onClick={addPost} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 font-black text-white shadow-lg hover:bg-pink-600"><Send size={18} /> Sdílet myšlenku do feedu</button>
        </Card>
      </section>

      <ActiveChallengeHomeCard challenge={incomingChallenge} outgoingCount={outgoingCount} openChallenges={openChallenges} />

      <details className="group rounded-[1.5rem] border border-white/70 bg-white/70 shadow-lg backdrop-blur dark:border-white/10 dark:bg-white/[0.06] sm:rounded-[2rem]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 font-black"><span className="flex items-center gap-2"><Gift className="text-pink-500" /> Inspirace a společná hra</span><span className="text-sm text-pink-500 group-open:hidden">Rozbalit</span><span className="hidden text-sm text-pink-500 group-open:inline">Sbalit</span></summary>
        <div className="grid gap-4 border-t border-pink-100 p-4 dark:border-white/10 sm:p-5">
          <PartnerDayCard card={partnerDay} awardedByMe={partnerDayAwardedByMe} myAward={partnerDayCompletion} completePartnerDay={completePartnerDay} />
          <section className="grid gap-4 lg:grid-cols-2">
            <WishlistHomeCard items={wishlistItems} currentUserId={currentUserId} addWishlistItem={addWishlistItem} completeWishlistItem={completeWishlistItem} />
            <SurpriseHomeCard surprise={surpriseCard} createSurprise={createSurprise} />
          </section>
        </div>
      </details>

      <details className="group rounded-[1.5rem] border border-white/70 bg-white/70 shadow-lg backdrop-blur dark:border-white/10 dark:bg-white/[0.06] sm:rounded-[2rem]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 font-black"><span className="flex items-center gap-2"><TrendingUp className="text-purple-500" /> Náš přehled a vzpomínky</span><span className="text-sm text-pink-500 group-open:hidden">Rozbalit</span><span className="hidden text-sm text-pink-500 group-open:inline">Sbalit</span></summary>
        <div className="grid gap-4 border-t border-pink-100 p-4 dark:border-white/10 sm:p-5">
          <RelationshipScoreCard score={relationshipScore.score} trend={relationshipScore.trend} history={relationshipHistory} />
          <MilestonesHomeCard milestones={milestones} addMilestone={addMilestone} />
          <RelationshipOverview ownHeat={ownHeat} ownCloseness={ownCloseness} partnerHeat={partnerHeat} partnerCloseness={partnerCloseness} hasPartnerMood={Boolean(freshPartnerStatus)} />
        </div>
      </details>
    </>
  );
}


function DailyStatusCard({ sendDailyStatus }) {
  return (
    <Card className="bg-gradient-to-br from-white/90 to-rose-50/90 dark:from-white/[0.08] dark:to-pink-500/[0.08]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-black"><ShieldCheck className="text-pink-500" /> Jak na tom dnes jsem</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Rychlý status bez dlouhého vysvětlování. Partner/ka dostane jasný signál.</p>
        </div>
        <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-100">1 klepnutí</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {dailyStatusOptions.map((status) => (
          <button
            key={status.id}
            type="button"
            onClick={() => sendDailyStatus?.(status)}
            className="rounded-2xl border border-pink-100 bg-white/80 p-3 text-left text-sm font-black transition hover:bg-pink-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <span className="mr-2">{status.icon}</span>{status.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function EveningRitualCard({ completeEveningRitual, posts = [] }) {
  const todayKey = getLocalDateKey();
  const doneToday = posts.filter((post) => post.type === 'ritual' && String(post.created_at || '').startsWith(todayKey));
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-black"><Moon className="text-purple-500" /> Dnes pro nás</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Krátký večerní rituál: ne všechno musí být splněné, stačí jeden malý krok.</p>
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700 dark:bg-white/10 dark:text-purple-100">{doneToday.length}/{eveningRitualItems.length}</span>
      </div>
      <div className="mt-4 grid gap-2">
        {eveningRitualItems.map((item) => {
          const done = doneToday.some((post) => String(post.text || '').includes(item.label));
          return (
            <button
              key={item.id}
              type="button"
              disabled={done}
              onClick={() => completeEveningRitual?.(item)}
              className={`rounded-2xl border p-3 text-left transition ${done ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100' : 'border-purple-100 bg-white/80 hover:bg-purple-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'}`}
            >
              <div className="font-black">{done ? '✓ ' : ''}{item.label}</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-300">{item.helper}</div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}


function RelationshipScoreCard({ score, trend, history }) {
  return (
    <Card className="bg-gradient-to-br from-white/90 to-pink-50/90 dark:from-white/[0.08] dark:to-fuchsia-500/[0.08]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-200">
            <TrendingUp size={15} /> Vztahové skóre
          </div>
          <div className="mt-3 text-6xl font-black tracking-tight text-gray-900 dark:text-white">{score}%</div>
          <p className="mt-1 text-sm font-bold text-gray-500 dark:text-gray-300">{trend >= 0 ? `↗ +${trend} % oproti minulému týdnu` : `↘ ${trend} % oproti minulému týdnu`}</p>
        </div>
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.5rem] bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-xl">
          <Heart size={34} />
        </div>
      </div>
      <div className="mt-5 flex h-28 items-end gap-2 rounded-3xl bg-white/70 p-3 dark:bg-white/5">
        {history.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-t-2xl bg-gradient-to-t from-pink-500 to-purple-500" style={{ height: `${Math.max(12, item.value)}%` }} />
            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PartnerDayCard({ card, awardedByMe, myAward, completePartnerDay }) {
  const awarded = Boolean(awardedByMe);
  return (
    <Card className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur">
            <Sparkles size={15} /> Partner dne
          </div>
          <h3 className="mt-4 text-2xl font-black">Jeden denní úkol</h3>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-pink-600">+{card.xp} XP</div>
      </div>
      <div className="mt-4 rounded-2xl bg-white/15 p-4 text-sm leading-relaxed">
        <b>Dnešní úkol:</b> {card.task}
      </div>
      {myAward && (
        <div className="mt-3 rounded-2xl bg-emerald-400/20 p-3 text-sm font-bold text-white">
          Partner/ka ti dnes udělil/a +{myAward.xp || card.xp} XP.
        </div>
      )}
      <button
        type="button"
        disabled={awarded}
        onClick={() => completePartnerDay?.(card)}
        className={`mt-4 w-full rounded-2xl px-5 py-3 text-sm font-black transition ${awarded ? 'bg-emerald-400 text-emerald-950' : 'bg-white text-pink-600 hover:bg-pink-50'}`}
      >
        {awarded ? `✓ Partnerovi uděleno +${awardedByMe?.xp || card.xp} XP` : `Udělit partnerovi +${card.xp} XP`}
      </button>
      <p className="mt-3 text-xs text-white/75">Body si člověk nepřidává sám. Každý den můžeš dát body partnerovi/partnerce, když úkol opravdu proběhl.</p>
    </Card>
  );
}

function WishlistHomeCard({ items, currentUserId, addWishlistItem, completeWishlistItem }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(wishCategories[0].id);
  const openItems = items.filter((item) => !item.fulfilled).slice(0, 6);
  const selectedCategory = wishCategories.find((item) => item.id === category) || wishCategories[0];
  function submit() {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const normalizedTitle = cleanTitle.toLowerCase().startsWith(selectedCategory.prefix.toLowerCase())
      ? cleanTitle
      : `${selectedCategory.prefix}: ${cleanTitle}`;
    addWishlistItem?.(normalizedTitle);
    setTitle('');
  }
  return (
    <Card>
      <h3 className="flex items-center gap-2 text-xl font-black"><Gift className="text-pink-500" /> Přáníčka</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Přání už nejsou jen seznam. Vyber kategorii a dej partnerovi jasnější signál, co by ti udělalo radost.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {wishCategories.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={`rounded-full px-4 py-2 text-xs font-black transition ${category === item.id ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-700 dark:bg-white/10 dark:text-pink-100'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <TextInput value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder={`${selectedCategory.label.toLowerCase()}...`} />
        <button onClick={submit} className="shrink-0 rounded-2xl bg-pink-500 px-4 py-2 font-black text-white">Přidat</button>
      </div>
      <div className="mt-4 grid gap-2">
        {openItems.length === 0 && <div className="rounded-2xl bg-pink-50 p-4 text-sm font-bold text-gray-500 dark:bg-white/5 dark:text-gray-300">Zatím žádná otevřená přáníčka.</div>}
        {openItems.map((item) => (
          <div key={item.id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-pink-100 bg-white/80 p-3 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="whitespace-normal break-words font-black leading-snug">{item.title}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.user_id === currentUserId ? 'Moje přáníčko' : 'Přáníčko partnera/partnerky'}</div>
            </div>
            <div className="flex w-full shrink-0 gap-2 sm:w-auto">
              <button onClick={() => completeWishlistItem?.(item)} className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white sm:flex-none">Splnit</button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SurpriseHomeCard({ surprise, createSurprise }) {
  return (
    <Card>
      <h3 className="flex items-center gap-2 text-xl font-black"><Dice5 className="text-purple-500" /> Překvap nás</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Jedním klikem vyberete otázku, mini výzvu, romantický nápad nebo Kamasutra tip.</p>
      <div className="mt-4 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-5 dark:from-purple-500/20 dark:to-pink-500/20">
        {surprise ? (
          <>
            <div className="text-xs font-black uppercase tracking-wide text-pink-500">{surprise.type}</div>
            <div className="mt-2 text-lg font-black">{surprise.text}</div>
          </>
        ) : (
          <div className="text-sm font-bold text-gray-500 dark:text-gray-300">Zatím není vybrané žádné překvapení.</div>
        )}
      </div>
      <button onClick={createSurprise} className="mt-4 w-full rounded-2xl bg-purple-500 px-5 py-3 font-black text-white">Vygenerovat překvapení</button>
    </Card>
  );
}

function MilestonesHomeCard({ milestones, addMilestone }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const upcoming = [...milestones].sort((a, b) => nextOccurrence(a.date) - nextOccurrence(b.date)).slice(0, 3);
  function submit() {
    if (!title.trim() || !date) return;
    addMilestone?.(title, date);
    setTitle('');
    setDate('');
  }
  return (
    <Card>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-black"><CalendarDays className="text-pink-500" /> Naše důležité dny</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Výročí, první rande, svatba nebo společná dovolená.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
          <TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="První rande" />
          <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <button onClick={submit} className="rounded-2xl bg-gray-900 px-4 py-3 font-black text-white dark:bg-white dark:text-gray-900">Přidat</button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {upcoming.length === 0 && <div className="rounded-2xl bg-pink-50 p-4 text-sm font-bold text-gray-500 dark:bg-white/5 dark:text-gray-300">Zatím nemáte uložené žádné důležité dny.</div>}
        {upcoming.map((item) => (
          <div key={item.id} className="rounded-3xl border border-pink-100 bg-pink-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="font-black">{item.title}</div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-300">{new Date(item.date).toLocaleDateString('cs-CZ')}</div>
            <div className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-black text-pink-700 dark:bg-white/10 dark:text-pink-200">za {daysUntil(item.date)} dní</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function nextOccurrence(dateString) {
  const source = new Date(dateString);
  const now = new Date();
  const next = new Date(now.getFullYear(), source.getMonth(), source.getDate());
  if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) next.setFullYear(next.getFullYear() + 1);
  return next;
}

function daysUntil(dateString) {
  const diff = nextOccurrence(dateString).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}


function ActiveChallengeHomeCard({ challenge, outgoingCount, openChallenges }) {
  if (!challenge && !outgoingCount) return null;

  return (
    <Card className="border-pink-400/60 bg-gradient-to-br from-pink-500/15 via-purple-500/15 to-rose-500/10 dark:border-pink-500/30 dark:from-pink-500/15 dark:via-purple-500/15 dark:to-rose-500/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-3 py-1 text-xs font-black text-white shadow-lg shadow-pink-500/20">
            <Clock size={15} /> Aktivní výzva
          </div>
          {challenge ? (
            <>
              <h3 className="mt-3 text-2xl font-black">Partner/ka tě vyzval/a</h3>
              <p className="mt-2 text-base font-bold text-gray-700 dark:text-gray-200">{challenge.title}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-black">
                <span className="rounded-full bg-white px-3 py-2 text-pink-700 dark:bg-white/10 dark:text-pink-200">Zbývá: {formatTimeLeft(challenge.challenge_deadline)}</span>
                <span className="rounded-full bg-white px-3 py-2 text-purple-700 dark:bg-white/10 dark:text-purple-200">Odměna +{challenge.xp || 10} XP</span>
                <span className="rounded-full bg-white px-3 py-2 text-amber-700 dark:bg-white/10 dark:text-amber-200">Nesplnění -{challenge.penalty_points || challenge.xp || 10}</span>
              </div>
            </>
          ) : (
            <>
              <h3 className="mt-3 text-2xl font-black">Čekáš na partnera/partnerku</h3>
              <p className="mt-2 text-base font-bold text-gray-700 dark:text-gray-200">Máš aktivní odeslané výzvy: {outgoingCount}. Sleduj jejich stav v sekci Výzvy.</p>
            </>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[320px]">
          {challenge && (
            <div className="rounded-2xl bg-white p-4 text-sm font-bold text-gray-700 dark:bg-white/10 dark:text-gray-200">
              Až výzvu splníš, partner/ka ti body udělí ze svého účtu. Body si nepřidáváš sám/sama.
            </div>
          )}
          <button
            type="button"
            onClick={openChallenges}
            className="rounded-2xl bg-gray-900 px-5 py-3 font-black text-white dark:bg-white dark:text-gray-900"
          >
            Zobrazit výzvy
          </button>
        </div>
      </div>
    </Card>
  );
}

function CompactMeter({ title, value, setValue }) {
  return (
    <div className="min-w-0 rounded-3xl bg-gradient-to-br from-pink-400 via-rose-500 to-purple-600 p-4 text-center text-white shadow-xl">
      <div className="text-xs font-bold uppercase tracking-wide text-white/80">{title}</div>
      <div className="text-4xl font-black sm:text-5xl">{value}%</div>
      <input aria-label={title} aria-valuetext={`${value} procent`} value={value} onChange={(event) => setValue(Number(event.target.value))} type="range" min="0" max="100" className="mt-4 block w-full min-w-0 accent-white" />
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

function StatBar({ label, value, icon }) {
  return <div className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/10"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">{icon}{label}</div><span className="font-black">{value}%</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200/70 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500" style={{ width: `${value}%` }} /></div></div>;
}


const quickChatMessages = [
  'Myslím na tebe ❤️',
  'Potřebuju obejmout',
  'Mám chuť na tebe',
  'Miluju tě',
  'Máš dnes večer chvilku jen pro nás?',
  'Děkuju za tebe'
];

function ChatPanel({ posts = [], message, setMessage, sendMessage, searchGifs, sendGif, gifPickerEnabled, deletePost, currentUserId, partnerName, hasMorePosts, loadOlderPosts }) {
  const sortedMessages = [...posts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const partnerLabel = partnerName?.trim() || 'Partner/ka';
  const messagesEndRef = useRef(null);
  const latestMessageId = sortedMessages.at(-1)?.id;
  const previousLatestMessageId = useRef(null);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [gifSearching, setGifSearching] = useState(false);
  const [gifError, setGifError] = useState('');
  const [sendingGifId, setSendingGifId] = useState('');

  useEffect(() => {
    if (latestMessageId && latestMessageId !== previousLatestMessageId.current) {
      messagesEndRef.current?.scrollIntoView({ block: 'end' });
      previousLatestMessageId.current = latestMessageId;
    }
  }, [latestMessageId]);

  async function handleGifSearch(event) {
    event.preventDefault();
    const query = gifQuery.trim();
    if (query.length < 2 || query.length > 80 || gifSearching) {
      setGifError('Hledaný výraz musí mít 2 až 80 znaků.');
      return;
    }

    setGifSearching(true);
    setGifError('');
    try {
      const results = await searchGifs(query, 12);
      setGifResults(results);
      if (results.length === 0) setGifError('Pro tento výraz se nenašel žádný GIF.');
    } catch (error) {
      setGifResults([]);
      setGifError(`GIFy se nepodařilo načíst: ${error.message}`);
    } finally {
      setGifSearching(false);
    }
  }

  async function handleGifSelect(gif) {
    if (sendingGifId) return;
    setSendingGifId(gif.externalId);
    setGifError('');
    try {
      const sent = await sendGif(gif);
      if (sent) {
        setGifPickerOpen(false);
        setGifResults([]);
        setGifQuery('');
      } else {
        setGifError('GIF se nepodařilo odeslat.');
      }
    } catch (error) {
      setGifError(`GIF se nepodařilo odeslat: ${error.message}`);
    } finally {
      setSendingGifId('');
    }
  }

  return (
    <Card className="flex h-[calc(100dvh-13rem)] min-h-[360px] flex-col overflow-hidden p-0 sm:h-[calc(100dvh-11rem)] sm:min-h-[560px]">
      <div className="shrink-0 border-b border-pink-100/80 bg-white/80 p-4 backdrop-blur dark:border-white/10 dark:bg-gray-950/60 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-black sm:text-3xl">Chat</h2>
            <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-300">Rychlá komunikace jen pro vás dva.</p>
          </div>
          <div className="shrink-0 rounded-2xl bg-pink-50 px-3 py-2 text-xs font-bold text-pink-700 dark:bg-white/10 dark:text-pink-100 sm:text-sm">
            {sortedMessages.length} zpráv
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {quickChatMessages.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => sendMessage(text)}
              className="shrink-0 rounded-full border border-pink-100 bg-white px-3 py-1.5 text-xs font-bold text-pink-600 shadow-sm transition hover:bg-pink-50 dark:border-white/10 dark:bg-white/10 dark:text-pink-100 dark:hover:bg-white/15 sm:px-4 sm:py-2 sm:text-sm"
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white/35 p-3 dark:bg-white/[0.03] sm:p-4">
        {hasMorePosts && <LoadOlderButton onClick={loadOlderPosts} label="Načíst starší zprávy" />}
        {sortedMessages.length === 0 ? (
          <div className="flex min-h-full items-end">
            <EmptyState title="Zatím žádný chat" text="Pošli první rychlou zprávu, použij připravenou větu nebo emoji reakci." icon={MessageCircle} />
          </div>
        ) : (
          <div className="flex min-h-full flex-col justify-end gap-3">
            {sortedMessages.map((post) => {
              const isMine = post.author_id === currentUserId;
              return (
                <article key={post.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-[1.5rem] px-4 py-3 shadow-sm sm:max-w-[72%] ${isMine ? 'rounded-br-md bg-pink-500 text-white' : 'rounded-bl-md border border-pink-100 bg-white text-gray-900 dark:border-white/10 dark:bg-white/10 dark:text-white'}`}>
                    <div className={`mb-1 text-xs font-black ${isMine ? 'text-white/80' : 'text-gray-500 dark:text-gray-300'}`}>
                      {isMine ? 'Ty' : partnerLabel} · {formatDate(post.created_at)}
                    </div>
                    {post.type === 'gif'
                      ? <GifMedia post={post} compact />
                      : <p className="whitespace-pre-wrap break-words text-base leading-relaxed">{post.text}</p>}
                    {!isMine && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {chatReactions.map((reaction) => (
                          <button
                            key={reaction}
                            type="button"
                            onClick={() => sendMessage(`${reaction} reakce na zprávu`)}
                            className="rounded-full bg-pink-50 px-2 py-1 text-sm transition hover:bg-pink-100 dark:bg-white/10 dark:hover:bg-white/15"
                          >
                            {reaction}
                          </button>
                        ))}
                      </div>
                    )}
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => deletePost?.(post)}
                        className="mt-2 text-xs font-black underline decoration-white/50 underline-offset-4"
                      >
                        Smazat
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-pink-100/80 bg-white/95 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur dark:border-white/10 dark:bg-gray-950/95 sm:p-4">
        {gifPickerEnabled && gifPickerOpen && (
          <div className="mb-3 max-h-[48dvh] overflow-y-auto rounded-3xl border border-pink-100 bg-pink-50 p-3 dark:border-white/10 dark:bg-white/5 sm:p-4">
            <form onSubmit={handleGifSearch} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <TextInput value={gifQuery} onChange={(event) => setGifQuery(event.target.value)} maxLength={80} placeholder="Hledat GIF…" aria-label="Hledat GIF" />
              <button type="submit" disabled={gifSearching} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 font-black text-white disabled:opacity-60 dark:bg-white dark:text-gray-900">
                <Search size={18} /> <span className="hidden sm:inline">{gifSearching ? 'Hledám…' : 'Hledat'}</span>
              </button>
            </form>
            {gifError && <p role="status" className="mt-2 text-sm font-bold text-rose-600 dark:text-rose-300">{gifError}</p>}
            {gifResults.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {gifResults.map((gif) => (
                  <GifSearchCard key={gif.externalId} gif={gif} disabled={Boolean(sendingGifId)} sending={sendingGifId === gif.externalId} onSelect={handleGifSelect} />
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">Výsledky a média poskytuje RedGIFs.</p>
          </div>
        )}
        <div className={`grid gap-2 ${gifPickerEnabled ? 'grid-cols-[auto_minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_auto]'}`}>
          {gifPickerEnabled && (
            <button type="button" onClick={() => { setGifPickerOpen((open) => !open); setGifError(''); }} className={`rounded-2xl border px-3 py-3 text-sm font-black transition ${gifPickerOpen ? 'border-pink-500 bg-pink-500 text-white' : 'border-pink-200 bg-white text-pink-600 dark:border-white/10 dark:bg-white/10 dark:text-pink-100'}`} aria-expanded={gifPickerOpen} aria-label="Vybrat GIF">
              GIF
            </button>
          )}
          <TextInput
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
            placeholder="Napiš zprávu..."
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-pink-500 px-4 py-3 font-black text-white shadow-lg hover:bg-pink-600 sm:px-5"
            aria-label="Poslat zprávu"
          >
            <Send size={18} /> <span className="hidden sm:inline">Poslat</span>
          </button>
        </div>
      </div>
    </Card>
  );
}

function FeedPanel({ posts, currentUserId, message, setMessage, sendMessage, addPhoto, deletePost, panicMode, openImage, encryptionReady, onMissingE2EE, hasMorePosts, loadOlderPosts }) {
  return <Card><div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h2 className="text-3xl font-black">Deník páru</h2><p className="mt-1 text-gray-500 dark:text-gray-300">Zprávy, nálady a fotky na jednom místě.</p></div><PhotoUploadButton addPhoto={addPhoto} encryptionReady={encryptionReady} onMissingE2EE={onMissingE2EE} /></div><div className="mb-5 flex flex-col gap-2 sm:flex-row"><TextInput className="min-w-0 flex-1" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} placeholder="Napiš rychlou zprávu..." /><button onClick={sendMessage} className="w-full shrink-0 rounded-2xl bg-gray-900 px-5 py-3 font-black text-white dark:bg-white dark:text-gray-900 sm:w-auto">Poslat</button></div><FeedList posts={posts} currentUserId={currentUserId} panicMode={panicMode} openImage={openImage} deletePost={deletePost} />{hasMorePosts && <LoadOlderButton onClick={loadOlderPosts} />}</Card>;
}

function GalleryPanel({ posts, dailyMoments = [], currentUserId, openMoments, addPhoto, deletePost, photoCategory, setPhotoCategory, sortOrder, setSortOrder, panicMode, openImage, encryptionReady, onMissingE2EE, hasMorePosts, loadOlderPosts }) {
  const showMoments = photoCategory === 'all' || photoCategory === 'moments';
  const visiblePosts = showMoments ? posts.filter((post) => !post.daily_moment_id) : posts;
  const galleryMoments = showMoments ? dailyMoments : [];
  return (
    <Card>
      <div className="mb-5">
        <h2 className="text-3xl font-black">Soukromá galerie</h2>
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

      <E2eeInlineNotice encryptionReady={encryptionReady} onProfile={onMissingE2EE} />
      <GalleryUploadForm addPhoto={addPhoto} encryptionReady={encryptionReady} onMissingE2EE={onMissingE2EE} />
      {galleryMoments.length > 0 && <DailyMomentGalleryArchive moments={galleryMoments} currentUserId={currentUserId} panicMode={panicMode} openMoments={openMoments} formatDate={formatDate} getStoredMomentMediaKind={getStoredMomentMediaKind} />}
      {(visiblePosts.length > 0 || galleryMoments.length === 0) && <FeedList posts={visiblePosts} currentUserId={currentUserId} panicMode={panicMode} galleryOnly openImage={openImage} deletePost={deletePost} />}
      {hasMorePosts && <LoadOlderButton onClick={loadOlderPosts} label="Načíst starší fotky" />}
    </Card>
  );
}

function LoadOlderButton({ onClick, label = 'Načíst starší příspěvky' }) {
  return <button type="button" onClick={onClick} className="mx-auto my-4 block rounded-full border border-pink-200 bg-white px-5 py-2 text-sm font-black text-pink-600 transition hover:bg-pink-50 dark:border-white/10 dark:bg-white/10 dark:text-pink-100">{label}</button>;
}

function GalleryUploadForm({ addPhoto, encryptionReady, onMissingE2EE }) {
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('romantic');
  function handleUpload(file) {
    if (!file) return;
    if (!encryptionReady) { onMissingE2EE?.(); return; }
    addPhoto(file, { text: caption, photoCategory: category });
    setCaption('');
  }
  return <div className="mb-6 rounded-[2rem] border border-pink-100 bg-pink-50 p-5 dark:border-white/10 dark:bg-white/5"><div className="grid gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-end"><label className="grid gap-2 text-sm font-bold">Popisek fotky<TextInput value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Naše soukromá vzpomínka..." /></label><label className="grid gap-2 text-sm font-bold">Kategorie<select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-900 dark:border-white/10 dark:bg-gray-900 dark:text-white">{photoCategories.filter((item) => item.id !== 'all').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>{encryptionReady ? <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 font-black text-white hover:bg-pink-600"><input type="file" accept="image/*" className="hidden" onChange={(event) => { handleUpload(event.target.files?.[0]); event.target.value = ''; }} /><Image size={18} /> Nahrát fotku</label> : <button type="button" onClick={onMissingE2EE} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-black text-gray-900 hover:bg-amber-300"><Lock size={18} /> Nastavit E2EE heslo</button>}</div></div>;
}

function PhotoUploadButton({ addPhoto, encryptionReady, onMissingE2EE }) {
  const [uploading, setUploading] = useState(false);

  async function handleChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || uploading) return;
    if (!encryptionReady) { onMissingE2EE?.(); return; }
    setUploading(true);
    try {
      await addPhoto(file, { photoCategory: 'romantic', text: 'Fotka z feedu' });
    } finally {
      setUploading(false);
    }
  }

  if (!encryptionReady) {
    return (
      <button type="button" onClick={onMissingE2EE} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-black text-gray-900 hover:bg-amber-300">
        <Lock size={18} /> Nastavit E2EE pro fotky
      </button>
    );
  }

  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-3 font-black text-white ${uploading ? 'bg-pink-300' : 'bg-pink-500 hover:bg-pink-600'}`}>
      <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleChange} />
      <Plus size={18} /> {uploading ? 'Nahrávám...' : 'Přidat fotku'}
    </label>
  );
}

function FeedList({ posts, currentUserId, panicMode, galleryOnly = false, openImage, deletePost }) {
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
              <PostMediaCard post={post} locked={post.locked} loading={post.mediaLoading} blurred={panicMode} category={post.photo_category || 'fotka'} openImage={openImage} compact />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black">{photoCategories.find((category) => category.id === post.photo_category)?.label || 'Fotka'}</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{formatDate(post.created_at)}</div>
                  </div>
                  {post.author_id === currentUserId && <button type="button" onClick={() => deletePost?.(post)} className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white">Smazat</button>}
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{post.text}</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="font-black">{post.type === 'photo' ? 'Fotka' : post.type === 'gif' ? 'GIF' : post.type === 'mood' ? 'Nálada' : post.type === 'status' ? 'Status' : post.type === 'ritual' ? 'Rituál' : 'Zpráva'}</div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500 dark:text-gray-300">{formatDate(post.created_at)}</div>
                  {post.author_id === currentUserId && <button type="button" onClick={() => deletePost?.(post)} className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white">Smazat</button>}
                </div>
              </div>
              {post.type !== 'gif' && <p className="mt-3 text-lg">{post.text}</p>}
              {post.mood_label && <div className="mt-4 grid gap-2 sm:grid-cols-3"><div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold dark:bg-white/10">Nálada: {post.mood_label}</div><div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold dark:bg-white/10">Blízkost: {post.closeness}%</div><div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold dark:bg-white/10">Nadrženost: {post.heat}%</div></div>}
              {post.type === 'photo' && <PostMediaCard post={post} locked={post.locked} loading={post.mediaLoading} blurred={panicMode} category={post.photo_category || 'fotka'} openImage={openImage} />}
              {post.type === 'gif' && <GifMedia post={post} />}
            </>
          )}
        </article>
      ))}
    </div>
  );
}

function GifMedia({ post, compact = false }) {
  const [videoFailed, setVideoFailed] = useState(!post.gif_media_url);
  const [videoReady, setVideoReady] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(!post.gif_thumbnail_url);
  const width = Number.isInteger(post.gif_width) && post.gif_width > 0 ? post.gif_width : undefined;
  const height = Number.isInteger(post.gif_height) && post.gif_height > 0 ? post.gif_height : undefined;
  const duration = typeof post.gif_duration === 'number' && Number.isFinite(post.gif_duration) ? Math.round(post.gif_duration) : null;
  const sourceUrl = getSafeRedgifsSourceUrl(post.gif_source_url, post.gif_external_id);
  const embedUrl = getSafeRedgifsEmbedUrl(post.gif_embed_url)
    || (/^[a-z0-9]+$/i.test(post.gif_external_id || '') ? `https://www.redgifs.com/ifr/${post.gif_external_id.toLowerCase()}` : null);
  const mediaClassName = `w-full bg-gray-950 object-contain ${compact ? 'max-h-80 rounded-xl' : 'max-h-[32rem] rounded-3xl'}`;

  useEffect(() => {
    if (videoFailed || videoReady || !post.gif_media_url) return undefined;
    const timeout = window.setTimeout(() => setVideoFailed(true), 3000);
    return () => window.clearTimeout(timeout);
  }, [post.gif_media_url, videoFailed, videoReady]);

  return (
    <div className={compact ? '' : 'mt-4'}>
      {!videoFailed ? (
        <video
          src={post.gif_media_url}
          poster={post.gif_thumbnail_url || undefined}
          referrerPolicy="no-referrer"
          width={width}
          height={height}
          controls
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          className={mediaClassName}
        >
          Tvůj prohlížeč neumí přehrát toto video.
        </video>
      ) : embedUrl ? (
        <RedgifsEmbed embedUrl={embedUrl} compact={compact} title="GIF z RedGIFs" />
      ) : !thumbnailFailed ? (
        <img src={post.gif_thumbnail_url} alt="Náhled GIFu z RedGIFs" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setThumbnailFailed(true)} className={mediaClassName} />
      ) : (
        <div className={`${mediaClassName} grid min-h-36 rounded-3xl place-items-center p-4 text-center text-sm font-bold text-white`}>GIF se nepodařilo načíst.</div>
      )}
      <div className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${compact ? 'text-current opacity-80' : 'text-gray-500 dark:text-gray-300'}`}>
        {sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold underline underline-offset-2">
          Zdroj: RedGIFs <ExternalLink size={13} />
        </a>}
        {duration !== null && <span>{duration} s</span>}
      </div>
    </div>
  );
}


function GifSearchCard({ gif, disabled, sending, onSelect }) {
  const [videoFailed, setVideoFailed] = useState(!gif.mediaUrl);
  const [videoReady, setVideoReady] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(!gif.thumbnailUrl);
  const embedUrl = getSafeRedgifsEmbedUrl(gif.embedUrl);
  const sourceUrl = getSafeRedgifsSourceUrl(gif.sourceUrl, gif.externalId);

  useEffect(() => {
    if (videoFailed || videoReady || !gif.mediaUrl) return undefined;
    const timeout = window.setTimeout(() => setVideoFailed(true), 3000);
    return () => window.clearTimeout(timeout);
  }, [gif.mediaUrl, videoFailed, videoReady]);

  return (
    <div className="min-w-0">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-gray-900 text-white">
        {!videoFailed ? (
          <video
            src={gif.mediaUrl}
            poster={gif.thumbnailUrl || undefined}
            referrerPolicy="no-referrer"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : !thumbnailFailed ? (
          <img src={gif.thumbnailUrl} alt="Náhled GIFu" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setThumbnailFailed(true)} className="h-full w-full object-cover" />
        ) : embedUrl ? (
          <div className="pointer-events-none h-full w-full" aria-hidden="true">
            <RedgifsEmbed embedUrl={embedUrl} compact title="Náhled GIFu z RedGIFs" />
          </div>
        ) : (
          <div className="grid h-full place-items-center p-2 text-center text-xs font-bold text-white/80">Náhled není dostupný</div>
        )}
        <button type="button" disabled={disabled} onClick={() => onSelect(gif)} className="absolute inset-0 z-10 bg-transparent ring-inset transition hover:ring-4 hover:ring-pink-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white disabled:opacity-60" aria-label="Odeslat vybraný GIF">
          {sending && <span className="absolute inset-0 grid place-items-center bg-black/60 text-xs font-black">Odesílám…</span>}
        </button>
      </div>
      {sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 text-[11px] font-bold text-gray-500 underline underline-offset-2 dark:text-gray-300">Zdroj: RedGIFs <ExternalLink size={11} /></a>}
    </div>
  );
}

function RedgifsEmbed({ embedUrl, compact = false, title }) {
  return (
    <iframe
      src={embedUrl}
      title={title}
      loading="lazy"
      sandbox="allow-scripts allow-same-origin allow-presentation"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      referrerPolicy="no-referrer"
      className={`aspect-video w-full border-0 bg-gray-950 ${compact ? 'max-h-80 rounded-xl' : 'max-h-[32rem] rounded-3xl'}`}
    />
  );
}

function FullscreenImageViewer({ image, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={image.title || 'Náhled fotky'} className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4" onClick={onClose}>
      <button
        type="button"
        ref={closeButtonRef}
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

function ChallengesPanel({ challenges = [], allChallenges = [], category, setCategory, addChallenge, updateChallenge, requestChallengeConfirmation, challengePartner, assignDebtTask, repayDebt, currentUserId, stats }) {
  const safeStats = stats || getChallengeStats(allChallenges, currentUserId);
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
              <div className="rounded-2xl bg-white/15 p-4"><div className="text-xs font-bold text-white/70">Já</div><div className="text-4xl font-black">{safeStats.myXp}</div></div>
              <div className="rounded-2xl bg-white/15 p-4"><div className="text-xs font-bold text-white/70">Partner/ka</div><div className="text-4xl font-black">{safeStats.partnerXp}</div></div>
            </div>
            <div className="mt-4 text-sm font-bold text-white/80">Dluh: Já {safeStats.myDebt} / Partner {safeStats.partnerDebt}</div>
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
          {challenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} updateChallenge={updateChallenge} requestChallengeConfirmation={requestChallengeConfirmation} challengePartner={challengePartner} currentUserId={currentUserId} />)}
        </div>
      </Card>
    </div>
  );
}

function ChallengeCard({ challenge, updateChallenge, requestChallengeConfirmation, challengePartner, currentUserId }) {
  const [hours, setHours] = useState(24);
  const [confirmationRequested, setConfirmationRequested] = useState(false);
  const isAssignedToMe = challenge.assigned_to === currentUserId;
  const canAwardPartner = challenge.challenge_status === 'active' && challenge.challenged_by === currentUserId && challenge.assigned_to && !challenge.completed;
  const isActive = challenge.challenge_status === 'active';
  const isOpen = !challenge.completed && !isActive && !['failed', 'debt_assigned', 'debt_repaid', 'completed'].includes(challenge.challenge_status);

  async function handleConfirmationRequest() {
    setConfirmationRequested(true);
    const result = await requestChallengeConfirmation?.(challenge);
    if (result?.ok === false) setConfirmationRequested(false);
  }

  return (
    <article className="rounded-3xl border border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 p-5 dark:border-white/10 dark:from-white/10 dark:to-white/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-black">{challenge.title}</h4>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-pink-500 px-3 py-1 font-bold text-white">{challenge.category}</span>
            <span className="rounded-full bg-purple-500 px-3 py-1 font-bold text-white">+{challenge.xp || 10} XP</span>
            {isActive && <span className="rounded-full bg-amber-400 px-3 py-1 font-bold text-gray-900">Limit {formatDate(challenge.challenge_deadline)}</span>}
            {isAssignedToMe && isActive && <span className="rounded-full bg-white px-3 py-1 font-bold text-pink-700 dark:bg-white/10 dark:text-pink-200">Plníš ty</span>}
            {isActive && challenge.challenged_by === currentUserId && challenge.assigned_to !== currentUserId && <span className="rounded-full bg-white px-3 py-1 font-bold text-purple-700 dark:bg-white/10 dark:text-purple-200">Plní partner/ka</span>}
            {challenge.completed_by && <span className="rounded-full bg-emerald-500 px-3 py-1 font-bold text-white">Body uděleny</span>}
          </div>
        </div>
      </div>

      {challenge.completed ? (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
          Výzva je uzavřená. XP získal/a ten, komu je partner udělil.
        </div>
      ) : isAssignedToMe && isActive ? (
        <div className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300">
          <div>Tuhle výzvu máš splnit ty. Až ji splníš, požádej partnera/partnerku o potvrzení.</div>
          <button type="button" disabled={confirmationRequested} onClick={handleConfirmationRequest} className="mt-3 w-full rounded-2xl bg-pink-500 px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-emerald-500">{confirmationRequested ? '✓ Žádost odeslána' : 'Požádat o potvrzení splnění'}</button>
        </div>
      ) : canAwardPartner ? (
        <button
          onClick={() => updateChallenge(challenge.id, { completed: true, accepted: true, completed_by: challenge.assigned_to, completed_at: new Date().toISOString(), challenge_status: 'completed' })}
          className="mt-4 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20"
        >
          Udělit partnerovi +{challenge.xp || 10} XP
        </button>
      ) : isActive ? (
        <div className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300">
          Čeká se na potvrzení od partnera/partnerky. Body nelze přidat sám/sama sobě.
        </div>
      ) : null}

      {isOpen && (
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
  const [category, setCategory] = useState('romantic');
  const [difficulty, setDifficulty] = useState('Easy');
  const [xp, setXp] = useState(10);
  function submit() {
    if (!title.trim()) return;
    addChallenge({ title, category, difficulty, xp });
    setTitle('');
  }
  return (
    <Card>
      <h3 className="mb-2 text-xl font-black">Vytvořit vlastní výzvu</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-300">Výzva se sama neboduje. Nejdřív vyzveš partnera a XP mu přidáš až po skutečném splnění.</p>
      <div className="grid gap-3 md:grid-cols-[1fr_150px_150px_110px_auto]">
        <TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Napiš vlastní výzvu..." />
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-900 dark:border-white/10 dark:bg-gray-900 dark:text-white">
          {challengeCategories.filter((item) => item.id !== 'all').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select aria-label="Obtížnost výzvy" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-900 dark:border-white/10 dark:bg-gray-900 dark:text-white"><option value="Easy">Lehká</option><option value="Medium">Střední</option><option value="Hard">Náročná</option></select>
        <TextInput type="number" min="1" max="100" value={xp} onChange={(event) => setXp(Number(event.target.value))} />
        <button onClick={submit} className="rounded-2xl bg-purple-500 px-5 py-3 font-black text-white hover:bg-purple-600">Přidat</button>
      </div>
    </Card>
  );
}

function KamasutraPanel({ kamaProgress, kamaFilter, setKamaFilter, kamaSearch, setKamaSearch, kamaDifficultyFilter, setKamaDifficultyFilter, oralOnly, setOralOnly, toggleKama, updateKamaPreference, uploadKamaPhoto, encryptionReady, onMissingE2EE }) {
  const completed = kamaProgress.filter((item) => item.completed).length;
  const wantToTry = kamaProgress.filter((item) => item.desire_status === 'want').length;
  const favorites = kamaProgress.filter((item) => item.favorite).length;
  const progress = Math.round((completed / Math.max(1, kamaPositions.length)) * 100);
  const typeFilters = ['all', 'Vaginální', 'Orální', 'Romantické'];
  const difficultyFilters = ['all', 'Začátečníci', 'Středně pokročilé', 'Pokročilé'];
  const searchTerm = normalizeSearchText(kamaSearch);
  const filtered = kamaPositions
    .filter((position) => kamaFilter === 'all' || position.type === kamaFilter || position.tag === kamaFilter)
    .filter((position) => kamaDifficultyFilter === 'all' || position.difficulty === kamaDifficultyFilter)
    .filter((position) => !oralOnly || position.type === 'Orální')
    .filter((position) => {
      if (!searchTerm) return true;
      const searchable = normalizeSearchText([
        position.title,
        position.type,
        position.difficulty,
        position.tag,
        position.description?.setup,
        position.description?.focus,
        position.description?.comfort,
      ].filter(Boolean).join(' '));
      return searchable.includes(searchTerm);
    });
  const progressById = Object.fromEntries(kamaProgress.map((item) => [item.position_id, item]));

  return (
    <div className="grid gap-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-sm font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-200"><Heart size={16} /> Kamasutra 2.0</div>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Kamasutra Journey</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">50 různorodých neanálních pozic, vyhledávání podle názvu nebo popisu, filtry, ověřené odkazy na Lovino.cz a nově i stav „chci zkusit / oblíbené / ne pro nás“.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
              <span className="rounded-full bg-pink-100 px-3 py-1 text-pink-700 dark:bg-pink-500/20 dark:text-pink-200">Chci zkusit: {wantToTry}</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">Oblíbené: {favorites}</span>
            </div>
          </div>
          <div className="rounded-[2rem] bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 p-5 text-white shadow-2xl">
            <div className="text-xs font-bold text-white/80">Splněno</div>
            <div className="text-5xl font-black">{completed}</div>
            <div className="text-sm font-bold text-white/80">z {kamaPositions.length}</div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={kamaSearch}
              onChange={(event) => setKamaSearch(event.target.value)}
              placeholder="Vyhledat polohu, typ nebo popis..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-pink-200 dark:border-white/10 dark:bg-gray-900 dark:text-white"
            />
          </label>
          <div className="text-sm font-bold text-gray-500 dark:text-gray-300">
            Zobrazeno {filtered.length} / {kamaPositions.length}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {typeFilters.map((filter) => <PillButton key={filter} active={kamaFilter === filter} onClick={() => setKamaFilter(filter)}>{filter === 'all' ? 'Vše' : filter}</PillButton>)}
          {difficultyFilters.map((filter) => <PillButton key={filter} active={kamaDifficultyFilter === filter} onClick={() => setKamaDifficultyFilter(filter)}>{filter === 'all' ? 'Všechny úrovně' : filter}</PillButton>)}
          <button onClick={() => setOralOnly(!oralOnly)} className={`rounded-2xl px-4 py-2 text-sm font-black transition ${oralOnly ? 'bg-fuchsia-500 text-white' : 'border border-gray-200 bg-white/80 dark:border-white/10 dark:bg-white/10'}`}>Pouze orální</button>
        </div>
      </Card>

      <E2eeInlineNotice encryptionReady={encryptionReady} onProfile={onMissingE2EE} compact />

      {filtered.length === 0 ? (
        <EmptyState title="Žádná poloha nenalezena" text="Zkuste kratší výraz, jiný typ nebo vypnout některý filtr." icon={Search} />
      ) : (
        <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
          {filtered.map((position) => {
            const item = progressById[position.id];
            const lovinoUrl = createLovinoKamasutraUrl(position);
            const hasLovinoPositionUrl = hasVerifiedLovinoPositionUrl(position);
            return (
              <Card key={position.id} className="overflow-hidden p-0">
                <PoseGuide pose={position.pose} title={position.title} compact />
                <div className="p-2.5 sm:p-4">
                  <h3 className="text-sm font-black leading-tight sm:text-xl">{position.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="rounded-full bg-pink-100 px-2 py-1 text-[9px] font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-200 sm:text-[10px]">{position.type}</span>
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-[9px] font-black text-purple-700 dark:bg-purple-500/20 dark:text-purple-200 sm:text-[10px]">{position.difficulty}</span>
                  </div>
                  <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-gray-600 dark:text-gray-300 sm:text-sm">
                    <InstructionBlock title="Nastavení" text={position.description.setup} />
                    <InstructionBlock title="Pohyb a tempo" text={position.description.focus} />
                    <InstructionBlock title="Komfort" text={position.description.comfort} />
                  </div>
                  <a href={lovinoUrl} target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-pink-50 px-2 py-2 text-center text-[10px] font-black text-pink-700 transition hover:bg-pink-100 dark:border-pink-500/30 dark:bg-pink-500/10 dark:text-pink-200 sm:text-xs">
                    <ExternalLink size={14} /> {hasLovinoPositionUrl ? 'Zobrazit polohu na Lovino.cz' : 'Otevřít Kamasutru na Lovino.cz'}
                  </a>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateKamaPreference(position.id, { desire_status: item?.desire_status === 'want' ? null : 'want' })}
                      className={`rounded-2xl px-2 py-2 text-[10px] font-black transition sm:text-xs ${item?.desire_status === 'want' ? 'bg-pink-500 text-white' : 'border border-pink-100 bg-white/80 text-pink-700 dark:border-white/10 dark:bg-white/10 dark:text-pink-200'}`}
                    >
                      {item?.desire_status === 'want' ? '✓ Chci zkusit' : 'Chci zkusit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateKamaPreference(position.id, { favorite: !item?.favorite })}
                      className={`rounded-2xl px-2 py-2 text-[10px] font-black transition sm:text-xs ${item?.favorite ? 'bg-amber-400 text-gray-900' : 'border border-amber-100 bg-white/80 text-amber-700 dark:border-white/10 dark:bg-white/10 dark:text-amber-200'}`}
                    >
                      {item?.favorite ? '★ Oblíbené' : 'Oblíbené'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateKamaPreference(position.id, { desire_status: item?.desire_status === 'no' ? null : 'no' })}
                    className={`mt-2 w-full rounded-2xl px-2 py-2 text-[10px] font-black transition sm:text-xs ${item?.desire_status === 'no' ? 'bg-gray-700 text-white' : 'border border-gray-200 bg-white/80 text-gray-600 dark:border-white/10 dark:bg-white/10 dark:text-gray-300'}`}
                  >
                    {item?.desire_status === 'no' ? 'Označeno: ne pro nás' : 'Ne pro nás'}
                  </button>
                  <button onClick={() => toggleKama(position.id)} className={`mt-2 w-full rounded-2xl py-2 text-xs font-black transition sm:text-sm ${item?.completed ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'}`}>{item?.completed ? '✓ Vyzkoušeno' : 'Označit jako vyzkoušené'}</button>
                  {encryptionReady ? (
                    <label className="mt-2 flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-pink-300 px-2 py-2.5 text-center text-[10px] font-bold text-pink-600 hover:bg-pink-100 dark:border-pink-500/30 dark:text-pink-200 sm:text-[11px]">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          uploadKamaPhoto(position.id, file);
                        }}
                      />
                      {item?.signedUrl ? 'Změnit fotku' : 'Přidat fotku k poloze'}
                    </label>
                  ) : (
                    <button type="button" onClick={onMissingE2EE} className="mt-2 flex w-full items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 px-2 py-2.5 text-center text-[10px] font-black text-amber-700 hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200 sm:text-[11px]">
                      <Lock size={14} /> Nejdřív E2EE heslo
                    </button>
                  )}
                  {item?.signedUrl && <img src={item.signedUrl} alt={position.title} className="mt-3 h-28 w-full rounded-2xl object-cover shadow-xl sm:h-36" />}
                  {item?.locked && <div className="mt-3 rounded-2xl bg-gray-900 p-3 text-center text-xs font-bold text-white"><Lock className="mx-auto mb-1" size={16} />Šifrovaná fotka</div>}
                </div>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}


function InstructionBlock({ title, text }) {
  return (
    <div className="rounded-2xl border border-pink-100/70 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.06] sm:rounded-3xl sm:p-4">
      <div className="font-black text-gray-900 dark:text-white">{title}</div>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-600 dark:text-gray-300 sm:text-sm">{text}</p>
    </div>
  );
}

function PoseGuide({ pose, title, compact = false }) {
  const guides = { 'seated-face': { icon: Heart, label: 'Romantická blízkost' }, 'side-spoon': { icon: Moon, label: 'Pomalá intimita' }, 'edge-bed': { icon: Flame, label: 'Intenzivní energie' }, 'standing-mirror': { icon: Sparkles, label: 'Flirt a teasing' }, 'top-facing': { icon: Trophy, label: 'Partnerka vede tempo' }, 'kneeling-arch': { icon: Flame, label: 'Silná intenzita' }, tabletop: { icon: Sparkles, label: 'Hravá změna prostředí' }, 'side-facing': { icon: Moon, label: 'Jemné propojení' } };
  const guide = guides[pose] || { icon: Heart, label: 'Intimní moment' };
  const Icon = guide.icon;
  return <div className={`bg-[#fff7f3] dark:bg-[#120d18] ${compact ? 'p-2' : 'p-5'}`}><div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 p-2 text-center dark:border-fuchsia-400/20 dark:from-pink-500/10 dark:to-purple-500/10 sm:rounded-3xl sm:p-4"><div className={`${compact ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-20 w-20'} flex items-center justify-center rounded-2xl bg-white shadow-lg dark:bg-white/10`}><Icon className="text-pink-500" size={compact ? 16 : 36} /></div><div className={`${compact ? 'mt-1.5 text-[11px] leading-tight sm:text-xs' : 'mt-4 text-xl'} font-black text-gray-900 dark:text-white`}>{title}</div><div className="mt-1 rounded-full bg-pink-100 px-2 py-1 text-[9px] font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-200 sm:text-[10px]">{guide.label}</div></div></div>;
}

function ProfilePanel({ profile, couple, coupleAvatarUrl, profileName, setProfileName, updateProfileName, uploadCoupleAvatar, encryptionPassphrase, saveEncryptionPassphrase, signOut }) {
  const [draftPassphrase, setDraftPassphrase] = useState(encryptionPassphrase || '');
  const [rememberOnDevice, setRememberOnDevice] = useState(() => Boolean(localStorage.getItem(ENC_KEY_DEVICE)));

  function activatePassphrase() {
    saveEncryptionPassphrase(draftPassphrase, rememberOnDevice);
  }

  function clearPassphrase() {
    setDraftPassphrase('');
    setRememberOnDevice(false);
    saveEncryptionPassphrase('', false);
  }

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
          <div className="flex flex-col gap-3 sm:flex-row">
            <TextInput className="min-w-0 flex-1" placeholder={profile?.display_name || 'Tvoje jméno'} value={profileName} onChange={(event) => setProfileName(event.target.value)} />
            <button onClick={() => updateProfileName(profileName)} className="w-full shrink-0 rounded-2xl bg-gray-900 px-5 py-3 font-black text-white dark:bg-white dark:text-gray-900 sm:w-auto">Uložit</button>
          </div>
          <div className="mt-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <h3 className="flex items-center gap-2 text-xl font-black"><ShieldCheck className="text-emerald-500" /> End-to-end šifrování fotek</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Zadejte společné heslo, které znáte jen vy dva. Galerie, Kamasutra fotky i profilová fotka páru se zašifrují v prohlížeči ještě před uploadem do Supabase.
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
              <TextInput type="password" placeholder="Společné E2EE heslo" value={draftPassphrase} onChange={(event) => setDraftPassphrase(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && activatePassphrase()} />
              <button type="button" onClick={activatePassphrase} className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white hover:bg-emerald-700">Aktivovat heslo</button>
              <button type="button" onClick={clearPassphrase} className="rounded-2xl bg-gray-900 px-5 py-3 font-black text-white dark:bg-white dark:text-gray-900">Vymazat</button>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-white/70 p-3 text-sm dark:bg-white/10">
              <input type="checkbox" checked={rememberOnDevice} onChange={(event) => setRememberOnDevice(event.target.checked)} className="mt-1" />
              <span>
                <span className="font-black">Zapamatovat na tomto zařízení</span>
                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-300">Pohodlnější na vlastním mobilu, ale méně bezpečné při ztrátě zařízení. Bez zaškrtnutí heslo zmizí po zavření aplikace.</span>
              </span>
            </label>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Heslo se neukládá do cloudu. Když ho zapomenete, staré šifrované fotky nepůjde obnovit. Zadání se teď potvrzuje tlačítkem, takže se neaktivuje po každém znaku.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <FeatureTile icon={ShieldCheck} title="E2EE fotky" text="Fotky se šifrují AES-GCM v prohlížeči ještě před uploadem." />
            <FeatureTile icon={Users} title="Propojení páru" text="Párovací kód připojí druhý účet do stejného páru." />
            <FeatureTile icon={Wand2} title="Živá synchronizace" text="Zprávy, fotky, výzvy a pokrok se synchronizují přes Supabase Realtime." />
          </div>
          <button onClick={signOut} className="mt-6 rounded-2xl bg-gray-900 px-5 py-3 font-black text-white dark:bg-white dark:text-gray-900">Odhlásit</button>
        </div>
      </div>
    </Card>
  );
}

function BottomNav({ activeTab, setActiveTab }) {
  const secondaryActive = secondaryTabs.some((item) => item.id === activeTab);
  return <nav aria-label="Hlavní navigace" className="fixed bottom-[calc(.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 box-border px-2 sm:bottom-4 sm:px-4"><div className="mx-auto grid w-full max-w-[calc(100vw-1rem)] grid-cols-5 gap-1 rounded-3xl border border-white/70 bg-white/90 p-2 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-black/70 sm:max-w-2xl sm:p-3">{navItems.map((item) => { const Icon = item.icon; const active = activeTab === item.id || (item.id === 'more' && secondaryActive); return <button type="button" aria-current={active ? 'page' : undefined} aria-label={item.label} key={item.id} onClick={() => setActiveTab(item.id)} className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition sm:px-4 ${active ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'hover:bg-pink-50 dark:hover:bg-white/10'}`}><Icon aria-hidden="true" size={20} /><span className="max-w-full truncate text-[10px] font-bold sm:text-xs">{item.label}</span></button>; })}</div></nav>;
}

function MorePanel({ setActiveTab }) {
  return (
    <Card>
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-700 dark:bg-pink-500/20 dark:text-pink-100"><Sparkles size={15} /> Další společné možnosti</div>
        <h2 className="mt-3 text-3xl font-black">Co chcete dělat?</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-300">Méně používané části jsou tady, aby hlavní obrazovka zůstala jednoduchá.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryTabs.map((item) => {
          const Icon = item.icon;
          const descriptions = {
            moments: 'Krátká videa z dneška a partnerské hodnocení srdíčky.',
            feed: 'Nálady, statusy a společné momenty na jednom místě.',
            kamasutra: 'Soukromá inspirace, oblíbené polohy a společný pokrok.',
            profile: 'Jména, párování, zabezpečení fotek a nastavení účtu.',
          };
          return (
            <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} className="rounded-3xl border border-pink-100 bg-gradient-to-br from-white to-pink-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:from-white/10 dark:to-pink-500/10">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-pink-500 text-white"><Icon size={23} /></div>
              <h3 className="mt-4 text-lg font-black">{item.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-300">{descriptions[item.id]}</p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function FeatureTile({ icon: Icon, title, text }) {
  return <div className="rounded-3xl border border-pink-100 bg-pink-50 p-5 dark:border-white/10 dark:bg-white/10"><Icon className="text-pink-500" size={30} /><h3 className="mt-3 font-black">{title}</h3><p className="mt-2 text-sm text-gray-500 dark:text-gray-300">{text}</p></div>;
}
