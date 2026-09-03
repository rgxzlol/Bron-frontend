"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { readImageFile } from "@/lib/readImageFile";
import { looksLikePhoneUsername } from "@/lib/auth/validation";
import { ApiError } from "@/lib/api/client";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/store/auth.store";
import { type ProfileLanguage, useProfileStore } from "@/store/profile.store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  PROFILE_ERROR_MESSAGE_KEYS,
  type ProfilePersonalField,
  validateProfilePersonalInfo,
} from "@/lib/profile/validation";
import { useToastStore } from "@/store/toast.store";
import { useNotificationStore } from "@/store/notification.store";
import s from "./profilePage.module.css";

type ProfileSection =
  | "main"
  | "personal"
  | "payments"
  | "addCard"
  | "appSettings"
  | "notifications"
  | "theme"
  | "logout";

type ProfilePageContentProps = {
  onClose?: () => void;
  onSectionChange?: (section: ProfileSection) => void;
};

const langOptions: { id: ProfileLanguage; label: string }[] = [
  { id: "uz", label: "UZ" },
  { id: "ru", label: "RU" },
  { id: "en", label: "EN" },
];

const sectionTitleKeys: Record<ProfileSection, string> = {
  main: "profile.sectionMain",
  personal: "profile.sectionPersonal",
  payments: "profile.sectionPayments",
  addCard: "profile.addCard",
  appSettings: "profile.sectionAppSettings",
  notifications: "profile.sectionNotifications",
  theme: "profile.sectionTheme",
  logout: "profile.sectionLogout",
};

const staticCards = [
  { id: "visa", logo: assets.profile.visa, logoWidth: 52, logoHeight: 17, last4: "4242" },
  { id: "mc", logo: assets.profile.masterCard, logoWidth: 42, logoHeight: 28, last4: "7878" },
];

const staticHistory = [
  { id: "1", title: "Оплата бронирования", reference: "123123", amount: "80 000 сум", date: "12 мая 2026" },
  { id: "2", title: "Оплата бронирования", reference: "123123", amount: "80 000 сум", date: "12 мая 2026" },
  { id: "3", title: "Оплата бронирования", reference: "123123", amount: "80 000 сум", date: "12 мая 2026" },
];

