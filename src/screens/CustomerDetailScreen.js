import React, { useState, useEffect, useRef } from "react";import axios from "axios";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
   TextInput, 
  Alert,
   Dimensions, 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { FlatList } from "react-native";
const BASE_URL = "https://dlume-boutique-backend.onrender.com";
const screenWidth = Dimensions.get("window").width; 

const DEFAULT_MEASUREMENTS = {
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
};

export default function CustomerDetailScreen({ customer, onBack, onPay }){
const { role, staffId } = useContext(AuthContext);


const [selectedOrder, setSelectedOrder] = useState(null);
const [showOrderModal, setShowOrderModal] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
 const [isEditingClient, setIsEditingClient] = useState(false);
const [clientData, setClientData] = useState(customer);
const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);
const [showCareOfDropdown, setShowCareOfDropdown] = useState(false);
const [customerList, setCustomerList] = useState([]);
const [customerSearch, setCustomerSearch] = useState("");
const [page, setPage] = useState(1);
const searchTimeout = useRef(null);

const fetchCustomers = async (search = "", pageNumber = 1) => {
  try {
    const res = await axios.get(
      `https://dlume-boutique-backend.onrender.com/api/customers?search=${search}&limit=20&page=${pageNumber}`
    );

    const newData = res.data.data || [];

    if (pageNumber === 1) {
      setCustomerList(newData);
    } else {
      setCustomerList(prev => [...prev, ...newData]);
    }

  } catch (err) {
    console.log("Customer fetch error:", err.message);
  }
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
  fetchCustomers("", 1);
}, []);

const [measurementData, setMeasurementData] = useState({
  ...DEFAULT_MEASUREMENTS,
  ...(customer?.latest_measurements || {}),
});
   




const fetchCustomerDetails = async () => {
  try {
    const response = await axios.get(
      `https://dlume-boutique-backend.onrender.com/api/customers/${customer._id}`
    );

    if (response.data.success) {
      setClientData(response.data.data);
const fetchedMeasurements = response.data.data.latest_measurements;

setMeasurementData({
  ...DEFAULT_MEASUREMENTS,
  ...(fetchedMeasurements || {}),
});
    }
  } catch (error) {
    console.log("Customer fetch error:", error.message);
  }
};





useEffect(() => {
  if (customer && customer._id) {
    fetchCustomerOrders();
    fetchCustomerDetails();
   
  }
}, [customer]);



const getOrderPaidAmount = async (orderId) => {
  try {
    const res = await axios.get(`${BASE_URL}/api/receipt?order_id=${orderId}`);
    const receipts = res.data?.data || [];

    const totalPaid = receipts.reduce((sum, receipt) => {
      const amount = (receipt.orders || [])
        .filter(o => String(o.order_id?._id || o.order_id) === String(orderId))
        .reduce((s, o) => s + Number(o.applied_amount || 0), 0);

      return sum + amount;
    }, 0);

    return totalPaid;
  } catch (err) {
    console.log("Receipt error:", err.message);
    return 0;
  }
};

const fetchCustomerOrders = async () => {
  if (!customer?._id) return;

  try {
    setLoading(true);

    const response = await axios.get(
      `https://dlume-boutique-backend.onrender.com/api/getByCustomer/${customer._id}`
    );

    if (response.data.success) {
     const orders = response.data.data || [];

const updatedOrders = await Promise.all(
  orders.map(async (order) => {
    const paid = await getOrderPaidAmount(order._id);

const total = Number(order.total || 0); //  NO DISCOUNT HERE

    return {
      ...order,
      paid,                      
      balance: total - paid,    
    };
  })
);

setCustomerOrders(updatedOrders);
    } else {
      setCustomerOrders([]);
    }

  } catch (error) {

    if (error.response?.status === 404) {
      setCustomerOrders([]);
    } else {
      console.log(
        "Order fetch error:",
        error.response?.data || error.message
      );
    }

  } finally {
    setLoading(false);
  }
};


const calculateOutstanding = (orders = []) => {
  const totalPaise = orders.reduce((sum, order) => {
const total = Math.round(
  (Number(order.total || 0)) * 100
);
const totalAmount =
  Number(order.total || 0);

const paid = Math.round(Number(order.paid || 0) * 100);

    return sum + Math.max(0, total - paid);
  }, 0);

  return totalPaise / 100;
};


  // Calculate selected orders total
