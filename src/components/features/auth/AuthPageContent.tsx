"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { siteConfig } from "@/config/site";
import { routes } from "@/config/routes";
import ThemeToggle from "@/components/shared/ThemeToggle";
import s from "./authPage.module.css";

type AuthTab = "login" | "register";

export default function AuthPageContent() {
  const [tab, setTab] = useState<AuthTab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className={s.authPage}>
      <div className={s.topBar}>
        <Link href={routes.home} className={s.logo}>
          {siteConfig.name}
        </Link>

        <div className={s.topActions}>
          <button type="button" className={s.langBtn}>
            <Image src={assets.header.ruLang} alt="" width={22} height={22} />
            RU
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className={s.center}>
        <div className={s.card}>
          <div className={s.tabs}>
            <button
              type="button"
              className={tab === "login" ? s.tabActive : s.tab}
              onClick={() => setTab("login")}
            >
              Войти в аккаунт
            </button>
            <button
              type="button"
              className={tab === "register" ? s.tabActive : s.tab}
              onClick={() => setTab("register")}
            >
              Создать аккаунт
            </button>
          </div>

          <label className={s.field}>
            <span className={s.label}>Имя</span>
            <input
              className={s.input}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Введите имя"
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Пароль</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Введите пароль"
              />
              <button
                type="button"
                className={s.eyeBtn}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? "◉" : "◎"}
              </button>
            </div>
          </label>

          <button type="button" className={s.submitBtn}>
            {tab === "login" ? "Войти" : "Создать аккаунт"}
          </button>

          <button type="button" className={s.socialBtn}>
            <span className={s.googleIcon}>G</span>
            Google
          </button>

          <div className={s.footerActions}>
            <Link href={routes.support} className={s.supportBtn}>
              Тех.поддержка
            </Link>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer"
              className={s.telegramBtn}
            >
              <Image src={assets.support.tg} alt="" width={20} height={20} data-theme-aware />
              Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
