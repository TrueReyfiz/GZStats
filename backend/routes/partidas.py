from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import StatsPartida, Partida
import json

router = APIRouter(prefix="/partidas", tags=["partidas"])


@router.get("/{puuid}")
def listar_partidas(
    puuid: str,
    limit: int = Query(default=20, le=50),
    db: Session = Depends(get_db)
):
    """Últimas N partidas Flex de um jogador"""
    stats = db.query(StatsPartida)\
        .filter(StatsPartida.puuid == puuid)\
        .order_by(StatsPartida.id.desc())\
        .limit(limit).all()

    resultado = []
    for s in stats:
        partida = db.query(Partida).filter(Partida.match_id == s.match_id).first()
        kda = round((s.kills + s.assists) / max(s.deaths, 1), 2)
        cspm = round(s.cs / max(s.duracao_min, 1), 2)

        resultado.append({
            "match_id":    s.match_id,
            "campeao":     s.campeao,
            "rota":        s.rota,
            "kills":       s.kills,
            "deaths":      s.deaths,
            "assists":     s.assists,
            "kda":         kda,
            "cs":          s.cs,
            "cspm":        cspm,
            "visao":       s.visao,
            "dano_por_min": s.dano_por_min,
            "gd15":        s.gd15,
            "xpd15":       s.xpd15,
            "csd15":       s.csd15,
            "vitoria":     s.vitoria,
            "kill_participation": s.kill_participation,
            "duracao_min": s.duracao_min,
            "data":        partida.data if partida else None,
            "patch":       partida.patch if partida else None,
        })

    return resultado
