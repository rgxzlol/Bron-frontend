import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BusinessApplicationFormData } from "@/lib/business/applicationValidation";

export type BusinessApplicationStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected";

type BusinessApplicationState = {
  submission: BusinessApplicationFormData | null;
  submittedAt: string | null;
  status: BusinessApplicationStatus;
  /** @deprecated use status === "pending" */
  isUnderReview: boolean;
  approvalAcknowledged: boolean;
  rejectionAcknowledged: boolean;
  businessAccessGranted: boolean;
  submitApplication: (data: BusinessApplicationFormData) => void;
  setApplicationStatus: (status: Exclude<BusinessApplicationStatus, "none">) => void;
  acknowledgeApproval: () => void;
  acknowledgeRejection: () => void;
  resetApplication: () => void;
};

const INITIAL_STATE = {
  submission: null,
  submittedAt: null,
  status: "none" as BusinessApplicationStatus,
  isUnderReview: false,
  approvalAcknowledged: false,
  rejectionAcknowledged: false,
  businessAccessGranted: false,
};

export const useBusinessApplicationStore = create<BusinessApplicationState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      submitApplication: (data) => {
        set({
          submission: data,
          submittedAt: new Date().toISOString(),
          status: "pending",
          isUnderReview: true,
          approvalAcknowledged: false,
          rejectionAcknowledged: false,
          businessAccessGranted: false,
        });
      },
      setApplicationStatus: (status) => {
        if (status === "approved") {
          set({
            status: "approved",
            isUnderReview: false,
            approvalAcknowledged: false,
            rejectionAcknowledged: false,
            businessAccessGranted: false,
          });
          return;
        }

        if (status === "rejected") {
          set({
            status: "rejected",
            isUnderReview: false,
            approvalAcknowledged: false,
            rejectionAcknowledged: false,
            businessAccessGranted: false,
          });
          return;
        }

        set({
          status: "pending",
          isUnderReview: true,
          approvalAcknowledged: false,
          rejectionAcknowledged: false,
          businessAccessGranted: false,
        });
      },
      acknowledgeApproval: () => {
        set({
          approvalAcknowledged: true,
          businessAccessGranted: true,
        });
      },
      acknowledgeRejection: () => {
        set({
          rejectionAcknowledged: true,
          status: "none",
          isUnderReview: false,
          submission: null,
          submittedAt: null,
          businessAccessGranted: false,
        });
      },
      resetApplication: () => {
        set({ ...INITIAL_STATE });
      },
    }),
    {
      name: "business-application-storage",
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<BusinessApplicationState>;

        if (!state.status) {
          state.status = state.isUnderReview ? "pending" : "none";
        }

        if (state.approvalAcknowledged == null) {
          state.approvalAcknowledged = false;
        }

        if (state.rejectionAcknowledged == null) {
          state.rejectionAcknowledged = false;
        }

        if (state.businessAccessGranted == null) {
          state.businessAccessGranted = false;
        }

        return state as BusinessApplicationState;
      },
    },
  ),
);
