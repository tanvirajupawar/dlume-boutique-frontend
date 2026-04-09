import React, { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  KeyboardAvoidingView,  
  Platform,               
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import Svg, { Path , } from "react-native-svg";
import { Image } from "react-native";
import { Animated, Dimensions } from "react-native";
import { io } from "socket.io-client";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useMemo } from "react";

const BASE_URL = "https://dlume-boutique-backend.onrender.com";



export default function OrderScreen({
  goToAddOrder,
  selectedOrderFromDashboard,
  clearSelectedOrderFromDashboard,
}) {

const { role, staffId, user } = useContext(AuthContext);
const token = user?.token;
console.log("🔥 ROLE INSIDE ORDER SCREEN:", role);
console.log("🔥 STAFF ID INSIDE ORDER SCREEN:", staffId);
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState([]);
const [selectedOrder, setSelectedOrder] = useState(null);
const [showDetailModal, setShowDetailModal] = useState(false);
const [showTaskModal, setShowTaskModal] = useState(false);
const [orderTasks, setOrderTasks] = useState([]);
const [workers, setWorkers] = useState([]);
const [taskAssignments, setTaskAssignments] = useState({});
const masters = workers.filter((w) => {
  const designation = w.designation?.toLowerCase() || "";
  return designation.includes("master");
});
const screenWidth = Dimensions.get("window").width;
const slideAnim = useRef(new Animated.Value(screenWidth)).current;
const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
const [showMasterDropdown, setShowMasterDropdown] = useState(false);
const [dropdownTaskId, setDropdownTaskId] = useState(null);
const [activeDropdown, setActiveDropdown] = useState(null);
const socketRef = useRef(null);
const fetchTimeoutRef = useRef(null); 
const [orderAdvancePaid, setOrderAdvancePaid] = useState(0);
const fetchOrderDetails = async (orderId) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/order-details/order/${orderId}`
    );

    return res.data.data;
  } catch (err) {
    console.log("❌ Fetch garments error:", err.message);
    return [];
  }
};
const formatMeasurementLabel = (key) => {
  const labels = {
    // 🔹 Upper Body
    shoulder: "Shoulder",
    arm_length: "Arm Length",
    sleeves_length: "Sleeves Length",
    armhole: "Armhole",
    biceps: "Biceps",
    neck_size: "Neck Size",
    back_neck: "Back Neck",
    upper_chest: "Upper Chest",
    chest: "Chest",
    waist: "Waist",
    waist_2: "Waist 2",
    hip: "Hip",
    top_length: "Top Length",
    tucks: "Tucks",

    // 🔹 Lower Body
    pant_length: "Pant Length",
    plazo_length: "Plazo Length",
    pyjama_length: "Pyjama Length",
    salwar_length: "Salwar Length",
    round_up_1: "Round Up 1",
    round_up_2: "Round Up 2",
    round_up_3: "Round Up 3",
    main_round_up: "Main Round Up",

    // 🔹 Other
    aster: "Aster",
    dupatta: "Dupatta",
  };

  return labels[key] || key;
};




const safeValue = (v) => {
  if (!v) return "-";

  const value = v.toString().trim().toLowerCase();

  if (value === "undefined" || value === "null" || value === "") {
    return "-";
  }

  return v;
};


const formatDate = (dateStr) => {
  if (!dateStr) return "-";

  // If already in DD/MM/YYYY → return directly
  if (dateStr.includes("/")) {
    return dateStr;
  }

  // Otherwise fallback (ISO format)
  const d = new Date(dateStr);
  return isNaN(d) ? "-" : d.toLocaleDateString("en-GB");
};


useEffect(() => {
  if (!role || !token) return;

  socketRef.current = io(BASE_URL, {
    auth: { token },
  });

  const safeFetchOrders = () => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchOrders();
    }, 400);
  };

  socketRef.current.on("orderAssigned", safeFetchOrders);
  socketRef.current.on("orderCreated", safeFetchOrders);
  socketRef.current.on("orderDeleted", safeFetchOrders);
  socketRef.current.on("taskUpdated", safeFetchOrders);
  socketRef.current.on("taskAssigned", safeFetchOrders);

  return () => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    socketRef.current.disconnect();
  };
}, [role, staffId, token]);





useEffect(() => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("✅ Token attached globally");
  }
}, [token]);


useEffect(() => {
  if (role && token) {
    fetchOrders();
  }
}, [role, token]);

const [workersLoaded, setWorkersLoaded] = useState(false);

useEffect(() => {
  if (!token || workersLoaded) return;

  fetchWorkers();
  setWorkersLoaded(true);
}, [token, workersLoaded]);

useEffect(() => {
if (selectedOrderFromDashboard) {
  handleView(selectedOrderFromDashboard); 
  clearSelectedOrderFromDashboard();
}
}, [selectedOrderFromDashboard]);


  // Filter orders based on search
const filteredOrders = useMemo(() => {
  const query = searchQuery.toLowerCase().trim();

  return orders.filter((order) => {
    const orderNo = (order.order_no || "").toLowerCase();
    const customerName = (order.customer_name || "").toLowerCase();
    const careOf = (order.care_of || "").toLowerCase();
    const contact = (order.contact_number || "").toString();
    const altContact = (order.alternate_number || "").toString();

    return (
      orderNo.includes(query) ||
      customerName.includes(query) ||
      careOf.includes(query) ||
      contact.includes(query) ||
      altContact.includes(query)
    );
  });
}, [orders, searchQuery]);


const handleView = async (order) => {
  if (!order?._id) return;
  setShowDetailModal(true);
  setOrderAdvancePaid(0); // reset

  try {
    const orderRes = await axios.get(`${BASE_URL}/api/orders/${order._id}`);
    const garments = await fetchOrderDetails(order._id);

    if (orderRes.data?.success) {
      const data = orderRes.data.data;

      setSelectedOrder({
        ...data,
        garments,
        contact_number: data.contact_no_1 || data.customer_id?.contact_no_1,
        alternate_number: data.contact_no_2 || data.customer_id?.contact_no_2,
      });

      // ✅ Fetch first receipt only (advance at order time)
      try {
        const receiptRes = await axios.get(`${BASE_URL}/api/receipt?order_id=${data._id}`);
        const receipts = receiptRes.data?.data || [];

        const orderReceipts = receipts
          .filter(r => (r.orders || []).some(o => {
            const rid = o.order_id?._id || o.order_id;
            return String(rid) === String(data._id);
          }))
          .sort((a, b) => new Date(a.receipt_date) - new Date(b.receipt_date));

    // ✅ NEW (sum of ALL payments)
if (orderReceipts.length > 0) {
  const totalPaid = orderReceipts.reduce((sum, receipt) => {
    const amount = (receipt.orders || [])
      .filter(o => String(o.order_id?._id || o.order_id) === String(data._id))
      .reduce((s, o) => s + Number(o.applied_amount || 0), 0);

    return sum + amount;
  }, 0);

  setOrderAdvancePaid(totalPaid);
}
      } catch (e) {
        console.log("Receipt fetch error:", e.message);
      }
    }
  } catch (err) {
    console.log("❌ Order detail fetch error:", err.message);
  }
};

const handleAssignTask = async (order) => {
  setSelectedOrder(order);

try {
  const response = await axios.get(`${BASE_URL}/api/orderTask/${order._id}`);

  if (response.data.success && Array.isArray(response.data.data)) {
    const tasksFromDB = response.data.data;

    setOrderTasks(tasksFromDB);

    const formattedAssignments = {};

    tasksFromDB.forEach((task) => {
      const staff = task.assigned_staff_1;

      formattedAssignments[task._id] = {
        workerId:
          typeof staff === "object"
            ? staff?._id
            : staff || null,

        workerName:
          typeof staff === "object" && staff
            ? `${staff.first_name || ""} ${staff.last_name || ""}`
            : "",

        amount: task.amount ? task.amount.toString() : "",
        assignmentId: task._id,
      };
    });

    setTaskAssignments(formattedAssignments);
  }
} catch (error) {
  console.log("Fetch order tasks error:", error.message);
  setOrderTasks([]);
  setTaskAssignments({});
}

  setShowTaskModal(true);

  Animated.timing(slideAnim, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  }).start();
};



const closeTaskPanel = () => {
  Animated.timing(slideAnim, {
    toValue: screenWidth,
    duration: 250,
    useNativeDriver: true,
  }).start(() => {
    setShowTaskModal(false);
  });
};


const handleWorkerChange = (taskId, workerId) => {
  setTaskAssignments((prev) => ({
    ...prev,
    [taskId]: {
      ...prev[taskId],
      workerId: workerId,
    },
  }));
};

const handleAmountChange = (taskId, amount) => {
  setTaskAssignments((prev) => ({
    ...prev,
    [taskId]: {
      ...prev[taskId],
      amount: amount,
    },
  }));
};

const handleSaveAssignments = async () => {
  try {
    const tasksToSend = Object.entries(taskAssignments)
      .filter(([_, data]) => data.workerId)
      .map(([taskId, data]) => {
        const taskObj = orderTasks.find(t => t._id === taskId);

      return {
  task_id: taskId,   // ✅ CRITICAL
  task: taskObj?.name,
  assigned_staff_1: data.workerId,
  amount: data.amount ? parseFloat(data.amount) : 0,
  garment_index: taskObj?.garment_index ?? 0,
};
      });

    if (tasksToSend.length === 0) {
      Alert.alert("Please assign at least one task");
      return;
    }

    const response = await axios.post(
    `${BASE_URL}/api/taskAssign`,
      {
        order_id: selectedOrder._id,
        tasks: tasksToSend,
      }
    );

    if (response.data.success) {

      Alert.alert("Success", "Task assigned successfully!");

      // 🔥 IMPORTANT — Re-fetch tasks again
      const refresh = await axios.get(
        `${BASE_URL}/api/orderTask/${selectedOrder._id}`
      );

      if (refresh.data.success) {
        setOrderTasks(refresh.data.data);
      }

      // 🔥 Refresh order list progress also
      await fetchOrders();

      // ❌ REMOVE this line:
      // setShowTaskModal(false);

      // Keep panel open so user sees updated data
    }

  } catch (error) {
    console.log("Error saving assignments:", error.response?.data || error.message);
  }
};
const handleAssignToMaster = (masterId) => {
  Alert.alert(
    "Assign To Master",
    "Are you sure you want to assign this order to this Master?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "default",
        onPress: async () => {
          try {
            const response = await axios.post(
             `${BASE_URL}/api/assignOrderToMaster`,
              {
                order_id: selectedOrder._id,
                master_id: masterId,
              }
            );

            if (response.data.success) {
              
              // 🔥 INSTANT UI UPDATE
              const selectedMaster = masters.find(
                (m) => m._id.toString() === masterId.toString()
              );

              setSelectedOrder((prev) => ({
                ...prev,
                assigned_master: selectedMaster,
              }));

              Alert.alert(
                "Success",
                "Order assigned to Master successfully!"
              );

              setShowMasterDropdown(false);

              // Optional: keep list synced
              fetchOrders();
            }

          } catch (error) {
            console.log(
              "Master assign error:",
              error.response?.data || error.message
            );
            Alert.alert("Error", "Failed to assign order");
          }
        },
      },
    ]
  );
};

const handleApproveTask = (taskId) => {
  Alert.alert(
    "Approve Task",
    "Are you sure you want to approve this task?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        style: "default",
        onPress: async () => {
          try {
            const response = await axios.post(
              `${BASE_URL}/api/taskApp/${taskId}`
            );

            if (response.data.success) {

              const updatedTasks = orderTasks.map(task =>
                task._id === taskId
                  ? { ...task, status: "Approved" }
                  : task
              );

              setOrderTasks(updatedTasks);

              // 🔥 Recalculate progress
              const total = updatedTasks.length;

              const completedCount = updatedTasks.filter(t =>
                ["completed", "approved"].includes(
                  t.status?.trim().toLowerCase()
                )
              ).length;

              const progress =
                total > 0
                  ? Math.round((completedCount / total) * 100)
                  : 0;

              setSelectedOrder(prev => ({
                ...prev,
                progress,
              }));

              setOrders(prev =>
                prev.map(o =>
              o._id === selectedOrder?._id
                    ? { ...o, progress }
                    : o
                )
              );

              Alert.alert("Success", "Task approved successfully!");
            }

          } catch (error) {
            console.log("Approve error:", error.message);
          }
        },
      },
    ]
  );
};


const handleCompleteTask = async (task) => {
  try {
    const assignment = taskAssignments[task._id];

    if (!assignment?.workerId) {
      Alert.alert("Select Employee", "Please select employee first");
      return;
    }

    await axios.post(
      `${BASE_URL}/api/taskComplete/${task._id}`,
      {
        assigned_staff_1: assignment.workerId,
        amount: assignment?.amount
          ? Number(assignment.amount)
          : 0,
      }
    );

    // ✅ 1️⃣ Update local task status
    const updatedTasks = orderTasks.map(t =>
      t._id === task._id
        ? { ...t, status: "Completed" }
        : t
    );

    setOrderTasks(updatedTasks);

    // ✅ 2️⃣ Recalculate progress
    const total = updatedTasks.length;

    const completedCount = updatedTasks.filter(t =>
      ["completed", "approved"].includes(
        t.status?.trim().toLowerCase()
      )
    ).length;

    const progress =
      total > 0
        ? Math.round((completedCount / total) * 100)
        : 0;

    // ✅ 3️⃣ Update selectedOrder progress instantly
    setSelectedOrder(prev => ({
      ...prev,
      progress,
    }));

    // ✅ 4️⃣ Update order list progress
    setOrders(prev =>
      prev.map(o =>
o._id === selectedOrder?._id
          ? { ...o, progress }
          : o
      )
    );

  } catch (error) {
    console.log("Complete task error:", error.response?.data || error.message);
  }
};




  const handleAddTask = (order) => {
    console.log("Add task for order:", order);
  };



const fetchWorkers = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/staff`)


    if (response.data.success) {
      setWorkers(response.data.data);
    }
  } catch (error) {
    console.log("Fetch workers error:", error.message);
  }
};

