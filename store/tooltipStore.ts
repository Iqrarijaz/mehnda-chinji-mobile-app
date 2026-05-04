import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { clientStorage } from '@/utils/storage';

interface TooltipState {
    viewedTooltips: Record<string, boolean>;
    
    // Actions
    hasViewed: (id: string) => boolean;
    markAsViewed: (id: string) => void;
    resetTooltips: () => void;
}

export const useTooltipStore = create<TooltipState>()(
    persist(
        (set, get) => ({
            viewedTooltips: {},

            hasViewed: (id) => {
                return !!get().viewedTooltips[id];
            },

            markAsViewed: (id) => {
                set((state) => ({
                    viewedTooltips: {
                        ...state.viewedTooltips,
                        [id]: true,
                    },
                }));
            },

            resetTooltips: () => set({ viewedTooltips: {} }),
        }),
        {
            name: 'tooltip-storage',
            storage: createJSONStorage(() => clientStorage),
        }
    )
);
