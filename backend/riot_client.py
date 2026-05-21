from riotwatcher import LolWatcher, RiotWatcher, ApiError
from dotenv import load_dotenv, find_dotenv
import os

load_dotenv(find_dotenv(), override=True)

API_KEY       = os.getenv("RIOT_API_KEY")
watcher       = LolWatcher(API_KEY)   # Endpoints LoL (league, match, summoner)
riot_watcher  = RiotWatcher(API_KEY)  # Endpoints Riot (account-v1)
PLATFORM      = "br1"       # Para summoner-v4 e league-v4
REGION        = "americas"  # Para account-v1 e match-v5


def get_puuid(game_name: str, tag_line: str) -> dict:
    """Busca o PUUID pelo Riot ID (Nome#Tag)"""
    account = riot_watcher.account.by_riot_id(REGION, game_name, tag_line)
    return account  # { puuid, gameName, tagLine }


def get_summoner(puuid: str) -> dict:
    """Busca dados da conta pelo PUUID"""
    return watcher.summoner.by_puuid(PLATFORM, puuid)


def get_ranks(puuid: str) -> list:
    """Busca rank Flex e SoloQ pelo PUUID"""
    return watcher.league.by_puuid(PLATFORM, puuid)


def get_match_ids(puuid: str, count: int = 50) -> list:
    """Busca IDs das últimas partidas Flex"""
    return watcher.match.matchlist_by_puuid(
        REGION, puuid, queue=440, count=count
    )


def get_match(match_id: str) -> dict:
    """Busca detalhes completos de uma partida"""
    return watcher.match.by_id(REGION, match_id)


def get_timeline(match_id: str) -> dict:
    """Busca a timeline de uma partida (para GD@15, XPD@15, CSD@15)"""
    return watcher.match.timeline_by_match(REGION, match_id)


def calcular_diff_15(timeline: dict, meu_pid: int, opp_pid: int) -> dict:
    """
    Calcula diferença de ouro, XP e CS aos 15 minutos
    vs o oponente de rota. Retorna None em remakes.
    """
    frames = timeline.get("info", {}).get("frames", [])
    frame15 = next(
        (f for f in frames if f["timestamp"] >= 15 * 60 * 1000), None
    )
    if not frame15:
        return {"gd15": None, "xpd15": None, "csd15": None}

    pf = frame15["participantFrames"]
    me  = pf.get(str(meu_pid), {})
    opp = pf.get(str(opp_pid), {})

    gd15  = me.get("totalGold", 0)      - opp.get("totalGold", 0)
    xpd15 = me.get("xp", 0)             - opp.get("xp", 0)
    csd15 = (
        me.get("minionsKilled", 0)  + me.get("jungleMinionsKilled", 0)
    ) - (
        opp.get("minionsKilled", 0) + opp.get("jungleMinionsKilled", 0)
    )

    return {"gd15": gd15, "xpd15": xpd15, "csd15": csd15}
