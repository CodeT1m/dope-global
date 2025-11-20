import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import logoDark from "@/assets/DOPE_lightfont.svg";
import logoLight from "@/assets/DOPE_darkfont.svg";

export const IntroAnimation = () => {
  const [show, setShow] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);
  const { theme } = useTheme();
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const currentTheme = theme === "system" ? systemTheme : theme;
  const logo = currentTheme === "dark" ? logoDark : logoLight;

  useEffect(() => {
    // Start exit animation after 2.5 seconds
    const exitTimer = setTimeout(() => {
      setIsAnimating(false);
    }, 2500);

    // Hide completely after fade out completes
    const hideTimer = setTimeout(() => {
      setShow(false);
    }, 3500); // 2.5s display + 1s fade out

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-700 ease-in-out ${
          isAnimating ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative flex items-center justify-center">
          {/* Subtle background glow */}
          {isAnimating && (
            <div 
              className="absolute inset-0 flex items-center justify-center -z-10"
              style={{
                animation: "glowPulse 2.5s ease-in-out infinite",
              }}
            >
              <div className="h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
            </div>
          )}
          
          {/* Logo with scale and fade animation */}
          <div
            className="intro-logo-container"
            style={{
              animation: isAnimating ? "logoReveal 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" : "logoExit 0.7s ease-in forwards",
            }}
          >
            <img 
              src={logo} 
              alt="DOPE" 
              className="h-64 w-auto md:h-80 md:w-auto"
              style={{
                filter: isAnimating ? "drop-shadow(0 0 30px rgba(255, 255, 255, 0.2))" : "none",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        .intro-logo-container {
          will-change: transform, opacity;
        }

        @keyframes logoReveal {
          0% {
            transform: scale(0.2) translateY(20px);
            opacity: 0;
            filter: blur(15px);
          }
          40% {
            transform: scale(1.08) translateY(-5px);
            opacity: 0.8;
            filter: blur(3px);
          }
          70% {
            transform: scale(0.98) translateY(2px);
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
            filter: blur(0px);
          }
        }

        @keyframes logoExit {
          0% {
            transform: scale(1) translateY(0);
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: scale(1.1) translateY(-20px);
            opacity: 0;
            filter: blur(10px);
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.9);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  );
};
