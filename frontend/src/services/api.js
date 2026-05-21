import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
})

export const getJogadores    = ()       => api.get('/jogadores')
export const getPerfil       = (puuid)  => api.get(`/jogadores/${puuid}`)
export const getPartidas     = (puuid)  => api.get(`/partidas/${puuid}`)
export const getComparativo  = ()       => api.get('/stats/comparativo')
export const getEvolucao     = (puuid)  => api.get(`/stats/evolucao/${puuid}`)
export const getAlertas      = ()       => api.get('/stats/alertas')
export const adicionarJogador = (game_name, tag_line) =>
  api.post('/jogadores', { game_name, tag_line })

export default api
