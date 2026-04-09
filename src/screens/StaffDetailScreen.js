import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import PaymentScreen from "./PaymentScreen";
import PaymentSuccessScreen from "./PaymentSuccessScreen";

import { useEffect, } from "react";



export default function StaffDetailScreen({ staff, onBack }) {
  const [isEditing, setIsEditing] = useState(false);
const [staffData, setStaffData] = useState(staff);
const [currentView, setCurrentView] = useState("detail");
const [paymentData, setPaymentData] = useState(null);

const [selectedTasks, setSelectedTasks] = useState([]);
useEffect(() => {
  setStaffData(staff);
}, [staff]);

  const [showPassword, setShowPassword] = useState(false);
const [tasks, setTasks] = useState([]);
const fetchTasks = async () => {
  try {
    const response = await axios.get(
      `https://dlume-boutique-backend.onrender.com/api/task/staff/${staff._id}`
    );

    if (response.data.success) {
      setTasks(response.data.data);
    }
  } catch (error) {
    console.log("Error fetching tasks:", error);
  }
};

useEffect(() => {
  fetchTasks();
}, []);

const getStatusStyle = (status) => {
  switch (status) {
    case "Pending":
      return { backgroundColor: "#F59E0B" };
    case "Assigned":
      return { backgroundColor: "#3B82F6" };
    case "In Progress":
      return { backgroundColor: "#6366F1" };
    case "Completed":
      return { backgroundColor: "#10B981" };
    case "Approved":
      return { backgroundColor: "#059669" };
    case "Disapproved":
      return { backgroundColor: "#EF4444" };
    case "Paused":
      return { backgroundColor: "#9CA3AF" };
    default:
      return { backgroundColor: "#6B7280" };
  }
};

const calculateTotalRemaining = () => {
  return tasks.reduce((totalSum, task) => {
    const paid = task.paid_amount || 0;
    const total = task.amount || 0;
    const remaining = Math.max(total - paid, 0);
    return totalSum + remaining;
  }, 0);
};

const calculateSelectedTotal = () => {
  return selectedTasks.reduce((sum, taskId) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return sum;

    const paid = task.paid_amount || 0;
    const total = task.amount || 0;
    const remaining = Math.max(total - paid, 0);

    return sum + remaining;
  }, 0);
};


const toggleTaskSelection = (taskId) => {
  const task = tasks.find(t => t._id === taskId);
  if (!task) return;

  const paid = task.paid_amount || 0;
  const total = task.amount || 0;

  // 🚫 STOP if fully paid
  if (paid >= total) return;

  setSelectedTasks(prev =>
    prev.includes(taskId)
      ? prev.filter(id => id !== taskId)
      : [...prev, taskId]
  );
};


const toggleSelectAll = () => {
  const unpaidTasks = tasks.filter(task => {
    const paid = task.paid_amount || 0;
    const total = task.amount || 0;
    return paid < total;
  });

  const unpaidIds = unpaidTasks.map(t => t._id);

  if (selectedTasks.length === unpaidIds.length) {
    setSelectedTasks([]);
  } else {
    setSelectedTasks(unpaidIds);
  }
};


if (currentView === "payment" && paymentData) {
  return (
    <PaymentScreen
      {...paymentData}
      onBack={() => setCurrentView("detail")}
onSuccess={async (data) => {

  await fetchTasks();      // 🔥 reload tasks from DB
  setSelectedTasks([]);    // clear selection

setPaymentData(prev => ({
  ...prev,
  amount: Number(data.amount || 0),
  method: data.method,
  date: data.date,
  customer: data.customer,
}));


  setCurrentView("success");
}}


    />
  );
}


