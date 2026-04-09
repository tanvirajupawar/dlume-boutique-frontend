import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider, AuthContext } from "./src/context/AuthContext";

import LoginScreen from "./src/screens/LoginScreen";
import MainLayout from "./src/navigation/AppNavigator";
import StaffMainLayout from "./src/screens/StaffMainLayout";

function AppContent() {
  const { userToken, role, loading } = useContext(AuthContext);

  if (loading) return null;

  if (!userToken) {
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
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
  );
}