import { useEffect, useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import {
  getJogadores, getAlertas,
  getEvolucao, getEvolucaoStats, getEvolucaoTime,
} from '../services/api'
import { SQUAD_COLORS, corJogador, fmtDate, fmtDateFull } from '../lib/brand'
import SectionHeader from '../components/SectionHeader'
import Chip from '../components/Chip'
import AlertBanner from '../components/AlertBanner'

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

const TOOLTIP_STYLE = {
  background: '#261c16',
  border: '2px solid #3d2d20',
  borderRadius: 14,
  fontFamily: 'Nunito, sans-serif',
  fontSize: 12,
  fontWeight: 700,
  color: '#fef3c7',
  padding: 12,
}

export default function Evolucao() {
  const [jogadores, setJogadores] = useState([])
  const [alertas, setAlertas] = useState([])
  const [selecionados, setSelecionados] = useState([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('lp')
  const [periodo, setPeriodo] = useState(PERIODOS[1])

  useEffect(() => {
    Promise.all([getJogadores(), getAlertas()])
      .then(([j, a]) => {
        setJogadores(j.data || [])
        setAlertas(a.data || [])
        setSelecionados((j.data || []).slice(0, 3).map(x => x.puuid))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function toggle(puuid) {
    setSelecionados(s => s.includes(puuid) ? s.filter(p => p !== puuid) : [...s, puuid])
  }

  if (loading) return <div className="py-20 text-center text-warm-4 font-bold">Carregando…</div>

  return (
    <div className="py-8">
      <SectionHeader title="Evolução" accent="do squad" sub="linha do tempo · BR1 Flex"/>

      {alertas.length > 0 && (
        <div className="flex flex-col gap-2 mb-6">
          {alertas.map((a, i) => <AlertBanner key={i} {...a}/>)}
        </div>
      )}

      <div className="bg-bg-1 rounded-lg p-6 border-2 border-bg-2 shadow-card">
        {/* Tabs + period */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-1.5">
            {[
              { k: 'lp',    l: '📈 LP' },
              { k: 'stats', l: '📊 Stats' },
              { k: 'time',  l: '🌐 Média do time' },
            ].map(t => (
              <Tab key={t.k} active={aba === t.k} onClick={() => setAba(t.k)}>
                {t.l}
              </Tab>
            ))}
          </div>
          <div className="flex gap-1.5">
            {PERIODOS.map(p => (
              <Chip key={p.label} active={periodo.label === p.label} onClick={() => setPeriodo(p)}>
                {p.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Player toggles */}
        {aba !== 'time' && (
          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            <span className="text-[11px] text-warm-4 font-extrabold uppercase tracking-[1px] mr-1">Squad</span>
            {jogadores.map(j => {
              const cor = corJogador(jogadores, j.puuid)
              const sel = selecionados.includes(j.puuid)
              return (
                <button
                  key={j.puuid}
                  onClick={() => toggle(j.puuid)}
                  className="px-3 py-1 rounded-full text-xs font-bold border-2 transition-colors whitespace-nowrap"
                  style={sel ? {
                    color: cor, borderColor: cor, background: 'rgba(255,255,255,0.04)',
                  } : {
                    color: '#d6a87a', borderColor: '#322519', background: 'transparent',
                  }}
                >
                  {j.riot_id}
                </button>
              )
            })}
          </div>
        )}

        {/* Charts */}
        {aba === 'lp'    && <AbaLP    jogadores={jogadores} selecionados={selecionados} periodo={periodo}/>}
        {aba === 'stats' && <AbaStats jogadores={jogadores} selecionados={selecionados} periodo={periodo}/>}
        {aba === 'time'  && <AbaTime  periodo={periodo}/>}
      </div>
    </div>
  )
}

function Tab({ active, onClick, children }) {
  const base = 'px-4 py-2 rounded-md text-[13px] font-extrabold border-2 transition-all whitespace-nowrap'
  if (active) return <button onClick={onClick} className={`${base} bg-banana text-bg-0 border-bg-0 shadow-pill`}>{children}</button>
  return <button onClick={onClick} className={`${base} bg-bg-2 text-warm-3 border-transparent hover:text-cream`}>{children}</button>
}

/* ── AbaLP ────────────────────────────────────────────── */
function AbaLP({ jogadores, selecionados, periodo }) {
  const [historicos, setHistoricos] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!jogadores.length) return
    setLoading(true)
    Promise.all(
      jogadores.map(j =>
        getEvolucao(j.puuid, periodo.dias).then(r => ({ puuid: j.puuid, data: r.data }))
      )
    ).then(results => {
      const h = {}
      results.forEach(r => { h[r.puuid] = r.data })
      setHistoricos(h)
    }).finally(() => setLoading(false))
  }, [periodo, jogadores])

  const chartData = useMemo(() => {
    const m = {}
    selecionados.forEach(puuid => {
      const hist = historicos[puuid] || []
      hist.forEach(h => {
        const ts = h.registrado_em
        if (!m[ts]) m[ts] = { ts }
        m[ts][puuid] = h.lp_absoluto ?? h.lp
      })
    })
    return Object.values(m).sort((a, b) => new Date(a.ts) - new Date(b.ts))
  }, [historicos, selecionados])

  if (loading)            return <EmptyChart text="Carregando…"/>
  if (!chartData.length)  return <EmptyChart icon="📈" text="Sem histórico de LP para o período selecionado."/>

  const tick = chartData.length > 10 ? Math.floor(chartData.length / 8) : 0

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ right: 16 }}>
          <XAxis dataKey="ts" tickFormatter={fmtDate} tick={{ fill: '#a07956', fontSize: 10, fontFamily: 'DM Mono' }} interval={tick}/>
          <YAxis tick={{ fill: '#a07956', fontSize: 11, fontFamily: 'DM Mono' }}/>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: '#fbbf24', fontFamily: 'Bowlby One' }}
            labelFormatter={fmtDateFull}
            formatter={(v, k) => [`${v} LP`, jogadores.find(j => j.puuid === k)?.riot_id || k]}
          />
          <Legend formatter={v => jogadores.find(j => j.puuid === v)?.riot_id || v} wrapperStyle={{ fontFamily: 'Nunito', fontWeight: 700 }}/>
          {selecionados.map(puuid => (
            <Line
              key={puuid}
              type="monotone"
              dataKey={puuid}
              name={jogadores.find(j => j.puuid === puuid)?.riot_id || puuid}
              stroke={corJogador(jogadores, puuid)}
              strokeWidth={3}
              dot={{ r: 3, fill: corJogador(jogadores, puuid), stroke: '#261c16', strokeWidth: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── AbaStats ─────────────────────────────────────────── */
function AbaStats({ jogadores, selecionados, periodo }) {
  const [historicos, setHistoricos] = useState({})
  const [loading, setLoading] = useState(true)
  const [metrica, setMetrica] = useState('kda')

  useEffect(() => {
    if (!jogadores.length) return
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
    const m = {}
    selecionados.forEach(puuid => {
      const hist = historicos[puuid] || []
      hist.forEach(h => {
        const dia = h.registrado_em?.slice(0, 10)
        if (!dia) return
        if (!m[dia]) m[dia] = { dia }
        m[dia][puuid] = h[metrica]
      })
    })
    return Object.values(m).sort((a, b) => new Date(a.dia) - new Date(b.dia))
  }, [historicos, selecionados, metrica])

  const met = METRICAS_STATS.find(m => m.key === metrica)

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {METRICAS_STATS.map(m => (
          <Chip key={m.key} active={metrica === m.key} onClick={() => setMetrica(m.key)}>{m.label}</Chip>
        ))}
      </div>

      {loading ? <EmptyChart text="Carregando…"/> :
       !chartData.length ? <EmptyChart icon="📊" text="Sem snapshots de stats para o período."/> : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ right: 16 }}>
              <XAxis dataKey="dia" tickFormatter={fmtDate} tick={{ fill: '#a07956', fontSize: 10, fontFamily: 'DM Mono' }}/>
              <YAxis tick={{ fill: '#a07956', fontSize: 11, fontFamily: 'DM Mono' }} tickFormatter={v => met?.fmt(v) ?? v}/>
              {['gd15', 'xpd15', 'csd15'].includes(metrica) && <ReferenceLine y={0} stroke="#6b4f38" strokeDasharray="4 4"/>}
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: '#fbbf24', fontFamily: 'Bowlby One' }}
                labelFormatter={fmtDateFull}
                formatter={(v, k) => [met?.fmt(v) ?? v, jogadores.find(j => j.puuid === k)?.riot_id || k]}
              />
              <Legend formatter={v => jogadores.find(j => j.puuid === v)?.riot_id || v} wrapperStyle={{ fontFamily: 'Nunito', fontWeight: 700 }}/>
              {selecionados.map(puuid => (
                <Line key={puuid} type="monotone" dataKey={puuid}
                  name={jogadores.find(j => j.puuid === puuid)?.riot_id || puuid}
                  stroke={corJogador(jogadores, puuid)} strokeWidth={3}
                  dot={{ r: 3, fill: corJogador(jogadores, puuid), stroke: '#261c16', strokeWidth: 2 }} connectNulls/>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  )
}

/* ── AbaTime ──────────────────────────────────────────── */
function AbaTime({ periodo }) {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrica, setMetrica] = useState('kda')

  useEffect(() => {
    setLoading(true)
    getEvolucaoTime(periodo.dias)
      .then(r => setDados(r.data || []))
      .finally(() => setLoading(false))
  }, [periodo])

  const met = METRICAS_STATS.find(m => m.key === metrica)

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {METRICAS_STATS.map(m => (
          <Chip key={m.key} active={metrica === m.key} onClick={() => setMetrica(m.key)}>{m.label}</Chip>
        ))}
      </div>

      {loading ? <EmptyChart text="Carregando…"/> :
       !dados.length ? <EmptyChart icon="🌐" text="Sem histórico do time para o período."/> : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ right: 16 }}>
              <XAxis dataKey="data" tickFormatter={fmtDate} tick={{ fill: '#a07956', fontSize: 10, fontFamily: 'DM Mono' }}/>
              <YAxis tick={{ fill: '#a07956', fontSize: 11, fontFamily: 'DM Mono' }} tickFormatter={v => met?.fmt(v) ?? v}/>
              {['gd15', 'xpd15', 'csd15'].includes(metrica) && <ReferenceLine y={0} stroke="#6b4f38" strokeDasharray="4 4"/>}
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#fbbf24', fontFamily: 'Bowlby One' }}
                labelFormatter={fmtDateFull}
                formatter={v => [met?.fmt(v) ?? v, `Média do time (${met?.label})`]}/>
              <Line type="monotone" dataKey={metrica} stroke="#fbbf24" strokeWidth={3}
                dot={{ r: 3, fill: '#fbbf24', stroke: '#261c16', strokeWidth: 2 }} connectNulls/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  )
}

function EmptyChart({ icon, text }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-warm-4 font-bold gap-2">
      {icon && <span className="text-3xl">{icon}</span>}
      <span>{text}</span>
    </div>
  )
}
