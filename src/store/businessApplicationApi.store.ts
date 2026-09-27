import { create } from "zustand";
import { businessApplicationsApi } from "@/lib/api/businessApplications";
import { mapApiApplicationStatus } from "@/lib/business/applicationStatus";
import type { BusinessApplication } from "@/lib/api/types";
import type { BusinessApplicationStatus } from "@/store/businessApplication.store";
import { useAuthStore } from "@/store/auth.store";

type BusinessApplicationApiState = {
  application: BusinessApplication | null;
  status: BusinessApplicationStatus;
  userId: number | null;
  isLoading: boolean;
  setApplication: (application: BusinessApplication) => void;
  fetchApplication: () => Promise<void>;
  reset: () => void;
};

export const useBusinessApplicationApiStore = create<BusinessApplicationApiState>(
  (set, get) => {
    let requestId = 0;

    return {
    application: null,
    status: "none",
    userId: null,
    isLoading: false,
    setApplication: (application) =>
      set({
        application,
        status: mapApiApplicationStatus(application.status),
        userId: useAuthStore.getState().userId,
      }),
    fetchApplication: async () => {
      const auth = useAuthStore.getState();
      if (!auth.token) {
        get().reset();
        return;
      }

      const currentRequestId = ++requestId;
      const sameUser = get().userId === auth.userId;
      set({
        application: sameUser ? get().application : null,
        status: sameUser ? get().status : "none",
        userId: auth.userId,
        isLoading: true,
      });
      const isCurrentRequest = () =>
        requestId === currentRequestId &&
        useAuthStore.getState().token === auth.token &&
        useAuthStore.getState().userId === auth.userId;

      try {
        const application = await businessApplicationsApi.getMy(auth.token);
        if (!isCurrentRequest()) return;

        if (!application) {
          set({
            application: null,
            status: "none",
            userId: auth.userId,
            isLoading: false,
          });
          return;
        }

        const status = application
          ? mapApiApplicationStatus(application.status)
          : "none";

        set({ application, status, userId: auth.userId, isLoading: false });
      } catch (error) {
        if (!isCurrentRequest()) return;
        console.error("Не удалось загрузить заявку на бизнес:", error);
        set({ isLoading: false });
      }
    },
    reset: () => {
      requestId += 1;
      set({ application: null, status: "none", userId: null, isLoading: false });
    },
    };
  },
);