const fetchOrders = async () => {
  try {
    let url = `${BASE_URL}/api/orders`;

    // If staff login → fetch only assigned orders
    if (role === "master" && staffId) {
  url = `${BASE_URL}/api/orders/master/${staffId}`;
}

    const response = await axios.get(url);

    const ordersData = response.data.data || response.data;

    if (!Array.isArray(ordersData)) {
      setOrders([]);
      return;
    }

  

const sortedOrders = [...ordersData].sort((a, b) => {
  const numA = parseInt(a.order_no?.replace("O-", "") || 0);
  const numB = parseInt(b.order_no?.replace("O-", "") || 0);

  return numB - numA; // Descending (latest first)
});

const limitedOrders = sortedOrders;
const updatedOrders = [];

for (const order of limitedOrders) {
  try {
    const taskRes = await axios.get(
      `${BASE_URL}/api/orderTask/${order._id}`
    );

    const tasks = taskRes.data?.data || [];

    const totalTasks = tasks.length;

    const assignedTasks = tasks.filter(
      (t) => t.assigned_staff_1
    ).length;

    const completedTasks = tasks.filter((t) =>
      ["completed", "approved"].includes(
        t.status?.toLowerCase()
      )
    ).length;

    const progress =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    updatedOrders.push({
      ...order,
      totalTasks,
      assignedTasks,
      remainingTasks: totalTasks - assignedTasks,
      progress,
    });

  } catch (err) {
    updatedOrders.push({
      ...order,
      progress: 0,
      totalTasks: 0,
      assignedTasks: 0,
      remainingTasks: 0,
    });
  }
}

    setOrders(updatedOrders);
  } catch (error) {
  console.log("Fetch orders error:", error.response?.data || error.message);
  }
};
const getTaskStatusStyle = (status) => {
  const s = status?.trim().toLowerCase() || "";

  switch (s) {
    case "pending":
      return {
        badge: styles.statusPending,
        text: styles.statusTextPending,
      };

    case "in progress":
      return {
        badge: styles.statusInProgress,
        text: styles.statusTextInProgress,
      };

    case "paused":
      return {
        badge: styles.statusPaused,
        text: styles.statusTextPaused,
      };

    case "completed":
      return {
        badge: styles.statusCompleted,
        text: styles.statusTextCompletedNew,
      };

    case "approved":
      return {
        badge: styles.statusApproved,
        text: styles.statusTextApproved,
      };

    default:
      return {
        badge: styles.statusPending,
        text: styles.statusTextPending,
      };
  }
};



  const getStatusStyle = (status) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "completed" || statusLower === "delivered") {
      return { badge: styles.statusBadgeCompleted, text: styles.statusTextCompleted };
    } else if (statusLower === "pending" || statusLower === "in progress") {
      return { badge: styles.statusBadgePending, text: styles.statusTextPending };
    } else if (statusLower === "cancelled") {
      return { badge: styles.statusBadgeCancelled, text: styles.statusTextCancelled };
    }
    return { badge: styles.statusBadge, text: styles.statusText };
  };