const calculateSelectedTotal = () => {
return (customerOrders || []).length === 0
  ? 0
  : selectedOrders.reduce((sum, orderId) => {
        const order = customerOrders.find(o => o._id === orderId);
    if (!order) return sum;

const total = Math.round(
  (Number(order.total || 0)) * 100
);
const totalAmount =
  Number(order.total || 0);

const paid = Math.round(Number(order.paid || 0) * 100);
    const balance = Math.max(0, total - paid);

    return sum + balance;
  }, 0) / 100;
};

  // Toggle individual order selection
const toggleOrderSelection = (orderId) => {
  const order = customerOrders.find(o => o._id === orderId);

  if (!order) return;

const totalAmount =
  Number(order.total || 0);

const paid = Number(order.paid || 0);
  setSelectedOrders(prev => {
    if (prev.includes(orderId)) {
      return prev.filter(id => id !== orderId);
    } else {
      return [...prev, orderId];
    }
  });
};





  // Handle payment
const handlePayment = () => {
  if (selectedOrders.length === 0) {
    Alert.alert("No Orders Selected");
    return;
  }

  console.log("SELECTED ORDERS:", selectedOrders);

  selectedOrders.forEach(id => {
    const order = customerOrders.find(o => o._id === id);
    console.log("Order:", {
      id,
      total: order.total,
      paid: order.paid,
balance: order.total - order.paid
    });
  });

  console.log("FRONTEND TOTAL:", calculateSelectedTotal());

const selectedOrderData = selectedOrders
  .map(orderId => {
    const order = customerOrders.find(o => o._id === orderId);

    const total = Number(order.total || 0);
    const paid = Number(order.paid || 0);
    const balance = Math.max(0, total - paid);

    return {
      order_id: orderId,
      applied_amount: balance,
      balance,
    };
  })
  .sort((a, b) => a.balance - b.balance); 
onPay({
  orders: selectedOrderData,
  orderIds: selectedOrderData.map(o => o.order_id),
  totalAmount: calculateSelectedTotal(),
  customer,
  type: "order",
  onSuccessCallback: () => {     
    fetchCustomerOrders();
    setSelectedOrders([]);
  },
});

setTimeout(() => {
  fetchCustomerOrders();
}, 500);
};

const totalOutstanding = calculateOutstanding(customerOrders);
const unpaidOrders = customerOrders.filter(order => {
  const total = Number(order.total || 0);
  const paid = Number(order.paid || 0);

  const balance = Math.max(0, total - paid);

  return balance > 0;   // 🔥 SAME AS EVERYWHERE
});


const handleDeleteOrder = async () => {
  if (!selectedOrder?._id) return;

  Alert.alert(
    "Delete Order",
    "Are you sure you want to delete this order?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await axios.delete(
              `https://dlume-boutique-backend.onrender.com/api/orders/${selectedOrder._id}`
            );

            if (response.data.success) {
              Alert.alert("Success", "Order deleted successfully");

              setShowOrderModal(false);
              setSelectedOrder(null);

              fetchCustomerOrders(); // 🔥 refresh list
            }
          } catch (error) {
            Alert.alert("Error", "Failed to delete order");
          }
        },
      },
    ]
  );
};

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

  return undefined; 
};

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
 <View style={styles.header}>
  <Text style={styles.headerTitle}>Customer Details</Text>

<TouchableOpacity 
onPress={onBack}

  style={styles.backButton}
>
    <Text style={styles.backArrow}>←</Text>
    <Text style={styles.backLabel}>Back</Text>
  </TouchableOpacity>
</View>



      <ScrollView style={styles.scrollView}>
        {/* Top Row - Two Cards Side by Side */}
        <View style={styles.topRow}>
          {/* Client Details Card */}
  <View style={styles.card}>
  <View style={styles.cardHeaderRow}>
    <Text style={styles.cardTitle}>Client Information</Text>

    <TouchableOpacity
