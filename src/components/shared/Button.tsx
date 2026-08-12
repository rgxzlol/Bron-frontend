import type { ButtonHTMLAttributes } from "react";

type ButtonProps = {
  text: string;
  as?: "button" | "span";
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "className" | "onClick" | "disabled">;

export default function Button({
  text,
  as = "button",
  type = "button",
  className,
  paddingTop = "pt-[16px]",
  paddingRight = "pr-[52px]",
  paddingBottom = "pb-[16px]",
  paddingLeft = "pl-[52px]",
  onClick,
  disabled,
}: ButtonProps) {
  const buttonClassName = `${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft} bg-[#0a6af7] text-white rounded-[10px] font-semibold w-fit whitespace-nowrap shrink-0`;
  const classes = className ? `${buttonClassName} ${className}` : buttonClassName;

  if (as === "span") {
    return <span className={classes}>{text}</span>;
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
}