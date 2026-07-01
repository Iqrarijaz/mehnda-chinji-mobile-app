import { create } from 'zustand';

interface ChatUiState {
    isChatActive: boolean;
    setChatActive: (active: boolean) => void;
}

export const useChatUiStore = create<ChatUiState>((set) => ({
    isChatActive: false,
    setChatActive: (active) => set({ isChatActive: active }),
}));
