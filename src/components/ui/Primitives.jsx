import { Sparkles } from 'lucide-react';

export function Card({ children, className = '' }) {
  return <section className={`box-border w-full max-w-full min-w-0 rounded-[1.5rem] border border-white/70 bg-white/85 p-4 shadow-xl backdrop-blur-xl dark:border-fuchsia-300/10 dark:bg-white/[0.07] dark:shadow-black/30 sm:rounded-[2rem] sm:p-5 ${className}`}>{children}</section>;
}

export function PillButton({ active, children, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={Boolean(active)} className={`rounded-2xl px-3 py-1.5 text-xs font-bold transition sm:px-4 sm:py-2 sm:text-sm ${active ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'border border-gray-200 bg-white/80 hover:bg-pink-50 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15'}`}>
      {children}
    </button>
  );
}

export function TextInput(props) {
  return <input {...props} className={`w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-4 focus:ring-pink-200 dark:border-white/10 dark:bg-gray-900 dark:text-white ${props.className || ''}`} />;
}

export function EmptyState({ title, text, icon: Icon = Sparkles }) {
  return (
    <div className="rounded-3xl border border-dashed border-pink-200 bg-pink-50/70 p-8 text-center dark:border-white/10 dark:bg-white/5">
      <Icon className="mx-auto text-pink-500" size={34} />
      <h3 className="mt-3 text-xl font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-300">{text}</p>
    </div>
  );
}

