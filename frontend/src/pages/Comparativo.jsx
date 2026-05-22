import { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getComparativo } from '../services/api'
import { ROTA_LABEL } from '../lib/brand'
import SectionHeader from '../components/SectionHeader'
import Chip from '../components/Chip'

const METRICAS = [
  { key: 'kda',     label: 'KDA Médio',    color: '#fbbf24' },
  { key: 'cspm',    label: 'CS / Min',     color: '#fde68a' },
  { key: 'dpm',     label: 'Dano / Min',   color: '#84cc16' },
  { key: 'kp',      label: 'Kill Part. %', color: '#ec4899' },
  { key: 'visao',   label: 'Vision',       color: '#60a5fa' },
  { key: 'winrate', label: 'Winrate %',    color: '#f97316' },
]

export default function Comparativo() {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrica, setMetrica] = useState('kda')

  useEffect(() => {
    getComparativo()
      .then(r => setDados(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const met = METRICAS.find(m => m.key === metrica)

  const sorted = useMemo(() =>
    [...dados].sort((a, b) => (b[metrica] ?? 0) - (a[metrica] ?? 0)),
    [dados, metrica]
  )

  if (loading) return <div className="py-20 text-center text-warm-4 font-bold">Carregando…</div>

  const maxPartidas = Math.max(...dados.map(d => d.partidas_analisadas || 0), 0)

  return (
    <div className="py-8">
      <SectionHeader
        title="Comparativo"
        accent="da resenha"
        sub={`médias das últimas ${maxPartidas > 0 ? maxPartidas : 30} partidas`}
      />

      {/* Chooser */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[11px] text-warm-4 font-extrabold uppercase tracking-[1px] mr-1 self-center">Métrica</span>
        {METRICAS.map(m => (
          <Chip key={m.key} active={metrica === m.key} onClick={() => setMetrica(m.key)}>
            {m.label}
          </Chip>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-bg-1 rounded-lg p-6 border-2 border-bg-2 shadow-card mb-8">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" margin={{ left: 24, right: 32 }}>
              <XAxis type="number" tick={{ fill: '#a07956', fontSize: 11, fontFamily: 'DM Mono' }}/>
              <YAxis
                type="category"
                dataKey="riot_id"
                tick={{ fill: '#fef3c7', fontSize: 13, fontFamily: 'Bowlby One' }}
                width={90}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{
                  background: '#261c16',
                  border: '2px solid #3d2d20',
                  borderRadius: 14,
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 700,
                  color: '#fef3c7',
                }}
                labelStyle={{ color: '#fbbf24', fontFamily: 'Bowlby One' }}
                formatter={(value) => [
                  typeof value === 'number' ? value.toLocaleString('pt-BR') : value,
                  met?.label,
                ]}
              />
              <Bar dataKey={metrica} radius={[0, 999, 999, 0]}>
                {sorted.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === 0 ? '#fbbf24' : i === sorted.length - 1 ? '#ef4444' : met?.color || '#fde68a'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <SectionHeader title="Tabela" accent="completa"/>

      <div className="bg-bg-1 rounded-lg border-2 border-bg-2 shadow-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-dashed border-warm-5/30">
              {['Jogador','KDA','CS/m','DPM','KP%','Visão','WR%','GD@15'].map((h, i) => (
                <th key={i} className={`px-4 py-3.5 font-display text-xs text-warm-3 tracking-wider uppercase font-normal ${i === 0 ? 'text-left' : 'text-center'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(d => (
              <tr key={d.puuid} className="border-b border-dashed border-warm-5/20 last:border-b-0">
                <td className="px-4 py-3.5">
                  <div className="font-display text-[15px] text-cream -tracking-[0.2px]">{d.riot_id}</div>
                  <div className="text-[10px] text-warm-4 font-mono mt-0.5">
                    {d.tier} {d.rank}{d.rota_principal ? ` · ${ROTA_LABEL[d.rota_principal] || d.rota_principal}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-center font-mono font-bold text-banana">{d.kda}</td>
                <td className="px-4 py-3.5 text-center font-mono text-cream-2">{d.cspm}</td>
                <td className="px-4 py-3.5 text-center font-mono text-jungle">{Math.round(d.dpm)}</td>
                <td className="px-4 py-3.5 text-center font-mono text-berry">{d.kp}%</td>
                <td className="px-4 py-3.5 text-center font-mono text-[#60a5fa]">{d.visao}</td>
                <td className={`px-4 py-3.5 text-center font-mono font-bold ${d.winrate >= 50 ? 'text-win' : 'text-loss'}`}>{d.winrate}%</td>
                <td className={`px-4 py-3.5 text-center font-mono font-bold ${d.gd15 >= 0 ? 'text-win' : 'text-loss'}`}>
                  {d.gd15 >= 0 ? `+${d.gd15}` : d.gd15}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
