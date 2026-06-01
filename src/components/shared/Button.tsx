import type { ButtonHTMLAttributes } from "react";

type ButtonProps = {
  text: string;
  as?: "button" | "span";
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "className">;

const buttonClassName =
  "py-[16px] px-[52px] bg-[#0a6af7] text-white rounded-[10px] font-semibold w-fit whitespace-nowrap shrink-0";

export default function Button({
  text,
  as = "button",
  type = "button",
  className,
}: ButtonProps) {
  const classes = className ? `${buttonClassName} ${className}` : buttonClassName;

  if (as === "span") {
    return <span className={classes}>{text}</span>;
  }

  return (
    <button type={type} className={classes}>
      {text}
    </button>
  );
}
