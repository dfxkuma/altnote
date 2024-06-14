import { create } from 'zustand';

export const useUserStore = create((set) => ({
    user: null,
    setUser: (user) => set({ user }),
}));

export const useJoinRoomStore = create((set) => ({
    roomId: null,
    setRoomId: (roomId) => set({ roomId }),
}));

export const useNoteStore = create((set) => ({
    note: null,
    setNote: (content) => set({ content }),
}));

