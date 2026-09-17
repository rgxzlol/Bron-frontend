import { Suspense } from "react";
import GoogleOAuthCallbackClient from "./GoogleOAuthCallbackClient";

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Загрузка...</div>}>
      <GoogleOAuthCallbackClient />
    </Suspense>
  );
}
