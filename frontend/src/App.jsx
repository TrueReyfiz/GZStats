import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Ranking from './pages/Ranking'
import Perfil from './pages/Perfil'
import Comparativo from './pages/Comparativo'
import Evolucao from './pages/Evolucao'
import HallVergonha from './pages/HallVergonha'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar/>
      <main className="max-w-[1200px] mx-auto px-8">
        <Routes>
          <Route path="/"              element={<Ranking/>}/>
          <Route path="/jogador/:puuid" element={<Perfil/>}/>
          <Route path="/comparativo"   element={<Comparativo/>}/>
          <Route path="/evolucao"      element={<Evolucao/>}/>
          <Route path="/vergonha"      element={<HallVergonha/>}/>
        </Routes>
      </main>
    </BrowserRouter>
  )
}
