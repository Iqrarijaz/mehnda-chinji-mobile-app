import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { clientStorage } from '../utils/storage';
import { errorLogger } from './errorLogger';

export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error) => {
            errorLogger.logApiError(error, { context: 'Global Query Cache' });
        },
    }),
    mutationCache: new MutationCache({
        onError: (error) => {
            errorLogger.logApiError(error, { context: 'Global Mutation Cache' });
        },
    }),
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            retry: 2,
        },
    },
});

export const asyncStoragePersister = createAsyncStoragePersister({
    storage: clientStorage,
    key: 'REHBAR_QUERY_CACHE',
});
