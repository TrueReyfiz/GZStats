import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Ranking from './pages/Ranking'
import Perfil from './pages/Perfil'
import Comparativo from './pages/Comparativo'
import Evolucao from './pages/Evolucao'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="pt-16 max-w-6xl mx-auto px-4">
        <Routes>
          <Route path="/"              element={<Ranking />} />
          <Route path="/jogador/:puuid" element={<Perfil />} />
          <Route path="/comparativo"   element={<Comparativo />} />
          <Route path="/evolucao"      element={<Evolucao />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
