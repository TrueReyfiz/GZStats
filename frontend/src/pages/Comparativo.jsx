import { useEffect, useState, useMemo } from 'react'
import { getComparativo } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const METRICAS = [
  { key: 'kda',     label: 'KDA Médio'    },
  { key: 'cspm',    label: 'CS / Min'     },
  { key: 'dpm',     label: 'Dano / Min'   },
  { key: 'visao',   label: 'Vision Score' },
  { key: 'kp',      label: 'Kill Part. %' },
  { key: 'winrate', label: 'Winrate %'    },
  { key: 'gd15',    label: 'GD@15'        },
]

// Colunas clicáveis na tabela
const COLUNAS = [
  { key: 'riot_id', label: 'Jogador',     align: 'left'   },
  { key: 'kda',     label: 'KDA',         align: 'center' },
  { key: 'cspm',    label: 'CS/m',        align: 'center' },
  { key: 'dpm',     label: 'DPM',         align: 'center' },
  { key: 'kp',      label: 'KP%',         align: 'center' },
  { key: 'visao',   label: 'Visão',       align: 'center' },
  { key: 'winrate', label: 'WR%',         align: 'center' },
  { key: 'gd15',    label: 'GD@15',       align: 'center' },
]

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <span className="text-slate-700 ml-1">↕</span>
  return <span className="text-cyan-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

export default function Comparativo() {
  const [dados,    setDados]    = useState([])
  const [metrica,  setMetrica]  = useState('kda')
  const [loading,  setLoading]  = useState(true)
  const [sortCol,  setSortCol]  = useState('kda')
  const [sortDir,  setSortDir]  = useState('desc')

  useEffect(() => {
    getComparativo()
      .then(r => setDados(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortCol(col)
      setSortDir(col === 'riot_id' ? 'asc' : 'desc')
    }
  }

  const chartSorted = useMemo(() =>
    [...dados].sort((a, b) => (b[metrica] ?? 0) - (a[metrica] ?? 0)),
    [dados, metrica]
  )

  const tabelaSorted = useMemo(() => {
    return [...dados].sort((a, b) => {
      const va = a[sortCol] ?? ''
      const vb = b[sortCol] ?? ''
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }, [dados, sortCol, sortDir])

  if (loading) return <div className="text-center py-20 text-slate-500">Carregando...</div>

  const maxPartidas = Math.max(...dados.map(d => d.partidas_analisadas || 0), 0)

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Comparativo do <span className="text-cyan-400">Time</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Médias das últimas {maxPartidas > 0 ? maxPartidas : 50} partidas Flex
        </p>
      </div>

      {/* ── Gráfico ── */}
      <div className="bg-[#0d1117] border border-white/5 rounded-lg mb-6">
        <div className="px-4 py-3 border-b border-white/5 text-xs uppercase tracking-widest text-slate-500">
          Selecionar métrica
        </div>
        <div className="flex gap-2 flex-wrap p-4">
          {METRICAS.map(m => (
            <button
              key={m.key}
              onClick={() => setMetrica(m.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-all ${
                metrica === m.key
                  ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30'
                  : 'text-slate-400 border-white/10 hover:border-white/20'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartSorted} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis type="category" dataKey="riot_id" tick={{ fill: '#94a3b8', fontSize: 12 }} width={75} />
              <Tooltip
                contentStyle={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => [
                  typeof value === 'number' ? value.toLocaleString('pt-BR') : value,
                  METRICAS.find(m => m.key === metrica)?.label,
                ]}
              />
              <Bar dataKey={metrica} radius={[0, 4, 4, 0]}>
                {chartSorted.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === 0 ? '#0bc4e3' : i === chartSorted.length - 1 ? '#e84057' : '#334155'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Tabela com ordenação ── */}
      <div className="bg-[#0d1117] border border-white/5 rounded-lg overflow-x-auto">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-slate-500">Tabela Completa</span>
          <span className="text-xs text-slate-600">Clique no cabeçalho para ordenar</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-widest select-none">
              {COLUNAS.map(col => (
                <th
                  key={col.key}
                  className={`py-2 px-4 text-${col.align} cursor-pointer hover:text-slate-300 transition-colors`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabelaSorted.map((d) => (
              <tr key={d.puuid} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                <td className="py-2 px-4">
                  <div className="font-semibold text-white">{d.riot_id}</div>
                  <div className="text-xs text-slate-600">{d.tier} {d.rank}</div>
                </td>
                <td className="py-2 px-4 text-center font-bold text-cyan-400">{d.kda}</td>
                <td className="py-2 px-4 text-center text-amber-400">{d.cspm}</td>
                <td className="py-2 px-4 text-center text-green-400">{Math.round(d.dpm)}</td>
                <td className="py-2 px-4 text-center text-purple-400">{d.kp}%</td>
                <td className="py-2 px-4 text-center text-blue-400">{d.visao}</td>
                <td className="py-2 px-4 text-center">
                  <span className={d.winrate >= 50 ? 'text-green-400 font-bold' : 'text-red-400'}>
                    {d.winrate}%
                  </span>
                </td>
                <td className={`py-2 px-4 text-center font-semibold ${d.gd15 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
