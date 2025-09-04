import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "./App.css";
import router from "./App.jsx";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <Toaster
        toastOptions={{
          style: {
            borderRadius: "var(--radius)",
          },
        }}
        position="top-center"
      />
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
