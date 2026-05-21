import { useEffect, useState } from 'react'
import { getJogadores, getEvolucao, getAlertas } from '../services/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const CORES = ['#0bc4e3','#a78bfa','#c89b3c','#00c853','#f687b3','#fb923c','#34d399','#f472b6','#60a5fa']

function fmtTick(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-lg p-3 text-xs">
      <div className="text-slate-400 mb-2">{fmtTick(label)}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.stroke }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-bold">{p.value} LP</span>
        </div>
      ))}
    </div>
  )
}

export default function Evolucao() {
  const [jogadores,   setJogadores]   = useState([])
  const [selecionados,setSelecionados]= useState([])
  const [historicos,  setHistoricos]  = useState({})
  const [alertas,     setAlertas]     = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([getJogadores(), getAlertas()])
      .then(([j, a]) => {
        setJogadores(j.data)
        setAlertas(a.data)
        const primeiros = j.data.slice(0, 3).map(x => x.puuid)
        setSelecionados(primeiros)
        return Promise.all(
          primeiros.map(p => getEvolucao(p).then(r => ({ puuid: p, data: r.data })))
        )
      })
      .then(results => {
        const h = {}
        results.forEach(r => { h[r.puuid] = r.data })
        setHistoricos(h)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const toggleJogador = async (puuid) => {
    if (selecionados.includes(puuid)) {
      setSelecionados(s => s.filter(p => p !== puuid))
    } else {
      setSelecionados(s => [...s, puuid])
      if (!historicos[puuid]) {
        const r = await getEvolucao(puuid)
        setHistoricos(h => ({ ...h, [puuid]: r.data }))
      }
    }
  }

  if (loading) return <div className="text-center py-20 text-slate-500">Carregando...</div>

  // Montar dataset alinhado por timestamp real (promoções aparecem como subida, não queda)
  const timeMap = {}
  selecionados.forEach(puuid => {
    const hist = historicos[puuid] || []
    hist.forEach(h => {
      const ts = h.registrado_em
      if (!timeMap[ts]) timeMap[ts] = { ts }
      // Usa lp_absoluto para mostrar progressão real entre divisões
      timeMap[ts][puuid] = h.lp_absoluto ?? h.lp
    })
  })
  const chartData = Object.values(timeMap).sort((a, b) => new Date(a.ts) - new Date(b.ts))

  // Calcular ticks de exibição (máx 8 labels no eixo X)
  const tickInterval = chartData.length > 8 ? Math.floor(chartData.length / 8) : 0

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Evolução de <span className="text-cyan-400">LP</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Progressão real — promoções contam como subida de LP
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

      {/* Seletor de jogadores */}
      <div className="bg-[#0d1117] border border-white/5 rounded-lg mb-6">
        <div className="px-4 py-3 border-b border-white/5 text-xs uppercase tracking-widest text-slate-500">
          Selecionar jogadores
        </div>
        <div className="flex gap-2 flex-wrap p-4">
          {jogadores.map((j, i) => (
            <button
              key={j.puuid}
              onClick={() => toggleJogador(j.puuid)}
              style={selecionados.includes(j.puuid)
                ? { borderColor: CORES[i % CORES.length], color: CORES[i % CORES.length] }
                : {}}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-all ${
                selecionados.includes(j.puuid)
                  ? 'bg-white/5'
                  : 'text-slate-400 border-white/10 hover:border-white/20'
              }`}
            >
              {j.riot_id}
            </button>
          ))}
        </div>

        <div className="p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="ts"
                tickFormatter={fmtTick}
                tick={{ fill: '#475569', fontSize: 10 }}
                interval={tickInterval}
              />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => {
                  const j = jogadores.find(x => x.puuid === value)
                  return j?.riot_id || value
                }}
              />
              {selecionados.map((puuid, i) => {
                const j = jogadores.find(x => x.puuid === puuid)
                return (
                  <Line
                    key={puuid}
                    type="monotone"
                    dataKey={puuid}
                    name={j?.riot_id || puuid}
                    stroke={CORES[i % CORES.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
