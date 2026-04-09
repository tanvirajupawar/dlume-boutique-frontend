import React, { useState, useEffect, useRef, useContext } from "react";import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,   
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function AddCustomerScreen({ onBack, onSuccess }) {

const { token } = useContext(AuthContext);

const [customerList, setCustomerList] = useState([]);
const [showCareOfDropdown, setShowCareOfDropdown] = useState(false);
const [customerSearch, setCustomerSearch] = useState("");
const [page, setPage] = useState(1);
const searchTimeout = useRef(null);
const BASE_URL = "https://dlume-boutique-backend.onrender.com";
   
const fetchCustomers = async (search = "", pageNumber = 1) => {
  try {
   const res = await axios.get(
  `${BASE_URL}/api/customers?search=${search}&limit=20&page=${pageNumber}`
);
    const newData = res.data.data || [];

    if (pageNumber === 1) {
      setCustomerList(newData);
    } else {
      setCustomerList(prev => {
        const combined = [...prev, ...newData];

        // 🔥 remove duplicates
        return combined.filter(
          (item, index, self) =>
            index === self.findIndex(i => i._id === item._id)
        );
      });
    }

  } catch (err) {
console.log(
  "Customer fetch error:",
  err.response?.data || err.message
);  }
};

const handleSearch = (text) => {
  setCustomerSearch(text);

  if (searchTimeout.current) {
    clearTimeout(searchTimeout.current);
  }

  searchTimeout.current = setTimeout(() => {
    setPage(1);
    fetchCustomers(text, 1);
  }, 300);
};
useEffect(() => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("✅ Token attached (customer screen)");
  }
}, [token]);


useEffect(() => {
  if (token) {
    fetchCustomers("", 1);
  }
}, [token]);

const [formData, setFormData] = useState({
  first_name: "",
  last_name: "",
  email: "",
  contact_no_1: "",
  contact_no_2: "",
  care_of: "",
  address_line_1: "",
  address_line_2: "",
  area: "",
  city: "",
  state: "",
  country: "",
  pincode: "",

latest_measurements: {
  // 🔹 Upper Body
  shoulder: "",
  arm_length: "",
  sleeves_length: "",
  armhole: "",
  biceps: "",
  neck_size: "",
  back_neck: "",
  upper_chest: "",
  chest: "",
  waist: "",
  waist_2: "",
  hip: "",
  top_length: "",
  tucks: "",

  // 🔹 Lower Body
  pant_length: "",
  plazo_length: "",
  pyjama_length: "",
  salwar_length: "",
  round_up_1: "",
  round_up_2: "",
  round_up_3: "",
  main_round_up: "",

  // 🔹 Other
  aster: "",
  dupatta: "",
},
});

const handleSubmit = async () => {
  if (!formData.first_name || !formData.contact_no_1) {
    alert("First name and phone number required");
    return;
  }

  // 🔥 convert values like "14 1/2" → 14.5
const parseMeasurement = (val) => {
  if (!val) return undefined;

  const clean = val.trim();

  // 14 1/2 → 14.5
  if (clean.includes(" ")) {
    const [whole, fraction] = clean.split(" ");
    if (fraction?.includes("/")) {
      const [num, den] = fraction.split("/");
      return Number(whole) + Number(num) / Number(den);
    }
  }

  // 1/2 → 0.5
  if (clean.includes("/")) {
    const [num, den] = clean.split("/");
    return Number(num) / Number(den);
  }

  // normal number
  if (!isNaN(clean)) {
    return Number(clean);
  }

  return undefined; // ✅ prevents backend crash
};

  const cleanedData = {
    ...formData,

    // 🔥 ensure phone always sent
    contact_no_1: formData.contact_no_1 || "",

    latest_measurements: Object.fromEntries(
      Object.entries(formData.latest_measurements).map(([key, value]) => [
        key,
        value === "" ? undefined : parseMeasurement(value),
      ])
    ),
  };

  try {
await axios.post(
  `${BASE_URL}/api/customers`,
  cleanedData
);
    alert("Customer Created");
    onSuccess();
  } catch (error) {
    console.log("CREATE ERROR:", error.response?.data || error.message);
    alert(error.response?.data?.error || "Error creating customer");
  }
};

  const renderInput = (label, key, isNumber = false) => (
    <TextInput
      placeholder={label}
style={[styles.input, { paddingVertical: 0 }]}
keyboardType={
  key.includes("latest_measurements") ? "default" : (isNumber ? "numeric" : "default")
}
      value={
        key.includes("latest_measurements")
          ? formData.latest_measurements[key.split(".")[1]]
          : formData[key]
      }
      onChangeText={(text) => {
        if (key.includes("latest_measurements")) {
          const measureKey = key.split(".")[1];
          setFormData({
            ...formData,
            latest_measurements: {
              ...formData.latest_measurements,
              [measureKey]: text,
            },
          });
        } else {
          setFormData({ ...formData, [key]: text });
        }
      }}
    />
  );

  const renderCustomerItem = ({ item }) => (
  <TouchableOpacity
    style={styles.dropdownItem}
    onPress={() => {
      setFormData(prev => ({
        ...prev,
        care_of: `${item.first_name} ${item.last_name}`,
      }));
      setShowCareOfDropdown(false);
    }}
  >
    <Text style={styles.dropdownText}>
      {item.first_name} {item.last_name}
    </Text>
  </TouchableOpacity>
);




  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Add Customer</Text>

          {/* BASIC INFO */}
          <View style={styles.row}>
            {renderInput("First Name *", "first_name")}
            {renderInput("Last Name", "last_name")}
          </View>

          <View style={styles.row}>
            {renderInput("Primary Phone *", "contact_no_1")}
            {renderInput("Secondary Phone", "contact_no_2")}
          </View>

    <View style={styles.row}>
  {renderInput("Email", "email")}

  <TouchableOpacity
    style={[styles.input, styles.dropdownInput]}
    onPress={() => setShowCareOfDropdown(true)}
    activeOpacity={0.7}
  >
    <Text
      style={[
        styles.dropdownTextValue,
        !formData.care_of && styles.placeholderText,
      ]}
    >
      {formData.care_of || "Select C/O"}
    </Text>
  </TouchableOpacity>
