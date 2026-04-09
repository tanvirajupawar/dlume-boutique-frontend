import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useEffect } from "react";
import axios from "axios";


export default function DashboardScreen({ onNewOrder, onViewOrder }){
const { user } = useContext(AuthContext);

console.log("🔥 USER:", user);
console.log("🔥 TOKEN:", user?.token);
const [awaitingPickups, setAwaitingPickups] = useState([]);


const [stats, setStats] = useState({
  todayRevenue: 0,
  totalOrders: 0,
  delivered: 0,
  pending: 0,
  monthlyRevenue: 0,
});

const handleMarkAsDelivered = (orderId) => {
  Alert.alert(
    "Confirm Delivery",
    "Are you sure you want to mark this order as Delivered?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, Deliver",
        onPress: async () => {
          try {
            await axios.put(
              `https://dlume-boutique-backend.onrender.com/api/orders/${orderId}`,
            { order_status: "Delivered" }
            );

            // 🔥 Refresh complete dashboard data
          fetchDashboard();
fetchOrders();

          } catch (error) {
            console.log("Error updating order", error);
          }
        },
      },
    ]
  );
};


useEffect(() => {
  if (user?.token) {
    fetchDashboard();
    fetchOrders();
  }
}, [user]);





const fetchDashboard = async () => {
  try {
    console.log("🔥 TOKEN SENT:", user?.token);

    const response = await axios.get(
      "https://dlume-boutique-backend.onrender.com/api/dashboard",
      {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      }
    );

    console.log("✅ DASHBOARD RESPONSE:", response.data);

    if (response.data.success) {
      const data = response.data.data;

      setStats({
        todayRevenue: data.todayRevenue,
        totalOrders: data.totalOrders,
        delivered: data.delivered,
        pending: data.pending,
        monthlyRevenue: data.monthlyRevenue,
      });
    }
  } catch (error) {
    console.log("❌ Dashboard error FULL:", error.response?.data || error.message);
  }
};

const fetchOrders = async () => {
  try {
    console.log("🔥 TOKEN SENT (orders):", user?.token);

    const response = await axios.get(
      "https://dlume-boutique-backend.onrender.com/api/orders",
      {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      }
    );

    console.log("✅ ORDERS RESPONSE:", response.data);

    if (response.data.success) {
      const formattedOrders = response.data.data.map(order => ({
        ...order,
        contact_number: order.customer_id?.contact_no_1 || "-",
      }));

      const readyOrders = formattedOrders.filter(
        (order) => order.order_status === "Approved"
      );

      setAwaitingPickups(readyOrders);
    }
  } catch (error) {
    console.log("❌ Orders error FULL:", error.response?.data || error.message);
  }
};

const today = new Date();

