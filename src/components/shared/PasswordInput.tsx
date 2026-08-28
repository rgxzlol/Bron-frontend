"use client";

import { useState } from "react";

type PasswordInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  wrapClassName?: string;
  inputClassName?: string;
  toggleClassName?: string;
};

function EyeOpenIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 12C22 12 17.522 18 12 18C6.478 18 2 12 2 12C2 12 6.478 6 12 6C17.522 6 22 12 22 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.1213 14.1213C13.5587 14.6839 12.7956 15 12 15C11.2044 15 10.4413 14.6839 9.87868 14.1213C9.31607 13.5587 9 12.7956 9 12C9 11.2044 9.31607 10.4413 9.87868 9.87868C10.4413 9.31607 11.2044 9 12 9C12.7956 9 13.5587 9.31607 14.1213 9.87868C14.6839 10.4413 15 11.2044 15 12C15 12.7956 14.6839 13.5587 14.1213 14.1213Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12C10 13.1046 10.8954 14 12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.87868 9.87868C8.81607 10.9413 8.2 12.4087 8.04 14M15.1213 15.1213C16.1839 14.0587 16.8 12.5913 16.96 11M6.58 6.58C4.85 7.85 3.5 9.75 2.5 12C4.5 16.5 8 19 12 19C13.55 19 15.03 18.55 16.35 17.75M19.42 19.42C21.15 18.15 22.5 16.25 23.5 14C21.5 9.5 18 7 14 7C12.95 7 11.95 7.2 11 7.55"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  wrapClassName = "",
  inputClassName = "",
  toggleClassName = "",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={wrapClassName}>
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete={visible ? "off" : "current-password"}
      />
      <button
        type="button"
        className={toggleClassName}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setVisible((prev) => !prev);
        }}
        aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
        aria-pressed={visible}
      >
        {visible ? <EyeClosedIcon /> : <EyeOpenIcon />}
      </button>
    </div>
  );
}
