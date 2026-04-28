import GlassPanel from '../components/GlassPanel';

export default function Home() {
  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>SYSTEM READY</h1>
      
      <GlassPanel title="STATUS DA CPU">
        <p style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
          Intel Core i9-13900K ativo e operando em capacidade nominal.
        </p>
      </GlassPanel>
    </div>
  );
}