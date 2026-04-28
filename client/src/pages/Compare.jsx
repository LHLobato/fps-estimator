import { useState } from 'react';
import { GlassPanel } from '../components/GlassPanel';

export default function Compare() {
  const [setup1, setSetup1] = useState({
    name: 'High-End Gaming',
    cpu: 'Intel Core i9-13900K',
    gpu: 'NVIDIA GeForce RTX 4090',
    ram: '64GB DDR5 6000MT/s',
    color: 'cyan',
  });

  const [setup2, setSetup2] = useState({
    name: 'Mid-Range Gaming',
    cpu: 'AMD Ryzen 7 5700X',
    gpu: 'NVIDIA GeForce RTX 3080',
    ram: '32GB DDR4 3600MT/s',
    color: 'secondary',
  });

  const games = [
    { name: 'Cyberpunk 2077', setup1: 142, setup2: 87 },
    { name: 'Elden Ring', setup1: 165, setup2: 98 },
    { name: 'Baldurs Gate 3', setup1: 118, setup2: 72 },
    { name: 'Starfield', setup1: 145, setup2: 92 },
    { name: 'Avatar Frontiers', setup1: 98, setup2: 58 },
  ];

  const metrics = [
    {
      label: 'AVERAGE_FPS',
      setup1: '127.6',
      setup2: '81.4',
      unit: 'FPS',
      advantage: 'setup1',
    },
    {
      label: 'GPU_PERFORMANCE',
      setup1: '96%',
      setup2: '68%',
      unit: '%',
      advantage: 'setup1',
    },
    {
      label: 'CPU_EFFICIENCY',
      setup1: '89%',
      setup2: '74%',
      unit: '%',
      advantage: 'setup1',
    },
    {
      label: 'MEMORY_BANDWIDTH',
      setup1: '576GB/s',
      setup2: '288GB/s',
      unit: 'GB/s',
      advantage: 'setup1',
    },
  ];

  const getDifference = (game) => {
    const diff = game.setup1 - game.setup2;
    const percent = ((diff / game.setup2) * 100).toFixed(1);
    return `+${percent}%`;
  };

  const getAdvantageColor = (advantage) => {
    return advantage === 'setup1' ? 'text-primary-fixed-dim' : 'text-secondary';
  };

  return (
    <div className="w-full">
      {/* HERO HEADER */}
      <div className="mb-8">
        <h2 className="font-headline-xl text-white tracking-tighter mb-2">
          HARDWARE{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-fixed-dim to-secondary">
            COMPARISON
          </span>
        </h2>
        <p className="text-on-surface-variant font-body-lg max-w-2xl">
          Compare two hardware configurations side-by-side and see performance differences across multiple games.
        </p>
      </div>

      {/* SETUP SELECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter mb-8">
        {/* Setup 1 */}
        <GlassPanel className="p-8 rounded-lg relative overflow-hidden border-l-4 border-l-primary-fixed-dim">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-fixed-dim"></div>

          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <span className="material-symbols-outlined text-primary-fixed-dim">build</span>
            <h3 className="font-label-caps text-sm text-white tracking-[0.2em]">SETUP_01</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-label-caps text-[10px] text-on-surface-variant mb-2">CONFIGURATION_NAME</p>
              <p className="text-white font-headline-md">{setup1.name}</p>
            </div>

            <div>
              <p className="font-label-caps text-[10px] text-primary-fixed-dim mb-2">CPU</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-fixed-dim/20 border border-primary-fixed-dim text-primary-fixed-dim text-xs font-label-caps rounded">
                  {setup1.cpu}
                </span>
              </div>
            </div>

            <div>
              <p className="font-label-caps text-[10px] text-primary-fixed-dim mb-2">GPU</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-fixed-dim/20 border border-primary-fixed-dim text-primary-fixed-dim text-xs font-label-caps rounded">
                  {setup1.gpu}
                </span>
              </div>
            </div>

            <div>
              <p className="font-label-caps text-[10px] text-primary-fixed-dim mb-2">MEMORY</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-fixed-dim/20 border border-primary-fixed-dim text-primary-fixed-dim text-xs font-label-caps rounded">
                  {setup1.ram}
                </span>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Setup 2 */}
        <GlassPanel className="p-8 rounded-lg relative overflow-hidden border-l-4 border-l-secondary">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>

          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <span className="material-symbols-outlined text-secondary">build</span>
            <h3 className="font-label-caps text-sm text-white tracking-[0.2em]">SETUP_02</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-label-caps text-[10px] text-on-surface-variant mb-2">CONFIGURATION_NAME</p>
              <p className="text-white font-headline-md">{setup2.name}</p>
            </div>

            <div>
              <p className="font-label-caps text-[10px] text-secondary mb-2">CPU</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-secondary/20 border border-secondary text-secondary text-xs font-label-caps rounded">
                  {setup2.cpu}
                </span>
              </div>
            </div>

            <div>
              <p className="font-label-caps text-[10px] text-secondary mb-2">GPU</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-secondary/20 border border-secondary text-secondary text-xs font-label-caps rounded">
                  {setup2.gpu}
                </span>
              </div>
            </div>

            <div>
              <p className="font-label-caps text-[10px] text-secondary mb-2">MEMORY</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-secondary/20 border border-secondary text-secondary text-xs font-label-caps rounded">
                  {setup2.ram}
                </span>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* PERFORMANCE METRICS */}
      <GlassPanel className="p-8 rounded-lg mb-8">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
          <span className="material-symbols-outlined text-primary-fixed-dim">speed</span>
          <h3 className="font-label-caps text-sm text-white tracking-[0.2em]">PERFORMANCE_METRICS</h3>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-unit-6">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-surface-container-low p-6 rounded border border-white/5">
              <p className="font-label-caps text-[10px] text-on-surface-variant mb-4">{metric.label}</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">Setup 01</p>
                  <p className={`font-data-display text-3xl ${getAdvantageColor(metric.advantage)}`}>
                    {metric.setup1}
                  </p>
                  <p className="font-label-caps text-[9px] text-on-surface-variant mt-1">{metric.unit}</p>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <p className="text-xs text-on-surface-variant mb-1">Setup 02</p>
                  <p className="font-data-display text-3xl text-on-surface-variant">
                    {metric.setup2}
                  </p>
                  <p className="font-label-caps text-[9px] text-on-surface-variant mt-1">{metric.unit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* GAME PERFORMANCE COMPARISON */}
      <GlassPanel className="p-8 rounded-lg">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
          <span className="material-symbols-outlined text-primary-fixed-dim">sports_esports</span>
          <h3 className="font-label-caps text-sm text-white tracking-[0.2em]">GAME_PERFORMANCE</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 font-label-caps text-[10px] text-on-surface-variant">
                  GAME_TITLE
                </th>
                <th className="text-center py-4 px-4 font-label-caps text-[10px] text-primary-fixed-dim">
                  SETUP_01
                </th>
                <th className="text-center py-4 px-4 font-label-caps text-[10px] text-on-surface-variant">
                  VS
                </th>
                <th className="text-center py-4 px-4 font-label-caps text-[10px] text-secondary">
                  SETUP_02
                </th>
                <th className="text-right py-4 px-4 font-label-caps text-[10px] text-on-surface-variant">
                  ADVANTAGE
                </th>
              </tr>
            </thead>
            <tbody>
              {games.map((game, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 text-white font-body-md">{game.name}</td>
                  <td className="text-center py-4 px-4">
                    <span className="font-data-display text-2xl text-primary-fixed-dim">{game.setup1}</span>
                    <p className="font-label-caps text-[9px] text-on-surface-variant">FPS</p>
                  </td>
                  <td className="text-center py-4 px-4">
                    <div className="w-12 h-1 bg-gradient-to-r from-primary-fixed-dim to-secondary rounded-full mx-auto"></div>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="font-data-display text-2xl text-secondary">{game.setup2}</span>
                    <p className="font-label-caps text-[9px] text-on-surface-variant">FPS</p>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className={`font-label-caps text-[10px] ${getAdvantageColor('setup1')}`}>
                      {getDifference(game)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-unit-6">
          <div className="bg-surface-container-low p-6 rounded border border-white/5">
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-4">AVERAGE_PERFORMANCE</p>
            <p className="font-data-display text-4xl text-primary-fixed-dim">127.6</p>
            <p className="font-label-caps text-[10px] text-on-surface-variant mt-2">FPS ACROSS ALL GAMES</p>
          </div>
          <div className="bg-surface-container-low p-6 rounded border border-white/5">
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-4">PERFORMANCE_GAP</p>
            <p className="font-data-display text-4xl text-secondary">+56.7%</p>
            <p className="font-label-caps text-[10px] text-on-surface-variant mt-2">SETUP_01 ADVANTAGE</p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}