onPress={async () => {
  if (isEditingClient) {
    // SAVE
    try {
      const response = await axios.put(
        `https://dlume-boutique-backend.onrender.com/api/customers/${customer._id}`,
        clientData
      );

      if (response.data.success) {
        Alert.alert("Success", "Customer updated successfully");
        setIsEditingClient(false);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update customer");
    }
  } else {
    setIsEditingClient(true);
  }
}}

    >
      <Text style={styles.editText}>
        {isEditingClient ? "Save" : "Edit"}
      </Text>
    </TouchableOpacity>
  </View>

  <View style={styles.cardContent}>

 {isEditingClient ? (
  <>
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>First Name</Text>
      <TextInput
        style={styles.formInput}
        value={clientData.first_name}
        onChangeText={(text) =>
          setClientData({ ...clientData, first_name: text })
        }
      />
    </View>

    <View style={styles.formRow}>
      <Text style={styles.formLabel}>Last Name</Text>
      <TextInput
        style={styles.formInput}
        value={clientData.last_name}
        onChangeText={(text) =>
          setClientData({ ...clientData, last_name: text })
        }
      />
    </View>

    <View style={styles.formRow}>
      <Text style={styles.formLabel}>Email</Text>
      <TextInput
        style={styles.formInput}
        value={clientData.email}
        onChangeText={(text) =>
          setClientData({ ...clientData, email: text })
        }
      />
    </View>

    <View style={styles.formRow}>
      <Text style={styles.formLabel}>Phone</Text>
      <TextInput
        style={styles.formInput}
        value={clientData.contact_no_1}
        onChangeText={(text) =>
          setClientData({ ...clientData, contact_no_1: text })
        }
        keyboardType="phone-pad"
      />
    </View>

    <View style={styles.formRow}>
      <Text style={styles.formLabel}>Alternate Phone</Text>
      <TextInput
        style={styles.formInput}
        value={clientData.contact_no_2}
        onChangeText={(text) =>
          setClientData({ ...clientData, contact_no_2: text })
        }
        keyboardType="phone-pad"
      />
    </View>

<View style={styles.formRow}>
  <Text style={styles.formLabel}>C/O</Text>

  <TouchableOpacity
    style={styles.formInput}
onPress={() => {
  setShowCareOfDropdown(true);
  setPage(1);
  fetchCustomers("", 1);
}}    activeOpacity={0.7}
  >
    <Text style={{ color: clientData.care_of ? "#111" : "#9CA3AF" }}>
      {clientData.care_of || "Select C/O"}
    </Text>
  </TouchableOpacity>
</View>

    <View style={styles.formRow}>
      <Text style={styles.formLabel}>Address</Text>
      <TextInput
        style={styles.formInput}
        value={clientData.address_line_1}
        onChangeText={(text) =>
          setClientData({ ...clientData, address_line_1: text })
        }
      />
    </View>

    <View style={styles.formRow}>
      <Text style={styles.formLabel}>City</Text>
      <TextInput
        style={styles.formInput}
        value={clientData.city}
        onChangeText={(text) =>
          setClientData({ ...clientData, city: text })
        }
      />
    </View>

    <View style={styles.formRow}>
      <Text style={styles.formLabel}>State</Text>
      <TextInput
        style={styles.formInput}
        value={clientData.state}
        onChangeText={(text) =>
          setClientData({ ...clientData, state: text })
        }
      />
    </View>

    <View style={styles.formRow}>
  <Text style={styles.formLabel}>Country</Text>
  <TextInput
    style={styles.formInput}
    value={clientData.country}
    onChangeText={(text) =>
      setClientData({ ...clientData, country: text })
    }
  />
</View>

    <View style={styles.formRow}>
      <Text style={styles.formLabel}>Pincode</Text>
      <TextInput
        style={styles.formInput}
        value={clientData.pincode}
        onChangeText={(text) =>
          setClientData({ ...clientData, pincode: text })
        }
        keyboardType="numeric"
      />
    </View>
  </>
) : (
  <>
  <View style={styles.detailRow}>
    <Text style={styles.label}>Name</Text>
    <Text style={styles.value}>
      {clientData.first_name} {clientData.last_name}
    </Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.label}>Email</Text>
    <Text style={styles.value}>
      {clientData.email || "—"}
    </Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.label}>Phone</Text>
    <Text style={styles.value}>
      {clientData.contact_no_1}
    </Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.label}>Alternate Phone</Text>
    <Text style={styles.value}>
      {clientData.contact_no_2 || "—"}
    </Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.label}>C/O</Text>
    <Text style={styles.value}>
      {clientData.care_of || "—"}
    </Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.label}>Address</Text>
    <Text style={styles.value}>
      {clientData.address_line_1}
      {clientData.address_line_2 ? `, ${clientData.address_line_2}` : ""}
    </Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.label}>Area / City</Text>
    <Text style={styles.value}>
      {clientData.area ? `${clientData.area}, ` : ""}
      {clientData.city}
    </Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.label}>State / Pincode</Text>
    <Text style={styles.value}>
      {clientData.state}
      {clientData.pincode ? ` - ${clientData.pincode}` : ""}
    </Text>
  </View>

  <View style={styles.detailRow}>
  <Text style={styles.label}>Country</Text>
  <Text style={styles.value}>
    {clientData.country || "—"}
  </Text>
