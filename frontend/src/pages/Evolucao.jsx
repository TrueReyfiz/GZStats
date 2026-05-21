import { useEffect, useState, useMemo } from 'react'
import {
  getJogadores, getAlertas,
  getEvolucao, getEvolucaoStats, getEvolucaoTime,
} from '../services/api'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'

// ─── Constantes ──────────────────────────────────────────────────────────────

const CORES = [
  '#0bc4e3', '#a78bfa', '#c89b3c', '#00c853',
  '#f687b3', '#fb923c', '#34d399', '#f472b6', '#60a5fa',
]

const PERIODOS = [
  { label: '7d',   dias: 7  },
  { label: '30d',  dias: 30 },
  { label: 'Tudo', dias: 0  },
]

const METRICAS_STATS = [
  { key: 'kda',     label: 'KDA',        fmt: v => v?.toFixed(2)            },
  { key: 'cspm',    label: 'CS/min',     fmt: v => v?.toFixed(2)            },
  { key: 'dpm',     label: 'DPM',        fmt: v => Math.round(v)            },
  { key: 'visao',   label: 'Vision',     fmt: v => v?.toFixed(1)            },
  { key: 'kp',      label: 'KP%',        fmt: v => `${v?.toFixed(1)}%`      },
  { key: 'winrate', label: 'WR%',        fmt: v => `${v?.toFixed(1)}%`      },
  { key: 'gd15',    label: 'GD@15',      fmt: v => v != null ? (v >= 0 ? `+${v}` : v) : '—' },
  { key: 'xpd15',   label: 'XPD@15',     fmt: v => v != null ? (v >= 0 ? `+${v}` : v) : '—' },
  { key: 'csd15',   label: 'CSD@15',     fmt: v => v != null ? (v >= 0 ? `+${v}` : v) : '—' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function fmtDateFull(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function corJogador(jogadores, puuid) {
  const idx = jogadores.findIndex(j => j.puuid === puuid)
  return CORES[idx % CORES.length]
}

// ─── Tooltip LP ──────────────────────────────────────────────────────────────

function TooltipLP({ active, payload, label, jogadores }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-lg p-3 text-xs min-w-[140px]">
      <div className="text-slate-400 mb-2 font-medium">{fmtDateFull(label)}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.stroke }} className="flex justify-between gap-4 mt-1">
          <span>{jogadores.find(j => j.puuid === p.dataKey)?.riot_id || p.name}</span>
          <span className="font-bold">{p.value} LP</span>
        </div>
      ))}
    </div>
  )
}

// ─── Tooltip Stats ────────────────────────────────────────────────────────────