const garmentColors = [
  "#4F46E5", 
  "#059669", 
  "#D97706", 
  "#DC2626", 
  "#7C3AED", 
  "#0284C7",
  "#BE123C",
  "#0F766E",
  "#9333EA", 
  "#EA580C", 
];

 const renderOrderRow = ({ item }) => {
const statusStyle = getStatusStyle(item.status || item.order_status);




  return (
<TouchableOpacity
  activeOpacity={0.9}
  onPress={() => handleView(item)}
  style={[
    styles.orderRow,
    showDetailModal && selectedOrder?._id === item._id && styles.activeRow
  ]}
>

      
      <View style={styles.colOrderNo}>
        <Text style={styles.orderNoText}>{item.order_no}</Text>
      </View>

      <View style={styles.colOrderDate}>
        <Text style={styles.dateText}>
          {item.order_date
            ? new Date(item.order_date).toLocaleDateString("en-GB")
            : "-"}
        </Text>
      </View>

      <View style={styles.colCustomer}>
        <Text style={styles.customerText}>{item.customer_name || "-"}</Text>
      </View>

{(role === "admin" || role === "manager") && (  <View style={styles.colContact}>
 <Text style={styles.contactText}>
{item.contact_no_1 || item.customer_id?.contact_no_1 || "-"}</Text>
  </View>
)}


      <View style={styles.colCareOf}>
        <Text style={styles.careOfText}>
     {item.care_of || "-"}

        </Text>
      </View>

  <View style={styles.colStatus}>

  {/* Status Badge */}
  <View style={[styles.statusBadge, statusStyle.badge]}>
    <Text style={[styles.statusText, statusStyle.text]}>
{item.status || item.order_status || "-"}    </Text>
  </View>

  {/* Progress Bar */}
  {item.totalTasks > 0 && (
    <View style={styles.progressContainer}>
      
      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            { width: `${item.progress || 0}%` },
          ]}
        />
      </View>

      <Text style={styles.progressText}>
        {item.progress || 0}%
      </Text>

    </View>
  )}

</View>


{(role === "admin" || role === "manager" || role === "master") && 
(  <View style={styles.colAction}>
    <TouchableOpacity
      style={styles.assignTaskBtn}
      activeOpacity={0.8}
      onPress={(e) => {
        e.stopPropagation();
        handleAssignTask(item);
      }}
    >
      <Text style={styles.assignTaskText}>
        {item.totalTasks === 0
          ? "No Tasks"
          : item.assignedTasks === 0
          ? "📋 Assign"
          : item.assignedTasks === item.totalTasks
          ? `✅ All Assigned`
          : `${item.assignedTasks}/${item.totalTasks} Assigned`}
      </Text>
    </TouchableOpacity>
  </View>
)}

</TouchableOpacity>
  );
};

const handleDeleteOrder = () => {
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
             `${BASE_URL}/api/orders/${selectedOrder._id}`
            );

            if (response.data.success) {
              alert("Order deleted successfully");

              setShowDetailModal(false);
              setSelectedOrder(null);

              fetchOrders();
            }
          } catch (error) {
            console.log("Delete error:", error.response?.data || error.message);
            alert("Failed to delete order");
          }
        },
      },
    ]
  );
};



  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Order Management</Text>
          <View style={styles.headerRight}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search Orders"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
  
          </View>

{(role === "admin" || role === "manager") && (  <TouchableOpacity
    style={styles.addButton}
    onPress={() => goToAddOrder(fetchOrders)}
  >
    <Text style={styles.addButtonText}>+ New Order</Text>
  </TouchableOpacity>
)}


          </View>
        </View>

        {/* Table Header */}
      <View style={styles.tableHeader}>
  <View style={styles.colOrderNo}>
    <Text style={styles.tableHeaderText}>Order No</Text>
  </View>

  <View style={styles.colOrderDate}>
    <Text style={styles.tableHeaderText}>Order Date</Text>
  </View>

  <View style={styles.colCustomer}>
    <Text style={styles.tableHeaderText}>Customer</Text>
  </View>

