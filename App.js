import React, { useContext } from "react";
import { AuthProvider, AuthContext } from "./src/context/AuthContext";

import LoginScreen from "./src/screens/LoginScreen";
import MainLayout from "./src/screens/MainLayout";
import StaffMainLayout from "./src/screens/StaffMainLayout";
import ErrorBoundary from "./ErrorBoundary";
function AppContent() {
  const { user, role, loading } = useContext(AuthContext);

  if (loading) return null;

  if (!user) {
    return <LoginScreen />;
  }

  if (role === "master") {
    return <StaffMainLayout />;
  }

  return <MainLayout />;
}

export default function App() {
  return (
 <AuthProvider>
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
</AuthProvider>
  );
}