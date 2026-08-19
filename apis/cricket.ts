import apiClient from './client';
import { CricketFeedParams, Tournament, CricketMatch, PredictionsSummary } from '@/types/cricket';

export const CRICKET_QUERY_KEYS = {
    all: ['cricket'] as const,
    feed: (params?: CricketFeedParams) => [...CRICKET_QUERY_KEYS.all, 'feed', params] as const,
    tournament: (id: string) => [...CRICKET_QUERY_KEYS.all, 'tournament', id] as const,
    match: (id: string) => [...CRICKET_QUERY_KEYS.all, 'match', id] as const,
};

/**
 * Fetch tournaments feed with optional filters
 */
export async function getTournamentsFeed(params?: CricketFeedParams) {
    const response = await apiClient.get('/api/public/v1/cricket/tournaments', { params });
    return response as unknown as {
        success: boolean;
        message: string;
        data: Tournament[];
        /** Fixtures across all tournaments — matches are their own collection. */
        matches: CricketMatch[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    };
}

/**
 * Fetch tournament details by ID
 */
export async function getTournamentDetails(id: string) {
    const response = await apiClient.get(`/api/public/v1/cricket/tournaments/${id}`);
    return response as unknown as {
        success: boolean;
        message: string;
        data: Tournament;
        matches: CricketMatch[];
    };
}

/**
 * Create a new tournament (Admin only)
 */
export async function createTournament(payload: any) {
    const response = await apiClient.post('/api/user/v1/cricket/tournaments', payload);
    return response as unknown as {
        success: boolean;
        message: string;
        data: Tournament;
    };
}

/**
 * Register a team and player roster to a tournament (Admin only)
 */
export async function registerTeam(tournamentId: string, payload: any) {
    const response = await apiClient.post(`/api/user/v1/cricket/tournaments/${tournamentId}/teams`, payload);
    return response as unknown as {
        success: boolean;
        message: string;
        data: Tournament;
    };
}

/**
 * Update an existing team's details and roster (Admin only)
 */
export async function updateTeam(tournamentId: string, teamId: string, payload: any) {
    const response = await apiClient.put(`/api/user/v1/cricket/tournaments/${tournamentId}/teams/${teamId}`, payload);
    return response as unknown as {
        success: boolean;
        message: string;
        data: Tournament;
    };
}

/**
 * Update a scheduled match's fixture details (Admin only)
 */
export async function updateMatch(matchId: string, payload: any) {
    const response = await apiClient.put(`/api/user/v1/cricket/matches/${matchId}`, payload);
    return response as unknown as {
        success: boolean;
        message: string;
        data: CricketMatch;
    };
}

/**
 * Schedule a fixture match in a tournament (Admin only)
 */
export async function scheduleMatch(tournamentId: string, payload: any) {
    const response = await apiClient.post(`/api/user/v1/cricket/tournaments/${tournamentId}/matches`, payload);
    return response as unknown as {
        success: boolean;
        message: string;
        data: CricketMatch;
    };
}

/**
 * Record the toss result for a match (Admin / Scorer only)
 */
export async function recordToss(matchId: string, payload: { tossWinnerId: string; tossDecision: 'BAT' | 'BOWL' }) {
    const response = await apiClient.patch(`/api/user/v1/cricket/matches/${matchId}/toss`, payload);
    return response as unknown as {
        success: boolean;
        message: string;
        data: CricketMatch;
    };
}

/**
 * Fetch match details by ID
 */
export async function getMatchDetails(matchId: string) {
    const response = await apiClient.get(`/api/public/v1/cricket/matches/${matchId}`);
    return response as unknown as {
        success: boolean;
        message: string;
        data: CricketMatch;
        userPrediction?: string | null;
    };
}

/**
 * Cast or update a user win prediction vote for a match
 */
export async function predictMatchWinner(matchId: string, predictedTeamId: string) {
    const response = await apiClient.post(`/api/user/v1/cricket/matches/${matchId}/predict`, { predictedTeamId });
    return response as unknown as {
        success: boolean;
        message: string;
        data: {
            predictionsSummary: PredictionsSummary;
            userPrediction: string;
        };
    };
}

/**
 * Post an over-by-over score update (Admin / Scorer only)
 */
export async function postOverUpdate(matchId: string, payload: any) {
    const response = await apiClient.patch(`/api/user/v1/cricket/matches/${matchId}/over`, payload);
    return response as unknown as {
        success: boolean;
        message: string;
        data: CricketMatch;
    };
}

/**
 * Update tournament details (Admin only)
 */
export async function updateTournament(tournamentId: string, payload: any) {
    const response = await apiClient.put(`/api/user/v1/cricket/tournaments/${tournamentId}`, payload);
    return response as unknown as {
        success: boolean;
        message: string;
        data: Tournament;
    };
}

/**
 * Assign or unassign a user admin to a tournament
 */
export async function assignTournamentAdmin(tournamentId: string, targetUserId: string, action: 'assign' | 'unassign') {
    const response = await apiClient.post(`/api/user/v1/cricket/tournaments/${tournamentId}/admin`, { targetUserId, action });
    return response as unknown as {
        success: boolean;
        message: string;
        data: Tournament;
    };
}
