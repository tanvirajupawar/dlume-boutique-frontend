import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";

import { Dimensions } from "react-native";
import { Animated } from "react-native";
import { useRef } from "react";
import axios from "axios";

import { AuthContext } from "../context/AuthContext";
import DashboardScreen from "./DashboardScreen";
import AddOrderScreen from "./AddOrderScreen";
import CustomerContainer from "./CustomerContainer";
import OrderScreen from "./OrderScreen";
import StaffContainer from "./StaffContainer";
import BillsScreen from "./BillsScreen";
import CustomerDetailScreen from "./CustomerDetailScreen";
import PaymentScreen from "./PaymentScreen";
import PaymentSuccessScreen from "./PaymentSuccessScreen";
import ReceiptDetailScreen from "./ReceiptDetailScreen";
import ReceiptListScreen from "./ReceiptListScreen";
import AddCustomerScreen from "./AddCustomerScreen";
import DebugOrderScreen from "./DebugOrderScreen";
import { Alert } from "react-native";



export default function MainLayout() {
  const [activeScreen, setActiveScreen] = useState("Home");
  const [isCollapsed, setIsCollapsed] = useState(false);
const { logout, user, role } = useContext(AuthContext);

const [selectedOrderFromDashboard, setSelectedOrderFromDashboard] = useState(null);


const [selectedCustomer, setSelectedCustomer] = useState(null);
const [selectedOrdersForPayment, setSelectedOrdersForPayment] = useState(null);
const [paymentSuccessData, setPaymentSuccessData] = useState(null);
const [selectedReceiptId, setSelectedReceiptId] = useState(null);
const [leaveHandler, setLeaveHandler] = useState(null);
const [debugLogs, setDebugLogs] = useState([]);
const handleNavigation = (navigateFn) => {
  if (leaveHandler) {
    leaveHandler(navigateFn); // call confirmLeave
  } else {
    navigateFn(); // normal navigation
  }
};


const handleLogout = () => {
  Alert.alert(
    "Logout",
    "Are you sure you want to logout?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
        },
      },
    ]
  );
};

  const renderContent = () => {
    switch (activeScreen) {
    case "Home":
  return (
    <DashboardScreen
      onNewOrder={() => setActiveScreen("AddOrder")}
      onViewOrder={(order) => {
        setSelectedOrderFromDashboard(order);
        setActiveScreen("Orders");
      }}
    />
  );

case "AddOrder":
  return (
    <AddOrderScreen
      goToOrders={() => setActiveScreen("Orders")}
      setLeaveHandler={setLeaveHandler}


      openDebug={(logs) => {
        setDebugLogs(logs);
        setActiveScreen("DebugOrder");
      }}
    />
  );
case "Customers":
  return (
    <CustomerContainer
      onViewCustomer={(customer) => {
        setSelectedCustomer(customer);
        setActiveScreen("CustomerDetail");
      }}
      onAddCustomer={() => setActiveScreen("AddCustomer")}
    />
  );

  case "AddCustomer":
  return (
    <AddCustomerScreen
      onBack={() => setActiveScreen("Customers")}
      onSuccess={() => setActiveScreen("Customers")}
    />
  );


  case "CustomerDetail":
  return (
    <CustomerDetailScreen
      customer={selectedCustomer}
      onBack={() => setActiveScreen("Customers")}
      onPay={({ selectedOrders, totalAmount, customer }) => {
        setSelectedOrdersForPayment({
          selectedOrders,
          totalAmount,
          customer,
        });
        setActiveScreen("Payment");
      }}
    />
  );

case "Payment":
  if (!selectedOrdersForPayment) {
    return null;
  }

  return (
    <PaymentScreen
      selectedOrders={selectedOrdersForPayment?.selectedOrders}
      totalAmount={selectedOrdersForPayment?.totalAmount}
      customer={selectedOrdersForPayment?.customer}
      onBack={() => setActiveScreen("CustomerDetail")}
      onSuccess={(data) => {
        console.log("SWITCHING TO SUCCESS");
        setPaymentSuccessData(data);
        setActiveScreen("PaymentSuccess");
      }}
    />
  );




case "PaymentSuccess":
  return (
    <PaymentSuccessScreen
      amount={paymentSuccessData?.amount}
      method={paymentSuccessData?.method}
      date={paymentSuccessData?.date}
            customer={paymentSuccessData?.customer}   
      onDone={() => setActiveScreen("CustomerDetail")}
      onBack={() => setActiveScreen("CustomerDetail")}
    />
  );



case "Orders":
  return (
    <OrderScreen
      goToAddOrder={() => setActiveScreen("AddOrder")}
      selectedOrderFromDashboard={selectedOrderFromDashboard}
      clearSelectedOrderFromDashboard={() =>
        setSelectedOrderFromDashboard(null)
      }
    />
  );

case "Receipts":
  return (
    <ReceiptListScreen
      onSelectReceipt={(id) => {
        setSelectedReceiptId(id);
        setActiveScreen("ReceiptDetail");
      }}
    />
  );

case "ReceiptDetail":
  return (
    <ReceiptDetailScreen
      receiptId={selectedReceiptId}
      onBack={() => setActiveScreen("Receipts")}
    />
  );


case "DebugOrder":
  return (
    <DebugOrderScreen
      logs={debugLogs}
      onBack={() => setActiveScreen("AddOrder")}
    />
  );


      case "Staff":
        return <StaffContainer />
;
      case "Bills":
        return <BillsScreen />;
      default:
        return (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>{activeScreen}</Text>
            <Text style={styles.placeholderSubtext}>Coming soon...</Text>
          </View>
        );
    }

    
  };

  

  const MenuItem = ({ title, icon }) => (
    <TouchableOpacity
onPress={() => handleNavigation(() => setActiveScreen(title))}
      style={[
        styles.menuItem,
        activeScreen === title && styles.menuItemActive,
        isCollapsed && styles.menuItemCollapsed,
      ]}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      {!isCollapsed && (
        <Text
          style={[
            styles.menuText,
            activeScreen === title && styles.menuTextActive,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );




  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View
        style={[
          styles.sidebar,
          { width: isCollapsed ? 80 : 280 },
        ]}
      >
        {/* Toggle Button */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsCollapsed(!isCollapsed)}
        >
          <Text style={styles.toggleIcon}>
            {isCollapsed ? "➤" : "◀"}
          </Text>
        </TouchableOpacity>

        {/* Profile */}
        <View style={[
          styles.profileSection,
          isCollapsed && styles.profileSectionCollapsed
        ]}>
          <View style={styles.avatar}>
<Text style={styles.avatarText}>
  {user?.fullName?.charAt(0)?.toUpperCase() ||
   user?.first_name?.charAt(0)?.toUpperCase() ||
   "A"}
</Text>
          </View>
          {!isCollapsed && (
          <View style={styles.profileInfo}>
  <Text style={styles.profileName}>
    {user?.fullName || user?.first_name || "Admin"}
  </Text>

  <Text style={styles.profileEmail}>
    {user?.email || ""}
  </Text>
</View>

          )}
        </View>

        {/* Menu */}
<View style={styles.menuContainer}>
  <MenuItem title="Home" icon="🏠" />
  <MenuItem title="Customers" icon="👥" />
  <MenuItem title="Bills" icon="💳" />
  <MenuItem title="Receipts" icon="🧾" />

  {role === "admin" && (
    <MenuItem title="Staff" icon="👤" />
  )}

  <MenuItem title="Orders" icon="📦" />
</View>

        {/* Logout */}
        <TouchableOpacity 
onPress={handleLogout}
          style={[
            styles.logoutButton,
            isCollapsed && styles.logoutButtonCollapsed
          ]}
        >
          <Text style={styles.menuIcon}>⎋</Text>
          {!isCollapsed && (
            <Text style={styles.logoutText}>Logout</Text>
          )}
        </TouchableOpacity>

        {!isCollapsed && (
          <Text style={styles.sidebarFooter}>
            2025 Archie's Designer Wear
          </Text>
        )}
      </View>

  
{/* Main Content */}
<View style={styles.mainContent}>
  {renderContent()}
</View>






    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FAFBFC",
  },

  // ========== SIDEBAR ==========
  sidebar: {
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  toggleButton: {
    alignSelf: "flex-end",
    marginBottom: 12,
    padding: 4,
  },

  toggleIcon: {
    fontSize: 16,
    color: "#6B7280",
  },

  // ========== PROFILE ==========
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  profileSectionCollapsed: {
    justifyContent: "center",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontWeight: "700",
    fontSize: 18,
    color: "#FFFFFF",
  },

  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },

  profileName: {
    fontWeight: "600",
    fontSize: 14,
    color: "#111827",
  },

  profileEmail: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },

  // ========== MENU ==========
  menuContainer: {
    flex: 1,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },

  menuItemCollapsed: {
    justifyContent: "center",
    paddingHorizontal: 0,
  },

  menuItemActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  menuIcon: {
    fontSize: 20,
  },

  menuText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  menuTextActive: {
    color: "#2563EB",
    fontWeight: "600",
  },

  // ========== LOGOUT ==========
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: 8,
  },

  logoutButtonCollapsed: {
    justifyContent: "center",
    paddingHorizontal: 0,
  },

  logoutText: {
    marginLeft: 12,
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "600",
  },

  sidebarFooter: {
    fontSize: 9,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 12,
    opacity: 0.6,
  },

  // ========== MAIN CONTENT ==========
  mainContent: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },

  // ========== PLACEHOLDER ==========
  placeholderContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFBFC",
  },

  placeholderText: {
    fontSize: 32,
    fontWeight: "300",
    color: "#111827",
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  placeholderSubtext: {
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "400",
  },
  overlayContainer: {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  elevation: 9999,
},

overlayBackground: {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
},

sidePanel: {
  position: "absolute",
  right: 0,
  top: 0,
  bottom: 0,
  width: Dimensions.get("window").width * 0.35,
  backgroundColor: "#FFFFFF",
  padding: 28,
  borderLeftWidth: 1,
  borderLeftColor: "#E5E7EB",
  elevation: 20,
},
panelTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 20,
},

panelInput: {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 10,
  padding: 14,
  marginBottom: 16,
  fontSize: 14,
  backgroundColor: "#F9FAFB",
},

panelButtons: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 15,
  borderTopWidth: 1,
  borderTopColor: "#F3F4F6",
},

panelSave: {
  backgroundColor: "#2563EB",
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 10,
},
panelHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
},

panelHeaderButtons: {
  flexDirection: "row",
  alignItems: "center",
  gap: 16,
},

cancelText: {
  color: "#6B7280",
  fontWeight: "600",
},

headerSaveButton: {
  backgroundColor: "#2563EB",
  paddingHorizontal: 18,
  paddingVertical: 8,
  borderRadius: 8,
},

headerSaveText: {
  color: "#FFFFFF",
  fontWeight: "600",
},


});