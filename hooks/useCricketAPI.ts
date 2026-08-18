import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import {
    CRICKET_QUERY_KEYS,
    getTournamentsFeed,
    getTournamentDetails,
    createTournament,
    updateTournament,
    assignTournamentAdmin,
    registerTeam,
    updateTeam,
    scheduleMatch,
    updateMatch,
    getMatchDetails,
    predictMatchWinner,
    postOverUpdate
} from '@/apis/cricket';
import { CricketFeedParams, CricketMatch } from '@/types/cricket';
import { useSocket } from '@/context/SocketContext';

export function useCricketAPI() {
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    /**
     * Feed query for browsing tournaments
     */
    const useTournamentsFeedQuery = (params?: CricketFeedParams) =>
        useQuery({
            queryKey: CRICKET_QUERY_KEYS.feed(params),
            queryFn: () => getTournamentsFeed(params),
            staleTime: 1000 * 60 * 2, // 2 minutes
        });

    /**
     * Tournament Details query (includes teams, prizes, organizers, guests, and fixtures)
     */
    const useTournamentDetailsQuery = (tournamentId: string) =>
        useQuery({
            queryKey: CRICKET_QUERY_KEYS.tournament(tournamentId),
            queryFn: () => getTournamentDetails(tournamentId),
            enabled: !!tournamentId,
            staleTime: 1000 * 60 * 1, // 1 minute
        });

    /**
     * Match Details query (includes over records & predictions)
     */
    const useMatchDetailsQuery = (matchId: string) =>
        useQuery({
            queryKey: CRICKET_QUERY_KEYS.match(matchId),
            queryFn: () => getMatchDetails(matchId),
            enabled: !!matchId,
            staleTime: 1000 * 15, // 15 seconds
        });

    /**
     * Create Tournament Mutation
     */
    const createTournamentMutation = useMutation({
        mutationFn: (payload: any) => createTournament(payload),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.all });
            Toast.show({
                type: 'success',
                text1: 'Tournament Created',
                text2: res.message || 'Cricket tournament created successfully!'
            });
        },
        onError: (err: any) => {
            Toast.show({
                type: 'error',
                text1: 'Creation Failed',
                text2: err.message || 'Could not create tournament. Please try again.'
            });
        }
    });

    /**
     * Register Team Mutation
     */
    const registerTeamMutation = useMutation({
        mutationFn: ({ tournamentId, payload }: { tournamentId: string; payload: any }) =>
            registerTeam(tournamentId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.tournament(variables.tournamentId) });
            Toast.show({
                type: 'success',
                text1: 'Team Registered',
                text2: 'Team & roster added successfully!'
            });
        },
        onError: (err: any) => {
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: err.message || 'Could not register team.'
            });
        }
    });

    /**
     * Update Team Mutation
     */
    const updateTeamMutation = useMutation({
        mutationFn: ({ tournamentId, teamId, payload }: { tournamentId: string; teamId: string; payload: any }) =>
            updateTeam(tournamentId, teamId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.tournament(variables.tournamentId) });
            queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.all });
            Toast.show({
                type: 'success',
                text1: 'Team Updated',
                text2: 'Team details updated successfully!'
            });
        },
        onError: (err: any) => {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: err.message || 'Could not update team.'
            });
        }
    });

    /**
     * Schedule Match Mutation
     */
    const scheduleMatchMutation = useMutation({
        mutationFn: ({ tournamentId, payload }: { tournamentId: string; payload: any }) =>
            scheduleMatch(tournamentId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.tournament(variables.tournamentId) });
            Toast.show({
                type: 'success',
                text1: 'Match Scheduled',
                text2: 'Fixture scheduled successfully!'
            });
        },
        onError: (err: any) => {
            Toast.show({
                type: 'error',
                text1: 'Scheduling Failed',
                text2: err.message || 'Could not schedule match.'
            });
        }
    });

    /**
     * Update Match Fixture Mutation
     */
    const updateMatchMutation = useMutation({
        mutationFn: ({ matchId, payload }: { matchId: string; payload: any }) =>
            updateMatch(matchId, payload),
        onSuccess: (res: any, variables) => {
            queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.match(variables.matchId) });
            if (res?.data?.tournamentId) {
                queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.tournament(res.data.tournamentId) });
            }
            queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.all });
            Toast.show({
                type: 'success',
                text1: 'Match Updated',
                text2: 'Match details updated successfully!'
            });
        },
        onError: (err: any) => {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: err.message || 'Could not update match.'
            });
        }
    });

    /**
     * Cast/Update Win Prediction Mutation
     */
    const predictWinnerMutation = useMutation({
        mutationFn: ({ matchId, predictedTeamId }: { matchId: string; predictedTeamId: string }) =>
            predictMatchWinner(matchId, predictedTeamId),
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.match(variables.matchId) });
            Toast.show({
                type: 'success',
                text1: 'Vote Recorded',
                text2: 'Your win prediction has been updated!'
            });
        },
        onError: (err: any) => {
            Toast.show({
                type: 'error',
                text1: 'Vote Failed',
                text2: err.message || 'Could not record vote.'
            });
        }
    });

    /**
     * Post Over Update Mutation (Scorer Panel)
     */
    const postOverMutation = useMutation({
        mutationFn: ({ matchId, payload }: { matchId: string; payload: any }) =>
            postOverUpdate(matchId, payload),
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.match(variables.matchId) });
            if (res.data?.tournamentId) {
                queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.tournament(res.data.tournamentId) });
            }
            Toast.show({
                type: 'success',
                text1: 'Over Recorded',
                text2: `Over ${variables.payload.overNumber} submitted successfully!`
            });
        },
        onError: (err: any) => {
            Toast.show({
                type: 'error',
                text1: 'Over Failed',
                text2: err.message || 'Could not record over update.'
            });
        }
    });

    /**
     * Update Tournament Mutation
     */
    const updateTournamentMutation = useMutation({
        mutationFn: ({ tournamentId, payload }: { tournamentId: string; payload: any }) =>
            updateTournament(tournamentId, payload),
        onSuccess: (res: any, variables) => {
            queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.tournament(variables.tournamentId) });
            queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.all });
            Toast.show({
                type: 'success',
                text1: 'Tournament Updated',
                text2: res.message || 'Tournament details updated successfully!'
            });
        },
        onError: (err: any) => {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: err.message || 'Could not update tournament. Please try again.'
            });
        }
    });

    /**
     * Assign / Unassign Tournament Admin Mutation
     */
    const assignTournamentAdminMutation = useMutation({
        mutationFn: ({ tournamentId, targetUserId, action }: { tournamentId: string; targetUserId: string; action: 'assign' | 'unassign' }) =>
            assignTournamentAdmin(tournamentId, targetUserId, action),
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.tournament(variables.tournamentId) });
            Toast.show({
                type: 'success',
                text1: 'Admin Updated',
                text2: `Tournament admin ${variables.action === 'assign' ? 'assigned' : 'removed'} successfully!`
            });
        },
        onError: (err: any) => {
            Toast.show({
                type: 'error',
                text1: 'Operation Failed',
                text2: err.message || 'Could not update tournament admin.'
            });
        }
    });

    /**
     * Real-time Socket.IO Hook for Live Match Scorecard
     */
    const useLiveMatchSocket = (matchId: string) => {
        useEffect(() => {
            if (!socket || !matchId) return;

            socket.emit('join_match_room', { matchId });

            const handleOverUpdated = (data: { matchId: string; match: CricketMatch }) => {
                if (data.matchId === matchId) {
                    queryClient.setQueryData(CRICKET_QUERY_KEYS.match(matchId), (old: any) => {
                        if (!old) return old;
                        return { ...old, data: data.match };
                    });
                }
            };

            const handlePredictionUpdated = (data: { matchId: string; predictionsSummary: any }) => {
                if (data.matchId === matchId) {
                    queryClient.setQueryData(CRICKET_QUERY_KEYS.match(matchId), (old: any) => {
                        if (!old || !old.data) return old;
                        return {
                            ...old,
                            data: { ...old.data, predictionsSummary: data.predictionsSummary }
                        };
                    });
                }
            };

            const handleMatchCompleted = (data: { matchId: string; match: CricketMatch }) => {
                if (data.matchId === matchId) {
                    queryClient.setQueryData(CRICKET_QUERY_KEYS.match(matchId), (old: any) => {
                        if (!old) return old;
                        return { ...old, data: data.match };
                    });
                    if (data.match.tournamentId) {
                        queryClient.invalidateQueries({ queryKey: CRICKET_QUERY_KEYS.tournament(data.match.tournamentId) });
                    }
                }
            };

            socket.on('OVER_UPDATED', handleOverUpdated);
            socket.on('PREDICTION_UPDATED', handlePredictionUpdated);
            socket.on('MATCH_COMPLETED', handleMatchCompleted);

            return () => {
                socket.emit('leave_match_room', { matchId });
                socket.off('OVER_UPDATED', handleOverUpdated);
                socket.off('PREDICTION_UPDATED', handlePredictionUpdated);
                socket.off('MATCH_COMPLETED', handleMatchCompleted);
            };
        }, [socket, matchId]);
    };

    return {
        useTournamentsFeedQuery,
        useTournamentDetailsQuery,
        useMatchDetailsQuery,
        createTournamentMutation,
        updateTournamentMutation,
        assignTournamentAdminMutation,
        registerTeamMutation,
        updateTeamMutation,
        scheduleMatchMutation,
        updateMatchMutation,
        predictWinnerMutation,
        postOverMutation,
        useLiveMatchSocket
    };
}
