from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Jogador, Partida, StatsPartida, HistoricoLP, HistoricoStats
import riot_client as rc
import json
from datetime import datetime, date

scheduler = BackgroundScheduler()

STATS_LIMIT = 50  # partidas usadas para calcular médias do snapshot


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


def _salvar_snapshot_stats(db: Session, jogador: Jogador):
    """
    Salva um HistoricoStats com as médias das últimas 50 partidas.
    Só salva uma vez por dia — se já existe snapshot de hoje, ignora.
    """
    hoje_inicio = datetime.combine(date.today(), datetime.min.time())
    ja_tem = db.query(HistoricoStats).filter(
        HistoricoStats.puuid == jogador.puuid,
        HistoricoStats.registrado_em >= hoje_inicio
    ).first()
    if ja_tem:
        return  # já salvou hoje

    stats_recentes = db.query(StatsPartida)\
        .filter(StatsPartida.puuid == jogador.puuid)\
        .order_by(StatsPartida.id.desc())\
        .limit(STATS_LIMIT).all()

    if not stats_recentes:
        return  # sem dados ainda

    n = len(stats_recentes)
    kda_list      = [(s.kills + s.assists) / max(s.deaths, 1) for s in stats_recentes]
    gd15_validos  = [s.gd15  for s in stats_recentes if s.gd15  is not None]
    xpd15_validos = [s.xpd15 for s in stats_recentes if s.xpd15 is not None]
    csd15_validos = [s.csd15 for s in stats_recentes if s.csd15 is not None]
    total_jogos   = jogador.wins + jogador.losses

    snapshot = HistoricoStats(
        puuid    = jogador.puuid,
        tier     = jogador.tier,
        rank     = jogador.rank,
        lp       = jogador.lp,
        kda      = round(sum(kda_list) / n, 2),
        cspm     = round(sum(s.cs / max(s.duracao_min, 1) for s in stats_recentes) / n, 2),
        dpm      = round(sum(s.dano_por_min for s in stats_recentes) / n, 1),
        visao    = round(sum(s.visao for s in stats_recentes) / n, 2),
        kp       = round(sum(s.kill_participation for s in stats_recentes) / n, 1),
        winrate  = round(jogador.wins / total_jogos * 100, 1) if total_jogos > 0 else 0,
        gd15     = round(sum(gd15_validos)  / len(gd15_validos),  1) if gd15_validos  else None,
        xpd15    = round(sum(xpd15_validos) / len(xpd15_validos), 1) if xpd15_validos else None,
        csd15    = round(sum(csd15_validos) / len(csd15_validos), 1) if csd15_validos else None,
        partidas = n,
    )
    db.add(snapshot)
    db.commit()
    print(f"  [{jogador.riot_id}] snapshot de stats salvo — {n} partidas analisadas")


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

        # Salvar snapshot de LP (toda atualização)
        snapshot_lp = HistoricoLP(
            puuid=jogador.puuid,
            lp=flex["leaguePoints"],
            tier=flex["tier"],
            rank=flex["rank"]
        )
        db.add(snapshot_lp)

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

            meu_pid    = meu_part["participantId"]
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

    # 3. Snapshot diário de stats (1x por dia)
    try:
        _salvar_snapshot_stats(db, jogador)
    except Exception as e:
        print(f"Erro ao salvar snapshot de stats de {jogador.riot_id}: {e}")


def iniciar_scheduler():
    scheduler.add_job(atualizar_todos, "interval", minutes=30, id="atualizacao")
    scheduler.start()
    print("Scheduler iniciado — atualização a cada 30 minutos.")
