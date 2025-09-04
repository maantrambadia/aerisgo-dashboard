import { useLocation } from "react-router";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  const location = useLocation();

  // Determine the title based on the current path
  const getTitle = () => {
    const path = location.pathname;

    if (path === "/") return "Dashboard";
    if (path.startsWith("/flights")) return "Flights";

    return "AerisGo Admin";
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) p-1">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{getTitle()}</h1>
      </div>
    </header>
  );
}
