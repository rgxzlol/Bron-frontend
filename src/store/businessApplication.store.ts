import { create } from "zustand";
import { persist } from "zustand/middleware";
import { businessApplicationsApi } from "@/lib/api/businessApplications";
import { ApiError } from "@/lib/api/client";
import type { BusinessApplication } from "@/lib/api/types";
import { mapApiApplicationStatus } from "@/lib/business/applicationStatus";
import type { BusinessApplicationFormData } from "@/lib/business/applicationValidation";

export type BusinessApplicationStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected";

type BusinessApplicationState = {
  submission: BusinessApplicationFormData | null;
  status: BusinessApplicationStatus;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  approvalAcknowledged: boolean;
  rejectionAcknowledged: boolean;
  fetchApplicationStatus: () => Promise<void>;
  submitApplication: (data: BusinessApplicationFormData) => Promise<void>;
  acknowledgeApproval: () => void;
  acknowledgeRejection: () => void;
  resetApplication: () => void;
};

const INITIAL_STATE = {
  submission: null,
  status: "none" as BusinessApplicationStatus,
  isLoading: false,
  isSubmitting: false,
  error: null,
  approvalAcknowledged: false,
  rejectionAcknowledged: false,
};

function mapApplicationToFormData(
  application: BusinessApplication,
): BusinessApplicationFormData {
  return {
    companyName: application.company_name,
    sphere: application.sphere,
    location: application.location,
    phone: application.phone,
  };
}

function applyApplicationFromApi(
  application: BusinessApplication | null,
  previousStatus: BusinessApplicationStatus,
  currentAck: {
    approvalAcknowledged: boolean;
    rejectionAcknowledged: boolean;
  },
) {
  const status = mapApiApplicationStatus(application?.status);

  return {
    submission: application ? mapApplicationToFormData(application) : null,
    status,
    approvalAcknowledged:
      status === "approved" && previousStatus !== "approved"
        ? false
        : currentAck.approvalAcknowledged,
    rejectionAcknowledged:
      status === "rejected" && previousStatus !== "rejected"
        ? false
        : currentAck.rejectionAcknowledged,
  };
}

export const useBusinessApplicationStore = create<BusinessApplicationState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      fetchApplicationStatus: async () => {
        set({ isLoading: true, error: null });

        try {
          const application = await businessApplicationsApi.getMy();
          const previousStatus = get().status;
          const nextState = applyApplicationFromApi(application, previousStatus, {
            approvalAcknowledged: get().approvalAcknowledged,
            rejectionAcknowledged: get().rejectionAcknowledged,
          });

          set({
            ...nextState,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) {
            set({
              submission: null,
              status: "none",
              isLoading: false,
              error: null,
            });
            return;
          }

          console.error("Не удалось загрузить статус заявки:", error);
          set({
            isLoading: false,
            error:
              error instanceof ApiError
                ? error.message
                : "Не удалось загрузить статус заявки",
          });
        }
      },
      submitApplication: async (data) => {
        set({ isSubmitting: true, error: null });

        try {
          const application = await businessApplicationsApi.create({
            company_name: data.companyName,
            sphere: data.sphere,
            location: data.location,
            phone: data.phone,
          });

          if (!application) {
            throw new ApiError(500, "Не удалось создать заявку");
          }
          const previousStatus = get().status;
          const nextState = applyApplicationFromApi(application, previousStatus, {
            approvalAcknowledged: false,
            rejectionAcknowledged: false,
          });

          set({
            ...nextState,
            isSubmitting: false,
          });
        } catch (error) {
          console.error("Не удалось отправить заявку:", error);
          set({
            isSubmitting: false,
            error:
              error instanceof ApiError
                ? error.message
                : "Не удалось отправить заявку",
          });
          throw error;
        }
      },
      acknowledgeApproval: () => {
        set({ approvalAcknowledged: true });
      },
      acknowledgeRejection: () => {
        set({ rejectionAcknowledged: true });
      },
      resetApplication: () => {
        set({ ...INITIAL_STATE });
      },
    }),
    {
      name: "business-application-storage",
      version: 3,
      partialize: (state) => ({
        approvalAcknowledged: state.approvalAcknowledged,
        rejectionAcknowledged: state.rejectionAcknowledged,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<BusinessApplicationState>;

        return {
          ...INITIAL_STATE,
          approvalAcknowledged: state.approvalAcknowledged ?? false,
          rejectionAcknowledged: state.rejectionAcknowledged ?? false,
        };
      },
    },
  ),
);
