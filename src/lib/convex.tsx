import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

// Only initialize Convex if URL is provided
const convex = convexUrl && convexUrl.trim() !== "" 
  ? new ConvexReactClient(convexUrl)
  : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // If no Convex URL, just render children without Convex provider
  if (!convex) {
    return <>{children}</>;
  }
  
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

export { convex };
