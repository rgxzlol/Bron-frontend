"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import { formatPrice } from "@/lib/formatPrice";
import { readImageFile } from "@/lib/readImageFile";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";
import {
  type ProfileLanguage,
  type ProfileTheme,
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

const sectionTitles: Record<ProfileSection, string> = {
  main: "Настройки профиля",
  personal: "Личные данные",
  payments: "Платежи",
  appSettings: "Настройки",
  notifications: "Уведомления",
  theme: "Тема",
  logout: "Выйти из аккаунта",
};

export default function ProfilePageContent({
  onClose,
  onSectionChange,
}: ProfilePageContentProps) {
  const router = useRouter();
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
        error instanceof ApiError
          ? error.message
          : "Не удалось сохранить данные",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
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
        error instanceof ApiError
          ? error.message
          : "Не удалось сменить пароль",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Удалить аккаунт без возможности восстановления?")) return;

    setDeleting(true);

    try {
      await deleteAccountFromApi();
      clearToken();
      onClose?.();
      router.push(routes.home);
    } catch (error) {
      alert(
        error instanceof ApiError
          ? error.message
          : "Не удалось удалить аккаунт",
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
                aria-label="Изменить фото"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Image src={assets.profile.camera} alt="" width={16} height={16} />
              </button>
            </div>

            <div className={s.headInfo}>
              <div className={s.nameRow}>
                <h2>{fullName}</h2>
                <button type="button" onClick={() => goTo("personal")} aria-label="Редактировать">
                  <Image src={assets.profile.edit} alt="" width={18} height={18} />
                </button>
              </div>
              <p>{phone}</p>
            </div>
          </div>

          <div className={s.menu}>
            <MenuItem
              icon={assets.profile.profileData}
              title="Персональные данные"
              subtitle="Редактирование данных"
              onClick={() => goTo("personal")}
            />
            <MenuItem
              icon={assets.profile.myBookings}
              title="Мои брони"
              subtitle="Все ваши брони"
              onClick={handleBookingsClick}
            />
            <MenuItem
              icon={assets.profile.card}
              title="Платежи"
              subtitle="История транзакций"
              onClick={() => goTo("payments")}
            />
            <MenuItem
              icon={assets.profile.settings}
              title="Настройки"
              subtitle="Язык и тема"
              onClick={() => goTo("appSettings")}
            />
          </div>

          <button type="button" className={s.logoutBtn} onClick={() => goTo("logout")}>
            <Image src={assets.profile.quit} alt="" width={17} height={21} />
            Выйти из аккаунта
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
                aria-label="Изменить фото"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Image src={assets.profile.camera} alt="" width={18} height={18} />
              </button>
            </div>
          </div>

          <label className={s.field}>
            <span>Имя пользователя</span>
            <input value={fullName} readOnly className={s.readOnlyInput} />
          </label>
          <label className={s.field}>
            <span>Номер телефона</span>
            <input value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} />
          </label>
          <label className={s.field}>
            <span>Электронная почта</span>
            <input value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
          </label>

          {saveError && <p className={s.errorText}>{saveError}</p>}

          <button
            type="button"
            className={s.primaryBtn}
            onClick={() => void handleSavePersonalInfo()}
            disabled={!isPersonalDirty || saving}
          >
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </button>

          <div className={s.passwordBlock}>
            <h3 className={s.blockTitle}>Смена пароля</h3>
            <label className={s.field}>
              <span>Текущий пароль</span>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </label>
            <label className={s.field}>
              <span>Новый пароль</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label className={s.field}>
              <span>Повторите новый пароль</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            {passwordError && <p className={s.errorText}>{passwordError}</p>}
            {passwordSuccess && (
              <p className={s.successText}>Пароль успешно изменён</p>
            )}
            <button
              type="button"
              className={s.secondaryBtn}
              onClick={() => void handleChangePassword()}
              disabled={!canChangePassword || saving || !token}
            >
              {saving ? "Сохранение..." : "Сменить пароль"}
            </button>
          </div>
        </div>
      )}

      {section === "payments" && (
        <div className={s.section}>
          <div className={s.historyBlock}>
            <h3 className={s.blockTitle}>История платежей</h3>
            <div className={s.historyList}>
              {visibleHistory.map((item) => (
                <div className={s.historyItem} key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>№{item.reference}</p>
                  </div>
                  <div className={s.historyPrice}>
                    <strong>{formatPrice(item.amount)} сум</strong>
                    <p>{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
            {!showAllHistory && paymentHistory.length > 2 && (
              <button type="button" className={s.viewAllBtn} onClick={() => setShowAllHistory(true)}>
                Смотреть все
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
              <strong>Язык</strong>
              <p>Выберите удобный язык</p>
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
              <strong>Тема</strong>
              <p>Можно выбрать любую тему</p>
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
              <strong>Уведомления</strong>
              <p>Настройте, какие уведомления вы хотите получать</p>
            </div>
            <span className={s.navArrowBtn} aria-hidden>
              <Image src={assets.profile.arrow} alt="" width={12} height={12} className={s.arrowRight} />
            </span>
          </button>

          <div className={s.aboutBlock}>
            <Image src={assets.profile.alert} alt="" width={24} height={24} />
            <div>
              <strong>О приложении</strong>
              <p>Версия 1.0.0</p>
            </div>
          </div>
        </div>
      )}

      {section === "notifications" && (
        <div className={s.section}>
          <div className={s.switchList}>
            <SwitchRow
              icon={assets.profile.push}
              title="Push-уведомления"
              subtitle="Получать push-уведомления"
              value={notifications.push}
              onToggle={() => toggleNotification("push")}
            />
            <SwitchRow
              icon={assets.profile.email}
              title="Email уведомления"
              subtitle="Получать письма на Email"
              value={notifications.email}
              onToggle={() => toggleNotification("email")}
            />
            <SwitchRow
              icon={assets.profile.booking}
              title="Напоминать о брони"
              subtitle="Уведомлять о будущих визитах"
              value={notifications.bookingReminder}
              onToggle={() => toggleNotification("bookingReminder")}
            />
            <SwitchRow
              icon={assets.profile.sales}
              title="Акции и предложения"
              subtitle="Получать акции и новости"
              value={notifications.promotions}
              onToggle={() => toggleNotification("promotions")}
            />
          </div>
        </div>
      )}

      {section === "theme" && (
        <div className={s.section}>
          <ThemeOption
            title="Светлая тема"
            description="Светлый интерфейс приложения"
            icon={assets.profile.lightTheme}
            selected={theme === "light"}
            onSelect={() => setTheme("light")}
          />
          <ThemeOption
            title="Темная тема"
            description="Темный интерфейс приложения"
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
          <p className={s.logoutTitle}>Вы уверены что хотите выйти из аккаунта?</p>
          <small>Вы выйдете из аккаунта с этого устройства</small>
          <button type="button" className={s.logoutConfirmBtn} onClick={handleLogout}>
            <span className={s.logoutConfirmIcon}>
              <Image src={assets.profile.quit} alt="" width={18} height={18} />
            </span>
            Выйти из аккаунта
          </button>
          <button type="button" className={s.cancelBtn} onClick={() => goTo("main")}>
            Отменить
          </button>
          {token && (
            <button
              type="button"
              className={s.deleteAccountBtn}
              onClick={() => void handleDeleteAccount()}
              disabled={deleting}
            >
              {deleting ? "Удаление..." : "Удалить аккаунт"}
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

function SectionHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className={s.sectionHead}>
      <button type="button" className={s.backBtn} onClick={onBack} aria-label="Назад">
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
