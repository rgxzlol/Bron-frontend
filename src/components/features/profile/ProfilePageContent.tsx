"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import { readImageFile } from "@/lib/readImageFile";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";
import { type ProfileLanguage, useProfileStore } from "@/store/profile.store";
import { useToastStore } from "@/store/toast.store";
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

const sectionTitles: Record<ProfileSection, string> = {
  main: "Настройки профиля",
  personal: "Персональные данные",
  payments: "Платежи",
  addCard: "Добавить карту",
  appSettings: "Настройки",
  notifications: "Уведомления",
  theme: "Тема",
  logout: "Выйти из аккаунта",
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
    updatePersonalInfo,
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveCardForFuture, setSaveCardForFuture] = useState(true);

  const [nameDraft, setNameDraft] = useState(fullName ?? "");
  const [phoneDraft, setPhoneDraft] = useState(phone ?? "");
  const [emailDraft, setEmailDraft] = useState(email ?? "");
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
    setNameDraft(fullName ?? "");
    setPhoneDraft(phone ?? "");
    setEmailDraft(email ?? "");
  }, [fullName, phone, email]);

  const isPersonalDirty = useMemo(
    () =>
      (nameDraft ?? "").trim() !== (fullName ?? "") ||
      (phoneDraft ?? "").trim() !== (phone ?? "") ||
      (emailDraft ?? "").trim() !== (email ?? ""),
    [nameDraft, fullName, phoneDraft, phone, emailDraft, email],
  );

  const canChangePassword =
    oldPassword.trim().length > 0 &&
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0;

  function goTo(next: ProfileSection) {
    setSection(next);
  }

  async function handleSavePersonalInfo() {
    if (!nameDraft.trim() || !phoneDraft.trim() || !emailDraft.trim()) return;

    setSaving(true);
    setSaveError(null);

    updatePersonalInfo({
      fullName: nameDraft,
      phone: phoneDraft,
      email: emailDraft,
    });

    try {
      await savePersonalInfoToApi({
        phone: phoneDraft,
        email: emailDraft,
      });
      showToast("Профиль обновлен", "Изменения успешно сохранены.");
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
    if (current === "addCard") return "payments";
    return "main";
  }

  return (
    <div className={s.content}>
      <SectionHeader
        title={sectionTitles[section]}
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
                aria-label="Изменить фото"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Image src={assets.profile.camera} alt="" width={16} height={16} />
              </button>
            </div>

            <div className={s.nameRow}>
              <h2>{fullName}</h2>
              <button type="button" onClick={() => goTo("personal")} aria-label="Редактировать">
                <Image src={assets.profile.edit} alt="" width={16} height={15} />
              </button>
            </div>
            <p className={s.phoneText}>{phone}</p>
          </div>

          <div className={s.menu}>
            <MenuItem
              icon={assets.profile.profileData}
              title="Персональная информация"
              subtitle="Просмотр и редактирование данных"
              onClick={() => goTo("personal")}
            />
            <MenuItem
              icon={assets.profile.myBookings}
              title="Мои брони"
              subtitle="История и статус ваших броней"
              onClick={handleBookingsClick}
            />
            <MenuItem
              icon={assets.profile.card}
              title="Платежи"
              subtitle="Способ оплаты и история платежей"
              onClick={() => goTo("payments")}
            />
            <MenuItem
              icon={assets.profile.settings}
              title="Настройки"
              subtitle="Язык, тема, уведомления"
              onClick={() => goTo("appSettings")}
            />
          </div>

          <button type="button" className={s.logoutRow} onClick={() => goTo("logout")}>
            <span className={s.iconTileRed}>
              <Image src={assets.profile.quit} alt="" width={17} height={21} />
            </span>
            Выйти из аккаунта
          </button>
        </div>
      )}

      {section === "personal" && (
        <div className={`${s.section} ${s.sectionGrow}`}>
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
                aria-label="Изменить фото"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Image src={assets.profile.camera} alt="" width={16} height={16} />
              </button>
            </div>
          </div>

          <label className={s.field}>
            <span>Имя</span>
            <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
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

          <div className={s.spacer} aria-hidden />

          <p className={s.hintText}>Измените свои данные и нажмите сохранить</p>

          <button
            type="button"
            className={s.primaryBtn}
            onClick={() => void handleSavePersonalInfo()}
            disabled={!isPersonalDirty || saving}
          >
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </button>

          <div className={`${s.passwordBlock} ${s.desktopOnly}`}>
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
                  placeholder={"ММ\\ ГГ"}
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
              <input placeholder="Необязательно" className={s.borderedInput} />
            </label>
          </div>

          <div className={s.saveCardRow}>
            <span>Сохранить карту для будущих платежей</span>
            <button
              type="button"
              className={saveCardForFuture ? s.toggleOn : s.toggleOff}
              onClick={() => setSaveCardForFuture((v) => !v)}
              aria-pressed={saveCardForFuture}
              aria-label="Сохранить карту для будущих платежей"
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
        <div className={s.section}>
          <div className={s.settingsCard}>
            <div className={s.iconTile}>
              <Image src={assets.profile.lang} alt="" width={22} height={22} />
            </div>
            <div className={s.settingsCardText}>
              <strong>Язык</strong>
              <p>Выберите удобный язык</p>
            </div>
            <div className={s.langGroup}>
              {langOptions.map((lang) => (
                <button
                  type="button"
                  key={lang.id}
                  className={language === lang.id ? s.langBtnActive : s.langBtn}
                  onClick={() => setLanguage(lang.id)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className={s.settingsCard} onClick={() => goTo("theme")}>
            <div className={s.iconTile}>
              <Image src={assets.profile.lightTheme} alt="" width={22} height={22} />
            </div>
            <div className={s.settingsCardText}>
              <strong>Тема</strong>
              <p>Можно выбрать любую тему</p>
            </div>
            <span className={s.navArrowBtn} aria-hidden>
              <Image src={assets.profile.arrow} alt="" width={11} height={11} className={s.arrowRight} />
            </span>
          </button>

          <button type="button" className={s.settingsCard} onClick={() => goTo("notifications")}>
            <div className={s.iconTile}>
              <MailEditIcon />
            </div>
            <div className={s.settingsCardText}>
              <strong>Уведомления</strong>
              <p>Настройте, какие уведомления вы хотите получать</p>
            </div>
            <span className={s.navArrowBtn} aria-hidden>
              <Image src={assets.profile.arrow} alt="" width={11} height={11} className={s.arrowRight} />
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
              icon={<Image src={assets.profile.push} alt="" width={22} height={22} />}
              title="Push-уведомления"
              subtitle="Получить push-уведомления"
              value={notifications.push}
              onToggle={() => toggleNotification("push")}
            />
            <SwitchRow
              icon={<Image src={assets.profile.email} alt="" width={22} height={22} />}
              title="Email уведомления"
              subtitle="Получать письма на Email"
              value={notifications.email}
              onToggle={() => toggleNotification("email")}
            />
            <SwitchRow
              icon={<MailEditIcon />}
              title="Напоминать о брони"
              subtitle="Напоминать о бронированиях"
              value={notifications.bookingReminder}
              onToggle={() => toggleNotification("bookingReminder")}
            />
            <SwitchRow
              icon={<Image src={assets.profile.sales} alt="" width={22} height={22} />}
              title="Акция и предложения"
              subtitle="Получать информацию об акциях"
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

          <div className={s.themePreviewCard}>
            <ThemePreviewGraphic />
          </div>
        </div>
      )}

      {section === "logout" && (
        <div className={`${s.logoutSection} ${s.sectionGrow}`}>
          <div className={s.spacer} aria-hidden />
          <DoorIllustration />
          <p className={s.logoutTitle}>Вы уверены что хотите выйти из аккаунта?</p>
          <small>Вы выйдете из аккаунта с этого устройства</small>
          <div className={s.spacer} aria-hidden />
          <div className={s.spacer} aria-hidden />
          <button type="button" className={s.logoutConfirmBtn} onClick={handleLogout}>
            <span className={s.iconTileRed}>
              <Image src={assets.profile.quit} alt="" width={16} height={20} />
            </span>
            Выйти из аккаунта
          </button>
          <button type="button" className={s.cancelBtn} onClick={() => goTo("main")}>
            Отменить
          </button>
          {token && (
            <button
              type="button"
              className={`${s.deleteAccountBtn} ${s.desktopOnly}`}
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

function SectionHeader({
  title,
  onBack,
  mobileOnly,
}: {
  title: string;
  onBack: () => void;
  mobileOnly?: boolean;
}) {
  return (
    <div className={mobileOnly ? `${s.sectionHead} ${s.mobileOnly}` : s.sectionHead}>
      <button type="button" className={s.backBtn} onClick={onBack} aria-label="Назад">
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
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={s.menuItem} onClick={onClick}>
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
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
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