</View>

          {/* ADDRESS */}
          <View style={styles.row}>
            {renderInput("Address Line 1", "address_line_1")}
            {renderInput("Address Line 2", "address_line_2")}
          </View>

          <View style={styles.row}>
            {renderInput("Area", "area")}
            {renderInput("City", "city")}
          </View>

          <View style={styles.row}>
            {renderInput("State", "state")}
            {renderInput("Country", "country")}
          </View>

          <View style={styles.row}>
            {renderInput("Pincode", "pincode", true)}
          </View>

          {/* MEASUREMENTS */}
          <Text style={styles.sectionTitle}>Measurements</Text>

          {Object.keys(formData.latest_measurements).map((key, index) => {
            if (index % 2 === 0) {
              const nextKey =
                Object.keys(formData.latest_measurements)[index + 1];
              return (
                <View style={styles.row} key={key}>
                  {renderInput(
                    key.replace("_", " ").toUpperCase(),
                    `latest_measurements.${key}`,
                    true
                  )}
                  {nextKey &&
                    renderInput(
                      nextKey.replace("_", " ").toUpperCase(),
                      `latest_measurements.${nextKey}`,
                      true
                    )}
                </View>
              );
            }
            return null;
          })}

          {/* BUTTONS */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

{showCareOfDropdown && (
  <View style={styles.dropdownOverlay}>
    <View style={styles.dropdownContainer}>

      <Text style={styles.modalTitle}>Select C/O</Text>

      {/* 🔍 SEARCH INPUT */}
      <TextInput
        style={styles.input}
        placeholder="Search customer..."
        value={customerSearch}
        onChangeText={handleSearch}
      />

   <FlatList
     style={{ flex: 1 }} 
  data={customerList}
  keyExtractor={(item, index) => `${item._id}-${index}`}
  keyboardShouldPersistTaps="handled"

  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}

  onEndReached={() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCustomers(customerSearch, nextPage);
  }}
  onEndReachedThreshold={0.5}

  ListEmptyComponent={
    <Text style={{ textAlign: "center", marginTop: 20 }}>
      No customers found
    </Text>
  }

  renderItem={renderCustomerItem}
/>

      <TouchableOpacity
        style={styles.dropdownClose}
        onPress={() => setShowCareOfDropdown(false)}
      >
        <Text style={{ color: "#2563EB", fontWeight: "600" }}>
          Close
        </Text>
      </TouchableOpacity>

    </View>
  </View>
)}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 24 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 25,
    marginBottom: 10,
    color: "#111827",
  },
row: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 12,
},
input: {
  width: "48%",
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 8,
  paddingHorizontal: 12,
  height: 44,
  fontSize: 13,
  backgroundColor: "#FFFFFF",
},
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 30,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginRight: 10,
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#2563EB",
    borderRadius: 8,
  },
  cancelText: { fontWeight: "600" },
  saveText: { color: "#FFFFFF", fontWeight: "600" },

dropdownOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20, },dropdownContainer: {
  backgroundColor: "#FFF",
  borderRadius: 12,
  padding: 20,
  height: "70%",     
}, dropdownItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", }, dropdownText: { fontSize: 14, color: "#111827", }, dropdownClose: { marginTop: 15, alignItems: "center", }, dropdownInput: { justifyContent: "center", }, dropdownTextValue: { fontSize: 13, color: "#111827", }, placeholderText: { color: "#9CA3AF", },
modalTitle: {
  fontSize: 16,
  fontWeight: "700",
  marginBottom: 10,
  color: "#111827",
},
});