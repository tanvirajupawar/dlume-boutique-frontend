import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";

import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Error", "Please enter both email and password");
    return;
  }

  setLoading(true);


  try {
    const response = await api.post("/user/signIn", {
      email: email.trim(),
      password: password.trim(),
    });


    if (response.data.success) {
const { role, staffId, user, token } = response.data;

console.log("LOGIN TOKEN:", token); // ✅ check coming from backend

// 🔥 SAVE TOKEN
await AsyncStorage.setItem("token", token);

// 🔥 VERIFY SAVE
const savedToken = await AsyncStorage.getItem("token");
console.log("SAVED TOKEN:", savedToken);

login(role, staffId, user, token);
    } else {

      Alert.alert("Login Failed", response.data.message);
    }

  } catch (error) {

    Alert.alert(
      "Login Failed",
      error.response?.data?.message || error.message || "Network error"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          
         
          {/* Right Side - Login Form */}
          <View style={styles.formSection}>
            <View style={styles.formContainer}>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>

              <View style={styles.inputContainer}>
             <Text style={styles.label}>Mobile Number / Username</Text>
<TextInput
  placeholder="Enter your mobile number"
  placeholderTextColor="#a0a0a0"
  style={styles.input}
  value={email}
  onChangeText={setEmail}
  autoCapitalize="none"
  editable={!loading}
/>

              </View>

            <View style={styles.passwordWrapper}>
  <TextInput
    placeholder="Enter your password"
    placeholderTextColor="#a0a0a0"
    secureTextEntry={!showPassword}
    style={styles.passwordInput}
    value={password}
    onChangeText={setPassword}
    editable={!loading}
  />

  <TouchableOpacity
    onPress={() => setShowPassword(!showPassword)}
    style={styles.eyeButton}
  >
    <Text style={styles.eyeText}>
      {showPassword ? "🙈" : "👁"}
    </Text>
  </TouchableOpacity>
</View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1a1a1a" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
              © 2024 D'Lume Boutique. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },

  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
  },

  content: {
    flex: 1,
    flexDirection: "row",
    minHeight: height,
  },

  // ========== LEFT BRAND SECTION ==========
  brandSection: {
    flex: 1,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },

  logoPlaceholder: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 60,
    paddingVertical: 40,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },

  logoTextMain: {
    fontSize: 38,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
  },

  logoTextSub: {
    fontSize: 14,
    color: "#E2E8F0",
    letterSpacing: 1.2,
    marginTop: 6,
  },

  tagline: {
    fontSize: 14,
    color: "#CBD5E1",
    letterSpacing: 1,
  },

  // ========== RIGHT FORM SECTION ==========
  formSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 60,
    backgroundColor: "#FFFFFF",
  },

  formContainer: {
    width: "100%",
    maxWidth: 420,
  },

  welcomeText: {
    fontSize: 34,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 40,
  },

  inputContainer: {
    marginBottom: 24,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#111827",
    borderRadius: 8,
  },

  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },

  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1,
  },

  footer: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 50,
  },

  passwordWrapper: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#D1D5DB",
  backgroundColor: "#F9FAFB",
  borderRadius: 8,
},

passwordInput: {
  flex: 1,
  paddingVertical: 14,
  paddingHorizontal: 16,
  fontSize: 14,
  color: "#111827",
},

eyeButton: {
  paddingHorizontal: 14,
},

eyeText: {
  fontSize: 16,
},
});
