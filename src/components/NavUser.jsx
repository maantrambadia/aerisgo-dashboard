import { MoreVertical, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext.jsx";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, logout } = useAuth();

  if (!user) return null;

  // Get initials for avatar fallback
  const getInitials = (name) => {
    return name
      ? name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .toUpperCase()
      : "U";
  };

  const handleLogout = () => {
    logout();
  };

  // AerisGo identity fields
  const displayName = user.name || user.username || user.email || "User";
  const subline =
    user.email || (user.role ? String(user.role).toUpperCase() : "");
  const avatarSrc = user.avatarUrl || user.avatar || undefined;
  const initials = getInitials(user.name || user.username || user.email || "");
  const roleLabel = user?.role
    ? String(user.role).toLowerCase() === "admin"
      ? "Admin"
      : String(user.role).toLowerCase() === "staff"
      ? "Staff"
      : String(user.role)
    : null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="bg-transparent data-[state=open]:bg-sidebar-accent text-sidebar-foreground
              hover:!text-sidebar-accent-foreground hover:[&_span]:!text-sidebar-accent-foreground hover:[&_svg]:!text-sidebar-accent-foreground
              data-[state=open]:!text-sidebar-accent-foreground data-[state=open]:[&_span]:!text-sidebar-accent-foreground data-[state=open]:[&_svg]:!text-sidebar-accent-foreground
              data-[state=open]:[&_span.subline]:opacity-100 data-[state=open]:[&_span.navuser-badge]:bg-[hsl(var(--sidebar-accent-foreground))]/15"
            >
              <Avatar className="h-8 w-8 rounded-lg ring-1 ring-sidebar-border shrink-0 group-hover/menu-item:ring-[hsl(var(--sidebar-accent-foreground))]/30">
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback className="rounded-lg bg-sidebar-foreground/15 text-inherit group-hover/menu-item:bg-[hsl(var(--sidebar-accent-foreground))]/20">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate font-medium flex-1 min-w-0 hover:!text-sidebar-accent-foreground">
                    {displayName}
                  </span>
                  {roleLabel ? (
                    <Badge
                      variant="secondary"
                      className="navuser-badge shrink-0 bg-sidebar-foreground/10 text-inherit border-0 group-hover/menu-item:bg-[hsl(var(--sidebar-accent-foreground))]/15"
                    >
                      {roleLabel}
                    </Badge>
                  ) : null}
                </div>
                {subline ? (
                  <span className="subline truncate text-xs opacity-80 group-hover/menu-item:opacity-100 hover:!text-sidebar-accent-foreground">
                    {subline}
                  </span>
                ) : null}
              </div>
              <MoreVertical className="ml-auto size-4 hover:!text-sidebar-accent-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg ring-1 ring-border">
                  <AvatarImage src={avatarSrc} alt={displayName} />
                  <AvatarFallback className="rounded-lg bg-foreground/10 text-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  {subline ? (
                    <span className="text-foreground/70 truncate text-xs">
                      {subline}
                    </span>
                  ) : null}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