</View>
</>

    )}

  </View>
</View>


          {/* Measurements Card */}
     <View style={styles.card}>
  <View style={styles.cardHeaderRow}>
    <Text style={styles.cardTitle}>Measurements</Text>

    <TouchableOpacity
     onPress={async () => {
  if (isEditingMeasurements) {
    try {
      const response = await axios.put(
  `https://dlume-boutique-backend.onrender.com/api/customers/${customer._id}`,
  
{
latest_measurements: Object.fromEntries(
  Object.entries(measurementData).map(([key, value]) => [
    key,
    value === "" ? undefined : parseMeasurement(value),
  ])
),
}
  
);




    if (response.data.success) {
setMeasurementData({
  ...DEFAULT_MEASUREMENTS,
  ...(response.data.data.latest_measurements || {}),
});  Alert.alert("Success", "Measurements updated"); 
  setIsEditingMeasurements(false);
}

    } catch (error) {
      Alert.alert("Error", "Failed to update measurements");
    }
  } else {
    setIsEditingMeasurements(true);
  }
}}

    >
      <Text style={styles.editText}>
        {isEditingMeasurements ? "Save" : "Edit"}
      </Text>
    </TouchableOpacity>
  </View>

  <View style={styles.cardContent}>

  {isEditingMeasurements ? (
  <>
    {Object.entries(measurementData ?? {}).map(([key, value]) => (
      <View key={key} style={styles.formRow}>
        <Text style={styles.formLabel}>
          {key.replace(/_/g, " ")}
        </Text>

        <TextInput
          style={styles.formInput}
          value={value !== undefined && value !== null ? String(value) : ""}
          onChangeText={(text) =>
            setMeasurementData({
              ...measurementData,
              [key]: text,
            })
          }
keyboardType="default"
          placeholder={`Enter ${key.replace(/_/g, " ")}`}
        />
      </View>
    ))}
  </>
) : (
Object.entries(measurementData ?? {}).map(([key, value]) => (
  <View key={key} style={styles.detailRow}>
    <Text style={styles.label}>
      {key.replace(/_/g, " ")}
    </Text>
    <Text style={styles.value}>
      {value ? `${value} ` : "—"}
    </Text>
  </View>
))
    )}

  </View>