{(role === "admin" || role === "manager") && (  <View style={styles.colContact}>
    <Text style={styles.tableHeaderText}>Contact</Text>
  </View>
)}


  <View style={styles.colCareOf}>
    <Text style={styles.tableHeaderText}>C/O</Text>
  </View>

  <View style={styles.colStatus}>
    <Text style={styles.tableHeaderText}>Status</Text>
  </View>

{(role === "admin" || role === "manager" || role === "master") &&  (  <View style={styles.colAction}>
    <Text style={styles.tableHeaderText}>Action</Text>
  </View>
)}
</View>


        {/* Order List */}
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderRow}
          keyExtractor={(item) => item._id}
          style={styles.orderList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      </View>


{showDetailModal && selectedOrder && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ===== HEADER ===== */}
        <Text style={styles.modalTitle}>Order Details</Text>

        {/* ===== ORDER INFO GRID ===== */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Order No</Text>
            <Text style={styles.infoValue}>{selectedOrder.order_no}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Order Date</Text>
            <Text style={styles.infoValue}>
              {new Date(selectedOrder.order_date).toLocaleDateString("en-GB")}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Customer</Text>
            <Text style={styles.infoValue}>{selectedOrder.customer_name}</Text>
          </View>

          <View style={styles.infoItem}>
  <Text style={styles.infoLabel}>C/O</Text>
  <Text style={styles.infoValue}>
    {selectedOrder?.care_of || "-"}
  </Text>
</View>

{(role === "admin" || role === "manager") && (
  <>
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>Contact</Text>
    <Text style={styles.infoValue}>
  {selectedOrder?.contact_no_1 || selectedOrder?.customer_id?.contact_no_1 || "-"}
</Text>
    </View>

    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>Alternate Number</Text>
    <Text style={styles.infoValue}>
  {selectedOrder?.contact_no_2 || selectedOrder?.customer_id?.contact_no_2 || "-"}
</Text>
    </View>
  </>
)}
 
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
         <Text style={styles.infoValue}>
  {selectedOrder?.status || selectedOrder?.order_status || "-"}
</Text>
          </View>
{(role === "admin" || role === "manager") && (
  <>
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>Total</Text>
      <Text style={[styles.infoValue, { fontWeight: "700" }]}>
        ₹{Number(selectedOrder.total || 0).toFixed(2)}
      </Text>
    </View>



<View style={styles.infoItem}>
  <Text style={styles.infoLabel}>Balance Due</Text>
  <Text style={[styles.infoValue, { fontWeight: "700", color:
    (Number(selectedOrder.total || 0) - orderAdvancePaid) <= 0 ? "#16A34A" : "#DC2626"
  }]}>
    {(Number(selectedOrder.total || 0) - orderAdvancePaid) <= 0
      ? "Paid ✓"
      : "₹" + (Number(selectedOrder.total || 0) - orderAdvancePaid).toFixed(2)
    }
  </Text>
</View>

 
  </>
)}
        </View>



        {/* ===== GARMENTS ===== */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>Garments</Text>

        {selectedOrder.garments?.map((garment, index) => (
       <View key={index} style={styles.garmentCard}>
  
  <Text style={styles.garmentTitle}>
    Garment {index + 1}
  </Text>

  {/* ===== BASIC INFO ===== */}
<View style={styles.basicInfoRow}>


<Text style={styles.basicInfoText}>
  <Text style={styles.basicLabel}>Delivery: </Text>
  {formatDate(garment.delivery_date)}
</Text>

  {(role === "admin" || role === "manager") && (
    <Text style={styles.basicInfoText}>
      <Text style={styles.basicLabel}>Price: </Text>
    ₹{
  (
    Number(garment.price || 0) +
    (garment.extraWork?.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    ) || 0)
  )
}
    </Text>
  )}

</View>


{/* ===== IMAGES ROW ===== */}
<View style={styles.garmentRow}>

  {garment.clothImage && (
    <View style={styles.garmentImageBlock}>
      <Text style={styles.garmentLabel}>Cloth Reference</Text>
      <Image
        source={{
         uri: garment?.clothImage
  ? garment.clothImage.startsWith("http")
    ? garment.clothImage
    : `${BASE_URL}/uploads/${garment.clothImage}`
  : undefined,
        }}
        style={styles.garmentImage}
        resizeMode="cover"
      />
    </View>
  )}

{garment.designImage && (
  <View style={styles.garmentImageBlock}>
    <Text style={styles.garmentLabel}>Design Preview</Text>

    <View style={styles.designContainer}>
      <Image
        source={{
    uri: garment.designImage
  ? garment.designImage.startsWith("http")
    ? garment.designImage
    : `${BASE_URL}/uploads/${garment.designImage}`
  : undefined,        }}
        style={styles.designImage}
        resizeMode="contain"
      />
    </View>
  </View>
)}

</View>

{/* ===== DESIGN NOTES FULL WIDTH ===== */}
{(garment.designNotes || garment.design_notes || garment.notes) ? (
  <>
    <Text style={styles.subSectionTitle}>Design Notes</Text>

    <View style={styles.notesCardFull}>
      <Text style={styles.notesText}>
  {garment.designNotes || garment.design_notes || garment.notes}
</Text>
    </View>
  </>
) : null}

{garment.measurements && (
  <>
    <Text style={styles.subSectionTitle}>Measurements</Text>

    {/* 🔹 Upper Body */}
{/* 🔹 Upper Body */}
<Text style={styles.measurementGroupTitle}>Upper Body</Text>

{/* First fields */}
<View style={styles.measurementRow}>
  {[
    "shoulder","neck_size","back_neck",
    "upper_chest","chest","arm_length",
    "sleeves_length","armhole","biceps",
    "waist","waist_2","hip"
  ].map((key) => (
    <View key={key} style={styles.measurementBox}>
      <Text style={styles.measurementLabel}>
        {formatMeasurementLabel(key)}
      </Text>
      <Text style={styles.measurementValue}>
        {safeValue(garment.measurements[key])}
      </Text>
    </View>
  ))}
</View>

{/* Last 2 fields → side by side */}
<View style={styles.measurementRow}>
  {["top_length","tucks"].map((key) => (
    <View key={key} style={styles.measurementBox}>
      <Text style={styles.measurementLabel}>
        {formatMeasurementLabel(key)}
      </Text>
      <Text style={styles.measurementValue}>
        {safeValue(garment.measurements[key])}
      </Text>
    </View>
  ))}

  {/* Empty spaces to maintain 4-column grid */}
  <View style={{ width: "23%" }} />
  <View style={{ width: "23%" }} />
</View>
 


    {/* 🔹 Lower Body */}
    <Text style={styles.measurementGroupTitle}>Lower Body</Text>
    <View style={styles.measurementRow}>
      {[
        "pant_length","plazo_length","pyjama_length",
        "salwar_length","round_up_1","round_up_2",
        "round_up_3","main_round_up"
      ].map((key) => (
        <View key={key} style={styles.measurementBox}>
          <Text style={styles.measurementLabel}>
            {formatMeasurementLabel(key)}
          </Text>
          <Text style={styles.measurementValue}>
            {safeValue(garment.measurements[key])}
          </Text>
        </View>
      ))}
    </View>

    {/* 🔹 Other */}
    <Text style={styles.measurementGroupTitle}>Other</Text>
<View style={[styles.measurementRow, { justifyContent: "flex-start", gap: 10 }]}>
        {["aster","dupatta"].map((key) => (
        <View key={key} style={styles.measurementBox}>
          <Text style={styles.measurementLabel}>
            {formatMeasurementLabel(key)}
          </Text>
          <Text style={styles.measurementValue}>
            {safeValue(garment.measurements[key])}
          </Text>
        </View>
      ))}
    </View>
  </>
)}

 

{/* ===== EXTRA WORK ===== */}
{garment.extraWork?.length > 0 && (
  <>
    <Text style={styles.subSectionTitle}>Tasks</Text>

    <View style={styles.measurementGrid}>
      {garment.extraWork.map((item, i) => (
        <View key={i} style={styles.measurementItem}>
        <Text style={[styles.measurementLabel, { fontWeight: "700", color: "#111827" }]}>
  {item.name}
</Text>

      {(role === "admin" || role === "manager") && (
  <Text style={styles.measurementValue}>
    ₹{item.amount}
  </Text>
)}
        </View>
      ))}
    </View>
  </>
)}
{/* ===== GARMENT DESCRIPTION ===== */}
{(garment.description || garment.garment_description) ? (
  <>
    <Text style={styles.subSectionTitle}>Description</Text>

    <View style={styles.notesCard}>
    <Text style={styles.notesText}>
  {garment.description || garment.garment_description}
</Text>
    </View>
  </>
) : null}
</View>

        ))}

        {/* ===== BUTTONS ===== */}
       <View style={styles.modalButtonRow}>


   {/* {role === "admin" && (
  <TouchableOpacity style={styles.editBtn}>
    <Text style={styles.modalBtnText}>✏️ Edit</Text>
  </TouchableOpacity>
)} */}


{(role === "admin" || role === "manager") && (       
    <TouchableOpacity
  style={styles.deleteBtn}
  onPress={handleDeleteOrder}
>
   <Text style={styles.modalBtnText}>🗑️ Delete</Text>
  </TouchableOpacity>
)}  
 

  <TouchableOpacity
  style={styles.closeBtn}
  onPress={() => {
    setShowDetailModal(false);  
    setSelectedOrder(null); 
      setOrderAdvancePaid(0);      
    setShowWorkerDropdown(false);
    setShowMasterDropdown(false);
    setDropdownTaskId(null);
  }}
>
  <Text style={styles.closeBtnText}>Close</Text>
</TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  </View>
)}


