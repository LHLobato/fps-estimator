export default function GlassCard({ title, children, className = '' }) {
  return (
    <section className={`glass-card ${className}`}>
      {title && (
        <header className="card-header">
          <span className="status-dot" aria-hidden="true" />
          <span className="font-label-caps text-[12px] text-[color:var(--text-primary)] tracking-[0.1em]">
            {title}
          </span>
        </header>
      )}
      {children}
    </section>
  );
}
