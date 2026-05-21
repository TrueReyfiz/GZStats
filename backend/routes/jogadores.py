from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Jogador, StatsPartida, HistoricoLP
import riot_client as rc
from scheduler import atualizar_jogador
from pydantic import BaseModel

router = APIRouter(prefix="/jogadores", tags=["jogadores"])


class JogadorInput(BaseModel):
    game_name: str
    tag_line: str


@router.get("/")
def listar_jogadores(db: Session = Depends(get_db)):
    """Lista todos os jogadores ordenados por LP"""
    jogadores = db.query(Jogador).order_by(Jogador.lp.desc()).all()
    resultado = []
    for j in jogadores:
        total = j.wins + j.losses
        winrate = round(j.wins / total * 100, 1) if total > 0 else 0
        resultado.append({
            "puuid":      j.puuid,
            "riot_id":    j.riot_id,
            "tag_line":   j.tag_line,
            "tier":       j.tier,
            "rank":       j.rank,
            "lp":         j.lp,
            "wins":       j.wins,
            "losses":     j.losses,
            "winrate":    winrate,
            "hot_streak": j.hot_streak,
            "atualizado_em": j.atualizado_em
        })
    return resultado


@router.get("/{puuid}")
def perfil_jogador(puuid: str, db: Session = Depends(get_db)):
    """Stats detalhados de um jogador nas últimas 20 partidas"""
    jogador = db.query(Jogador).filter(Jogador.puuid == puuid).first()
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")

    stats = db.query(StatsPartida)\
        .filter(StatsPartida.puuid == puuid)\
        .order_by(StatsPartida.id.desc())\
        .limit(20).all()

    if not stats:
        return {"jogador": jogador, "stats_medios": None}

    n = len(stats)
    kda_list = [
        (s.kills + s.assists) / max(s.deaths, 1) for s in stats
    ]

    return {
        "puuid":    jogador.puuid,
        "riot_id":  jogador.riot_id,
        "tag_line": jogador.tag_line,
        "tier":     jogador.tier,
        "rank":     jogador.rank,
        "lp":       jogador.lp,
        "wins":     jogador.wins,
        "losses":   jogador.losses,
        "hot_streak": jogador.hot_streak,
        "stats_medios": {
            "kda_medio":       round(sum(kda_list) / n, 2),
            "cspm_medio":      round(sum(s.cs / max(s.duracao_min, 1) for s in stats) / n, 2),
            "dpm_medio":       round(sum(s.dano_por_min for s in stats) / n, 1),
            "visao_medio":     round(sum(s.visao for s in stats) / n, 2),
            "kp_medio":        round(sum(s.kill_participation for s in stats) / n, 1),
            "gd15_medio":      round(sum(s.gd15 for s in stats if s.gd15 is not None) / max(sum(1 for s in stats if s.gd15 is not None), 1), 1),
            "winrate":         round(sum(1 for s in stats if s.vitoria) / n * 100, 1),
            "partidas_analisadas": n
        }
    }


@router.post("/")
def adicionar_jogador(body: JogadorInput, db: Session = Depends(get_db)):
    """Adiciona um novo jogador pelo Riot ID"""
    existente = db.query(Jogador).filter(
        Jogador.riot_id == body.game_name,
        Jogador.tag_line == body.tag_line
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="Jogador já cadastrado")

    try:
        account = rc.get_puuid(body.game_name, body.tag_line)
    except Exception:
        raise HTTPException(status_code=404, detail="Riot ID não encontrado. Verifique o nome e a tag.")

    jogador = Jogador(
        puuid=account["puuid"],
        riot_id=account["gameName"],
        tag_line=account["tagLine"]
    )
    db.add(jogador)
    db.commit()
    db.refresh(jogador)

    # Buscar dados imediatamente
    try:
        atualizar_jogador(db, jogador)
    except Exception as e:
        print(f"Aviso: erro na atualização inicial de {body.game_name}: {e}")

    return {"mensagem": f"{body.game_name}#{body.tag_line} adicionado com sucesso!", "puuid": jogador.puuid}