</View>

        </View>

        {/* Outstanding Balance */}
        <View style={styles.outstandingSection}>
          <View style={styles.outstandingCard}>
            <Text style={styles.outstandingLabel}>Total Outstanding</Text>
            <Text style={styles.outstandingValue}>₹{totalOutstanding.toFixed(2)}</Text>
          </View>
        </View>

        {/* Orders Section */}
        <View style={styles.ordersSection}>
          <View style={styles.ordersSectionHeader}>
            <Text style={styles.ordersTitle}>Orders ({customerOrders.length})</Text>
         
          </View>
          
          {loading ? (
            <View style={styles.orderCard}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : customerOrders.length === 0 ? (
            <View style={styles.orderCard}>
              <Text style={styles.emptyText}>No orders</Text>
            </View>
          ) : (
 customerOrders.map((order) => {
  console.log("ORDER DATA:", order);

const totalAmount =
  Number(order.total || 0);

const paid = Number(order.paid || 0);

const finalTotal =
  Number(order.total || 0);



const balanceDue = Math.max(
  0,
  Number((totalAmount - paid).toFixed(2))
);

const isSelected = selectedOrders.includes(order._id);
const balance = Math.max(0, totalAmount - paid);
const isPaid = balance === 0;
let paymentStatus = "UNPAID";

if (paid === 0) {
  paymentStatus = "UNPAID";
} else if (paid < totalAmount) {
  paymentStatus = "PARTIAL";
} else {
  paymentStatus = "PAID";
}

  return (

<TouchableOpacity
key={`${order._id}-${order.order_no}`}  style={[
    styles.orderCard,
    isSelected && styles.orderCardSelected
  ]}
onPress={() => {
  const balance = Math.max(0, totalAmount - paid);
  if (balance > 0) toggleOrderSelection(order._id);
}}  activeOpacity={0.9}
>




  <View style={styles.orderCardContent}>

    {/* CHECKBOX — ONLY SELECT */}
 <TouchableOpacity
  onPress={() => !isPaid && toggleOrderSelection(order._id)}
  style={styles.checkbox}
  activeOpacity={isPaid ? 1 : 0.8}
  disabled={isPaid}
>
  {isPaid ? (
    <Text style={{ fontSize: 14, fontWeight: "700", color: "#16A34A" }}>
      ✓
    </Text>
  ) : (
    isSelected && <View style={styles.checkboxInner} />
  )}
</TouchableOpacity>



    {/* CLICKABLE HEADER — ONLY EXPANDS */}
<View style={{ flex: 1 }}>

      {/* HEADER */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>
            Order #{order.order_no}
          </Text>
          <Text style={styles.orderDate}>
            {order.order_date
              ? new Date(order.order_date).toLocaleDateString("en-GB")
              : "—"}
          </Text>
        </View>

   <View style={{ alignItems: "flex-end" }}>

  {/* ✅ TOTAL AFTER DISCOUNT */}
  <Text style={styles.orderAmount}>₹{finalTotal}</Text>


  {/* ✅ DUE */}
  {paymentStatus !== "PAID" && (
    <Text style={styles.balanceDue}>
      Due ₹{balanceDue}
    </Text>
  )}

</View>
      </View>

      {/* STATUS + ARROW */}
      <View style={styles.expandRow}>
    <View
  style={[
    styles.statusBadge,
    paymentStatus === "PAID" && styles.statusPaid,
    paymentStatus === "PARTIAL" && styles.statusPartial,
    paymentStatus === "UNPAID" && styles.statusUnpaid,
  ]}
>
  <Text style={styles.statusText}>
    {paymentStatus}
  </Text>
</View>


      
      </View>
</View>
  </View>





</TouchableOpacity>

              );
            })
          )}
        </View>


      </ScrollView>




      {/* Pay Button - Fixed at bottom */}
      {selectedOrders.length > 0 && (
        <View style={styles.paymentFooter}>
          <View style={styles.paymentInfo}>
            <Text style={styles.selectedCount}>
              {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
            </Text>
            <Text style={styles.selectedAmount}>₹{calculateSelectedTotal().toFixed(2)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.payButton}
            onPress={handlePayment}
          >
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      )}


      {showCareOfDropdown && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>

      <Text style={styles.modalTitle}>Select C/O</Text>

<TextInput
  style={styles.formInput}
  placeholder="Search customer..."
  value={customerSearch}
  onChangeText={handleSearch}
/>

<FlatList
  data={customerList}
keyExtractor={(item, index) => `${item._id}-${index}`}  keyboardShouldPersistTaps="handled"
  onEndReached={() => {
    if (customerList.length >= page * 20) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCustomers(customerSearch, nextPage);
    }
  }}
  onEndReachedThreshold={0.5}
  ListEmptyComponent={
    <Text style={{ textAlign: "center", marginTop: 20 }}>
      No customers found
    </Text>
  }
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        setClientData({
          ...clientData,
          care_of: `${item.first_name} ${item.last_name}`,
        });
        setShowCareOfDropdown(false);
      }}
    >
      <Text style={styles.dropdownText}>
        {item.first_name} {item.last_name}
      </Text>
    </TouchableOpacity>
  )}
