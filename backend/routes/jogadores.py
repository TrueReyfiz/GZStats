from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Jogador, StatsPartida
import riot_client as rc
from scheduler import atualizar_jogador
from pydantic import BaseModel
from utils import elo_score

router = APIRouter(prefix="/jogadores", tags=["jogadores"])

STATS_LIMIT = 50  # Partidas usadas para calcular médias


class JogadorInput(BaseModel):
    game_name: str
    tag_line: str


@router.get("/")
def listar_jogadores(db: Session = Depends(get_db)):
    """Lista todos os jogadores ordenados por Elo (Tier > Rank > LP)"""
    jogadores = db.query(Jogador).all()
    resultado = []

    for j in jogadores:
        total = j.wins + j.losses
        winrate = round(j.wins / total * 100, 1) if total > 0 else 0

        stats_recentes = db.query(StatsPartida)\
            .filter(StatsPartida.puuid == j.puuid)\
            .order_by(StatsPartida.id.desc())\
            .limit(STATS_LIMIT).all()

        n = len(stats_recentes)
        if n > 0:
            kda_medio = round(
                sum((s.kills + s.assists) / max(s.deaths, 1) for s in stats_recentes) / n, 2
            )
            dpm_medio = round(sum(s.dano_por_min for s in stats_recentes) / n, 1)
            gd15_validos = [s.gd15 for s in stats_recentes if s.gd15 is not None]
            gd15_medio = round(sum(gd15_validos) / len(gd15_validos), 1) if gd15_validos else None
        else:
            kda_medio = 0
            dpm_medio = 0
            gd15_medio = None

        resultado.append({
            "puuid":               j.puuid,
            "riot_id":             j.riot_id,
            "tag_line":            j.tag_line,
            "tier":                j.tier,
            "rank":                j.rank,
            "lp":                  j.lp,
            "wins":                j.wins,
            "losses":              j.losses,
            "winrate":             winrate,
            "hot_streak":          j.hot_streak,
            "kda_medio":           kda_medio,
            "dpm_medio":           dpm_medio,
            "gd15_medio":          gd15_medio,
            "partidas_analisadas": n,
            "atualizado_em":       j.atualizado_em,
        })

    # Ordenar corretamente: Tier > Rank > LP
    resultado.sort(
        key=lambda x: elo_score(x["tier"], x["rank"], x["lp"]),
        reverse=True
    )
    return resultado


@router.get("/{puuid}")
def perfil_jogador(puuid: str, db: Session = Depends(get_db)):
    """Stats detalhados de um jogador nas últimas 50 partidas"""
    jogador = db.query(Jogador).filter(Jogador.puuid == puuid).first()
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")

    stats = db.query(StatsPartida)\
        .filter(StatsPartida.puuid == puuid)\
        .order_by(StatsPartida.id.desc())\
        .limit(STATS_LIMIT).all()

    total_geral = jogador.wins + jogador.losses

    if not stats:
        return {
            "puuid":          jogador.puuid,
            "riot_id":        jogador.riot_id,
            "tag_line":       jogador.tag_line,
            "tier":           jogador.tier,
            "rank":           jogador.rank,
            "lp":             jogador.lp,
            "wins":           jogador.wins,
            "losses":         jogador.losses,
            "winrate_geral":  round(jogador.wins / total_geral * 100, 1) if total_geral > 0 else 0,
            "hot_streak":     jogador.hot_streak,
            "atualizado_em":  jogador.atualizado_em,
            "stats_medios":   None,
        }

    n = len(stats)
    kda_list      = [(s.kills + s.assists) / max(s.deaths, 1) for s in stats]
    gd15_validos  = [s.gd15  for s in stats if s.gd15  is not None]
    xpd15_validos = [s.xpd15 for s in stats if s.xpd15 is not None]
    csd15_validos = [s.csd15 for s in stats if s.csd15 is not None]

    return {
        "puuid":         jogador.puuid,
        "riot_id":       jogador.riot_id,
        "tag_line":      jogador.tag_line,
        "tier":          jogador.tier,
        "rank":          jogador.rank,
        "lp":            jogador.lp,
        "wins":          jogador.wins,
        "losses":        jogador.losses,
        "winrate_geral": round(jogador.wins / total_geral * 100, 1) if total_geral > 0 else 0,
        "hot_streak":    jogador.hot_streak,
        "atualizado_em": jogador.atualizado_em,
        "stats_medios": {
            "kda_medio":           round(sum(kda_list) / n, 2),
            "cspm_medio":          round(sum(s.cs / max(s.duracao_min, 1) for s in stats) / n, 2),
            "dpm_medio":           round(sum(s.dano_por_min for s in stats) / n, 1),
            "visao_medio":         round(sum(s.visao for s in stats) / n, 2),
            "kp_medio":            round(sum(s.kill_participation for s in stats) / n, 1),
            "gd15_medio":          round(sum(gd15_validos)  / len(gd15_validos),  1) if gd15_validos  else None,
            "xpd15_medio":         round(sum(xpd15_validos) / len(xpd15_validos), 1) if xpd15_validos else None,
            "csd15_medio":         round(sum(csd15_validos) / len(csd15_validos), 1) if csd15_validos else None,
            "winrate_recente":     round(sum(1 for s in stats if s.vitoria) / n * 100, 1),
            "partidas_analisadas": n,
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

    try:
        atualizar_jogador(db, jogador)
    except Exception as e:
        print(f"Aviso: erro na atualização inicial de {body.game_name}: {e}")

    return {"mensagem": f"{body.game_name}#{body.tag_line} adicionado com sucesso!", "puuid": jogador.puuid}