{/* Task Assignment Modal */}
{showTaskModal && (
  <View style={styles.sliderOverlay}>
    
    {/* Background Click Close */}
    <TouchableOpacity 
      style={styles.overlayBackground}
      activeOpacity={1}
      onPress={closeTaskPanel}
    />

    {/* Sliding Panel */}
 <Animated.View
  style={[
    styles.sliderContainer,
    { transform: [{ translateX: slideAnim }] },
  ]}
>

  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >

      {/* HEADER */}
     <View style={styles.sliderHeader}>

  {/* Left Side Info */}
  <View>
    <Text style={styles.sliderTitle}>
      Assign Tasks - {selectedOrder?.order_no}
    </Text>
<Text style={styles.sliderSub}>
  {selectedOrder?.customer_name}
  {role === "admin" && ` • ₹${selectedOrder?.total}`}
</Text>
{selectedOrder?.assigned_master && (
  <Text style={{
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#16A34A"
  }}>
    Assigned To: {selectedOrder.assigned_master.first_name}{" "}
    {selectedOrder.assigned_master.last_name}
  </Text>
)}
  </View>

  {/* Right Side Button */}
{(role === "admin" || role === "manager") && (() => {

  const allTasksApproved =
    orderTasks.length > 0 &&
    orderTasks.every(
      t => t.status?.trim().toLowerCase() === "approved"
    );

  return (
    <TouchableOpacity
      disabled={allTasksApproved}
      style={[
        styles.headerMasterBtn,
        allTasksApproved && { backgroundColor: "#9CA3AF", opacity: 0.6 }
      ]}
      onPress={() => {
        if (!allTasksApproved) {
          setShowMasterDropdown(true);
        }
      }}
    >
      <Text style={styles.headerMasterBtnText}>
        Assign To Master
      </Text>
    </TouchableOpacity>
  );
})()}

</View>

      {/* TASK LIST */}
<ScrollView
  style={{ flex: 1 }}
  contentContainerStyle={{ paddingBottom: 200 }}
  keyboardShouldPersistTaps="handled"
  nestedScrollEnabled={true}   // ✅ ADD THIS
>



<View style={styles.taskTableHeader}>
  <Text style={{ flex: 1.5, fontWeight: "600" }}>Task</Text>
  <Text style={{ flex: 2, fontWeight: "600" }}>Employee</Text>
  <Text style={{ flex: 1, fontWeight: "600" }}>Amount</Text>
  <Text style={{ flex: 0.8, fontWeight: "600", textAlign: "center" }}>✓</Text>
  <Text style={{ flex: 1, fontWeight: "600", textAlign: "center" }}>Status</Text>
{(role === "admin" || role === "manager") && (  <Text style={{ flex: 1, fontWeight: "600", textAlign: "center" }}>
    Action
  </Text>
)}</View>


{orderTasks.length === 0 && (
  <View style={{ padding: 20, alignItems: "center" }}>
    <Text style={{ fontSize: 14, color: "#9CA3AF", fontWeight: "500" }}>
      No tasks created for this order
    </Text>
  </View>
)}
{orderTasks.map((task) => {
  const isAssigned = !!taskAssignments[task._id]?.workerId;

const statusLower = task.status?.trim().toLowerCase() || "";

const isApproved = statusLower === "approved";
const isCompleted = statusLower === "completed";
const isDone = ["completed", "approved"].includes(statusLower);

const isAlreadyAssigned = isApproved || isCompleted;



  return (
   <View
  key={task._id}
  style={[
    styles.taskTableRow,
    isAssigned && styles.taskRowAssigned,
    activeDropdown === task._id && { zIndex: 1000 }
  ]}
>


<View style={{ flex: 1.5 }}>

  {(() => {
    const color = garmentColors[task.garment_index % garmentColors.length];

    return (
      <>
        <Text style={styles.taskNameText}>
          <Text style={{ color, fontWeight: "700" }}>
{task.garment_name || `Garment ${task.garment_index + 1}`}
          </Text>
          {" - "}
          <Text style={{ color }}>
            {task.name}
          </Text>
        </Text>

        {task.description ? (
          <Text style={[styles.taskDescriptionText, { color }]}>
            {task.description}
          </Text>
        ) : null}
      </>
    );
  })()}

</View>


          <View style={{ flex: 2, paddingRight: 12 }}>
  <View style={{ position: "relative" }}>
    
<TouchableOpacity
  disabled={isAlreadyAssigned}
  style={[
    styles.dropdownBox,
    isAssigned
      ? styles.dropdownAssigned
      : styles.dropdownUnassigned,
    isAlreadyAssigned && styles.lockedField
  ]}
onPress={() => {
  setActiveDropdown(task._id);  
  setDropdownTaskId(task._id);
  setShowWorkerDropdown(true);
}}

>


<Text
  style={[
    styles.dropdownText,
    isAssigned && styles.dropdownTextAssigned
  ]}
>
  {(() => {
    const workerId = taskAssignments[task._id]?.workerId;
const worker = workers.find(
  w => w._id.toString() === workerId?.toString()
);

    return worker
      ? worker.first_name + " " + worker.last_name
      : "Select Employee";
  })()}
</Text>

    </TouchableOpacity>

   

  </View>
</View>


            <View style={{ flex: 1 }}>
<TextInput
  editable={!isAlreadyAssigned}
  style={[
    styles.amountInputNew,
    isAssigned && styles.amountInputAssigned,
    isAlreadyAssigned && styles.lockedField
  ]}
  placeholder="Amount"
  keyboardType="numeric"
  value={taskAssignments[task._id]?.amount?.toString() || ""}
  onChangeText={(value) => handleAmountChange(task._id, value)}
/>


            </View>

            {/* CHECKBOX COLUMN */}

<View style={{ flex: 0.8, alignItems: "center" }}>
<TouchableOpacity
  disabled={isDone}
  style={[
    styles.checkbox,
    isDone && styles.checkboxChecked,
  ]}
  onPress={() => {
    if (!isDone) {
      Alert.alert(
        "Complete Task",
        "Are you sure you want to mark this task as completed?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes",
            onPress: () => handleCompleteTask(task),
          },
        ]
      );
    }
  }}
>
  {isDone && (
    <Text style={styles.checkboxTick}>✓</Text>
  )}
</TouchableOpacity>
</View>
            {/* STATUS COLUMN */}
<View style={{ flex: 1, alignItems: "center" }}>
  <View style={getTaskStatusStyle(task.status).badge}>
    <Text style={getTaskStatusStyle(task.status).text}>
      {task.status || "Pending"}
    </Text>
  </View>
</View>


            {/* ACTION COLUMN */}
{(role === "admin" || role === "manager") && (
  <View style={{ flex: 1, alignItems: "center" }}>
    {statusLower === "completed" && (
      <TouchableOpacity
        style={styles.confirmBtnNew}
        onPress={() => handleApproveTask(task._id)}
      >
        <Text style={styles.confirmTextNew}>Confirm</Text>
      </TouchableOpacity>
    )}

    {statusLower === "approved" && (
      <View style={styles.approvedBadge}>
        <Text style={styles.approvedBadgeText}>Approved</Text>
      </View>
    )}
  </View>
)}

            </View>
  );
})}


      </ScrollView>

    <SafeAreaView style={styles.fixedFooterSafe}>
  <View style={styles.fixedFooter}>
    <TouchableOpacity
      style={styles.saveBtn}
      onPress={handleSaveAssignments}
    >
      <Text style={{ color: "#fff", fontWeight: "600" }}>
        Save Assignments
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.cancelBtn}
      onPress={closeTaskPanel}
    >
      <Text style={{ fontWeight: "600" }}>
        Cancel
      </Text>
    </TouchableOpacity>
  </View>