export default function ProfilePageContent({
  onClose,
  onSectionChange,
}: ProfilePageContentProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const clearToken = useAuthStore((state) => state.clearToken);
  const showToast = useToastStore((state) => state.showToast);
  const {
    fullName,
    phone,
    email,
    avatarUrl,
    language,
    theme,
    notifications,
    setAvatarUrl,
    setLanguage,
    setTheme,
    toggleNotification,
    savePersonalInfo,
    fetchProfile,
    fetchNotificationSettings,
    resetProfile,
    isProfileLoading,
  } = useProfileStore();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const personalDraftHydratedRef = useRef(false);

  const [section, setSection] = useState<ProfileSection>("main");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveCardForFuture, setSaveCardForFuture] = useState(true);

  const [nameDraft, setNameDraft] = useState(
    looksLikePhoneUsername(fullName) ? "" : (fullName ?? ""),
  );
  const [phoneDraft, setPhoneDraft] = useState(phone ?? "");
  const [emailDraft, setEmailDraft] = useState(email ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [personalFieldErrors, setPersonalFieldErrors] = useState<
    Partial<Record<ProfilePersonalField, string>>
  >({});

  const displayName = looksLikePhoneUsername(fullName) ? "" : fullName;

  useEffect(() => {
    if (token) {
      void fetchProfile();
    }
  }, [token, fetchProfile]);

  useEffect(() => {
    if (section === "notifications") {
      void fetchNotificationSettings();
    }
  }, [section, fetchNotificationSettings]);

  useEffect(() => {
    onSectionChange?.(section);
  }, [section, onSectionChange]);

  useEffect(() => {
    if (section !== "personal") {
      personalDraftHydratedRef.current = false;
      return;
    }

    if (personalDraftHydratedRef.current || isProfileLoading) {
      return;
    }

    setNameDraft(looksLikePhoneUsername(fullName) ? "" : (fullName ?? ""));
    setPhoneDraft(phone ?? "");
    setEmailDraft(email ?? "");
    personalDraftHydratedRef.current = true;
  }, [section, fullName, phone, email, isProfileLoading]);

  const canChangePassword =
    oldPassword.trim().length > 0 &&
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0;

  function goTo(next: ProfileSection) {
    if (next !== "personal") {
      setPersonalFieldErrors({});
      personalDraftHydratedRef.current = false;
    }
    setSection(next);
  }

  function clearPersonalFieldError(field: ProfilePersonalField) {
    setPersonalFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError(t("profile.passwordMismatch"));
      return;
    }

    if (!token) return;

    setSaving(true);
    try {
      await usersApi.changePassword(
        { old_password: oldPassword, new_password: newPassword },
        token,
      );
      setPasswordSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(t("profile.passwordChangedToast"), t("profile.passwordChangedToastDesc"));
    } catch (error) {
      setPasswordError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("profile.passwordChangeFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!token) return;

    setDeleting(true);
    try {
      await usersApi.deleteProfile(token);
      clearToken();
      resetProfile();
      onClose?.();
      router.push(routes.login);
    } catch (error) {
      showToast(
        t("common.errorTitle"),
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("profile.deleteFailed"),
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleSavePersonalInfo() {
    const validationErrors = validateProfilePersonalInfo(
      nameDraft,
      phoneDraft,
      emailDraft,
    );

    if (Object.keys(validationErrors).length > 0) {
      const mappedErrors = Object.fromEntries(
        Object.entries(validationErrors).map(([field, code]) => [
          field,
          t(PROFILE_ERROR_MESSAGE_KEYS[code]),
        ]),
      ) as Partial<Record<ProfilePersonalField, string>>;

      setPersonalFieldErrors(mappedErrors);
      setSaveError(null);
      return;
    }

    setPersonalFieldErrors({});
    setSaving(true);
    setSaveError(null);

    try {
      await savePersonalInfo({
        fullName: nameDraft,
        phone: phoneDraft,
        email: emailDraft,
      });
      showToast(t("profile.updatedTitle"), t("profile.updatedMessage"));
      goTo("main");
    } catch (error) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("profile.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  function handleBookingsClick() {
    router.push(routes.bookings);
  }

  function handleLogout() {
    clearToken();
    resetProfile();
    useNotificationStore.getState().resetNotifications();
    router.replace(routes.login);
  }

  async function handleAvatarUpload(file: File) {
    const url = await readImageFile(file);
    if (url) setAvatarUrl(url);
  }

  function getBackSection(current: ProfileSection): ProfileSection {
    if (current === "logout") return "main";
    if (current === "theme" || current === "notifications") return "appSettings";
    if (current === "addCard") return "payments";
    return "main";
  }

  return (
    <div className={s.content}>
      <SectionHeader
        title={t(sectionTitleKeys[section])}
        mobileOnly={section === "main"}
        onBack={
          section === "main"
            ? () => onClose?.()
            : () => goTo(getBackSection(section))
        }
      />

      {section === "main" && (
        <div className={s.mainSection}>
          <div className={s.profileHead}>
            <div className={s.avatarWrap}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className={s.avatarImage} />
              ) : (
                <Image
                  src={assets.profile.avatar}
                  alt=""
                  width={104}
                  height={104}
                  className={s.avatarImage}
                />
              )}
              <button
                type="button"
                className={s.cameraBtn}
                aria-label={t("profile.changePhoto")}
                onClick={() => avatarInputRef.current?.click()}
              >
                <Image src={assets.profile.camera} alt="" width={16} height={16} />
              </button>
            </div>

            <div className={s.nameRow}>
              <h2 data-testid="profile-display-name">{displayName || t("profile.fullName")}</h2>
              <button type="button" onClick={() => goTo("personal")} aria-label={t("profile.editAria")}>
                <Image src={assets.profile.edit} alt="" width={16} height={15} />
              </button>
            </div>
            <p className={s.phoneText}>{phone}</p>
          </div>

          <div className={s.menu}>
            <MenuItem
              icon={assets.profile.profileData}
              title={t("profile.personalInformation")}
              subtitle={t("profile.personalDataSubtitle")}
              onClick={() => goTo("personal")}
              testId="profile-menu-personal"
            />
            <MenuItem
              icon={assets.profile.myBookings}
              title={t("profile.myBookings")}
              subtitle={t("profile.myBookingsSubtitle")}
              onClick={handleBookingsClick}
              testId="profile-menu-bookings"
            />
            <MenuItem
              icon={assets.profile.card}
              title={t("profile.payments")}
              subtitle={t("profile.paymentsSubtitle")}
              onClick={() => goTo("payments")}
            />
            <MenuItem
              icon={assets.profile.settings}
              title={t("profile.settings")}
              subtitle={t("profile.settingsSubtitle")}
              onClick={() => goTo("appSettings")}
              testId="profile-menu-settings"
            />
          </div>

          <button
            type="button"
            className={s.logoutRow}
            onClick={() => goTo("logout")}
            data-testid="profile-logout-trigger"
          >
            <span className={s.iconTileRed}>
              <Image src={assets.profile.quit} alt="" width={17} height={21} />
            </span>
            {t("profile.logout")}
          </button>
          <button
            type="button"
            className={s.cancelBtn}
            onClick={() => onClose?.()}
            data-testid="profile-close"
          >
            {t("common.cancel")}
          </button>
        </div>
      )}

      {section === "personal" && (
        <form
          className={`${s.section} ${s.sectionGrow}`}
          data-testid="profile-personal-section"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleSavePersonalInfo();
          }}
        >
          <div className={s.avatarBlock}>
            <div className={s.avatarWrap}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className={s.avatarImageLarge} />
              ) : (
                <Image
                  src={assets.profile.avatar}
                  alt=""
                  width={112}
                  height={112}
                  className={s.avatarImageLarge}
                />
              )}
              <button
                type="button"
                className={s.cameraBtn}
                aria-label={t("profile.changePhoto")}
                onClick={() => avatarInputRef.current?.click()}
              >
                <Image src={assets.profile.camera} alt="" width={16} height={16} />
              </button>
            </div>
          </div>

          <label className={`${s.field} ${personalFieldErrors.fullName ? s.fieldError : ""}`}>
            <span>{t("profile.fullName")}</span>
            <input
              value={nameDraft}
              onChange={(e) => {
                setNameDraft(e.target.value);
                clearPersonalFieldError("fullName");
              }}
              data-testid="profile-full-name"
              aria-invalid={Boolean(personalFieldErrors.fullName)}
              aria-describedby={
                personalFieldErrors.fullName ? "profile-error-full-name" : undefined
              }
            />
            {personalFieldErrors.fullName ? (
              <span
                id="profile-error-full-name"
                className={s.fieldErrorMessage}
                data-testid="profile-error-full-name"
                role="alert"
              >
                {personalFieldErrors.fullName}
              </span>
            ) : null}
          </label>
          <div className={s.field}>
            <span>{t("profile.phone")}</span>
            <p className={s.readOnlyValue} data-testid="profile-phone">
              {phoneDraft || "—"}
            </p>
          </div>
          <label className={`${s.field} ${personalFieldErrors.email ? s.fieldError : ""}`}>
            <span>{t("profile.emailAddress")}</span>
            <input
              value={emailDraft}
              onChange={(e) => {
                setEmailDraft(e.target.value);
                clearPersonalFieldError("email");
              }}
              data-testid="profile-email"
              aria-invalid={Boolean(personalFieldErrors.email)}
              aria-describedby={
                personalFieldErrors.email ? "profile-error-email" : undefined
              }
            />
            {personalFieldErrors.email ? (
              <span
                id="profile-error-email"
                className={s.fieldErrorMessage}
                data-testid="profile-error-email"
                role="alert"
              >
                {personalFieldErrors.email}
              </span>
            ) : null}
          </label>

          {Object.keys(personalFieldErrors).length > 0 ? (
            <p
              className={s.validationSummary}
              role="alert"
              data-testid="profile-validation-summary"
            >
              {t("profile.validationSummary")}
            </p>
          ) : null}

          {saveError ? <p className={s.errorText}>{saveError}</p> : null}

          <div className={s.spacer} aria-hidden />

          <p className={s.hintText}>{t("profile.saveHint")}</p>

          <button
            type="submit"
            className={s.primaryBtn}
            disabled={saving}
            data-testid="profile-save-changes"
          >
            {saving ? t("common.saving") : t("common.saveChanges")}
          </button>

          <div className={`${s.passwordBlock} ${s.desktopOnly}`}>
            <h3 className={s.blockTitle}>{t("profile.changePassword")}</h3>
            <label className={s.field}>
              <span>{t("profile.currentPassword")}</span>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </label>
            <label className={s.field}>
              <span>{t("profile.newPassword")}</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label className={s.field}>
              <span>{t("profile.confirmNewPassword")}</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            {passwordError && <p className={s.errorText}>{passwordError}</p>}
            {passwordSuccess && (
              <p className={s.successText}>{t("profile.passwordChanged")}</p>
            )}
            <button
              type="button"
              className={s.secondaryBtn}
              onClick={() => void handleChangePassword()}
              disabled={!canChangePassword || saving || !token}
            >
              {saving ? t("common.saving") : t("profile.changePasswordBtn")}
            </button>
          </div>
        </form>
      )}

      {section === "payments" && (
        <div className={s.section}>
          <h3 className={s.paymentsLabel}>Мои карты</h3>

          <div className={s.cardsBox}>
            {staticCards.map((card) => (
              <div className={s.cardRow} key={card.id}>
                <span className={s.cardLogo}>
                  <Image
                    src={card.logo}
                    alt=""
                    width={card.logoWidth}
                    height={card.logoHeight}
                  />
                </span>
                <span className={s.cardNumber}>
                  <span className={s.cardDots}>&middot; &middot; &middot; &middot;</span>
                  {card.last4}
                </span>
                <span className={s.cardExpiry}>{"09\\12"}</span>
              </div>
            ))}
          </div>

          <button type="button" className={s.outlineBtn} onClick={() => goTo("addCard")}>
            Добавить карту
          </button>

          <h3 className={s.paymentsLabel}>История платежей</h3>

          <div className={s.historyList}>
            {staticHistory.map((item) => (
              <div className={s.historyItem} key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>№{item.reference}</p>
                </div>
                <div className={s.historyPrice}>
                  <strong>{item.amount}</strong>
                  <p>{item.date}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={s.viewAllWrap}>
            <button type="button" className={s.viewAllBtn}>
              Смотреть все
            </button>
          </div>
        </div>
      )}

      {section === "addCard" && (
        <div className={`${s.section} ${s.sectionGrow}`}>
          <div className={s.addCardBox}>
            <div className={s.addCardLogos}>
              <Image src={assets.profile.visa} alt="VISA" width={48} height={16} />
              <Image src={assets.profile.masterCard} alt="Mastercard" width={38} height={25} />
            </div>

            <label className={s.field}>
              <span>Номер карты</span>
              <input
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                className={s.borderedInput}
              />
            </label>

            <div className={s.addCardRow}>
              <label className={s.field}>
                <span>Срок действия</span>
                <input
                  inputMode="numeric"
                  placeholder={t("profile.cardExpiryPlaceholder")}
                  className={s.borderedInput}
                />
              </label>
              <label className={s.field}>
                <span>CVV</span>
                <span className={s.cvvWrap}>
                  <input
                    inputMode="numeric"
                    placeholder="•••"
                    className={s.borderedInput}
                  />
                  <span className={s.cvvInfo} aria-hidden>
                    <InfoIcon />
                  </span>
                </span>
              </label>
            </div>

            <label className={s.field}>
              <span>Имя карты</span>
              <input placeholder={t("common.optional")} className={s.borderedInput} />
            </label>
          </div>

          <div className={s.saveCardRow}>
            <span>Сохранить карту для будущих платежей</span>
            <button
              type="button"
              className={saveCardForFuture ? s.toggleOn : s.toggleOff}
              onClick={() => setSaveCardForFuture((v) => !v)}
              aria-pressed={saveCardForFuture}
              aria-label={t("profile.saveCardAria")}
            >
              <span />
            </button>
          </div>

          <div className={s.spacer} aria-hidden />

          <button type="button" className={s.primaryBtn} onClick={() => goTo("payments")}>
            Добавить карту
          </button>
        </div>
      )}

      {section === "appSettings" && (
        <div className={s.section} data-testid="profile-settings-section">
          <div className={s.settingsCard}>
            <div className={s.iconTile}>
              <Image src={assets.profile.lang} alt="" width={22} height={22} />
            </div>
            <div className={s.settingsCardText}>
              <strong>{t("profile.language")}</strong>
              <p>{t("profile.languageHint")}</p>
            </div>
            <div className={s.langGroup}>
              {langOptions.map((lang) => (
                <button
                  type="button"
                  key={lang.id}
                  className={language === lang.id ? s.langBtnActive : s.langBtn}
                  onClick={() => setLanguage(lang.id)}
                  aria-pressed={language === lang.id}
                  data-testid={`profile-language-${lang.id}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={s.settingsCard}
            onClick={() => goTo("theme")}
            data-testid="profile-menu-theme"
          >
            <div className={s.iconTile}>
              <Image src={assets.profile.lightTheme} alt="" width={22} height={22} />
            </div>
            <div className={s.settingsCardText}>
              <strong>{t("profile.theme")}</strong>
              <p>{t("profile.themeHint")}</p>
            </div>
            <span className={s.navArrowBtn} aria-hidden>
              <Image src={assets.profile.arrow} alt="" width={11} height={11} className={s.arrowRight} />
            </span>
          </button>

          <button
            type="button"
            className={s.settingsCard}
            onClick={() => goTo("notifications")}
            data-testid="profile-menu-notifications"
          >
            <div className={s.iconTile}>
              <MailEditIcon />
            </div>
            <div className={s.settingsCardText}>
              <strong>{t("profile.notifications")}</strong>
              <p>{t("profile.notificationsHint")}</p>
            </div>
            <span className={s.navArrowBtn} aria-hidden>
              <Image src={assets.profile.arrow} alt="" width={11} height={11} className={s.arrowRight} />
            </span>
          </button>

          <div className={s.aboutBlock} data-testid="profile-about-app">
            <Image src={assets.profile.alert} alt="" width={24} height={24} />
            <div>
              <strong>{t("profile.aboutApp")}</strong>
              <p data-testid="profile-app-version">
                {t("profile.version", { version: siteConfig.version })}
              </p>
            </div>
          </div>
        </div>
      )}

      {section === "notifications" && (
        <div className={s.section} data-testid="profile-notifications-section">
          <div className={s.switchList}>
            <SwitchRow
              icon={<Image src={assets.profile.push} alt="" width={22} height={22} />}
              title={t("profile.pushTitle")}
              subtitle={t("profile.pushSubtitle")}
              value={notifications.push}
              onToggle={() => toggleNotification("push")}
              testId="profile-notification-push"
            />
            <SwitchRow
              icon={<Image src={assets.profile.email} alt="" width={22} height={22} />}
              title={t("profile.emailTitle")}
              subtitle={t("profile.emailSubtitle")}
              value={notifications.email}
              onToggle={() => toggleNotification("email")}
              testId="profile-notification-email"
            />
            <SwitchRow
              icon={<MailEditIcon />}
              title={t("profile.bookingReminderTitle")}
              subtitle={t("profile.bookingReminderSubtitle")}
              value={notifications.bookingReminder}
              onToggle={() => toggleNotification("bookingReminder")}
              testId="profile-notification-booking-reminder"
            />
            <SwitchRow
              icon={<Image src={assets.profile.sales} alt="" width={22} height={22} />}
              title={t("profile.promotionsTitle")}
              subtitle={t("profile.promotionsSubtitle")}
              value={notifications.promotions}
              onToggle={() => toggleNotification("promotions")}
              testId="profile-notification-promotions"
            />
          </div>
        </div>
      )}

      {section === "theme" && (
        <div className={s.section} data-testid="profile-theme-section">
          <ThemeOption
            title={t("profile.lightTheme")}
            description={t("profile.lightThemeDesc")}
            icon={assets.profile.lightTheme}
            selected={theme === "light"}
            onSelect={() => setTheme("light")}
            testId="profile-theme-light"
          />
          <ThemeOption
            title={t("profile.darkTheme")}
            description={t("profile.darkThemeDesc")}
            icon={assets.profile.nightTheme}
            selected={theme === "dark"}
            onSelect={() => setTheme("dark")}
            testId="profile-theme-dark"
          />

          <div className={s.themePreviewCard}>
            <ThemePreviewGraphic />
          </div>
        </div>
      )}

      {section === "logout" && (
        <div
          className={`${s.logoutSection} ${s.sectionGrow}`}
          data-testid="profile-logout-section"
        >
          <div className={s.spacer} aria-hidden />
          <DoorIllustration />
          <p className={s.logoutTitle}>{t("profile.logoutConfirm")}</p>
          <small>{t("profile.logoutHint")}</small>
          <div className={s.spacer} aria-hidden />
          <div className={s.spacer} aria-hidden />
          <button
            type="button"
            className={s.logoutConfirmBtn}
            onClick={handleLogout}
            data-testid="profile-logout-confirm"
          >
            <span className={s.iconTileRed}>
              <Image src={assets.profile.quit} alt="" width={16} height={20} />
            </span>
            {t("profile.logout")}
          </button>
          <button
            type="button"
            className={s.cancelBtn}
            onClick={() => goTo("main")}
            data-testid="profile-logout-cancel"
          >
            {t("common.cancel")}
          </button>
          {token && (
            <button
              type="button"
              className={`${s.deleteAccountBtn} ${s.desktopOnly}`}
              onClick={() => void handleDeleteAccount()}
              disabled={deleting}
            >
              {deleting ? t("common.deleting") : t("profile.deleteAccount")}
            </button>
          )}
        </div>
      )}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className={s.hiddenFileInput}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) await handleAvatarUpload(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function SectionHeader({
  title,
  onBack,
  mobileOnly,
}: {
  title: string;
  onBack: () => void;
  mobileOnly?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className={mobileOnly ? `${s.sectionHead} ${s.mobileOnly}` : s.sectionHead}>
      <button type="button" className={s.backBtn} onClick={onBack} aria-label={t("common.back")}>
        <svg width="18" height="16" viewBox="0 0 18 16" fill="none" aria-hidden>
          <path
            d="M8 1.5 1.5 8 8 14.5M2 8h15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <h2>{title}</h2>
    </div>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
  onClick,
  testId,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button type="button" className={s.menuItem} onClick={onClick} data-testid={testId}>
      <span className={s.iconTile}>
        <Image src={icon} alt="" width={24} height={24} />
      </span>
      <div className={s.menuText}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <span className={s.navArrowBtn} aria-hidden>
        <Image src={assets.profile.arrow} alt="" width={11} height={11} className={s.arrowRight} />
      </span>
    </button>
  );
}

function SwitchRow({
  icon,
  title,
  subtitle,
  value,
  onToggle,
  testId,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  testId?: string;
}) {
  return (
    <div className={s.switchRow}>
      <span className={s.iconTile}>{icon}</span>
      <div className={s.switchText}>
        <strong>{title}</strong>
        <p>{subtitle}</p>
      </div>
      <button
        type="button"
        className={value ? s.toggleOn : s.toggleOff}
        onClick={onToggle}
        aria-pressed={value}
        aria-label={title}
        data-testid={testId}
      >
        <span />
      </button>
    </div>
  );
}

function ThemeOption({
  title,
  description,
  icon,
  selected,
  onSelect,
  testId,
}: {
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onSelect: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      className={s.themeOption}
      onClick={onSelect}
      aria-pressed={selected}
      data-testid={testId}
    >
      <div className={s.iconTile}>
        <Image src={icon} alt="" width={22} height={22} />
      </div>
      <div className={s.themeOptionText}>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <span className={selected ? s.radioActive : s.radio} aria-hidden />
    </button>
  );
}

function MailEditIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 11V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6"
        stroke="#0A6AF7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m3.5 7 8.5 6 8.5-6"
        stroke="#0A6AF7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m19.6 13.2 1.7 1.7-5.2 5.2-2.3.6.6-2.3 5.2-5.2Z"
        stroke="#0A6AF7"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="8.2" stroke="#9db4e8" strokeWidth="1.6" />
      <path
        d="M10 9v4.5"
        stroke="#9db4e8"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="10" cy="6.3" r="1" fill="#9db4e8" />
    </svg>
  );
}

function DoorIllustration() {
  return (
    <svg
      width="188"
      height="152"
      viewBox="0 0 220 170"
      fill="none"
      className={s.logoutImage}
      aria-hidden
    >
      <path
        d="M120 18h32a8 8 0 0 1 8 8v118a8 8 0 0 1-8 8h-32"
        stroke="#9aa2b1"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M62 14c0-2.5 2.3-4.3 4.7-3.7l52 12.4a5 5 0 0 1 3.8 4.9v114.8a5 5 0 0 1-3.8 4.9l-52 12.4c-2.4.6-4.7-1.2-4.7-3.7V14Z"
        fill="#98a1ad"
      />
      <ellipse cx="72.5" cy="85" rx="3.6" ry="8" fill="#5f6875" />
      <path
        d="M132 85h48"
        stroke="#9aa2b1"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="m166 70 15 15-15 15"
        stroke="#9aa2b1"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThemePreviewGraphic() {
  const lightRows = [22, 46, 70, 94, 118, 142];

  return (
    <svg viewBox="0 0 288 168" fill="none" className={s.themePreviewSvg} aria-hidden>
      {/* Light mini layout */}
      <rect x="1" y="1" width="286" height="166" rx="14" fill="#ffffff" stroke="#eceef6" strokeWidth="2" />
      {lightRows.map((y) => (
        <g key={`l-${y}`}>
          <circle cx="22" cy={y + 4} r="3.5" fill="#dfe3ee" />
          <rect x="32" y={y} width="38" height="8" rx="4" fill="#e8eaf1" />
          <rect x="84" y={y} width="9" height="9" rx="2" fill="#0a6af7" />
          <rect x="99" y={y} width="46" height="8" rx="4" fill="#e8eaf1" />
        </g>
      ))}
      {/* Dark mini layout */}
      <rect x="150" y="0" width="138" height="168" rx="14" fill="#17181c" />
      {lightRows.map((y) => (
        <g key={`d-${y}`}>
          <circle cx="168" cy={y + 4} r="3.5" fill="#33363e" />
          <rect x="178" y={y} width="26" height="8" rx="4" fill="#2c2f36" />
          <rect x="214" y={y} width="9" height="9" rx="2" fill="#0a6af7" />
          <rect x="229" y={y} width="44" height="8" rx="4" fill="#2c2f36" />
        </g>
      ))}
    </svg>
  );
}
