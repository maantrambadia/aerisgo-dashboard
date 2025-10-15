import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export default function LoadingFallback() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="dark:bg-black/20">
        {/* Header Skeleton */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </header>

        {/* Content Skeleton */}
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>

          {/* Large Chart Skeleton */}
          <Skeleton className="h-[400px] w-full rounded-xl" />

          {/* Two Column Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[350px] w-full rounded-xl" />
            <Skeleton className="h-[350px] w-full rounded-xl" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
