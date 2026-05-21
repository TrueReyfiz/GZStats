"""Funções utilitárias compartilhadas entre rotas."""

TIER_ORDER = {
    'CHALLENGER': 9, 'GRANDMASTER': 8, 'MASTER': 7,
    'DIAMOND': 6, 'EMERALD': 5, 'PLATINUM': 4,
    'GOLD': 3, 'SILVER': 2, 'BRONZE': 1, 'IRON': 0, 'UNRANKED': -1
}

RANK_ORDER = {'I': 3, 'II': 2, 'III': 1, 'IV': 0, '': 0}


def elo_score(tier: str, rank: str, lp: int) -> int:
    """
    Retorna score numérico para ordenar corretamente por elo.
    Exemplo: EMERALD III 94 > PLATINUM I 45 > BRONZE III 76
    """
    return TIER_ORDER.get(tier, -1) * 10000 + RANK_ORDER.get(rank, 0) * 100 + lp


def lp_absoluto(tier: str, rank: str, lp: int) -> int:
    """
    LP absoluto para o gráfico de evolução — considera promoções corretamente.
    IRON IV 0LP = 0, cada divisão = 100 pontos.
    Assim promoção de PLAT I → EMERALD IV aparece como subida, não queda.
    """
    t = TIER_ORDER.get(tier, -1)
    r = RANK_ORDER.get(rank, 0)
    # MASTER+ não tem divisão (rank = ''), trata separado
    if t >= TIER_ORDER['MASTER']:
        return t * 400 + lp
    return (t * 4 + r) * 100 + lp
