import { GlassPanel } from '../components/GlassPanel';

export default function Games() {
  return (
    <div className="w-full">
      <h2 className="font-headline-xl text-white tracking-tighter mb-2">LIBRARY</h2>
      <p className="text-slate-400 font-body-lg max-w-2xl mb-8">
        Browse and manage your game library with FPS estimations.
      </p>

      <GlassPanel className="p-8 rounded-lg">
        <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
          <span className="material-symbols-outlined text-cyan-400">sports_esports</span>
          <h3 className="font-label-caps text-sm text-white tracking-[0.2em]">GAME_LIBRARY</h3>
        </div>
        <p className="text-slate-300">
          This section will display your game library and performance metrics.
        </p>
      </GlassPanel>
    </div>
  );
}