</SafeAreaView>
    
  </KeyboardAvoidingView>

    </Animated.View>


  </View>
)}

{/* ===== WORKER DROPDOWN MODAL ===== */}
<Modal
  visible={showWorkerDropdown}
  transparent
  animationType="fade"
  presentationStyle="overFullScreen"
  statusBarTranslucent={true}
  onRequestClose={() => setShowWorkerDropdown(false)}
>
  <TouchableOpacity
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
    }}
    activeOpacity={1}
    onPress={() => setShowWorkerDropdown(false)}
  >
    <View
      style={{
        width: 350,
        maxHeight: 400,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingVertical: 10,
      }}
    >
      <ScrollView>
        {workers.map((worker) => {
          const fullName =
            worker.first_name + " " + worker.last_name;

          return (
            <TouchableOpacity
              key={worker._id}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9",
              }}
              onPress={() => {
                setTaskAssignments((prev) => ({
                  ...prev,
                  [dropdownTaskId]: {
                    ...prev[dropdownTaskId],
                    workerId: worker._id,
                    workerName: fullName,
                  },
                }));

                setShowWorkerDropdown(false);
              }}
            >
              <Text style={{ fontSize: 15 }}>
                {fullName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  </TouchableOpacity>
</Modal>


<Modal
  visible={showMasterDropdown}
  transparent
  animationType="fade"
  onRequestClose={() => setShowMasterDropdown(false)}
>
  <TouchableOpacity
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
    }}
    activeOpacity={1}
    onPress={() => setShowMasterDropdown(false)}
  >
    <View
      style={{
        width: 350,
        maxHeight: 400,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingVertical: 10,
      }}
    >
      <ScrollView>
        {masters.map((master) => {
          const fullName =
            master.first_name + " " + master.last_name;

          return (
            <TouchableOpacity
              key={master._id}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9",
              }}
              onPress={() => {
                handleAssignToMaster(master._id);
                setShowMasterDropdown(false);
              }}
            >
              <Text style={{ fontSize: 15 }}>
                {fullName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  </TouchableOpacity>
</Modal>

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
    backgroundColor: "#F9FAFB",
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
    minWidth: 280,
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
    paddingVertical: 10,
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

  // ========== ORDER LIST ==========
  orderList: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 24,
  },
  orderRow: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
    backgroundColor: "#FFFFFF",

  },

  // ========== COLUMNS ==========
  orderNo: {
    flex: 1.2,
  },
  orderNoText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
  orderCustomer: {
    flex: 2,
  },
  customerText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    marginBottom: 2,
  },
  careOfText: {
   fontSize: 13,
  color: "#374151",
  fontWeight: "500",
  },
  orderDate: {
    flex: 1.3,
  },
  dateText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  orderType: {
    flex: 1,
    alignItems: "center",
  },
  typeBadge: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7C3AED",
  },
  orderTotal: {
    flex: 1,
  },
  totalText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
  },
  orderStatus: {
    flex: 1.2,
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeCompleted: {
    backgroundColor: "#D1FAE5",
  },
  statusBadgePending: {
    backgroundColor: "#FEF3C7",
  },
  statusBadgeCancelled: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  statusTextCompleted: {
    color: "#059669",
  },
  statusTextPending: {
    color: "#D97706",
  },
  statusTextCancelled: {
    color: "#DC2626",
  },
  orderAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  taskButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  taskIcon: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
  },
  viewButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  viewIcon: {
    fontSize: 14,
  },

  // ========== EMPTY STATE ==========
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
colOrderNo: { flex: 1.1 },
colOrderDate: { flex: 1.2 },
colCustomer: { flex: 1.6 },
colContact: { flex: 1.4 },  // new
colCareOf: { flex: 1.4 },
colStatus: { flex: 1.2, alignItems: "center" },
colAction: { flex: 1.6, alignItems: "center", justifyContent: "center" },

