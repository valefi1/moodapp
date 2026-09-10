import { MessageCircle } from 'lucide-react';
import { getLocalDateKey } from '../../lib/productUtils';

function groupByDay(posts) {
  return Object.entries(posts.reduce((groups, post) => {
    const dateKey = getLocalDateKey(new Date(post.created_at));
    groups[dateKey] = [...(groups[dateKey] || []), post];
    return groups;
  }, {})).sort(([first], [second]) => second.localeCompare(first));
}

function StatusMomentCard({ post, currentUserId }) {
  const mine = post.author_id === currentUserId;
  return (
    <article className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-300/20 dark:bg-amber-500/10">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-400 text-gray-900"><MessageCircle size={19} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black text-amber-800 dark:text-amber-100">
            <span>{mine ? 'Tvůj status' : 'Status partnera/partnerky'}</span>
            <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</time>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-base font-bold text-gray-900 dark:text-white">{post.text}</p>
        </div>
      </div>
    </article>
  );
}

export function StatusMomentArchive({ posts = [], currentUserId, title = 'Status momenty' }) {
  if (posts.length === 0) return null;
  const groups = groupByDay(posts);
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-300/20 dark:bg-amber-500/10">
      <div className="mb-3">
        <h3 className="text-xl font-black">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">Krátké textové zprávy ze dne, uložené spolu s foto a video momenty.</p>
      </div>
      <div className="grid gap-2">
        {groups.map(([dateKey, dayPosts], index) => (
          <details key={dateKey} open={index === 0} className="rounded-2xl border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.06]">
            <summary className="cursor-pointer list-none font-black">{new Date(`${dateKey}T12:00:00`).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {dayPosts.length}</summary>
            <div className="mt-3 grid gap-2">{dayPosts.map((post) => <StatusMomentCard key={post.id} post={post} currentUserId={currentUserId} />)}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
