from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Jogador, Partida, StatsPartida, HistoricoLP
import riot_client as rc
import json
from datetime import datetime

scheduler = BackgroundScheduler()


def atualizar_todos():
    """Roda a cada 30 minutos: atualiza ranks e busca partidas novas"""
    print(f"[{datetime.now()}] Iniciando atualização automática...")
    db = SessionLocal()
    try:
        jogadores = db.query(Jogador).all()
        for jogador in jogadores:
            try:
                atualizar_jogador(db, jogador)
            except Exception as e:
                print(f"Erro ao atualizar {jogador.riot_id}: {e}")
    finally:
        db.close()
    print(f"[{datetime.now()}] Atualização concluída.")


def atualizar_jogador(db: Session, jogador: Jogador):
    """Atualiza rank e busca partidas novas de um jogador"""
    # 1. Atualizar rank
    ranks = rc.get_ranks(jogador.puuid)
    flex = next((r for r in ranks if r["queueType"] == "RANKED_FLEX_SR"), None)
    if flex:
        jogador.tier       = flex["tier"]
        jogador.rank       = flex["rank"]
        jogador.lp         = flex["leaguePoints"]
        jogador.wins       = flex["wins"]
        jogador.losses     = flex["losses"]
        jogador.hot_streak = flex["hotStreak"]

        # Salvar snapshot de LP
        snapshot = HistoricoLP(
            puuid=jogador.puuid,
            lp=flex["leaguePoints"],
            tier=flex["tier"],
            rank=flex["rank"]
        )
        db.add(snapshot)

    db.commit()

    # 2. Buscar partidas novas
    match_ids = rc.get_match_ids(jogador.puuid)
    # Checar quais partidas JÁ têm stats para ESTE jogador especificamente
    ids_com_stats = {s.match_id for s in db.query(StatsPartida.match_id).filter(StatsPartida.puuid == jogador.puuid).all()}
    # Checar quais partidas já estão na tabela partidas (para não rebaixar da API)
    ids_no_banco = {p.match_id for p in db.query(Partida.match_id).all()}

    for mid in match_ids:
        if mid in ids_com_stats:
            continue  # Já temos stats desta partida para este jogador

        try:
            # Buscar dados da partida da API (ou reusar do banco se já existir)
            if mid in ids_no_banco:
                from sqlalchemy.orm import Session
                partida_existente = db.query(Partida).filter(Partida.match_id == mid).first()
                match = json.loads(partida_existente.raw_json)
            else:
                match = rc.get_match(mid)

            info = match["info"]

            # Só insere na tabela partidas se ainda não existir
            if mid not in ids_no_banco:
                partida = Partida(
                    match_id=mid,
                    queue=info.get("queueId"),
                    duracao=info.get("gameDuration"),
                    patch=info.get("gameVersion", "").rsplit(".", 1)[0],
                    data=datetime.fromtimestamp(info["gameStartTimestamp"] / 1000),
                    raw_json=json.dumps(match)
                )
                db.add(partida)
                ids_no_banco.add(mid)

            # Extrair stats do jogador nessa partida
            participantes = info.get("participants", [])
            meu_part = next(
                (p for p in participantes if p["puuid"] == jogador.puuid), None
            )
            if not meu_part:
                continue

            meu_pid  = meu_part["participantId"]
            minha_rota = meu_part.get("teamPosition", "")
            meu_time   = meu_part.get("teamId")

            # Achar oponente de rota
            opp_part = next(
                (p for p in participantes
                 if p.get("teamPosition") == minha_rota
                 and p.get("teamId") != meu_time),
                None
            )

            diffs = {"gd15": None, "xpd15": None, "csd15": None}
            if opp_part and info.get("gameDuration", 0) >= 900:
                timeline = rc.get_timeline(mid)
                diffs = rc.calcular_diff_15(timeline, meu_pid, opp_part["participantId"])

            duracao_min = info.get("gameDuration", 0) / 60
            total_dano  = meu_part.get("totalDamageDealtToChampions", 0)
            kp_total    = meu_part.get("challenges", {}).get("killParticipation", 0)

            stats = StatsPartida(
                match_id=mid,
                puuid=jogador.puuid,
                campeao=meu_part.get("championName"),
                rota=minha_rota,
                kills=meu_part.get("kills", 0),
                deaths=meu_part.get("deaths", 0),
                assists=meu_part.get("assists", 0),
                cs=meu_part.get("totalMinionsKilled", 0) + meu_part.get("neutralMinionsKilled", 0),
                visao=meu_part.get("visionScore", 0),
                dano_por_min=round(total_dano / duracao_min, 1) if duracao_min > 0 else 0,
                gd15=diffs["gd15"],
                xpd15=diffs["xpd15"],
                csd15=diffs["csd15"],
                vitoria=meu_part.get("win", False),
                kill_participation=round(kp_total * 100, 1),
                duracao_min=round(duracao_min, 1)
            )
            db.add(stats)
            db.commit()

        except Exception as e:
            print(f"Erro ao processar partida {mid}: {e}")
            db.rollback()


def iniciar_scheduler():
    scheduler.add_job(atualizar_todos, "interval", minutes=30, id="atualizacao")
    scheduler.start()
    print("Scheduler iniciado — atualização a cada 30 minutos.")
