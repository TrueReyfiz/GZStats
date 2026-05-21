import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000, // Render free tier pode demorar até 50s para acordar
})

export const getJogadores     = ()              => api.get('/jogadores')
export const getPerfil        = (puuid)         => api.get(`/jogadores/${puuid}`)
export const getPartidas      = (puuid)         => api.get(`/partidas/${puuid}`)
export const getComparativo   = ()              => api.get('/stats/comparativo')
export const getAlertas       = ()              => api.get('/stats/alertas')
export const adicionarJogador = (game_name, tag_line) =>
  api.post('/jogadores', { game_name, tag_line })

// Evolução de LP (dias = 0 → tudo, 7 → última semana, 30 → último mês)
export const getEvolucao      = (puuid, dias = 0) =>
  api.get(`/stats/evolucao/${puuid}`, { params: { dias } })

// Evolução de stats de um jogador (snapshots diários)
export const getEvolucaoStats = (puuid, dias = 0) =>
  api.get(`/stats/evolucao-stats/${puuid}`, { params: { dias } })

// Evolução média do time inteiro
export const getEvolucaoTime  = (dias = 30) =>
  api.get('/stats/evolucao-time', { params: { dias } })

export default api
