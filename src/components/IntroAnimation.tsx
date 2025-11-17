import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

export const IntroAnimation = () => {
  const [show, setShow] = useState(true);
  const { theme } = useTheme();
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const currentTheme = theme === "system" ? systemTheme : theme;
  const introVideo = currentTheme === "dark" ? "/intro-dark.mp4" : "/intro-light.mp4";

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 5000); // Hide after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <video
        autoPlay
        muted
        playsInline
        className="max-w-full max-h-full object-contain"
      >
        <source src={introVideo} type="video/mp4" />
      </video>
    </div>
  );
};