const formattedDate = today.toLocaleDateString("en-IN", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const hour = today.getHours();

let greeting = "Good Evening";

if (hour < 12) greeting = "Good Morning";
else if (hour < 17) greeting = "Good Afternoon";


  return (
<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
  <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
<Text style={styles.greeting}>
  {greeting},{" "}
  {(user?.fullName ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Admin")
    ?.charAt(0)
    ?.toUpperCase() +
    (user?.fullName ||
      user?.first_name ||
      user?.email?.split("@")[0] ||
      "Admin")
      ?.slice(1)}
</Text>

<Text style={styles.date}>{formattedDate}</Text> 
</View>
        <TouchableOpacity 
          style={styles.createOrderBtn}
          onPress={onNewOrder}
        >
          <Text style={styles.createOrderIcon}>+</Text>
          <Text style={styles.createOrderText}>New Order</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
     {/* Stats Overview */}
<View style={styles.statsContainer}>
  <View style={styles.mainStat}>
    <Text style={styles.mainStatLabel}>Today's Revenue</Text>

    <Text style={styles.mainStatValue}>
      ₹{stats.todayRevenue.toLocaleString()}
    </Text>

    <View style={styles.mainStatFooter}>
      <View style={styles.miniStat}>
        <Text style={styles.miniStatValue}>
          {stats.totalOrders}
        </Text>
        <Text style={styles.miniStatLabel}>Orders</Text>
      </View>

      <View style={styles.miniStat}>
        <Text style={styles.miniStatValue}>
          {stats.delivered}
        </Text>
        <Text style={styles.miniStatLabel}>Delivered</Text>
      </View>

      <View style={styles.miniStat}>
        <Text style={styles.miniStatValue}>
          {stats.pending}
        </Text>
        <Text style={styles.miniStatLabel}>Pending</Text>
      </View>
    </View>
  </View>

  <View style={styles.sideStat}>
    <View style={styles.sideStatItem}>
      <Text style={styles.sideStatIcon}>📦</Text>
      <View>
        <Text style={styles.sideStatValue}>
     {awaitingPickups.length}
        </Text>
        <Text style={styles.sideStatLabel}>
          Ready for Pickup
        </Text>
      </View>
    </View>

    <View style={styles.sideStatItem}>
      <Text style={styles.sideStatIcon}>💰</Text>
      <View>
        <Text style={styles.sideStatValue}>
          ₹{stats.monthlyRevenue.toLocaleString()}
        </Text>
        <Text style={styles.sideStatLabel}>
          This Month
        </Text>
      </View>
    </View>
  </View>
</View>

  
      {/* Awaiting Pickups */}
<View style={styles.pickupsSection}>
  <Text style={styles.sectionTitle}>Ready for Pickup</Text>

  {awaitingPickups.length > 0 ? (
    <View style={styles.pickupsList}>
      {awaitingPickups.map((order) => (
        <View key={order._id} style={styles.pickupItem}>
          
          {/* LEFT */}
          <View style={styles.pickupLeft}>
            <View style={styles.pickupBadge}>
              <Text style={styles.pickupBadgeText}>
                Ready
              </Text>
            </View>

            <View style={styles.pickupInfo}>
             <Text style={styles.pickupOrderNum}>
  {order.order_no || `#${order._id.slice(-4)}`}
</Text>
              <Text style={styles.pickupCustomer}>
                {order.customer_name}
              </Text>
            </View>
          </View>

          {/* CENTER */}
          <View style={styles.pickupCenter}>
        <Text style={styles.pickupPhone}>
  {order.contact_number || "-"}
</Text>
            <Text style={styles.pickupItems}>
{Number(order.total || 0).toLocaleString()}
            </Text>
          </View>

          {/* RIGHT */}
       
<View style={{ flexDirection: "row", gap: 10 }}>
  
<TouchableOpacity
  style={styles.pickupViewBtn}
  onPress={() => onViewOrder(order)}
>
  <Text style={styles.pickupViewText}>View</Text>
</TouchableOpacity>


<TouchableOpacity
  style={styles.pickupDeliverBtn}
  activeOpacity={0.8}
  onPress={() => handleMarkAsDelivered(order._id)}
>
  <Text style={styles.pickupDeliverText}>
    Mark Delivered
  </Text>
</TouchableOpacity>

</View>


        </View>
      ))}
    </View>
  ) : (
    <View style={styles.emptyPickups}>
      <Text style={styles.emptyIcon}>✓</Text>
      <Text style={styles.emptyText}>All orders delivered</Text>
    </View>
  )}
</View>



      </ScrollView>
    </View>
</SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  // Top Bar
  topBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  topBarLeft: {
    gap: 4,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  date: {
    fontSize: 13,
    color: "#6C757D",
  },
  createOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  createOrderIcon: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  createOrderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Scroll Content
  scrollContent: {
    flex: 1,
  },

  // Stats Container
  statsContainer: {
    flexDirection: "row",
    padding: 28,
    gap: 20,
  },
  mainStat: {
    flex: 2,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 24,
  },
  mainStatLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
    fontWeight: "500",
  },
  mainStatValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  mainStatFooter: {
    flexDirection: "row",
    gap: 24,
  },
  miniStat: {
    gap: 4,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  miniStatLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
  },
  sideStat: {
    flex: 1,
    gap: 20,
  },
  sideStatItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  sideStatIcon: {
    fontSize: 32,
  },
  sideStatValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  sideStatLabel: {
    fontSize: 12,
    color: "#6C757D",
  },

  // Pickups Section
  pickupsSection: {
    paddingHorizontal: 28,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 16,
  },
  pickupsList: {
    gap: 12,
  },
  pickupItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickupLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 2,
  },
  pickupBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pickupBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },
  pickupInfo: {
    gap: 4,
  },
  pickupOrderNum: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212529",
  },
  pickupCustomer: {
    fontSize: 13,
    color: "#6C757D",
  },
  pickupCenter: {
    flex: 2,
    gap: 4,
  },
  pickupPhone: {
    fontSize: 13,
    fontWeight: "600",
    color: "#212529",
  },
  pickupItems: {
    fontSize: 12,
    color: "#6C757D",
  },
  pickupDeliverBtn: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DEE2E6",
  },
  pickupDeliverText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#212529",
  },
  emptyPickups: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 50,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
    opacity: 0.4,
  },
  emptyText: {
    fontSize: 14,
    color: "#6C757D",
  },
  safeArea: {
  flex: 1,
  backgroundColor: "#F8F9FA",
},

container: {
  flex: 1,
},
pickupViewBtn: {
  backgroundColor: "#2563EB",
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 8,
},

pickupViewText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#FFFFFF",
},

  
});