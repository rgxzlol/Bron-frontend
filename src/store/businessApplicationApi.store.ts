import { create } from "zustand";
import { businessApplicationsApi } from "@/lib/api/businessApplications";
import { mapApiApplicationStatus } from "@/lib/business/applicationStatus";
import type { BusinessApplication } from "@/lib/api/types";
import type { BusinessApplicationStatus } from "@/store/businessApplication.store";

type BusinessApplicationApiState = {
  application: BusinessApplication | null;
  status: BusinessApplicationStatus;
  isLoading: boolean;
  fetchApplication: () => Promise<void>;
  reset: () => void;
};

export const useBusinessApplicationApiStore = create<BusinessApplicationApiState>(
  (set) => ({
    application: null,
    status: "none",
    isLoading: false,
    fetchApplication: async () => {
      set({ isLoading: true });

      try {
        const application = await businessApplicationsApi.getMy();
        const status = application
          ? mapApiApplicationStatus(application.status)
          : "none";

        set({ application, status, isLoading: false });
      } catch {
        set({ application: null, status: "none", isLoading: false });
      }
    },
    reset: () => {
      set({ application: null, status: "none", isLoading: false });
    },
  }),
);
