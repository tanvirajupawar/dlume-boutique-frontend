import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "https://dlume-boutique-backend.onrender.com/api",
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token"); // ✅ FIXED

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;