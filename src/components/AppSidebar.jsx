import React, { useMemo } from "react";
import { Link } from "react-router";
import { LayoutDashboard, Plane } from "lucide-react";
import { NavMain } from "@/components/NavMain";
import { NavUser } from "@/components/NavUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext.jsx";

export function AppSidebar({ ...props }) {
  const { user } = useAuth();

  const items = useMemo(() => {
    if (!user) return [];
    const roleLower = user.role?.toLowerCase?.();
    if (roleLower === "admin") {
      return [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
        { title: "Flights", url: "/flights", icon: Plane },
      ];
    }
    if (roleLower === "staff") {
      // Staff see the dashboard entry; management items remain hidden
      return [{ title: "Dashboard", url: "/", icon: LayoutDashboard }];
    }
    // For other roles, hide items by default
    return [];
  }, [user]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-transparent"
            >
              <Link to="/">
                <img
                  src="/images/welcome-logo.png"
                  alt="AerisGo"
                  className="h-6 w-auto select-none"
                  draggable="false"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
