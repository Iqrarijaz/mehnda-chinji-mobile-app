import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { clientStorage } from '../utils/storage';

export const queryClient = new QueryClient({
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
    key: 'MEHNDA_CHINJI_QUERY_CACHE',
});
