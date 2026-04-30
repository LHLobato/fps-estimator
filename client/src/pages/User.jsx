import { useState } from 'react';
import { GlassPanel } from '../components/GlassPanel';

export default function User() {
  const [systemConfig, setSystemConfig] = useState({
    cpu: 'Intel Core i9-13900K',
    gpu: 'NVIDIA RTX 4090',
    ram: '64GB DDR5 6000MHz'
  });

  const [games, setGames] = useState([
    {
      id: 1,
      title: 'CYBERPUNK_2077',
      fps: 94,
      tag: 'RTX_READY',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMIOLj7B3Fye-WTRLNIJBR3RCh-gE5UevbhWdKAKaNP8uLsfAfRXG8gdOToV9HVdrTF5-_QiUXLP61sQdBp5Fmkovlcv4-HzreuGifLNZdg1DK_VpDbewwGITL45OTYLJP809AKjoN1BBnBMABT8hjSUzvzRi_Zm0ighwMdtkO5WCLXXndwN4QPAbwSa4UYz8FnupLAWkhxdXACR38gGFqsHSj4xiuE2ssVbLRkUBlu5BZQapcbHtN2g26R79fTb7WrmVSsC6xtcw',
      tagColor: 'cyan'
    },
    {
      id: 2,
      title: 'ELDEN_RING',
      fps: 60,
      tag: 'STRESS_TEST',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYkI2j1nyy3GPAuLPbFoq1rEEpQQFt7cNdtUYIoQMIh49tJuHnhg5LJoU1WrsHR2V9Ku82Pf7auY3udUGYmr41L8eDoS3DCKXuTRXLzhPZcnOm3L48o_szzo2OcdbFX_kCBvgJNO9IlNxXhZM6Y2X-0jzkVEvsiRqKNFGeip_FSegKZhwaYIZE-Pq4-hEmcEVhyqv3Hy8lCvqwmhPwr0iawx6PY03RnfRkQdGUkdwG0EUG3K75JczRUq_Xn0ZDiykSkvg6QtiJ0xQ',
      tagColor: 'violet'
    },
    {
      id: 3,
      title: 'FORZA_HORIZON_5',
      fps: 144,
      tag: 'OPTIMIZED',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi3F4PE5TEST9TEXfC2C3tws_HRbsG7K7qI0yEob4PnXnxAtI2YlbDDUGGxz-E7t2PvKfxkWlOFs1MMiaDi6ZqSGmNWs0-i6vIi_BNn8MMy9c9j8DpuvtKg-n2i2Q0QxgDztGhafFgDuSfenEgydFX2NpzOHCJ0P7CSB1xYXfwhGzXTSMP3zQeva1eAJRDtTNaVSItZ2yr79fEW-lUYsE4VUhQl9fDhfn7nbhIIDpMqTHzat3PpDB99ca-COSU-DQ-No9QtJzd8Ws',
      tagColor: 'cyan'
    },
    {
      id: 4,
      title: 'WARZONE_2.0',
      fps: 128,
      tag: 'RTX_READY',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUunx1jbjsZgU2RUcLDfdA2PuMYvoHvJPTCH7gf1u5LRMxTCT5KbJl2iwh5cg99KDIEADTrKJu8cu4-TI_I_JEId-LtGxgSlofV1CJLB5huSDzKNbv65Ubsq9LCT8KO67AH0r1vddgReIAYcAT7N1rhd8U-SNBscZo45MslrkUcIGG3mUbOyl7nT2qAfBZek7rjhb9OS2v51v_ulSmJBPw6A59Bt_iAzvTaUnor3XNA_n8PrHEZ09o9QmQrXx8OnCUDaKAFPmzses',
      tagColor: 'cyan'
    }
  ]);

  const handleUpdateSystem = () => {
    alert('System configuration updated successfully!');
  };

  const handleConfigChange = (field, value) => {
    setSystemConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="w-full">
      {/* Hero Title */}
      <div className="mb-10">
        <h1 className="font-headline-xl text-cyan-400 mb-2 uppercase">Neural Library</h1>
        <p className="font-body-lg text-on-surface-variant max-w-2xl">
          Access your archived performance metrics and hardware configurations across the meta-network.
        </p>
      </div>

      {/* Dashboard Bento Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Section 1: Current Rig Configuration (Editable) */}
        <section className="col-span-12 lg:col-span-8 glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="header-bar px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-cyan-400">memory</span>
              <h3 className="font-label-caps text-on-surface">Current Rig Configuration</h3>
            </div>
            <span className="font-label-caps text-[10px] text-cyan-400/50">SYSTEM_ID: X-9900_V</span>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* CPU Field */}
            <div className="space-y-2">
              <label className="font-label-caps text-xs text-on-surface-variant">Central Processing Unit</label>
              <div className="relative group">
                <input
                  type="text"
                  value={systemConfig.cpu}
                  onChange={(e) => handleConfigChange('cpu', e.target.value)}
                  className="w-full bg-slate-900/40 border-0 border-b border-cyan-500/30 py-3 px-0 font-headline-md text-cyan-400 focus:ring-0 focus:border-cyan-400 focus:bg-cyan-500/5 transition-all outline-none"
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-cyan-400 group-focus-within:w-full transition-all duration-300"></div>
              </div>
              <p className="font-label-caps text-[9px] text-slate-500">MAX_FREQ: 5.8GHZ</p>
            </div>

            {/* GPU Field */}
            <div className="space-y-2">
              <label className="font-label-caps text-xs text-on-surface-variant">Graphics Processor</label>
              <div className="relative group">
                <input
                  type="text"
                  value={systemConfig.gpu}
                  onChange={(e) => handleConfigChange('gpu', e.target.value)}
                  className="w-full bg-slate-900/40 border-0 border-b border-cyan-500/30 py-3 px-0 font-headline-md text-cyan-400 focus:ring-0 focus:border-cyan-400 focus:bg-cyan-500/5 transition-all outline-none"
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-cyan-400 group-focus-within:w-full transition-all duration-300"></div>
              </div>
              <p className="font-label-caps text-[9px] text-slate-500">VRAM: 24GB GDDR6X</p>
            </div>

            {/* RAM Field */}
            <div className="space-y-2">
              <label className="font-label-caps text-xs text-on-surface-variant">System Memory</label>
              <div className="relative group">
                <input
                  type="text"
                  value={systemConfig.ram}
                  onChange={(e) => handleConfigChange('ram', e.target.value)}
                  className="w-full bg-slate-900/40 border-0 border-b border-cyan-500/30 py-3 px-0 font-headline-md text-cyan-400 focus:ring-0 focus:border-cyan-400 focus:bg-cyan-500/5 transition-all outline-none"
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-cyan-400 group-focus-within:w-full transition-all duration-300"></div>
              </div>
              <p className="font-label-caps text-[9px] text-slate-500">LATENCY: CL30</p>
            </div>
          </div>

          <div className="px-8 pb-8 flex justify-end">
            <button
              onClick={handleUpdateSystem}
              className="bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 font-label-caps py-3 px-8 rounded-lg font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] active:scale-95"
            >
              UPDATE SYSTEM ARCHITECTURE
            </button>
          </div>
        </section>

        {/* Section 3: Performance History */}
        <section className="col-span-12 lg:col-span-4 glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="header-bar px-6 py-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-violet-400">history</span>
            <h3 className="font-label-caps text-on-surface">Performance History</h3>
          </div>

          <div className="p-6 space-y-6 flex-1">
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <div>
                  <p className="font-label-caps text-[10px] text-slate-500">LAST ESTIMATION</p>
                  <p className="font-body-md text-on-surface">Starfield 4K Ultra</p>
                </div>
                <div className="text-right">
                  <p className="font-data-display text-2xl text-cyan-400">
                    82 <span className="text-xs font-label-caps">FPS</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <div>
                  <p className="font-label-caps text-[10px] text-slate-500">SYSTEM STABILITY</p>
                  <p className="font-body-md text-on-surface">Thermal Stress Test</p>
                </div>
                <div className="text-right">
                  <p className="font-data-display text-2xl text-violet-400">
                    99.8 <span className="text-xs font-label-caps">%</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Mini Trend Chart */}
            <div className="mt-auto h-24 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                <defs>
                  <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4"></stop>
                    <stop offset="100%" stopColor="#00f0ff" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path
                  d="M0 40 L0 30 Q 10 10, 20 25 T 40 15 T 60 30 T 80 5 T 100 20 L 100 40 Z"
                  fill="url(#lineGrad)"
                ></path>
                <path
                  d="M0 30 Q 10 10, 20 25 T 40 15 T 60 30 T 80 5 T 100 20"
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="1"
                ></path>
              </svg>
            </div>
          </div>
        </section>

        {/* Section 2: Your Neural Library (Gallery) */}
        <section className="col-span-12 glass-panel rounded-xl overflow-hidden">
          <div className="header-bar px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-cyan-400">grid_view</span>
              <h3 className="font-label-caps text-on-surface">Your Neural Library</h3>
            </div>
            <button className="flex items-center gap-2 font-label-caps text-xs text-cyan-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-sm">add</span>
              ADD NEW TITLE
            </button>
          </div>

          <div className="p-gutter grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* Game Cards */}
            {games.map((game) => (
              <div
                key={game.id}
                className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all"
              >
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src={game.image}
                  alt={game.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-4">
                  <span
                    className={`bg-${game.tagColor}-500/20 text-${game.tagColor}-400 border border-${game.tagColor}-500/40 font-label-caps text-[8px] w-fit px-2 py-0.5 rounded-full mb-2`}
                    style={{
                      backgroundColor: game.tagColor === 'cyan' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                      color: game.tagColor === 'cyan' ? '#00f0ff' : '#c084fc',
                      borderColor: game.tagColor === 'cyan' ? 'rgba(0, 240, 255, 0.4)' : 'rgba(168, 85, 247, 0.4)'
                    }}
                  >
                    {game.tag}
                  </span>
                  <h4 className="font-headline-md text-sm text-white mb-1">{game.title}</h4>
                  <div className="flex justify-between items-center">
                    <span className="font-label-caps text-[9px] text-slate-400">FPS AVG: {game.fps}</span>
                    <span className="material-symbols-outlined text-cyan-400 text-lg group-hover:translate-x-1 transition-transform">
                      play_arrow
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Placeholder */}
            <button className="aspect-[3/4] rounded-lg border-2 border-dashed border-cyan-500/20 bg-cyan-500/5 flex flex-col items-center justify-center gap-4 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all group">
              <div className="w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl text-cyan-400">add</span>
              </div>
              <span className="font-label-caps text-xs text-slate-400 group-hover:text-cyan-400">ADD NEW TITLE</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}