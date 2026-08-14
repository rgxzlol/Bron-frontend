import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BusinessFormData {
  companyName: string;
  activity: string;
  inn: string;
  location: string;
  phone: string;
  social: string;
  website: string;
  comment: string;
}

export type BusinessApplicationStatus =
  | "idle"
  | "pending"
  | "approved"
  | "rejected";

const emptyForm: BusinessFormData = {
  companyName: "",
  activity: "",
  inn: "",
  location: "",
  phone: "",
  social: "",
  website: "",
  comment: "",
};

interface BusinessFormState {
  isFormOpen: boolean;
  formData: BusinessFormData;
  hasHydrated: boolean;
  applicationStatus: BusinessApplicationStatus;
  hasApprovedBusiness: boolean;
  openForm: () => void;
  closeForm: () => void;
  setFormField: (field: keyof BusinessFormData, value: string) => void;
  setHasHydrated: (value: boolean) => void;
  submitApplication: () => void;
  approveApplication: () => void;
  rejectApplication: () => void;
  dismissResult: () => void;
}

export const useBusinessFormStore = create<BusinessFormState>()(
  persist(
    (set) => ({
      isFormOpen: false,
      formData: emptyForm,
      hasHydrated: false,
      applicationStatus: "idle",
      hasApprovedBusiness: false,

      openForm: () => set({ isFormOpen: true }),
      closeForm: () => set({ isFormOpen: false, formData: emptyForm }),

      setFormField: (field, value) =>
        set((state) => ({
          formData: { ...state.formData, [field]: value },
        })),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      submitApplication: () =>
        set({
          applicationStatus: "pending",
          isFormOpen: false,
          formData: emptyForm,
        }),

      approveApplication: () =>
        set({ applicationStatus: "approved", hasApprovedBusiness: true }),

      rejectApplication: () => set({ applicationStatus: "rejected" }),

      dismissResult: () =>
        set({ applicationStatus: "idle", formData: emptyForm }),
    }),
    {
      name: "business-form-storage",
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
