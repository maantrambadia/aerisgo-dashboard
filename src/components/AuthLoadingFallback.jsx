import { Plane } from "lucide-react";

export default function AuthLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Plane */}
        <div className="relative">
          <div className="animate-bounce">
            <Plane className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Loading text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold text-foreground">Taking off...</p>
          <div className="flex gap-1">
            <div
              className="h-2 w-2 animate-pulse rounded-full bg-primary"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="h-2 w-2 animate-pulse rounded-full bg-primary"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="h-2 w-2 animate-pulse rounded-full bg-primary"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
