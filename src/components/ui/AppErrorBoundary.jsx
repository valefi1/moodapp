import React from 'react';

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Keep diagnostics local to the browser console; never persist user data.
    console.error('MoodSync render error', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-50 via-white to-purple-100 px-5 py-10 text-gray-900 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950 dark:text-white">
        <section role="alert" className="w-full max-w-lg rounded-[2rem] border border-pink-200 bg-white/90 p-7 text-center shadow-2xl backdrop-blur dark:border-white/10 dark:bg-white/10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-pink-500">MoodSync</p>
          <h1 className="mt-3 text-2xl font-black">Aplikace potřebuje obnovit</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
            Došlo k neočekávané chybě zobrazení. Tvoje data zůstávají uložená; zkus aplikaci načíst znovu.
          </p>
          <button type="button" onClick={this.handleReload} className="mt-6 min-h-12 rounded-2xl bg-pink-500 px-6 py-3 font-black text-white shadow-lg shadow-pink-500/20 transition hover:bg-pink-600 focus-visible:outline-3 focus-visible:outline-pink-400 focus-visible:outline-offset-2">
            Načíst znovu
          </button>
        </section>
      </main>
    );
  }
}
