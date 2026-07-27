import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type InstallPlatform = "prompt" | "ios" | "manual" | "installed";

export function useInstallPrompt() {
  const [installPromptEvent, setInstallPromptEvent] =
    useState<InstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [installPlatform, setInstallPlatform] =
    useState<InstallPlatform>("manual");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ((window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true);

    if (isStandalone) {
      setInstallPlatform("installed");
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari =
      /safari/.test(userAgent) &&
      !/crios|fxios|edgios|chrome|android/.test(userAgent);

    setInstallPlatform(isIOS && isSafari ? "ios" : "manual");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as InstallPromptEvent);
      setInstallPlatform("prompt");
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setInstallPlatform("installed");
      setShowInstallHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const requestInstallApp = async () => {
    if (installPlatform === "installed") return;

    if (installPromptEvent) {
      await installPromptEvent.prompt();
      try {
        await installPromptEvent.userChoice;
      } finally {
        setInstallPromptEvent(null);
      }
      return;
    }

    setShowInstallHelp(true);
  };

  return {
    requestInstallApp,
    showInstallHelp,
    setShowInstallHelp,
    installPlatform,
    isAppInstalled: installPlatform === "installed",
  };
}