if (currentView === "success" && paymentData) {
  return (
    <PaymentSuccessScreen
      {...paymentData}
      onDone={() => {
        setSelectedTasks([]);
        setCurrentView("detail");
      }}
    />
  );
}



  return (


    
    <SafeAreaView style={styles.container}>
      {/* Header */}
<View style={styles.header}>
<TouchableOpacity onPress={onBack} style={styles.backButtonStyled}>
  <Text style={styles.backIcon}>←</Text>
  <Text style={styles.backTextStyled}>Back</Text>
</TouchableOpacity>


  <Text style={styles.headerTitle}>Staff Details</Text>

  <TouchableOpacity
    style={styles.backButton}
    onPress={async () => {
      if (isEditing) {
        try {
         const response = await axios.put(
  `https://dlume-boutique-backend.onrender.com/api/staff/${staff._id}`,
  staffData
);



          if (response.data.success) {
            setStaffData(response.data.data);
            setIsEditing(false);
            Alert.alert("Success", "Staff updated successfully");
          }
        } catch (error) {
          Alert.alert("Error", "Failed to update staff");
        }
      } else {
        setIsEditing(true);
      }
    }}
  >
  <View style={styles.editButtonContent}>
  <Text style={styles.editIcon}>
    {isEditing ? "💾" : "✏"}
  </Text>
  <Text style={styles.editText}>
    {isEditing ? "Save" : "Edit"}
  </Text>
</View>

  </TouchableOpacity>
</View>




      <ScrollView style={styles.scrollView}>
        {/* Top Row - Two Cards Side by Side */}
        <View style={styles.topRow}>
          {/* Personal Information Card */}
      <View style={styles.card}>
  <Text style={styles.cardTitle}>Personal Information</Text>

  <View style={styles.cardContent}>
    {isEditing ? (
      <>
        <TextInput
          style={styles.input}
          value={staffData.first_name}
          onChangeText={(text) =>
            setStaffData({ ...staffData, first_name: text })
          }
          placeholder="First Name"
        />

        <TextInput
          style={styles.input}
          value={staffData.last_name}
          onChangeText={(text) =>
            setStaffData({ ...staffData, last_name: text })
          }
          placeholder="Last Name"
        />

        <TextInput
          style={styles.input}
          value={staffData.email}
          onChangeText={(text) =>
            setStaffData({ ...staffData, email: text })
          }
          placeholder="Email"
        />

        <TextInput
          style={styles.input}
          value={staffData.contact_no_1}
          onChangeText={(text) =>
            setStaffData({ ...staffData, contact_no_1: text })
          }
          placeholder="Phone"
        />

        <TextInput
          style={styles.input}
          value={staffData.designation}
          onChangeText={(text) =>
            setStaffData({ ...staffData, designation: text })
          }
          placeholder="Designation"
        />
      </>
    ) : (
      <>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>
            {staffData.first_name} {staffData.last_name}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{staffData.email || "—"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{staffData.contact_no_1}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Designation</Text>
          <Text style={styles.value}>{staffData.designation || "—"}</Text>
        </View>
      </>
    )}
  </View>
</View>


          {/* Address Information Card */}
        <View style={styles.card}>
  <Text style={styles.cardTitle}>Address Information</Text>

  <View style={styles.cardContent}>
    {isEditing ? (
      <>
        <TextInput
          style={styles.input}
          value={staffData.address_line_1}
          onChangeText={(text) =>
            setStaffData({ ...staffData, address_line_1: text })
          }
          placeholder="Address Line 1"
        />

        <TextInput
          style={styles.input}
          value={staffData.address_line_2}
          onChangeText={(text) =>
            setStaffData({ ...staffData, address_line_2: text })
          }
          placeholder="Address Line 2"
        />

        <TextInput
          style={styles.input}
          value={staffData.city}
          onChangeText={(text) =>
            setStaffData({ ...staffData, city: text })
          }
          placeholder="City"
        />

        <TextInput
          style={styles.input}
          value={staffData.state}
          onChangeText={(text) =>
            setStaffData({ ...staffData, state: text })
          }
          placeholder="State"
        />

        <TextInput
          style={styles.input}
          value={staffData.pincode}
          onChangeText={(text) =>
            setStaffData({ ...staffData, pincode: text })
          }
          placeholder="Pincode"
          keyboardType="numeric"
        />
      </>
    ) : (
      <>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>
            {staffData.address_line_1 || "—"}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>City</Text>
          <Text style={styles.value}>{staffData.city || "—"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>State</Text>
          <Text style={styles.value}>{staffData.state || "—"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Pincode</Text>
          <Text style={styles.value}>{staffData.pincode || "—"}</Text>
        </View>
      </>
    )}
  </View>
</View>

        </View>

        {/* Account Information Section */}
        {/* <View style={styles.fullWidthSection}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Information</Text>
            <View style={styles.cardContent}>
                <View style={styles.detailRow}>
  <Text style={styles.label}>Password</Text>

  <View style={{ flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
    <Text style={styles.value}>
      {showPassword
        ? staff.password || "—"
        : staff.password
        ? "•".repeat(staff.password.length)
        : "—"}
    </Text>

    {staff.password && (
      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        style={{ marginLeft: 10 }}
      >
        <Text style={{ fontSize: 16 }}>
          {showPassword ? "🙈" : "👁"}
        </Text>
      </TouchableOpacity>
    )}
  </View>
</View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Created At</Text>
                <Text style={styles.value}>
                  {staff.createdAt
                    ? new Date(staff.createdAt).toLocaleDateString("en-GB")
                    : "—"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Last Updated</Text>
                <Text style={styles.value}>
                  {staff.updatedAt
                    ? new Date(staff.updatedAt).toLocaleDateString("en-GB")
                    : "—"}
                </Text>
              </View>
            </View>
          </View>
        </View> */}

<View style={styles.fullWidthSection}>
  <View style={styles.outstandingCard}>
    <Text style={styles.outstandingLabel}>
      Total Remaining Payment
    </Text>
    <Text style={styles.outstandingValue}>
      ₹{calculateTotalRemaining().toFixed(2)}
    </Text>
  </View>
</View>



<View style={styles.fullWidthSection}>
  <View style={styles.card}>
    <View style={styles.tasksHeader}>
      <Text style={styles.cardTitle}>Assigned Tasks</Text>



    </View>

    {tasks.length === 0 ? (
      <Text style={styles.emptyText}>No tasks assigned</Text>
    ) : (
     tasks.map((task) => {
const paid = task.paid_amount || 0;
const total = task.amount || 0;
const remaining = Math.max(total - paid, 0);

const isPaid = paid >= total;
const isSelected = selectedTasks.includes(task._id);




        return (
       <TouchableOpacity
  key={task._id}
  style={[
    styles.taskRow,
    isSelected && styles.taskSelected
  ]}
  onPress={() => !isPaid && toggleTaskSelection(task._id)}
  activeOpacity={isPaid ? 1 : 0.8}
>

     <View style={{ flexDirection: "row", alignItems: "center" }}>

  {/* Checkbox */}
  <View style={styles.checkbox}>
    {isPaid ? (
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#16A34A" }}>
        ✓
      </Text>
    ) : (
      isSelected && <View style={styles.checkboxInner} />
    )}
  </View>

  {/* Task Status Badge (Approved / Assigned etc.) */}
  <View
    style={[
      styles.statusBadge,
      getStatusStyle(task.status),
      { marginLeft: 8 }
    ]}
  >
    <Text style={styles.statusText}>
      {task.status}
    </Text>
  </View>

</View>


        <View style={{ flex: 1, marginLeft: 10 }}>

  {/* Order Number */}
  <Text style={styles.orderNumberText}>
    Order: {task.order_id?.order_no || "—"}
  </Text>

  {/* Client Name */}
  <Text style={styles.clientNameText}>
   {task.order_id?.customer_name ||
      task.client_id?.first_name + " " + task.client_id?.last_name || "—"}
  </Text>

  {/* Task Name */}
  <Text style={styles.taskName}>
    {task.name}
  </Text>



  {/* {remaining > 0 && (
    <Text style={styles.remainingText}>
      Remaining ₹{remaining}
    </Text>
  )} */}

</View>


<View style={{ alignItems: "flex-end" }}>

 

  {/* Amount */}
  <Text style={styles.amountBelowStatus}>
    ₹ {task.amount}
  </Text>

  {/* Due */}
{remaining > 0 && (
  <Text style={styles.dueText}>
    Due ₹{remaining}
  </Text>
)}
</View>



          </TouchableOpacity>
        );
      })
    )}
  </View>
</View>



      </ScrollView>

      {selectedTasks.length > 0 && (
  <View style={styles.paymentFooter}>
    <View>
      <Text style={styles.selectedCount}>
        {selectedTasks.length} selected
      </Text>
      <Text style={styles.selectedAmount}>
        ₹{calculateSelectedTotal().toFixed(2)}
      </Text>
    </View>

    <TouchableOpacity
      style={styles.payButton}
  onPress={() => {
const selectedTaskObjects = tasks
  .filter(task => selectedTasks.includes(task._id))
  .map(task => {
    const paid = task.paid_amount || 0;
    const total = task.amount || 0;
    const remaining = Math.max(total - paid, 0);

    return {
      task_id: task._id,                              // ✅ actual task ID
      order_id:
        typeof task.order_id === "object"
          ? task.order_id._id
          : task.order_id,
      applied_amount: remaining,
    };
  });

setPaymentData({
  orders: selectedTaskObjects,
  taskIds: selectedTaskObjects.map(o => o.task_id), 
  totalAmount: calculateSelectedTotal(),
  type: "staff",
  customer: {
    first_name: staffData.first_name,
    last_name: staffData.last_name,
    _id: staff._id,
  },
});

setPaymentData({
  orders: selectedTaskObjects,   
  totalAmount: calculateSelectedTotal(),
  type: "staff",
  customer: {
    first_name: staffData.first_name,
    last_name: staffData.last_name,
    _id: staff._id,
  },
});
  setCurrentView("payment");
}}

    >
      <Text style={styles.payButtonText}>Pay Now</Text>
    </TouchableOpacity>
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

  // Full Width Section
  fullWidthSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "right",
    flex: 1,
  },

  // Empty State
  emptyText: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
    paddingVertical: 8,
  },
  sectionTitle: {
  fontSize: 18,
  fontWeight: "bold",
  marginTop: 20,
},

noTask: {
  color: "gray",
  marginTop: 10,
},

taskCard: {
  backgroundColor: "#f5f5f5",
  padding: 12,
  borderRadius: 8,
  marginTop: 10,
},

taskName: {
  fontWeight: "bold",
  fontSize: 16,
},
taskRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",  // ✅ Align to top
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#F0F0F0",
},


taskName: {
  fontSize: 14,
  fontWeight: "600",
  color: "#1A1A1A",
},

taskAmount: {
  fontSize: 13,
  color: "#666",
  marginTop: 4,
},

statusBadge: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 20,
},

statusText: {
  fontSize: 12,
  fontWeight: "600",
  color: "#fff",
},
header: {
  backgroundColor: "#FFFFFF",
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: "#E0E0E0",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
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
input: {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 8,
  padding: 10,
  marginBottom: 10,
  fontSize: 13,
  backgroundColor: "#FFFFFF",
},
outstandingCard: {
  backgroundColor: "#FAFAFA",
  borderRadius: 8,
  padding: 14,
  borderWidth: 1,
  borderColor: "#E0E0E0",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

outstandingLabel: {
  fontSize: 14,
  fontWeight: "500",
  color: "#555",
},

outstandingValue: {
  fontSize: 18,
  fontWeight: "700",
  color: "#DC2626",
},

tasksHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
},

selectAllButton: {
  flexDirection: "row",
  alignItems: "center",
},

selectAllText: {
  marginLeft: 6,
  fontSize: 13,
  color: "#555",
},

checkbox: {
  width: 20,
  height: 20,
  borderWidth: 1.5,
  borderColor: "#999",
  borderRadius: 4,
  justifyContent: "center",
  alignItems: "center",
  marginTop: 3,   
},


checkboxInner: {
  width: 12,
  height: 12,
  backgroundColor: "#666",
},

taskSelected: {
  backgroundColor: "#F9FAFB",
},

remainingText: {
  fontSize: 12,
  color: "#DC2626",
  marginTop: 2,
},

paymentFooter: {
  backgroundColor: "#FFFFFF",
  padding: 16,
  borderTopWidth: 1,
  borderTopColor: "#E5E5E5",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

selectedCount: {
  fontSize: 13,
  color: "#666",
},

selectedAmount: {
  fontSize: 20,
  fontWeight: "700",
},

payButton: {
  backgroundColor: "#2563EB",
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8,
},

payButtonText: {
  color: "#FFF",
  fontWeight: "600",
},

backButtonStyled: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F3F4F6",
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 25,
},

backIcon: {
  fontSize: 16,
  marginRight: 6,
  color: "#111827",
  fontWeight: "600",
},

backTextStyled: {
  fontSize: 14,
  color: "#111827",
  fontWeight: "600",
},
editButtonContent: {
  flexDirection: "row",
  alignItems: "center",
},

editIcon: {
  fontSize: 16,
  marginRight: 6,
},

editText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#111827",
},

orderNumberText: {
  fontSize: 12,
  fontWeight: "600",
  color: "#080808",
  marginBottom: 2,
},

clientNameText: {
  fontSize: 12,
  color: "#374151",
  marginBottom: 4,
},
amountBelowStatus: {
  fontSize: 14,
  fontWeight: "700",
  marginTop: 6,
  color: "#111827",
},

paymentBadge: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 20,
  marginBottom: 6,
},

paymentStatusText: {
  fontSize: 11,
  fontWeight: "700",
  color: "#FFFFFF",
},

statusPaid: {
  backgroundColor: "#16A34A",
},

statusPartial: {
  backgroundColor: "#F59E0B",
},

statusUnpaid: {
  backgroundColor: "#DC2626",
},

dueText: {
  fontSize: 12,
  fontWeight: "600",
  color: "#DC2626",
  marginTop: 4,
},


});