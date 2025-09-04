import React from "react";
import { Link, useLocation } from "react-router";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NavMain({ items }) {
  const { isCollapsed } = useSidebar();
  const location = useLocation();

  return (
    <SidebarMenu>
      {items.map((item) => {
        // Check if current path matches this item's URL
        const isActive =
          item.url === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.url);

        return (
          <SidebarMenuItem key={item.title}>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    asChild
                    className={
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : ""
                    }
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon className="size-5" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                {isCollapsed ? (
                  <TooltipContent side="right" sideOffset={16}>
                    {item.title}
                  </TooltipContent>
                ) : null}
              </Tooltip>
            </TooltipProvider>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
