import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [staffId, setStaffId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  // 🔁 Restore session
  const restoreSession = async () => {
    try {
      const storedRole = await AsyncStorage.getItem("role");
      const storedStaffId = await AsyncStorage.getItem("staffId");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedRole) setRole(storedRole);
      if (storedStaffId) setStaffId(storedStaffId);

   const storedToken = await AsyncStorage.getItem("token");

if (storedUser) {
  const parsedUser = JSON.parse(storedUser);

  const userWithToken = {
    ...parsedUser,
    token: storedToken || parsedUser.token,
  };

  setUser(userWithToken);
}

    } catch (err) {
      console.log("Restore Session Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔐 LOGIN (FIXED)
  const login = async (
    userRole,
    userStaffId = null,
    userData = null,
    token = null
  ) => {
    try {
      await AsyncStorage.setItem("role", userRole);

      if (userStaffId) {
        await AsyncStorage.setItem("staffId", userStaffId);
        setStaffId(userStaffId);
      } else {
        await AsyncStorage.removeItem("staffId");
        setStaffId(null);
      }

      // ✅ IMPORTANT FIX (MERGE TOKEN)
      if (userData) {
        const userWithToken = {
          ...userData,
          token: token, // 🔥 THIS WAS MISSING
        };

        await AsyncStorage.setItem("user", JSON.stringify(userWithToken));
        setUser(userWithToken);
      }

      // ✅ Optional: also store token separately
      if (token) {
        await AsyncStorage.setItem("token", token);
      }

      setRole(userRole);

    } catch (err) {
      console.log("Login Storage Error:", err);
    }
  };

  // 🚪 LOGOUT (FIXED)
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "role",
        "staffId",
        "user",
        "token", // 🔥 ADD THIS
      ]);

      setRole(null);
      setStaffId(null);
      setUser(null);
    } catch (err) {
      console.log("Logout Error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        staffId,
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};