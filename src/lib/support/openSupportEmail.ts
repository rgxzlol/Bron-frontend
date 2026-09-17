type OpenSupportEmailOptions = {
  email: string;
  subject?: string;
};

type TelegramWebApp = {
  openLink?: (url: string) => void;
};

function getTelegramWebApp(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;

  return (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram
    ?.WebApp;
}

export function buildSupportMailtoUrl({ email, subject }: OpenSupportEmailOptions): string {
  if (!subject) return `mailto:${email}`;

  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

export function buildGmailComposeUrl({ email, subject }: OpenSupportEmailOptions): string {
  const params = new URLSearchParams({ view: "cm", fs: "1", to: email });
  if (subject) params.set("su", subject);

  return `https://mail.google.com/mail/?${params.toString()}`;
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openSupportEmail(options: OpenSupportEmailOptions) {
  const mailtoUrl = buildSupportMailtoUrl(options);
  const gmailUrl = buildGmailComposeUrl(options);
  const telegram = getTelegramWebApp();

  if (telegram?.openLink) {
    telegram.openLink(gmailUrl);
    return;
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    openInNewTab(gmailUrl);
    return;
  }

  const link = document.createElement("a");
  link.href = mailtoUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copySupportEmail(email: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return false;

  try {
    await navigator.clipboard.writeText(email);
    return true;
  } catch {
    return false;
  }
}