editButton: {
  width: 32,
  height: 32,
  borderRadius: 6,
  backgroundColor: "#DCFCE7",
  alignItems: "center",
  justifyContent: "center",
},

deleteButton: {
  width: 32,
  height: 32,
  borderRadius: 6,
  backgroundColor: "#FEE2E2",
  alignItems: "center",
  justifyContent: "center",
},
viewButtonNew: {
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: 20,
  backgroundColor: "#EEF2FF",
  borderWidth: 1,
  borderColor: "#C7D2FE",
},

viewButtonText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#4F46E5",
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

modalContainer: {
  width: "60%",
  backgroundColor: "#fff",
  padding: 24,
  borderRadius: 12,
},

modalTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 12,
},

modalButtonRow: {
  flexDirection: "row",
  marginTop: 24,
  gap: 12,
  justifyContent: "flex-end",
},

editBtn: {
  backgroundColor: "#16A34A",
  paddingHorizontal: 24,
  paddingVertical: 10,
  borderRadius: 8,
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
},

deleteBtn: {
  backgroundColor: "#DC2626",
  paddingHorizontal: 24,
  paddingVertical: 10,
  borderRadius: 8,
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
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

// ========== ASSIGN TASK BUTTON ==========
assignTaskBtn: {
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: 20,
  backgroundColor: "#FEF3C7",
  borderWidth: 1,
  borderColor: "#FDE047",
},

assignTaskText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#CA8A04",
},

// ========== TASK ASSIGNMENT MODAL ==========
taskModalContainer: {
  width: "80%",
  backgroundColor: "#FFFFFF",
  borderRadius: 18,
  paddingBottom: 20,
  overflow: "hidden",
  elevation: 20,
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 20,
},



orderInfoText: {
  fontSize: 13,
  color: "#6B7280",
  marginBottom: 16,
  paddingBottom: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#E5E7EB",
},

taskScrollView: {
  maxHeight: 400,
},

taskCard: {
  backgroundColor: "#F9FAFB",
  padding: 16,
  borderRadius: 8,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "#E5E7EB",
},

taskName: {
  fontSize: 16,
  fontWeight: "600",
  color: "#111827",
  marginBottom: 12,
},

inputGroup: {
  marginBottom: 12,
},

inputLabel: {
  fontSize: 13,
  fontWeight: "600",
  color: "#374151",
  marginBottom: 6,
},

pickerContainer: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#D1D5DB",
  borderRadius: 6,
  paddingHorizontal: 12,
  paddingVertical: 10,
},

pickerInput: {
  flex: 1,
  fontSize: 14,
  color: "#111827",
},

dropdownIcon: {
  fontSize: 10,
  color: "#6B7280",
},

workerList: {
  position: "absolute",
  top: 48,
  left: 0,
  right: 0,
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#D1D5DB",
  borderRadius: 8,
  maxHeight: 220,

  elevation: 1000,     // Android
  zIndex: 1000,        // iOS
},




workerOption: {
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#F3F4F6",
},

workerOptionSelected: {
  backgroundColor: "#EFF6FF",
},

workerOptionText: {
  fontSize: 14,
  color: "#374151",
},

workerOptionTextSelected: {
  color: "#2563EB",
  fontWeight: "600",
},

amountInput: {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#D1D5DB",
  borderRadius: 6,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 14,
  color: "#111827",
},

noTasksText: {
  textAlign: "center",
  fontSize: 14,
  color: "#9CA3AF",
  paddingVertical: 20,
},

saveBtn: {
  backgroundColor: "#2563EB",
  paddingHorizontal: 24,
  paddingVertical: 10,
  borderRadius: 8,
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
},

sliderOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  flexDirection: "row",
},

overlayBackground: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
},
sliderContainer: {
  width: "100%",
  backgroundColor: "#FFFFFF",
  elevation: 20,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 20,
  overflow: "visible",
  zIndex: 1,   
  

},


sliderHeader: {
    paddingTop: 40, 
  paddingVertical: 18,
  paddingHorizontal: 24,
  backgroundColor: "#FFFFFF",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

sliderTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: "#111827",
},


sliderSub: {
  fontSize: 14,
  color: "#6B7280",
  marginTop: 4,
},



sliderFooter: {
  flexDirection: "row",
  justifyContent: "flex-end",
  padding: 20,
  borderTopWidth: 1,
  borderTopColor: "#E2E8F0",
},

cancelBtn: {
  backgroundColor: "#E2E8F0",
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 8,
  marginLeft: 10,
},
/* ===== TABLE HEADER ===== */
taskTableHeader: {
  flexDirection: "row",
  backgroundColor: "#EFF6FF",
  paddingVertical: 14,
  paddingHorizontal: 20,
},

taskHeaderText: {
  color: "#1E293B",
  fontWeight: "600",
  fontSize: 14,
},

/* ===== TABLE ROW ===== */
taskTableRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 16,
  paddingHorizontal: 20,
  borderBottomWidth: 1,
  borderBottomColor: "#E2E8F0",
  backgroundColor: "#FFFFFF",
    position: "relative", 
},

taskCellText: {
  fontSize: 14,
  color: "#1E293B",
},
dropdownBox: {
  borderWidth: 1,
  borderColor: "#CBD5E1",
  borderRadius: 8,
  paddingVertical: 10,
  paddingHorizontal: 12,
  backgroundColor: "#FFFFFF",
},

dropdownText: {
  fontSize: 13,
  color: "#475569",
},

amountInputNew: {
  borderWidth: 1,
  borderColor: "#CBD5E1",
  borderRadius: 8,
  paddingVertical: 10,
  paddingHorizontal: 12,
  backgroundColor: "#FFFFFF",
  fontSize: 13,
  textAlign: "center",
},
progressContainer: {
  marginTop: 6,
  width: "100%",
},

progressBackground: {
  height: 6,
  width: "100%",
  backgroundColor: "#E5E7EB",
  borderRadius: 4,
  overflow: "hidden",
},

progressFill: {
  height: 6,
  backgroundColor: "#2563EB",
  borderRadius: 4,
},

progressText: {
  fontSize: 10,
  fontWeight: "600",
  color: "#374151",
  marginTop: 4,
  textAlign: "right",
},
activeRow: {
  backgroundColor: "#EFF6FF",   // soft blue highlight
  borderLeftColor: "#2563EB",   // premium blue indicator
},
modalCard: {
  width: "70%",
  maxHeight: "85%",
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 28,
  elevation: 25,
},

infoGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 10,
},

infoItem: {
  width: "50%",
  marginBottom: 16,
},

infoLabel: {
  fontSize: 12,
  color: "#6B7280",
  marginBottom: 4,
  fontWeight: "500",
},

infoValue: {
  fontSize: 15,
  color: "#111827",
  fontWeight: "600",
},

sectionDivider: {
  height: 1,
  backgroundColor: "#E5E7EB",
  marginVertical: 20,
},

sectionTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 16,
  color: "#111827",
},

garmentCard: {
  backgroundColor: "#F9FAFB",
  padding: 18,
  borderRadius: 12,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: "#E5E7EB",
},

garmentTitle: {
  fontSize: 16,
  fontWeight: "700",
  marginBottom: 14,
  color: "#1F2937",
},

garmentRow: {
  flexDirection: "row",
  gap: 20,
},

garmentImageBlock: {
  width: "48%",
},

garmentLabel: {
  fontSize: 13,
  fontWeight: "600",
  marginBottom: 8,
  color: "#374151",
},

garmentImage: {
  width: "100%",
  height: 180,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#E5E7EB",
},

designContainer: {
  height: 180,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  backgroundColor: "#FFFFFF",
  overflow: "hidden",
},

basicInfoRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 16,
},

basicInfoText: {
  fontSize: 13,
  color: "#374151",
},

basicLabel: {
  fontWeight: "700",
  color: "#111827",
},

subSectionTitle: {
  fontSize: 15,
  fontWeight: "700",
  marginTop: 18,
  marginBottom: 10,
  color: "#111827",
},

measurementGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
},

measurementItem: {
  width: "25%",
  marginBottom: 12,
},

measurementLabel: {
  fontSize: 13,
  color: "#6B7280",
},

measurementValue: {
  fontSize: 12,
  fontWeight: "600",
  color: "#111827",
},

workCard: {
  backgroundColor: "#FFFFFF",
  padding: 12,
  borderRadius: 8,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: "#E5E7EB",
},

extraWorkItem: {
  fontSize: 13,
  marginBottom: 4,
  color: "#374151",
},
/* ===== ASSIGNED VISUAL STYLES ===== */

taskRowAssigned: {
  backgroundColor: "#F0FDF4", // light green row
},

dropdownAssigned: {
  backgroundColor: "#ECFDF5",
  borderColor: "#10B981",
},

dropdownUnassigned: {
  backgroundColor: "#FFFBEB",
  borderColor: "#F59E0B",
},

dropdownTextAssigned: {
  color: "#065F46",
  fontWeight: "600",
},

amountInputAssigned: {
  borderColor: "#10B981",
  backgroundColor: "#F0FDF4",
},
fixedFooterSafe: {
  backgroundColor: "#FFFFFF",
},
fixedFooter: {
  flexDirection: "row",
  justifyContent: "flex-end",
  padding: 20,
  borderTopWidth: 1,
  borderTopColor: "#E2E8F0",
  backgroundColor: "#FFFFFF",
},
confirmBtn: {
  marginTop: 6,
  backgroundColor: "#2563EB",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 6,
},

confirmText: {
  color: "#FFFFFF",
  fontSize: 12,
  fontWeight: "600",
},

approvedText: {
  marginTop: 6,
  color: "#16A34A",
  fontSize: 12,
  fontWeight: "600",
},
confirmBtnNew: {
  backgroundColor: "#16A34A",
  paddingVertical: 6,
  paddingHorizontal: 14,
  borderRadius: 20,
  shadowColor: "#16A34A",
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 3,
},

confirmTextNew: {
  color: "#FFFFFF",
  fontSize: 12,
  fontWeight: "600",
},

approvedBadge: {
  backgroundColor: "#DCFCE7",
  paddingVertical: 6,
  paddingHorizontal: 14,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: "#16A34A",
},

approvedBadgeText: {
  color: "#15803D",
  fontSize: 12,
  fontWeight: "600",
},

statusPending: {
  backgroundColor: "#FEF3C7",
  paddingVertical: 5,
  paddingHorizontal: 12,
  borderRadius: 20,
},

statusTextPending: {
  color: "#D97706",
  fontSize: 12,
  fontWeight: "600",
},

statusInProgress: {
  backgroundColor: "#DBEAFE",
  paddingVertical: 5,
  paddingHorizontal: 12,
  borderRadius: 20,
},

statusTextInProgress: {
  color: "#2563EB",
  fontSize: 12,
  fontWeight: "600",
},

statusPaused: {
  backgroundColor: "#FEE2E2",
  paddingVertical: 5,
  paddingHorizontal: 12,
  borderRadius: 20,
},

statusTextPaused: {
  color: "#DC2626",
  fontSize: 12,
  fontWeight: "600",
},

statusCompleted: {
  backgroundColor: "#E0F2FE",
  paddingVertical: 5,
  paddingHorizontal: 12,
  borderRadius: 20,
},

statusTextCompletedNew: {
  color: "#0284C7",
  fontSize: 12,
  fontWeight: "600",
},

statusApproved: {
  backgroundColor: "#DCFCE7",
  paddingVertical: 5,
  paddingHorizontal: 12,
  borderRadius: 20,
},

statusTextApproved: {
  color: "#15803D",
  fontSize: 12,
  fontWeight: "600",
},
lockedField: {
  backgroundColor: "#F3F4F6",
  borderColor: "#D1D5DB",
  opacity: 0.7,
},
colContact: {
  flex: 1.5,
  alignItems: "center",
},

contactText: {
  fontSize: 13,
  color: "#374151",
  fontWeight: "500",
},
taskNameText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#111827",
},

taskDescriptionText: {
  fontSize: 12,
  color: "#6B7280",
  marginTop: 4,
},
notesCard: {
  backgroundColor: "#F8FAFC",
  padding: 16,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#E2E8F0",
},

notesText: {
  fontSize: 14,
  color: "#374151",
  lineHeight: 20,
},

checkbox: {
  width: 22,
  height: 22,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: "#CBD5E1",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#FFFFFF",
},

checkboxChecked: {
  backgroundColor: "#16A34A",
  borderColor: "#16A34A",
},
masterAssignContainer: {
  paddingHorizontal: 24,
  paddingBottom: 10,
},

masterAssignBtn: {
  backgroundColor: "#EEF2FF",
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: "#6366F1",
  alignSelf: "flex-start",
},

masterAssignText: {
  color: "#4F46E5",
  fontWeight: "600",
},
headerMasterBtn: {
  backgroundColor: "#2563EB",
  paddingHorizontal: 18,
  paddingVertical: 10,
  borderRadius: 8,
  shadowColor: "#2563EB",
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 3,
},

headerMasterBtnText: {
  color: "#FFFFFF",
  fontWeight: "600",
  fontSize: 14,
},

checkboxApproved: {
  backgroundColor: "#15803D",
  borderColor: "#15803D",
},

checkboxTick: {
  color: "#FFFFFF",
  fontWeight: "700",
  fontSize: 14,
},
notesCardFull: {
  backgroundColor: "#F8FAFC",
  padding: 18,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#E2E8F0",
  marginBottom: 10,
},
designImage: {
  width: "100%",
  height: "100%",
},
measurementGroupTitle: {
  fontSize: 14,
  fontWeight: "700",
  marginTop: 12,
  marginBottom: 8,
  color: "#111827",
},

measurementRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginBottom: 10,
},

measurementBox: {
  width: "20%",   
 margin: 10
},
});