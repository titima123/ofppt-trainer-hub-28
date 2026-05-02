import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
