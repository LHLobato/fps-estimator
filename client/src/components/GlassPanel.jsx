// src/components/GlassPanel.jsx

export default function GlassPanel({ children, title }) {
  const panelStyle = {
    backgroundColor: 'var(--bg-navy-glass)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)', /* Suporte para Safari */
    borderRadius: '8px',
    borderTop: '1px solid rgba(0, 219, 233, 0.3)', /* Borda top Cyan */
    borderLeft: '1px solid rgba(0, 219, 233, 0.3)',
    borderBottom: '1px solid rgba(182, 0, 248, 0.1)', /* Borda bottom Violet */
    borderRight: '1px solid rgba(182, 0, 248, 0.1)',
    padding: '24px',
    color: 'white'
  };

  const headerStyle = {
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  return (
    <div style={panelStyle}>
      {title && (
        <div style={headerStyle}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-cyan)', boxShadow: '0 0 10px var(--primary-cyan)' }}></div>
          <span className="label-caps">{title}</span>
        </div>
      )}
      {/* O "children" é o conteúdo que você vai colocar dentro do painel depois */}
      <div>{children}</div>
    </div>
  );
}