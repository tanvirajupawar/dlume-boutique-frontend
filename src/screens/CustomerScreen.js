import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
} from "react-native";
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";
import { ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function CustomerScreen({ onViewCustomer, onAddCustomer, refreshKey }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCareOfSheet, setShowCareOfSheet] = useState(false);
const [careOfSearch, setCareOfSearch] = useState("");
const [page, setPage] = useState(1);
const [loadingMore, setLoadingMore] = useState(false);
const [hasMore, setHasMore] = useState(true);

const LIMIT = 30; // customers per request
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


const formatLabel = (text) => {
  return text
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};


useEffect(() => {
  const delaySearch = setTimeout(() => {
    setPage(1);
    setCustomers([]);
    setHasMore(true);
    fetchCustomers(1);
  }, 400);

  return () => clearTimeout(delaySearch);
}, [searchQuery]);

const loadMoreCustomers = () => {
  if (loadingMore) return;
  if (!hasMore) return;

  setLoadingMore(true);
  fetchCustomers(page + 1);
};

const calculateOutstanding = (orders = []) => {
  const totalPaise = orders.reduce((sum, order) => {
    const total = Math.round((Number(order.total) || 0) * 100);
    const paid = Math.round((Number(order.paid_amount) || 0) * 100);

    return sum + Math.max(0, total - paid);
  }, 0);

  return totalPaise / 100;
};

const getCustomerOutstanding = async (customerId) => {
  try {
    // 1️⃣ get orders
   const token = await AsyncStorage.getItem("token");

const orderRes = await axios.get(
  `https://dlume-boutique-backend.onrender.com/api/getByCustomer/${customerId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    const orders = orderRes.data?.data || [];

    let totalOutstanding = 0;

    for (const order of orders) {
 const receiptRes = await axios.get(
  `https://dlume-boutique-backend.onrender.com/api/receipt?order_id=${order._id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      const receipts = receiptRes.data?.data || [];

      const paid = receipts.reduce((sum, receipt) => {
        const amount = (receipt.orders || [])
          .filter(o => String(o.order_id?._id || o.order_id) === String(order._id))
          .reduce((s, o) => s + Number(o.applied_amount || 0), 0);

        return sum + amount;
      }, 0);

      const total =
        Number(order.total || 0);

      const balance = Math.max(0, total - paid);

      totalOutstanding += balance;
    }

    return totalOutstanding;

  } catch (err) {
    console.log("Outstanding error:", err.message);
    return 0;
  }
};

const fetchCustomers = async (pageNumber = 1) => {
  try {
const token = await AsyncStorage.getItem("token");

console.log("TOKEN:", token);
// or wherever you store it

const response = await axios.get(
  `https://dlume-boutique-backend.onrender.com/api/customers?page=${pageNumber}&limit=${LIMIT}&search=${searchQuery}`,
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

    if (response.data.success) {
      const customersData = response.data.data;

      if (pageNumber === 1) {
     const updatedCustomers = await Promise.all(
  customersData.map(async (customer) => {
    const outstanding = await getCustomerOutstanding(customer._id);

    return {
      ...customer,
      outstanding,
    };
  })
);

setCustomers(updatedCustomers);
      } else {
     setCustomers(prev => {
  const map = new Map();

  [...prev, ...customersData].forEach(c => {
    map.set(c._id, c);
  });

  return Array.from(map.values());
});
      }

      if (customersData.length < LIMIT) {
        setHasMore(false);
      }

      setPage(pageNumber);
    }

  } catch (error) {
    console.log("Customer fetch error:", error.message);
  } finally {
    setLoadingMore(false);
  }
};





const handleView = (customer) => {
  onViewCustomer(customer);
};



  const handleSubmit = async () => {
    try {
      if (!formData.first_name || !formData.contact_no_1) {
        alert("First name and phone number are required");
        return;
      }

     const cleanedData = {
  ...formData,
  latest_measurements: Object.fromEntries(
    Object.entries(formData.latest_measurements).map(([key, value]) => [
      key,
      value === "" ? undefined : Number(value),
    ])
  ),
};

const token = await AsyncStorage.getItem("token");

const response = await axios.post(
  "https://dlume-boutique-backend.onrender.com/api/customers",
  cleanedData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);


      if (response.data.success) {
        alert("Customer created successfully");
        
setPage(1);
setHasMore(true);
fetchCustomers(1);
        
        setShowAddModal(false); // Close modal
        
        // Reset form
setFormData({
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



      }
    } catch (error) {
      console.log("Add customer error:", error.response?.data || error.message);
      alert("Failed to add customer");
    }
  };

const handleDeleteCustomer = async (customerId) => {
  try {
const token = await AsyncStorage.getItem("token");

const response = await axios.delete(
  `https://dlume-boutique-backend.onrender.com/api/customers/${customerId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    if (response.data.success) {
      alert("Customer deleted successfully");
      setPage(1);
setHasMore(true);
fetchCustomers(1);
    }
  } catch (error) {
    console.log("Delete error:", error.message);
    alert("Failed to delete customer");
  }
};
  

const formatAddress = (customer) => {
  const parts = [
    customer.address_line_1,
    customer.address_line_2,
    customer.area,
    customer.city,
    customer.state,
      customer.country,
    customer.pincode,
  ];

  return parts.filter(Boolean).join(", ");
};




  const renderCustomerRow = ({ item }) => (
<TouchableOpacity 
  style={styles.customerRow}
  onPress={() => handleView(item)}
  activeOpacity={0.7}
>

  {/* NAME */}
  <View style={styles.columnName}>
    <Text style={styles.nameText}>
      {item.first_name} {item.last_name}
    </Text>

    {item.email ? (
      <Text style={styles.emailRow}>
        {item.email}
      </Text>
    ) : null}
  </View>

  {/* C/O */}
  <View style={styles.columnCareOf}>
    <Text style={styles.careOfText}>
      {item.care_of || "-"}
    </Text>
  </View>

  {/* ADDRESS */}
  <View style={styles.columnAddress}>
    <Text style={styles.addressText} numberOfLines={2}>
      {item.address_line_1}
      {item.address_line_2 ? `, ${item.address_line_2}` : ""}
    </Text>

    <Text style={styles.addressSubText} numberOfLines={1}>
      {item.area ? `${item.area}, ` : ""}
      {item.city}
    </Text>

   <Text style={styles.addressSubText} numberOfLines={1}>
  {item.state}
  {item.pincode ? ` - ${item.pincode}` : ""}
</Text>

{item.country ? (
  <Text style={styles.addressSubText} numberOfLines={1}>
    {item.country}
  </Text>
) : null}
  </View>

  {/* PHONE */}
  <View style={styles.columnPhone}>
    <Text style={styles.phoneText}>
      {item.contact_no_1}
    </Text>
  </View>

  {/* OUTSTANDING */}
  <View style={styles.columnOutstanding}>
    <Text
      style={[
        styles.outstandingText,
        (item.outstanding || 0) > 0 && styles.outstandingTextDue,
      ]}
    >
₹{Number(item.outstanding || 0).toFixed(2)}    </Text>
  </View>

  {/* DELETE ICON */}
<View style={styles.columnDelete}>
  <TouchableOpacity
onPress={() =>
  Alert.alert(
    "Delete Customer",
    "Are you sure you want to delete this customer?",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => handleDeleteCustomer(item._id) },
    ]
  )
}  >
    <Feather name="trash-2" size={18} color="#DC2626" />
  </TouchableOpacity>
</View>

</TouchableOpacity>

  );


const renderFooter = () => {
  if (!loadingMore) return null;

  return (
    <View style={{ padding: 20 }}>
      <ActivityIndicator size="small" color="#2563EB" />
    </View>
  );
};


useEffect(() => {
  setPage(1);
  setCustomers([]);
  setHasMore(true);
  fetchCustomers(1);
}, [refreshKey]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Customers</Text>
          <View style={styles.headerRight}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or phone..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
           <TouchableOpacity 
  style={styles.addButton}
 onPress={onAddCustomer}
>
              <Text style={styles.addButtonText}>+ Add New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Table Header */}
       <View style={styles.tableHeader}>
  <View style={styles.columnName}>
    <Text style={styles.tableHeaderText}>Name</Text>
  </View>

  <View style={styles.columnCareOf}>
    <Text style={styles.tableHeaderText}>C/O</Text>
  </View>

  <View style={styles.columnAddress}>
    <Text style={styles.tableHeaderText}>Address</Text>
  </View>

  <View style={styles.columnPhone}>
    <Text style={styles.tableHeaderText}>Phone</Text>
  </View>

  <View style={styles.columnOutstanding}>
    <Text style={styles.tableHeaderText}>Outstanding</Text>
  </View>
<View style={styles.columnDelete}>
  <Feather name="trash-2" size={16} color="#6B7280" />
</View>
</View>


        {/* Customer List */}
<FlatList
  data={customers}
  renderItem={renderCustomerRow}
    contentContainerStyle={styles.listContent}
  keyExtractor={(item) => item._id}

  initialNumToRender={20}
  maxToRenderPerBatch={20}
  windowSize={10}
  removeClippedSubviews={true}

  onEndReached={loadMoreCustomers}
  onEndReachedThreshold={0.3}

  ListFooterComponent={renderFooter}
/>
      </View>



    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
container: {
  flex: 1,
  backgroundColor: "#FFFFFF",

},
  // ========== HEADER ==========
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 300,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },
  addButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // ========== TABLE HEADER ==========
tableHeader: {
  backgroundColor: "#FFFFFF",
  flexDirection: "row",
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderBottomWidth: 2,
  borderBottomColor: "#E5E7EB",
  alignItems: "center",
},
  tableHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ========== CUSTOMER LIST ==========
  customerList: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
listContent: {
  paddingHorizontal: 24,
  paddingBottom: 80,
},

  // ========== COLUMNS ==========

  nameText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
columnName: {
  flex: 2,
},

columnCareOf: {
  flex: 1.2,
},

columnAddress: {
  flex: 2.5,
},

columnPhone: {
  flex: 1.5,
  alignItems: "center",
},

columnOutstanding: {
  flex: 1,
  alignItems: "center",
},

columnDelete: {
  flex: 0.5,
  alignItems: "center",
},
  phoneText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  columnOrders: {
    flex: 0.8,
    alignItems: "center",
  },
  ordersBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: "center",
  },
  ordersText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },
  columnAction: {
    flex: 0.7,
    alignItems: "center",
  },
  viewButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#2563EB", 
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // ========== MODAL ==========
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#2563EB",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  bottomOverlay: {
  flex: 1,
  justifyContent: "flex-end",
  backgroundColor: "rgba(0,0,0,0.4)",
},

bottomSheet: {
    flex: 1,  
  backgroundColor: "#FFFFFF",
  padding: 24,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,

},

sheetHandle: {
  width: 40,
  height: 4,
  backgroundColor: "#CBD5E1",
  alignSelf: "center",
  borderRadius: 2,
  marginBottom: 16,
},

sheetTitle: {
  fontSize: 18,
  fontWeight: "600",
  marginBottom: 20,
  color: "#111827",
},

formRow: {
  flexDirection: "row",
  gap: 20,
},

formColumn: {
  flex: 1,
},

sheetActions: {
  flexDirection: "row",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 10,
},
formContent: {
  paddingBottom: 40,
},
addressText: {
  fontSize: 13,
  fontWeight: "500",
  color: "#374151",
},

addressSubText: {
  fontSize: 12,
  color: "#6B7280",
},
careOfRow: {
  fontSize: 12,
  fontWeight: "500",
  color: "#4B5563",
  marginTop: 4,
},
emailRow: {
  fontSize: 12,
  color: "#2563EB",
  marginTop: 2,
},
columnOutstanding: {
  flex: 1.2,
  alignItems: "center",
},

outstandingText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#059669", // Green if 0
},

outstandingTextDue: {
  color: "#DC2626", // Red if amount due
},
columnName: {
  flex: 2,
},

columnCareOf: {
  flex: 1.5,
},


careOfText: {
  fontSize: 12,
  color: "#374151",
},
customerRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: "#F3F4F6",
},
measurementTitle: {
  fontSize: 16,
  fontWeight: "600",
  marginTop: 20,
  marginBottom: 10,
  color: "#111827",
},

measurementGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
},

measurementWrapper: {
  width: "48%",
},
careOfSheet: {
  backgroundColor: "#FFFFFF",
  padding: 20,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  maxHeight: "70%",
},

careOfItem: {
  paddingVertical: 14,
  borderBottomWidth: 1,
  borderBottomColor: "#F3F4F6",
},

careOfName: {
  fontSize: 14,
  fontWeight: "600",
  color: "#111827",
},

careOfPhone: {
  fontSize: 12,
  color: "#6B7280",
  marginTop: 2,
},
columnDelete: {
  flex: 0.8,
  alignItems: "center",
  justifyContent: "center",
},

}); 