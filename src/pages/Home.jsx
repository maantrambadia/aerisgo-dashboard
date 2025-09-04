import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SiteHeader } from "@/components/SiteHeader";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Plane } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

export default function Home() {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const role = user?.role?.toLowerCase?.();
  const isAdmin = role === "admin";
  const isStaff = role === "staff";

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="dark:bg-black/20">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 md:px-6">
              <h2 className="text-2xl font-semibold">
                {isAdmin
                  ? "Welcome to AerisGo Admin"
                  : isStaff
                  ? "Welcome to AerisGo"
                  : "Welcome"}
              </h2>
              <p className="text-muted-foreground">
                {isAdmin
                  ? "Use the sidebar to navigate. Start by managing flights."
                  : isStaff
                  ? "Use the sidebar to access your dashboard."
                  : "Please sign in or request access if needed."}
              </p>
            </div>
            {isAdmin ? (
              <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 md:gap-6 md:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Flights</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Create, update, and manage flight schedules.
                    </div>
                    <Button asChild>
                      <Link to="/flights">
                        <Plane className="mr-2 h-4 w-4" />
                        Go
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : isStaff ? (
              <div className="px-4 md:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      You are signed in as{" "}
                      <span className="font-medium">Staff</span>. Your current
                      access includes the dashboard. If you need additional
                      permissions, please contact an administrator.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="px-4 md:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Access Restricted</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      You do not have access to the AerisGo admin dashboard. If
                      you believe this is an error, please contact an
                      administrator.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
