import { Image, Lock, Video } from 'lucide-react';

export function MediaCard({ blurred, locked, loading, category, imageUrl, openImage, compact = false }) {
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
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition ${blurred ? 'blur-sm scale-105' : 'hover:scale-105'}`}
          />
        </button>
      ) : (
        <div className={`grid h-full place-items-center p-5 text-center text-white ${loading ? 'animate-pulse' : ''}`}>
          <div>
            {loading ? <Image className="mx-auto mb-3" size={44} /> : <Lock className="mx-auto mb-3" size={44} />}
            <div className="font-black">{loading ? 'Připravuju fotku…' : locked ? 'Šifrovaná fotka' : 'Fotka není dostupná'}</div>
            {!loading && <p className="mt-2 text-sm text-white/80">{locked ? 'Zadej správné E2EE heslo v profilu.' : 'Zkus obnovit stránku.'}</p>}
          </div>
        </div>
      )}
      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur">Soukromá fotka</span>
        <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-bold text-white">uloženo</span>
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

export function PostMediaCard({ post, locked, loading, blurred, category, openImage, compact = false }) {
  const isVideo = post.media_kind === 'video' || String(post.media_mime_type || post.mime_type || '').startsWith('video/');
  if (!isVideo) {
    return <MediaCard imageUrl={post.signedUrl} locked={locked} loading={loading} blurred={blurred} category={category} openImage={openImage} compact={compact} />;
  }

  return (
    <div className={`relative overflow-hidden border border-white/20 bg-gray-950 ${compact ? 'h-56 md:h-72' : 'mt-4 min-h-72 rounded-3xl'}`}>
      {post.signedUrl ? (
        <video
          src={post.signedUrl}
          controls
          playsInline
          preload="metadata"
          className={`h-full min-h-72 w-full object-contain ${blurred ? 'blur-sm' : ''}`}
        />
      ) : (
        <div className={`grid h-full min-h-72 place-items-center p-5 text-center text-white ${loading ? 'animate-pulse' : ''}`}>
          <div>
            {loading ? <Video className="mx-auto mb-3" size={44} /> : <Lock className="mx-auto mb-3" size={44} />}
            <div className="font-black">{loading ? 'Připravuju video…' : locked ? 'Šifrované video' : 'Video není dostupné'}</div>
            {!loading && <p className="mt-2 text-sm text-white/80">{locked ? 'Zadej správné E2EE heslo v profilu.' : 'Zkus obnovit stránku.'}</p>}
          </div>
        </div>
      )}
      <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur">Dnešní moment</div>
    </div>
  );
}

