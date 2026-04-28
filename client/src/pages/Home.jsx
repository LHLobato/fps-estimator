import DashboardGrid from '../components/DashboardGrid';
import GlassCard from '../components/GlassCard';

export default function Home() {
  return (
    <div className="w-full">
      {/* HERO HEADER */}
      <div className="mb-8">
        <h2 className="font-headline-xl text-white tracking-tighter mb-2">
          PERFORMANCE{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-secondary">
            ANALYTICS
          </span>
        </h2>
        <p className="text-slate-400 font-body-lg max-w-2xl">
          View detailed performance metrics and historical analysis of your FPS estimates.
        </p>
      </div>

      <DashboardGrid>
        <div className="grid-span-12">
          <GlassCard title="ANALYTICS_DASHBOARD" className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <div className="flex flex-col items-center justify-center gap-4 text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-600">dashboard</span>
              <p className="text-sm text-slate-400">Analytics dashboard coming soon...</p>
            </div>
          </GlassCard>
        </div>
      </DashboardGrid>
    </div>
  );
}
