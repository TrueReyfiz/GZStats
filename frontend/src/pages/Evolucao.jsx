import { useEffect, useState } from 'react'
import { getJogadores, getEvolucao, getAlertas } from '../services/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const CORES = ['#0bc4e3', '#a78bfa', '#c89b3c', '#00c853', '#f687b3', '#fb923c', '#34d399', '#f472b6']

export default function Evolucao() {
  const [jogadores, setJogadores] = useState([])
  const [selecionados, setSelecionados] = useState([])
  const [historicos, setHistoricos]     = useState({})
  const [alertas, setAlertas]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getJogadores(), getAlertas()])
      .then(([j, a]) => {
        setJogadores(j.data)
        setAlertas(a.data)
        const primeiros = j.data.slice(0, 3).map(x => x.puuid)
        setSelecionados(primeiros)
        return Promise.all(primeiros.map(p => getEvolucao(p).then(r => ({ puuid: p, data: r.data }))))
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

  // Montar dataset para o gráfico
  const chartData = []
  selecionados.forEach(puuid => {
    const hist = historicos[puuid] || []
    hist.forEach((h, i) => {
      if (!chartData[i]) chartData[i] = { idx: i }
      chartData[i][puuid] = h.lp
    })
  })

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Evolução de <span className="text-cyan-400">LP</span></h1>
        <p className="text-slate-500 text-sm mt-1">Histórico ao longo da temporada</p>
      </div>

      {alertas.length > 0 && (
        <div className="flex flex-col gap-2 mb-6">
          {alertas.map((a, i) => (
            <div key={i} className={`px-4 py-2.5 rounded-lg border text-sm ${
              a.tipo === 'tilt'
                ? 'bg-red-400/10 border-red-400/20 text-red-300'
                : 'bg-orange-400/10 border-orange-400/20 text-orange-300'
            }`}>
              {a.tipo === 'tilt' ? '⚠️' : '🔥'} {a.mensagem}
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#0d1117] border border-white/5 rounded-lg mb-6">
        <div className="px-4 py-3 border-b border-white/5 text-xs uppercase tracking-widest text-slate-500">Selecionar jogadores</div>
        <div className="flex gap-2 flex-wrap p-4">
          {jogadores.map((j, i) => (
            <button
              key={j.puuid}
              onClick={() => toggleJogador(j.puuid)}
              style={selecionados.includes(j.puuid) ? { borderColor: CORES[i % CORES.length], color: CORES[i % CORES.length] } : {}}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-all ${
                selecionados.includes(j.puuid) ? 'bg-white/5' : 'text-slate-400 border-white/10 hover:border-white/20'
              }`}
            >
              {j.riot_id}
            </button>
          ))}
        </div>

        <div className="p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="idx" tick={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 6, fontSize: 12 }}
              />
              <Legend />
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
