"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import { formatPrice } from "@/lib/formatPrice";
import { readImageFile } from "@/lib/readImageFile";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { PAYMENT_TITLE_KEYS, translateErrorMessage, translateLabel } from "@/lib/i18n/labels";
import { formatDateRu } from "@/lib/formatDate";
import { useAuthStore } from "@/store/auth.store";
import {
  type ProfileLanguage,
  useProfileStore,
} from "@/store/profile.store";
import s from "./profilePage.module.css";

type ProfileSection =
  | "main"
  | "personal"
  | "payments"
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

export default function ProfilePageContent({
  onClose,
  onSectionChange,
}: ProfilePageContentProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const clearToken = useAuthStore((state) => state.clearToken);
  const {
    fullName,
    phone,
    email,
    avatarUrl,
    language,
    theme,
    notifications,
    paymentHistory,
    setAvatarUrl,
    setLanguage,
    setTheme,
    toggleNotification,
    hydrateFromApi,
    savePersonalInfoToApi,
    changePasswordToApi,
    deleteAccountFromApi,
  } = useProfileStore();

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [section, setSection] = useState<ProfileSection>("main");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [phoneDraft, setPhoneDraft] = useState(phone);
  const [emailDraft, setEmailDraft] = useState(email);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const sectionTitles: Record<ProfileSection, string> = {
    main: t("profile.sectionMain"),
    personal: t("profile.sectionPersonal"),
    payments: t("profile.sectionPayments"),
    appSettings: t("profile.sectionAppSettings"),
    notifications: t("profile.sectionNotifications"),
    theme: t("profile.sectionTheme"),
    logout: t("profile.sectionLogout"),
  };

  useEffect(() => {
    if (token) {
      void hydrateFromApi();
    }
  }, [token, hydrateFromApi]);

  useEffect(() => {
    onSectionChange?.(section);
  }, [section, onSectionChange]);

  useEffect(() => {
    setPhoneDraft(phone);
    setEmailDraft(email);
  }, [phone, email]);

  const isPersonalDirty = useMemo(
    () => phoneDraft.trim() !== phone || emailDraft.trim() !== email,
    [phoneDraft, phone, emailDraft, email],
  );

  const canChangePassword =
    oldPassword.trim().length > 0 &&
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0;

  const visibleHistory = showAllHistory ? paymentHistory : paymentHistory.slice(0, 2);

  function goTo(next: ProfileSection) {
    setSection(next);
  }

  async function handleSavePersonalInfo() {
    if (!phoneDraft.trim() || !emailDraft.trim()) return;

    setSaving(true);
    setSaveError(null);

    try {
      await savePersonalInfoToApi({
        phone: phoneDraft,
        email: emailDraft,
      });
      goTo("main");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? translateErrorMessage(t, error.message)
          : t("profile.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setPasswordError(t("profile.passwordMismatch"));
      return;
    }

    setSaving(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await changePasswordToApi({
        oldPassword,
        newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? translateErrorMessage(t, error.message)
          : t("profile.passwordChangeFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm(t("profile.deleteAccountConfirm"))) return;

    setDeleting(true);

    try {
      await deleteAccountFromApi();
      clearToken();
      onClose?.();
      router.push(routes.home);
    } catch (error) {
      alert(
        error instanceof Error
          ? translateErrorMessage(t, error.message)
          : t("profile.deleteFailed"),
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleLogout() {
    clearToken();
    onClose?.();
    router.push(routes.home);
  }

  function handleBookingsClick() {
    onClose?.();
    router.push(routes.bookings);
  }

  async function handleAvatarUpload(file: File) {
    const url = await readImageFile(file);
    if (url) setAvatarUrl(url);
  }

  function getBackSection(current: ProfileSection): ProfileSection {
    if (current === "theme" || current === "notifications") return "appSettings";
    return "main";
  }

  return (
    <div className={s.content}>
      {section !== "main" && (
        <SectionHeader
          title={sectionTitles[section]}
          onBack={() => goTo(getBackSection(section))}
          backLabel={t("common.back")}
        />
      )}

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
                  width={88}
                  height={88}
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

            <div className={s.headInfo}>
              <div className={s.nameRow}>
                <h2>{fullName}</h2>
                <button type="button" onClick={() => goTo("personal")} aria-label={t("common.edit")}>
                  <Image src={assets.profile.edit} alt="" width={18} height={18} />
                </button>
              </div>
              <p>{phone}</p>
            </div>
          </div>

          <div className={s.menu}>
            <MenuItem
              icon={assets.profile.profileData}
              title={t("profile.personalData")}
              subtitle={t("profile.personalDataSubtitle")}
              onClick={() => goTo("personal")}
            />
            <MenuItem
              icon={assets.profile.myBookings}
              title={t("profile.myBookings")}
              subtitle={t("profile.myBookingsSubtitle")}
              onClick={handleBookingsClick}
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
            />
          </div>

          <button type="button" className={s.logoutBtn} onClick={() => goTo("logout")}>
            <Image src={assets.profile.quit} alt="" width={17} height={21} />
            {t("profile.logout")}
          </button>
        </div>
      )}

      {section === "personal" && (
        <div className={s.section}>
          <div className={s.avatarBlock}>
            <div className={s.avatarWrapLarge}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className={s.avatarImageLarge} />
              ) : (
                <Image
                  src={assets.profile.avatar}
                  alt=""
                  width={120}
                  height={120}
                  className={s.avatarImageLarge}
                />
              )}
              <button
                type="button"
                className={s.cameraBtnLarge}
                aria-label={t("profile.changePhoto")}
                onClick={() => avatarInputRef.current?.click()}
              >
                <Image src={assets.profile.camera} alt="" width={18} height={18} />
              </button>
            </div>
          </div>

          <label className={s.field}>
            <span>{t("profile.username")}</span>
            <input value={fullName} readOnly className={s.readOnlyInput} />
          </label>
          <label className={s.field}>
            <span>{t("profile.phone")}</span>
            <input value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} />
          </label>
          <label className={s.field}>
            <span>{t("profile.email")}</span>
            <input value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
          </label>

          {saveError && <p className={s.errorText}>{saveError}</p>}

          <button
            type="button"
            className={s.primaryBtn}
            onClick={() => void handleSavePersonalInfo()}
            disabled={!isPersonalDirty || saving}
          >
            {saving ? t("common.saving") : t("common.saveChanges")}
          </button>

          <div className={s.passwordBlock}>
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
        </div>
      )}

      {section === "payments" && (
        <div className={s.section}>
          <div className={s.historyBlock}>
            <h3 className={s.blockTitle}>{t("profile.paymentHistory")}</h3>
            <div className={s.historyList}>
              {visibleHistory.map((item) => (
                <div className={s.historyItem} key={item.id}>
                  <div>
                    <strong>
                      {translateLabel(t, item.title, PAYMENT_TITLE_KEYS)}
                    </strong>
                    <p>№{item.reference}</p>
                  </div>
                  <div className={s.historyPrice}>
                    <strong>
                      {formatPrice(item.amount, locale)} {t("common.sum")}
                    </strong>
                    <p>
                      {/^\d{4}-\d{2}-\d{2}/.test(item.date)
                        ? formatDateRu(new Date(`${item.date}T12:00:00`), locale)
                        : item.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {!showAllHistory && paymentHistory.length > 2 && (
              <button type="button" className={s.viewAllBtn} onClick={() => setShowAllHistory(true)}>
                {t("common.viewAll")}
              </button>
            )}
          </div>
        </div>
      )}

      {section === "appSettings" && (
        <div className={s.section}>
          <div className={s.settingsCard}>
            <div className={s.settingsIconWrap}>
              <Image src={assets.profile.lang} alt="" width={20} height={20} />
            </div>
            <div className={s.settingsCardText}>
              <strong>{t("profile.language")}</strong>
              <p>{t("profile.languageHint")}</p>
            </div>
            <div className={s.segment}>
              {langOptions.map((lang) => (
                <button
                  type="button"
                  key={lang.id}
                  className={language === lang.id ? s.segmentActive : s.segmentBtn}
                  onClick={() => setLanguage(lang.id)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className={s.settingsCard} onClick={() => goTo("theme")}>
            <div className={s.settingsIconWrap}>
              <Image src={assets.profile.lightTheme} alt="" width={20} height={20} />
            </div>
            <div className={s.settingsCardText}>
              <strong>{t("profile.theme")}</strong>
              <p>{t("profile.themeHint")}</p>
            </div>
            <span className={s.navArrowBtn} aria-hidden>
              <Image src={assets.profile.arrow} alt="" width={12} height={12} className={s.arrowRight} />
            </span>
          </button>

          <button type="button" className={s.settingsCard} onClick={() => goTo("notifications")}>
            <div className={s.settingsIconWrap}>
              <Image src={assets.header.notification} alt="" width={20} height={20} />
            </div>
            <div className={s.settingsCardText}>
              <strong>{t("profile.notifications")}</strong>
              <p>{t("profile.notificationsHint")}</p>
            </div>
            <span className={s.navArrowBtn} aria-hidden>
              <Image src={assets.profile.arrow} alt="" width={12} height={12} className={s.arrowRight} />
            </span>
          </button>

          <div className={s.aboutBlock}>
            <Image src={assets.profile.alert} alt="" width={24} height={24} />
            <div>
              <strong>{t("profile.aboutApp")}</strong>
              <p>{t("profile.version", { version: "1.0.0" })}</p>
            </div>
          </div>
        </div>
      )}

      {section === "notifications" && (
        <div className={s.section}>
          <div className={s.switchList}>
            <SwitchRow
              icon={assets.profile.push}
              title={t("profile.pushTitle")}
              subtitle={t("profile.pushSubtitle")}
              value={notifications.push}
              onToggle={() => toggleNotification("push")}
            />
            <SwitchRow
              icon={assets.profile.email}
              title={t("profile.emailTitle")}
              subtitle={t("profile.emailSubtitle")}
              value={notifications.email}
              onToggle={() => toggleNotification("email")}
            />
            <SwitchRow
              icon={assets.profile.booking}
              title={t("profile.bookingReminderTitle")}
              subtitle={t("profile.bookingReminderSubtitle")}
              value={notifications.bookingReminder}
              onToggle={() => toggleNotification("bookingReminder")}
            />
            <SwitchRow
              icon={assets.profile.sales}
              title={t("profile.promotionsTitle")}
              subtitle={t("profile.promotionsSubtitle")}
              value={notifications.promotions}
              onToggle={() => toggleNotification("promotions")}
            />
          </div>
        </div>
      )}

      {section === "theme" && (
        <div className={s.section}>
          <ThemeOption
            title={t("profile.lightTheme")}
            description={t("profile.lightThemeDesc")}
            icon={assets.profile.lightTheme}
            selected={theme === "light"}
            onSelect={() => setTheme("light")}
          />
          <ThemeOption
            title={t("profile.darkTheme")}
            description={t("profile.darkThemeDesc")}
            icon={assets.profile.nightTheme}
            selected={theme === "dark"}
            onSelect={() => setTheme("dark")}
          />

          <div className={s.themePreviewWrap}>
            <Image
              src={assets.profile.lightThemePreview}
              alt=""
              width={220}
              height={160}
              className={s.themePreviewLight}
            />
            <Image
              src={assets.profile.nightThemePreview}
              alt=""
              width={220}
              height={160}
              className={s.themePreviewDark}
            />
          </div>
        </div>
      )}

      {section === "logout" && (
        <div className={s.logoutSection}>
          <Image
            src={assets.profile.quitIllustration}
            alt=""
            width={200}
            height={160}
            className={s.logoutImage}
          />
          <p className={s.logoutTitle}>{t("profile.logoutConfirm")}</p>
          <small>{t("profile.logoutHint")}</small>
          <button type="button" className={s.logoutConfirmBtn} onClick={handleLogout}>
            <span className={s.logoutConfirmIcon}>
              <Image src={assets.profile.quit} alt="" width={18} height={18} />
            </span>
            {t("profile.logout")}
          </button>
          <button type="button" className={s.cancelBtn} onClick={() => goTo("main")}>
            {t("common.cancel")}
          </button>
          {token && (
            <button
              type="button"
              className={s.deleteAccountBtn}
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
  backLabel,
}: {
  title: string;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <div className={s.sectionHead}>
      <button type="button" className={s.backBtn} onClick={onBack} aria-label={backLabel}>
        <Image src={assets.profile.arrow} alt="" width={14} height={14} className={s.arrowLeft} />
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
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={s.menuItem} onClick={onClick}>
      <Image src={icon} alt="" width={24} height={24} />
      <div className={s.menuText}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <Image src={assets.profile.arrow} alt="" width={12} height={12} className={s.arrowRight} />
    </button>
  );
}

function SwitchRow({
  icon,
  title,
  subtitle,
  value,
  onToggle,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={s.switchRow}>
      <Image src={icon} alt="" width={24} height={24} />
      <div className={s.switchText}>
        <strong>{title}</strong>
        <p>{subtitle}</p>
      </div>
      <button
        type="button"
        className={value ? s.toggleOn : s.toggleOff}
        onClick={onToggle}
        aria-pressed={value}
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
}: {
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" className={s.themeOption} onClick={onSelect}>
      <div className={s.settingsIconWrap}>
        <Image src={icon} alt="" width={20} height={20} />
      </div>
      <div className={s.themeOptionText}>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <span className={selected ? s.radioActive : s.radio} aria-hidden />
    </button>
  );
}
