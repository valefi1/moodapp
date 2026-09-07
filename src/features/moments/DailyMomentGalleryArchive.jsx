import { Heart } from 'lucide-react';

export function DailyMomentGalleryArchive({ moments, currentUserId, openMoments, formatDate, getStoredMomentMediaKind }) {
  const groups = Object.entries(moments.reduce((acc, moment) => {
    const dateKey = moment.moment_date || String(moment.created_at || '').slice(0, 10) || 'unknown';
    acc[dateKey] = [...(acc[dateKey] || []), moment];
    return acc;
  }, {})).sort(([first], [second]) => second.localeCompare(first));

  return (
    <section className="mb-6 rounded-3xl border border-fuchsia-200 bg-fuchsia-50/70 p-4 dark:border-fuchsia-400/20 dark:bg-fuchsia-500/10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">Dnešní momenty</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Archiv je seskupený podle dnů, aby galerie zůstala přehledná.</p>
        </div>
        <Heart className="shrink-0 text-pink-500" fill="currentColor" />
      </div>
      <div className="max-h-[720px] space-y-3 overflow-auto pr-1">
        {groups.map(([dateKey, dayMoments], groupIndex) => (
          <details key={dateKey} open={groupIndex === 0} className="overflow-hidden rounded-2xl border border-white/70 bg-white/70 dark:border-white/10 dark:bg-white/[0.06]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-black">
              <span>{dateKey === 'unknown' ? 'Bez data' : formatDate(`${dateKey}T12:00:00`)}</span>
              <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-xs text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-100">{dayMoments.length} {dayMoments.length === 1 ? 'moment' : 'momenty'}</span>
            </summary>
            <div className="grid gap-2 border-t border-fuchsia-100 p-2 sm:grid-cols-2 dark:border-white/10">
              {dayMoments.map((moment) => {
                const rating = moment.ratings?.find((item) => item.rater_id === currentUserId) || moment.ratings?.[0];
                const isVideo = getStoredMomentMediaKind(moment) === 'video';
                return (
                  <article key={moment.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-gray-950/50">
                    <div className="relative h-40 bg-black">
                      {moment.signedUrl
                        ? isVideo
                          ? <video src={moment.signedUrl} controls playsInline preload="metadata" className="h-full w-full object-contain" />
                          : <img src={moment.signedUrl} alt={moment.caption || 'Dnešní moment'} loading="lazy" className="h-full w-full object-cover" />
                        : <div className="grid h-full place-items-center p-4 text-center text-xs font-bold text-white">{moment.locked ? 'Šifrovaný moment' : 'Náhled není dostupný'}</div>}
                      <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-bold text-white">{moment.author_id === currentUserId ? 'Ty' : 'Partner/ka'}</span>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2 text-xs font-bold text-gray-500 dark:text-gray-300">
                        <span>{isVideo ? 'Video' : 'Fotka'} · {formatDate(moment.created_at)}</span>
                        {rating ? <span aria-label={`${rating.score} z 5 srdcí`}>{'❤️'.repeat(rating.score)}</span> : <span>Bez hodnocení</span>}
                      </div>
                      {moment.caption && <p className="mt-1 line-clamp-2 text-sm font-bold">{moment.caption}</p>}
                      <button type="button" onClick={openMoments} className="mt-2 text-xs font-black text-pink-600 underline underline-offset-2 dark:text-pink-200">Otevřít hodnocení</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

