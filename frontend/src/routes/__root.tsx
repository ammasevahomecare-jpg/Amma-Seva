import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  ScrollRestoration,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logoAsset from "@/assets/amma-seva-logo.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Set timers for fade-out and unmount
    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 1500); // Start fade out at 1.5s

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 2000); // Fully unmount at 2.0s

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;
 
   return (
     <div
       className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-tr from-[#0a1128] via-[#101f42] to-[#0a1128] transition-opacity duration-700 ease-in-out ${
         fade ? "opacity-0 pointer-events-none" : "opacity-100"
       }`}
     >
       <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
         {/* Logo Container with rotating loading ring */}
         <div className="relative flex items-center justify-center h-32 w-32">
           {/* Pulsing glow background */}
           <div className="absolute inset-0 rounded-full bg-[#c9a24c]/10 blur-xl scale-125 animate-pulse" />
           
           {/* Smooth spinning gold accent ring */}
           <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#c9a24c] animate-spin" style={{ animationDuration: "15s" }} />
           
           {/* Glowing outer progress ring */}
           <div className="absolute inset-[-4px] rounded-full border-t-2 border-l-2 border-[#c9a24c] border-r-2 border-b-2 border-r-transparent border-b-transparent animate-spin" style={{ animationDuration: "2s" }} />
 
           <img
             src={logoAsset}
             alt="Amma Seva"
             className="h-24 w-24 rounded-full bg-white p-2 border-2 border-[#1e2a5a] object-contain shadow-2xl z-10 transition-transform duration-300 hover:scale-105"
           />
         </div>
 
         {/* Text details */}
         <div className="text-center space-y-2">
           <h1 className="font-display text-4xl font-bold tracking-wide text-white">
             Amma <span className="text-[#c9a24c]">Seva</span>
           </h1>
           <div className="flex flex-col items-center gap-1.5">
             <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] font-bold">
               Home Healthcare &amp; Caregiving
             </p>
             {/* Soft progress indicator dots */}
             <div className="flex gap-1.5 mt-2">
               <span className="h-1.5 w-1.5 rounded-full bg-[#c9a24c] animate-bounce" style={{ animationDelay: '0ms' }} />
               <span className="h-1.5 w-1.5 rounded-full bg-[#c9a24c]/80 animate-bounce" style={{ animationDelay: '150ms' }} />
               <span className="h-1.5 w-1.5 rounded-full bg-[#c9a24c]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
           </div>
         </div>
       </div>
     </div>
   );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, 50);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <QueryClientProvider client={queryClient}>
      <SplashScreen />
      <ScrollRestoration />
      <Outlet />
    </QueryClientProvider>
  );
}
