import { create } from "zustand";
import { businessApplicationsApi } from "@/lib/api/businessApplications";
import { mapApiApplicationStatus } from "@/lib/business/applicationStatus";
import type { BusinessApplication } from "@/lib/api/types";
import type { BusinessApplicationStatus } from "@/store/businessApplication.store";

type BusinessApplicationApiState = {
  application: BusinessApplication | null;
  status: BusinessApplicationStatus;
  isLoading: boolean;
  setApplication: (application: BusinessApplication) => void;
  fetchApplication: () => Promise<void>;
  reset: () => void;
};

export const useBusinessApplicationApiStore = create<BusinessApplicationApiState>(
  (set) => ({
    application: null,
    status: "none",
    isLoading: false,
    setApplication: (application) =>
      set({
        application,
        status: mapApiApplicationStatus(application.status),
      }),
    fetchApplication: async () => {
      set({ isLoading: true });

      try {
        const application = await businessApplicationsApi.getMy();
        if (!application) {
          set((state) =>
            state.application?.status === "pending"
              ? { isLoading: false }
              : { application: null, status: "none", isLoading: false },
          );
          return;
        }

        const status = application
          ? mapApiApplicationStatus(application.status)
          : "none";

        set({ application, status, isLoading: false });
      } catch (error) {
        console.error("Не удалось загрузить заявку на бизнес:", error);
        set({ application: null, status: "none", isLoading: false });
      }
    },
    reset: () => {
      set({ application: null, status: "none", isLoading: false });
    },
  }),
);
