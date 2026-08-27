export type CricketFormat = 'T10' | 'T15' | 'T20' | 'CUSTOM';
export type TournamentStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED';
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
export type MatchStage = 'GROUP' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';
export type PlayerRole = 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER';

export interface Organizer {
    _id?: string;
    name: string;
    phone?: string;
    role: string;
    image?: string | null;
}

export interface Guest {
    _id?: string;
    name: string;
    title: string;
    image?: string | null;
}

export interface TournamentPrizes {
    winnerPrize: string;
    runnerUpPrize: string;
    manOfTheSeriesPrize?: string | null;
    bestBowlerPrize?: string | null;
}

export interface PlayerStats {
    matches: number;
    runsScored: number;
    ballsFaced: number;
    fours: number;
    sixes: number;
    wicketsTaken: number;
    oversBowled: number;
    runsConceded: number;
}

export interface Player {
    _id?: string;
    name: string;
    role: PlayerRole;
    jerseyNumber?: number | null;
    image?: string | null;
    phone?: string | null;
    isCaptain?: boolean;
    stats?: PlayerStats;
}

export interface TeamStats {
    played: number;
    won: number;
    lost: number;
    tied: number;
    noResult: number;
    points: number;
    netRunRate: number;
    runsFor: number;
    oversFor: number;
    runsAgainst: number;
    oversAgainst: number;
}

export interface Team {
    _id: string;
    name: string;
    shortName: string;
    logo?: string | null;
    captainName?: string | null;
    captainPhone?: string | null;
    players: Player[];
    stats?: TeamStats;
}

export interface LocationPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

export interface Tournament {
    _id: string;
    name: string;
    city: string;
    venue: string;
    location: LocationPoint;
    format: CricketFormat;
    defaultMaxOvers: number;
    startDate: string;
    endDate?: string | null;
    bannerImage?: string | null;
    status: TournamentStatus;
    prizes: TournamentPrizes;
    organizers: Organizer[];
    guests: Guest[];
    teams: Team[];
    createdBy: {
        _id: string;
        name: string;
        email?: string;
        profileImage?: string;
    } | string;
    admins?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface BallRecord {
    _id?: string;
    ballNumber: number;
    strikerName?: string;
    nonStrikerName?: string;
    bowlerName?: string;
    runs: number;
    isWicket?: boolean;
    isWide?: boolean;
    isNoBall?: boolean;
    isBye?: boolean;
    isLegBye?: boolean;
    wicketType?: string;
    totalRuns: number;
    commentary?: string;
}

export interface OverRecord {
    _id?: string;
    overNumber: number;
    bowlerName: string;
    strikerName?: string;
    nonStrikerName?: string;
    batsmanName?: string;
    runsScored: number;
    wickets: number;
    extras: {
        wides: number;
        noBalls: number;
        byesLegByes: number;
    };
    balls?: BallRecord[];
    commentary?: string;
}

export interface Innings {
    battingTeamId: string;
    bowlingTeamId: string;
    totalRuns: number;
    totalWickets: number;
    totalOvers: number;
    maxOvers: number;
    overs: OverRecord[];
    isCompleted: boolean;
}

export interface PredictionsSummary {
    teamAVotes: number;
    teamBVotes: number;
    totalVotes: number;
    teamAProbability: number;
    teamBProbability: number;
}

export interface CricketMatch {
    _id: string;
    tournamentId: string | { _id: string; name: string; venue?: string; city?: string };
    tournamentName?: string;
    matchTitle: string;
    stage: MatchStage;
    teamA: {
        id: string;
        name: string;
        logo?: string | null;
    };
    teamB: {
        id: string;
        name: string;
        logo?: string | null;
    };
    venue: string;
    scheduledAt: string;
    maxOvers: number;
    tossWinnerId?: string | null;
    tossDecision?: 'BAT' | 'BOWL' | null;
    status: MatchStatus;
    currentInnings: 1 | 2;
    innings1?: Innings | null;
    innings2?: Innings | null;
    predictionsSummary: PredictionsSummary;
    result?: string | null;
    winnerTeamId?: string | null;
    manOfTheMatch?: {
        playerId?: string | null;
        name?: string | null;
    };
    scorerUserId: string;
    createdAt?: string;
}

export interface PlayerBattingStat {
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
    innings?: number;
}

export interface PlayerBowlingStat {
    name: string;
    wickets: number;
    runsConceded: number;
    ballsBowled: number;
    overs: number;
    economy: number;
    maidens?: number;
}

export interface TournamentLeaderboard {
    topBatsmen: PlayerBattingStat[];
    topBowlers: PlayerBowlingStat[];
    orangeCap: PlayerBattingStat | null;
    purpleCap: PlayerBowlingStat | null;
}

export interface CricketFeedParams {
    status?: TournamentStatus;
    city?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    page?: number;
    limit?: number;
}

/**
 * Checks whether the logged-in user can manage a specific tournament.
 */
export function canUserManageTournament(
    user: any,
    tournamentId?: string,
    createdById?: string,
    admins?: string[]
): boolean {
    if (!user?.user?.isCricketAdmin) return false;

    const userId = String(user?.user?._id || user?.user?.id || '');
    if (!userId) return false;

    // 1. Check if user is in tournament admins array
    if (admins && Array.isArray(admins) && admins.length > 0) {
        if (admins.some(id => String(id) === userId)) return true;
    }

    // 2. Check if user is tournament creator
    if (createdById && String(createdById) === userId) return true;

    // 3. Check if tournament is in user's managedTournaments array
    const managedTournaments: string[] = user?.user?.managedTournaments || [];
    if (managedTournaments.length > 0 && tournamentId) {
        return managedTournaments.some(id => String(id) === String(tournamentId));
    }

    return true;
}
