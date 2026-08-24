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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0c1a30] transition-opacity duration-500 ease-in-out ${
        fade ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-pulse">
        {/* Big circular logo with premium pulse rings */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gold/20 blur-md scale-110" />
          <img
            src={logoAsset}
            alt="Amma Seva"
            className="h-28 w-28 rounded-full bg-white p-2 border-2 border-gold object-contain shadow-2xl animate-spin"
            style={{ animationDuration: "12s" }}
          />
        </div>

        {/* Text bottom */}
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-wide text-white">
            Amma <span className="text-gold">Seva</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Home Healthcare &amp; Caregiving
          </p>
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
  }, [location.pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <SplashScreen />
      <ScrollRestoration />
      <Outlet />
    </QueryClientProvider>
  );
}