/>

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => setShowCareOfDropdown(false)}
      >
        <Text style={styles.closeBtnText}>Close</Text>
      </TouchableOpacity>

    </View>
  </View>
)}


    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  // Header
 header: {
  backgroundColor: "#FFFFFF",
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: "#E0E0E0",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",   // 👈 important
},

  backButton: {
    marginRight: 12,
  },
  backText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Top Row - Two Cards
  topRow: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardContent: {
    gap: 2,
  },

  // Detail Row
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  label: {
    fontSize: 13,
    color: "#666666",
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "right",
  },

  // Outstanding Balance Row
  outstandingLabel: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "500",
  },
  outstandingValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DC2626",
    textAlign: "right",
  },

  // Orders Section
  ordersSection: {
    padding: 16,
    paddingTop: 0,
  },
  ordersSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ordersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectAllText: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "500",
  },

  // Outstanding Balance Section
  outstandingSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  outstandingCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 6,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  // Checkbox
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#999999",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#666666",
  },

  // Order Card
orderCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  padding: 18,
  marginBottom: 18,
  borderWidth: 1,
  borderColor: "#ECECEC",
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
},

  orderCardSelected: {
    borderColor: "#999999",
    backgroundColor: "#FAFAFA",
  },
  orderCardContent: {
    flexDirection: "row",
    gap: 12,
  },
  orderDetails: {
    flex: 1,
  },
orderHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 12,
  paddingBottom: 8,
  borderBottomWidth: 1,
  borderBottomColor: "#F1F1F1",
},

  orderNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: "#999999",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  balanceDue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
    marginTop: 2,
  },
  orderPaint: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 8,
  },

  // Media
mediaRow: {
  flexDirection: "row",
  marginTop: 12,
  justifyContent: "flex-start",
},

  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: "#E0E0E0",
  },
  designBox: {
    width: 50,
    height: 50,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
  },

  // Empty State
  emptyText: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
    paddingVertical: 8,
  },

  // Payment Footer
  paymentFooter: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  paymentInfo: {
    flex: 1,
  },
  selectedCount: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 2,
  },
  selectedAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  payButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginLeft: 16,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
orderStatus: {
  alignSelf: "flex-start",
  backgroundColor: "#EEF2FF",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 20,
  fontSize: 11,
  fontWeight: "600",
  color: "#4F46E5",
  marginBottom: 12,
},


garmentBlock: {
  marginTop: 14,
  padding: 14,
  borderRadius: 12,
  backgroundColor: "#F9FAFB",
  borderWidth: 1,
  borderColor: "#E5E7EB",
},


garmentTitle: {
  fontSize: 15,
  fontWeight: "700",
  marginBottom: 12,
  color: "#111827",
},

measurementGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 6,
},


measurementChip: {
  backgroundColor: "#F3F4F6",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 14,
  marginRight: 6,
  marginBottom: 6,
},

measurementText: {
  fontSize: 11,
  color: "#374151",
  fontWeight: "500",
},

measurementItem: {
  width: "48%",
  backgroundColor: "#FFFFFF",
  paddingVertical: 6,
  paddingHorizontal: 8,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: "#F0F0F0",
  marginBottom: 6,
  flexDirection: "row",
  justifyContent: "space-between",
},

measurementLabel: {
  fontSize: 11,
  color: "#666",
},

measurementValue: {
  fontSize: 11,
  fontWeight: "600",
  color: "#111",
},

workSection: {
  marginTop: 8,
},

subSectionTitle: {
  fontSize: 12,
  fontWeight: "600",
  marginBottom: 4,
  color: "#374151",
},

workRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 4,
},

workText: {
  fontSize: 11,
  backgroundColor: "#E0F2FE",
  color: "#0369A1",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 20,
  marginRight: 6,
  marginBottom: 6,
},

extraWorkBox: {
  marginTop: 6,
},

extraWorkText: {
  fontSize: 11,
  color: "#9A3412",
  backgroundColor: "#FEF3C7",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 14,
  alignSelf: "flex-start",
},



thumbnailLarge: {
  width: 90,
  height: 90,
  borderRadius: 10,
  marginRight: 12,
  borderWidth: 1,
  borderColor: "#E5E7EB",
},

designBoxLarge: {
  width: 90,
  height: 90,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  backgroundColor: "#FFFFFF",
  overflow: "hidden",
},


workSection: {
  marginTop: 8,
},

