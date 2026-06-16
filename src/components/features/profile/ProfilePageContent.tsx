"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { formatPrice } from "@/lib/formatPrice";
import { useAuthStore } from "@/store/auth.store";
import {
  type ProfileLanguage,
  useProfileStore,
} from "@/store/profile.store";
import s from "./profilePage.module.css";

type ProfileSection =
  | "settings"
  | "personal"
  | "notifications"
  | "payments"
  | "theme"
  | "logout";

const langMap: Record<ProfileLanguage, string> = {
  ru: "RU",
  uz: "UZ",
  en: "EN",
};

export default function ProfilePageContent() {
  const clearToken = useAuthStore((state) => state.clearToken);
  const {
    fullName,
    phone,
    email,
    language,
    theme,
    notifications,
    cards,
    paymentHistory,
    updatePersonalInfo,
    setLanguage,
    setTheme,
    toggleNotification,
    addCard,
    removeCard,
  } = useProfileStore();

  const [section, setSection] = useState<ProfileSection>("settings");
  const [showAddCardForm, setShowAddCardForm] = useState(false);

  const [nameDraft, setNameDraft] = useState(fullName);
  const [phoneDraft, setPhoneDraft] = useState(phone);
  const [emailDraft, setEmailDraft] = useState(email);

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [saveCard, setSaveCard] = useState(true);

  const isPersonalDirty = useMemo(
    () =>
      nameDraft.trim() !== fullName ||
      phoneDraft.trim() !== phone ||
      emailDraft.trim() !== email,
    [nameDraft, fullName, phoneDraft, phone, emailDraft, email],
  );

  function handleSavePersonalInfo() {
    if (!nameDraft.trim() || !phoneDraft.trim() || !emailDraft.trim()) return;
    updatePersonalInfo({
      fullName: nameDraft,
      phone: phoneDraft,
      email: emailDraft,
    });
  }

  function handleAddCard() {
    const cardDigits = cardNumber.replace(/\D/g, "");
    if (!cardHolder.trim() || cardDigits.length < 16 || !cardExpiry.trim()) return;
    addCard({
      holder: cardHolder,
      number: cardDigits,
      expiresAt: cardExpiry,
    });
    setCardNumber("");
    setCardExpiry("");
    setCardHolder("");
    setShowAddCardForm(false);
    if (!saveCard && cards.length === 0) {
      setSaveCard(true);
    }
  }

  function handleLogout() {
    clearToken();
    setSection("settings");
  }

  return (
    <div className={s.content}>
      <section className={s.card}>
        {section === "settings" && (
          <div className={s.settingsRoot}>
            <div className={s.profileHead}>
              <div className={s.avatar}>{fullName.slice(0, 1)}</div>
              <div className={s.headInfo}>
                <h2>{fullName}</h2>
                <p>{phone}</p>
              </div>
            </div>

            <div className={s.menu}>
              <button type="button" className={s.menuItem} onClick={() => setSection("personal")}>
                <span>Персональная информация</span>
                <small>Просмотр и редактирование данных</small>
              </button>
              <button
                type="button"
                className={s.menuItem}
                onClick={() => setSection("notifications")}
              >
                <span>Уведомления</span>
                <small>Push, Email и напоминания</small>
              </button>
              <button type="button" className={s.menuItem} onClick={() => setSection("payments")}>
                <span>Платежи</span>
                <small>Карты и история платежей</small>
              </button>
              <button type="button" className={s.menuItem} onClick={() => setSection("theme")}>
                <span>Настройки</span>
                <small>Язык и тема приложения</small>
              </button>
            </div>

            <button type="button" className={s.logoutBtn} onClick={() => setSection("logout")}>
              Выйти из аккаунта
            </button>
          </div>
        )}

        {section === "personal" && (
          <div className={s.section}>
            <Header title="Персональные данные" onBack={() => setSection("settings")} />

            <div className={s.avatarBlock}>
              <div className={s.avatarLarge}>{nameDraft.slice(0, 1)}</div>
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

            <button
              type="button"
              className={s.primaryBtn}
              onClick={handleSavePersonalInfo}
              disabled={!isPersonalDirty}
            >
              Сохранить изменения
            </button>
          </div>
        )}

        {section === "notifications" && (
          <div className={s.section}>
            <Header title="Уведомления" onBack={() => setSection("settings")} />
            <div className={s.switchList}>
              <SwitchRow
                title="Push-уведомления"
                subtitle="Получать push-уведомления"
                value={notifications.push}
                onToggle={() => toggleNotification("push")}
              />
              <SwitchRow
                title="Email уведомления"
                subtitle="Получать письма на Email"
                value={notifications.email}
                onToggle={() => toggleNotification("email")}
              />
              <SwitchRow
                title="Напоминать о брони"
                subtitle="Уведомлять о будущих визитах"
                value={notifications.bookingReminder}
                onToggle={() => toggleNotification("bookingReminder")}
              />
              <SwitchRow
                title="Акции и предложения"
                subtitle="Получать акции и новости"
                value={notifications.promotions}
                onToggle={() => toggleNotification("promotions")}
              />
            </div>
          </div>
        )}

        {section === "payments" && (
          <div className={s.section}>
            <Header title="Платежи" onBack={() => setSection("settings")} />
            {showAddCardForm ? (
              <div className={s.addCardForm}>
                <label className={s.field}>
                  <span>Номер карты</span>
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                  />
                </label>
                <div className={s.row}>
                  <label className={s.field}>
                    <span>Срок действия</span>
                    <input
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="09/28"
                    />
                  </label>
                  <label className={s.field}>
                    <span>Имя владельца</span>
                    <input
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="IVAN PETROV"
                    />
                  </label>
                </div>
                <label className={s.switchInline}>
                  <span>Сохранить карту для будущих платежей</span>
                  <input
                    type="checkbox"
                    checked={saveCard}
                    onChange={() => setSaveCard((prev) => !prev)}
                  />
                </label>
                <button type="button" className={s.primaryBtn} onClick={handleAddCard}>
                  Добавить карту
                </button>
              </div>
            ) : (
              <>
                <div className={s.cardList}>
                  {cards.map((card) => (
                    <div className={s.paymentCard} key={card.id}>
                      <div>
                        <strong>{card.numberMasked}</strong>
                        <p>{card.holder}</p>
                      </div>
                      <div className={s.paymentMeta}>
                        <small>{card.expiresAt}</small>
                        <button type="button" onClick={() => removeCard(card.id)}>
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className={s.secondaryBtn}
                  onClick={() => setShowAddCardForm(true)}
                >
                  Добавить карту
                </button>
              </>
            )}

            <div className={s.history}>
              <h3>История платежей</h3>
              {paymentHistory.map((item) => (
                <div className={s.historyItem} key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>№{item.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className={s.historyPrice}>
                    <strong>{formatPrice(item.amount)}</strong>
                    <p>{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === "theme" && (
          <div className={s.section}>
            <Header title="Настройки" onBack={() => setSection("settings")} />
            <div className={s.themeBlock}>
              <h3>Язык</h3>
              <div className={s.segment}>
                {(["uz", "ru", "en"] as ProfileLanguage[]).map((lang) => (
                  <button
                    type="button"
                    key={lang}
                    className={language === lang ? s.segmentActive : s.segmentBtn}
                    onClick={() => setLanguage(lang)}
                  >
                    {langMap[lang]}
                  </button>
                ))}
              </div>
            </div>

            <div className={s.themeBlock}>
              <h3>Тема</h3>
              <div className={s.themeList}>
                <button
                  type="button"
                  className={theme === "light" ? s.themeItemActive : s.themeItem}
                  onClick={() => setTheme("light")}
                >
                  Светлая тема
                </button>
                <button
                  type="button"
                  className={theme === "dark" ? s.themeItemActive : s.themeItem}
                  onClick={() => setTheme("dark")}
                >
                  Темная тема
                </button>
              </div>
            </div>
          </div>
        )}

        {section === "logout" && (
          <div className={s.section}>
            <Header title="Выйти из аккаунта" onBack={() => setSection("settings")} />
            <div className={s.logoutConfirm}>
              <p>Вы уверены, что хотите выйти из аккаунта?</p>
              <small>Вы выйдете из аккаунта с этого устройства</small>
              <button type="button" className={s.logoutBtn} onClick={handleLogout}>
                Выйти из аккаунта
              </button>
              <button type="button" className={s.linkBtn} onClick={() => setSection("settings")}>
                Отменить
              </button>
            </div>
          </div>
        )}
      </section>

      <div className={s.quickLinks}>
        <Link href={routes.bookings} className={s.quickLink}>
          Мои брони
        </Link>
      </div>
    </div>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className={s.sectionHead}>
      <button type="button" onClick={onBack}>
        ←
      </button>
      <h2>{title}</h2>
    </div>
  );
}

function SwitchRow({
  title,
  subtitle,
  value,
  onToggle,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={s.switchRow}>
      <div>
        <strong>{title}</strong>
        <p>{subtitle}</p>
      </div>
      <button type="button" className={value ? s.toggleOn : s.toggleOff} onClick={onToggle}>
        <span />
      </button>
    </div>
  );
}
