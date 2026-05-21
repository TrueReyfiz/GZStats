from sqlalchemy import Column, String, Integer, Boolean, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class Jogador(Base):
    __tablename__ = "jogadores"

    id          = Column(Integer, primary_key=True, index=True)
    puuid       = Column(String, unique=True, index=True, nullable=False)
    riot_id     = Column(String, nullable=False)   # Nome do jogador
    tag_line    = Column(String, nullable=False)   # Ex: BR1
    tier        = Column(String, default="UNRANKED")
    rank        = Column(String, default="")
    lp          = Column(Integer, default=0)
    wins        = Column(Integer, default=0)
    losses      = Column(Integer, default=0)
    hot_streak  = Column(Boolean, default=False)
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Partida(Base):
    __tablename__ = "partidas"

    match_id  = Column(String, primary_key=True, index=True)
    queue     = Column(Integer)        # 440 = Flex
    duracao   = Column(Integer)        # em segundos
    patch     = Column(String)
    data      = Column(DateTime)
    raw_json  = Column(Text)           # JSON bruto da partida


class StatsPartida(Base):
    __tablename__ = "stats_partida"

    id        = Column(Integer, primary_key=True, index=True)
    match_id  = Column(String, index=True)
    puuid     = Column(String, index=True)
    campeao   = Column(String)
    rota      = Column(String)         # TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
    kills     = Column(Integer, default=0)
    deaths    = Column(Integer, default=0)
    assists   = Column(Integer, default=0)
    cs        = Column(Integer, default=0)
    visao     = Column(Float, default=0)
    dano_por_min = Column(Float, default=0)
    gd15      = Column(Integer, nullable=True)   # None = remake
    xpd15     = Column(Integer, nullable=True)
    csd15     = Column(Integer, nullable=True)
    vitoria   = Column(Boolean, default=False)
    kill_participation = Column(Float, default=0)
    duracao_min = Column(Float, default=0)


class HistoricoLP(Base):
    __tablename__ = "historico_lp"

    id           = Column(Integer, primary_key=True, index=True)
    puuid        = Column(String, index=True)
    lp           = Column(Integer)
    tier         = Column(String)
    rank         = Column(String)
    registrado_em = Column(DateTime, server_default=func.now())