subSectionTitle: {
  fontSize: 11,
  fontWeight: "600",
  color: "#6B7280",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: 0.5,
},

workRow: {
  flexDirection: "row",
  flexWrap: "wrap",
},

workText: {
  fontSize: 11,
  backgroundColor: "#E0F2FE",
  color: "#0369A1",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 14,
  marginRight: 6,
  marginBottom: 6,
},
expandRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 6,
},

expandIcon: {
  fontSize: 12,
  color: "#9CA3AF",
  fontWeight: "600",
},

expandedContent: {
  marginTop: 14,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: "#F1F1F1",
},
backButton: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F3F4F6",
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
},

backArrow: {
  fontSize: 16,
  marginRight: 6,
  color: "#111827",
  fontWeight: "600",
},

backLabel: {
  fontSize: 13,
  color: "#111827",
  fontWeight: "600",
},
cardHeaderRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
},

editText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#2563EB",
},

input: {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 8,
  padding: 10,
  marginBottom: 10,
  fontSize: 13,
  backgroundColor: "#FFFFFF",
},
statusBadge: {
  alignSelf: "flex-start",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 20,
},

statusText: {
  fontSize: 11,
  fontWeight: "700",
  color: "#FFFFFF",
},

statusPaid: {
  backgroundColor: "#16A34A", // Green
},

statusPartial: {
  backgroundColor: "#F59E0B", // Orange
},

statusUnpaid: {
  backgroundColor: "#DC2626", // Red
},

modalOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
},

modalCard: {
  width: "70%",
  minHeight: "60%",     
  maxHeight: "80%",    
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 20,
 
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
},

modalTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 12,
  color: "#111827",
},

modalButtonRow: {
  flexDirection: "row",
  marginTop: 24,
  gap: 12,
  justifyContent: "flex-end",
},

deleteBtn: {
  backgroundColor: "#DC2626",
  paddingHorizontal: 24,
  paddingVertical: 10,
  borderRadius: 8,
  flexDirection: "row",
  alignItems: "center",
},

closeBtn: {
  backgroundColor: "#F3F4F6",
  paddingHorizontal: 24,
  paddingVertical: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#D1D5DB",
},

modalBtnText: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "600",
},

closeBtnText: {
  color: "#374151",
  fontSize: 14,
  fontWeight: "600",
},
infoGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 12,
},

infoItem: {
  width: "50%",
  marginBottom: 14,
},

infoLabel: {
  fontSize: 11,
  color: "#6B7280",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: 0.5,
},

infoValue: {
  fontSize: 14,
  fontWeight: "600",
  color: "#111827",
},

sectionDivider: {
  height: 1,
  backgroundColor: "#E5E7EB",
  marginVertical: 20,
},

sectionTitle: {
  fontSize: 13,
  fontWeight: "700",
  color: "#374151",
  marginBottom: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
},

notesCard: {
  backgroundColor: "#F9FAFB",
  padding: 14,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#E5E7EB",
},

notesText: {
  fontSize: 13,
  color: "#374151",
  lineHeight: 18,
},

garmentCard: {
  backgroundColor: "#FFFFFF",
  padding: 16,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  marginBottom: 18,
},

basicInfoRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 14,
},

basicInfoText: {
  fontSize: 13,
  color: "#374151",
},

basicLabel: {
  fontWeight: "600",
  color: "#111827",
},

garmentRow: {
  flexDirection: "row",
  gap: 16,
  marginBottom: 12,
},

garmentImageBlock: {
  flex: 1,
},

garmentLabel: {
  fontSize: 11,
  color: "#6B7280",
  marginBottom: 6,
  textTransform: "uppercase",
},

garmentImage: {
  width: "100%",
  height: 120,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#E5E7EB",
},

designContainer: {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 10,
  overflow: "hidden",
},
formRow: {
  marginBottom: 14,
},

formLabel: {
  fontSize: 11,
  color: "#6B7280",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  fontWeight: "600",
},

formInput: {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 14,
  backgroundColor: "#F9FAFB",
},
dropdownItem: {
  paddingVertical: 14,
  borderBottomWidth: 1,
  borderBottomColor: "#E5E7EB",
},

dropdownText: {
  fontSize: 14,
  color: "#111827",
},
});