function TooltipStats({ active, payload, label, jogadores, metrica }) {
  if (!active || !payload?.length) return null
  const met = METRICAS_STATS.find(m => m.key === metrica)
  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-lg p-3 text-xs min-w-[160px]">
      <div className="text-slate-400 mb-2 font-medium">{fmtDateFull(label)}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.stroke }} className="flex justify-between gap-4 mt-1">
          <span>{jogadores.find(j => j.puuid === p.dataKey)?.riot_id || p.name}</span>
          <span className="font-bold">{met?.fmt(p.value) ?? p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Aba LP ───────────────────────────────────────────────────────────────────

function AbaLP({ jogadores, selecionados, periodo }) {
  const [historicos, setHistoricos] = useState({})
  const [loadingLP,  setLoadingLP]  = useState(true)

  useEffect(() => {
    setLoadingLP(true)
    Promise.all(
      jogadores.map(j =>
        getEvolucao(j.puuid, periodo.dias).then(r => ({ puuid: j.puuid, data: r.data }))
      )
    ).then(results => {
      const h = {}
      results.forEach(r => { h[r.puuid] = r.data })
      setHistoricos(h)
    }).finally(() => setLoadingLP(false))
  }, [periodo, jogadores])

  const chartData = useMemo(() => {
    const timeMap = {}
    selecionados.forEach(puuid => {
      const hist = historicos[puuid] || []
      hist.forEach(h => {
        const ts = h.registrado_em
        if (!timeMap[ts]) timeMap[ts] = { ts }
        timeMap[ts][puuid] = h.lp_absoluto ?? h.lp
      })
    })
    return Object.values(timeMap).sort((a, b) => new Date(a.ts) - new Date(b.ts))
  }, [historicos, selecionados])

  const tickInterval = chartData.length > 10 ? Math.floor(chartData.length / 8) : 0

  if (loadingLP) return <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Carregando...</div>

  if (chartData.length === 0) return (
    <div className="h-64 flex flex-col items-center justify-center text-slate-600 text-sm gap-2">
      <span className="text-3xl">📈</span>
      <span>Sem histórico de LP para o período selecionado.</span>
      <span className="text-xs">O gráfico vai crescer à medida que as atualizações automáticas rodarem.</span>
    </div>
  )

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ right: 16 }}>
          <XAxis
            dataKey="ts"
            tickFormatter={fmtDate}
            tick={{ fill: '#475569', fontSize: 10 }}
            interval={tickInterval}
          />
          <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
          <Tooltip content={<TooltipLP jogadores={jogadores} />} />
          <Legend formatter={v => jogadores.find(j => j.puuid === v)?.riot_id || v} />
          {selecionados.map(puuid => (
            <Line
              key={puuid}
              type="monotone"
              dataKey={puuid}
              name={jogadores.find(j => j.puuid === puuid)?.riot_id || puuid}
              stroke={corJogador(jogadores, puuid)}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Aba Stats ────────────────────────────────────────────────────────────────

function AbaStats({ jogadores, selecionados, periodo }) {
  const [historicos, setHistoricos] = useState({})
  const [loading,    setLoading]    = useState(true)
  const [metrica,    setMetrica]    = useState('kda')

  useEffect(() => {
    setLoading(true)
    Promise.all(
      jogadores.map(j =>
        getEvolucaoStats(j.puuid, periodo.dias).then(r => ({ puuid: j.puuid, data: r.data }))
      )
    ).then(results => {
      const h = {}
      results.forEach(r => { h[r.puuid] = r.data })
      setHistoricos(h)
    }).finally(() => setLoading(false))
  }, [periodo, jogadores])

  const chartData = useMemo(() => {
    const dayMap = {}
    selecionados.forEach(puuid => {
      const hist = historicos[puuid] || []
      hist.forEach(h => {
        // Agrupar por dia (os snapshots são diários)
        const dia = h.registrado_em?.slice(0, 10)
        if (!dia) return
        if (!dayMap[dia]) dayMap[dia] = { dia }
        dayMap[dia][puuid] = h[metrica]
      })
    })
    return Object.values(dayMap).sort((a, b) => new Date(a.dia) - new Date(b.dia))
  }, [historicos, selecionados, metrica])

  const met = METRICAS_STATS.find(m => m.key === metrica)
  const tickInterval = chartData.length > 10 ? Math.floor(chartData.length / 8) : 0

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Carregando...</div>

  return (
    <>
      {/* Seletor de métrica */}
      <div className="flex gap-2 flex-wrap px-4 pb-4">
        {METRICAS_STATS.map(m => (
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

      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-600 text-sm gap-2">
          <span className="text-3xl">📊</span>
          <span>Sem snapshots de stats para o período selecionado.</span>
          <span className="text-xs">O histórico começa a crescer automaticamente a cada atualização diária.</span>
        </div>
      ) : (
        <div className="h-72 px-4 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ right: 16 }}>
              <XAxis
                dataKey="dia"
                tickFormatter={fmtDate}
                tick={{ fill: '#475569', fontSize: 10 }}
                interval={tickInterval}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 11 }}
                tickFormatter={v => met?.fmt(v) ?? v}
              />
              {/* Linha de referência no zero para métricas de diff */}
              {['gd15', 'xpd15', 'csd15'].includes(metrica) && (
                <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" />
              )}
              <Tooltip content={<TooltipStats jogadores={jogadores} metrica={metrica} />} />
              <Legend formatter={v => jogadores.find(j => j.puuid === v)?.riot_id || v} />
              {selecionados.map(puuid => (
                <Line
                  key={puuid}
                  type="monotone"
                  dataKey={puuid}
                  name={jogadores.find(j => j.puuid === puuid)?.riot_id || puuid}
                  stroke={corJogador(jogadores, puuid)}
                  strokeWidth={2}
                  dot={{ r: 3, fill: corJogador(jogadores, puuid) }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  )
}

// ─── Aba Time (média do grupo) ────────────────────────────────────────────────

function AbaTime({ periodo }) {
  const [dados,   setDados]   = useState([])
  const [loading, setLoading] = useState(true)
  const [metrica, setMetrica] = useState('kda')

  useEffect(() => {
    setLoading(true)
    getEvolucaoTime(periodo.dias)
      .then(r => setDados(r.data))
      .finally(() => setLoading(false))
  }, [periodo])

  const met = METRICAS_STATS.find(m => m.key === metrica)

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Carregando...</div>

  return (
    <>
      {/* Seletor de métrica */}
      <div className="flex gap-2 flex-wrap px-4 pb-4">
        {METRICAS_STATS.map(m => (
          <button
            key={m.key}
            onClick={() => setMetrica(m.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-all ${
              metrica === m.key
                ? 'text-violet-400 bg-violet-400/10 border-violet-400/30'
                : 'text-slate-400 border-white/10 hover:border-white/20'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {dados.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-600 text-sm gap-2">
          <span className="text-3xl">🌐</span>
          <span>Sem histórico do time para o período selecionado.</span>
          <span className="text-xs">Os dados começam a aparecer após o primeiro snapshot diário.</span>
        </div>
      ) : (
        <div className="h-72 px-4 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ right: 16 }}>
              <XAxis
                dataKey="data"
                tickFormatter={fmtDate}
                tick={{ fill: '#475569', fontSize: 10 }}
                interval={dados.length > 10 ? Math.floor(dados.length / 8) : 0}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 11 }}
                tickFormatter={v => met?.fmt(v) ?? v}
              />
              {['gd15', 'xpd15', 'csd15'].includes(metrica) && (
                <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" />
              )}
              <Tooltip
                contentStyle={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 6, fontSize: 12 }}
                labelFormatter={fmtDateFull}
                formatter={v => [met?.fmt(v) ?? v, `Média do time (${met?.label})`]}
              />
              <Line
                type="monotone"
                dataKey={metrica}
                stroke="#a78bfa"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#a78bfa' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela dos valores mais recentes por metrica */}
      {dados.length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-xs text-slate-600 mb-2 uppercase tracking-widest">Último registro: {fmtDateFull(dados[dados.length - 1]?.data)}</div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {METRICAS_STATS.filter(m => !['xpd15','csd15'].includes(m.key)).map(m => {
              const ultimo = dados[dados.length - 1]
              const anterior = dados.length > 1 ? dados[dados.length - 2] : null
              const val = ultimo?.[m.key]
              const valAnt = anterior?.[m.key]
              const subiu = val != null && valAnt != null ? val > valAnt : null
              return (
                <div
                  key={m.key}
                  className={`rounded-lg border p-2 text-center transition-all ${
                    metrica === m.key
                      ? 'border-violet-400/40 bg-violet-400/10'
                      : 'border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                  <div className={`text-sm font-bold ${metrica === m.key ? 'text-violet-300' : 'text-white'}`}>
                    {val != null ? met?.key === m.key ? met.fmt(val) : m.fmt(val) : '—'}
                  </div>
                  {subiu !== null && (
                    <div className={`text-xs mt-0.5 ${subiu ? 'text-green-400' : 'text-red-400'}`}>
                      {subiu ? '▲' : '▼'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Evolucao() {
  const [jogadores,    setJogadores]    = useState([])
  const [selecionados, setSelecionados] = useState([])
  const [alertas,      setAlertas]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('lp')        // 'lp' | 'stats' | 'time'
  const [periodo,      setPeriodo]      = useState(PERIODOS[1]) // 30d padrão

  useEffect(() => {
    Promise.all([getJogadores(), getAlertas()])
      .then(([j, a]) => {
        setJogadores(j.data)
        setAlertas(a.data)
        // Selecionar os 3 primeiros por padrão
        setSelecionados(j.data.slice(0, 3).map(x => x.puuid))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function toggleJogador(puuid) {
    setSelecionados(s =>
      s.includes(puuid) ? s.filter(p => p !== puuid) : [...s, puuid]
    )
  }

  if (loading) return <div className="text-center py-20 text-slate-500">Carregando...</div>

  const TABS = [
    { key: 'lp',    label: 'LP',               icon: '📈' },
    { key: 'stats', label: 'Stats (jogadores)', icon: '📊' },
    { key: 'time',  label: 'Média do time',     icon: '🌐' },
  ]

  return (
    <div className="py-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Evolução do <span className="text-cyan-400">Time</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Linha do tempo de LP e stats — snapshots diários de KDA, DPM, CS/min e mais
        </p>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="flex flex-col gap-2 mb-6">
          {alertas.map((a, i) => (
            <div
              key={i}
              className={`px-4 py-2.5 rounded-lg border text-sm ${
                a.tipo === 'tilt'
                  ? 'bg-red-400/10 border-red-400/20 text-red-300'
                  : 'bg-orange-400/10 border-orange-400/20 text-orange-300'
              }`}
            >
              {a.tipo === 'tilt' ? '⚠️' : '🔥'} {a.mensagem}
            </div>
          ))}
        </div>
      )}

      {/* Painel principal */}
      <div className="bg-[#0d1117] border border-white/5 rounded-lg">

        {/* Barra de abas + período */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 flex-wrap gap-2 py-2">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                  activeTab === t.key
                    ? 'bg-white/10 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {PERIODOS.map(p => (
              <button
                key={p.label}
                onClick={() => setPeriodo(p)}
                className={`px-2.5 py-1 text-xs rounded border transition-all ${
                  periodo.label === p.label
                    ? 'border-cyan-400/40 text-cyan-400 bg-cyan-400/10'
                    : 'border-white/10 text-slate-500 hover:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Seletor de jogadores (só nas abas LP e Stats) */}
        {activeTab !== 'time' && (
          <div className="px-4 pt-4 pb-2 flex gap-2 flex-wrap">
            {jogadores.map((j) => {
              const cor = corJogador(jogadores, j.puuid)
              const sel = selecionados.includes(j.puuid)
              return (
                <button
                  key={j.puuid}
                  onClick={() => toggleJogador(j.puuid)}
                  style={sel ? { borderColor: cor, color: cor } : {}}
                  className={`px-3 py-1.5 text-xs font-medium rounded border transition-all ${
                    sel ? 'bg-white/5' : 'text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {j.riot_id}
                </button>
              )
            })}
            {selecionados.length > 0 && (
              <button
                onClick={() => setSelecionados([])}
                className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                limpar
              </button>
            )}
          </div>
        )}

        {/* Conteúdo da aba */}
        <div className="pt-4">
          {activeTab === 'lp' && (
            <AbaLP
              jogadores={jogadores}
              selecionados={selecionados}
              periodo={periodo}
            />
          )}
          {activeTab === 'stats' && (
            <AbaStats
              jogadores={jogadores}
              selecionados={selecionados}
              periodo={periodo}
            />
          )}
          {activeTab === 'time' && (
            <AbaTime periodo={periodo} />
          )}
        </div>
      </div>
    </div>
  )
}
