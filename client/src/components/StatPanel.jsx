import GlassCard from './GlassCard';

export default function StatPanel({ title, value, unit, accent = 'var(--primary-cyan)' }) {
  return (
    <GlassCard title={title} className="stat-panel">
      <div className="stat-body">
        <span className="data-display" style={{ color: accent }}>
          {value}
        </span>
        {unit && (
          <span className="font-label-caps text-[12px] text-[color:var(--text-muted)] tracking-[0.1em]">
            {unit}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
