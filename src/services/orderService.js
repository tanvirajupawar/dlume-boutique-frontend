import axios from "axios";

export const createOrder = async (formData) => {
  try {
    const response = await axios.post(
      "https://dlume-boutique-backend.onrender.com/api/orders",
      formData,
      {
        timeout: 60000, // safer for uploads
      }
    );

    return response.data;

  } catch (error) {
    console.log("UPLOAD ERROR:", error.message);
    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);

    throw error;
  }
};