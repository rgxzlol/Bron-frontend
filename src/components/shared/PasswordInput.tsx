"use client";

import { useState } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";

type PasswordInputProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  wrapClassName?: string;
  inputClassName?: string;
  toggleClassName?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  inputRef,
  wrapClassName = "",
  inputClassName = "",
  toggleClassName = "",
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={wrapClassName}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete={visible ? "off" : autoComplete}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        className={toggleClassName}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setVisible((prev) => !prev);
        }}
        aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
        aria-pressed={visible}
        data-testid="password-visibility-toggle"
      >
        <Image src={assets.auth.eyeIcon} alt="" width={22} height={22} aria-hidden />
      </button>
    </div>
  );
};
