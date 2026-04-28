// src/components/GlassPanel.jsx

export function GlassPanel({ children, title, className = '' }) {
  return (
    <div className={`glass-panel ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.5)]"></div>
          <span className="font-label-caps text-[11px] text-white tracking-[0.25em]">{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}

export default GlassPanel;