import { useEffect, useState } from "react";

export const IntroAnimation = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 3000); // Hide after 3 seconds

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
        <source src="/dope-intro.mp4" type="video/mp4" />
      </video>
    </div>
  );
};
