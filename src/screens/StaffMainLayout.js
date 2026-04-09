import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
    Alert,  
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import OrderScreen from "./OrderScreen"; // ✅ IMPORT YOUR EXISTING ORDER SCREEN

export default function StaffMainLayout() {
  const [activeScreen, setActiveScreen] = useState("MyOrders");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout, user } = useContext(AuthContext);

  const renderContent = () => {
    return (
      <OrderScreen
        goToAddOrder={() => {}}
        selectedOrderFromDashboard={null}
        clearSelectedOrderFromDashboard={() => {}}
      />
    );
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

  const MenuItem = ({ title, icon }) => (
    <TouchableOpacity
      onPress={() => setActiveScreen(title)}
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
      {/* SIDEBAR */}
      <View style={[styles.sidebar, { width: isCollapsed ? 80 : 280 }]}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsCollapsed(!isCollapsed)}
        >
          <Text style={styles.toggleIcon}>
            {isCollapsed ? "➤" : "◀"}
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.profileSection,
            isCollapsed && styles.profileSectionCollapsed,
          ]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.first_name?.charAt(0)?.toUpperCase() || "S"}
            </Text>
          </View>

          {!isCollapsed && (
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.first_name || "Staff"} {user?.last_name || ""}
              </Text>
              <View style={styles.profileBadge}>
                <Text style={styles.profileBadgeText}>
                  {user?.first_name || ""} {user?.last_name || ""}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.menuContainer}>
          <MenuItem title="MyOrders" icon="📦" />
        </View>

        <TouchableOpacity
onPress={handleLogout}
          style={[
            styles.logoutButton,
            isCollapsed && styles.logoutButtonCollapsed,
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

      {/* MAIN CONTENT */}
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
    backgroundColor: "#F8F9FA",
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
    backgroundColor: "#4F46E5",
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
    marginBottom: 4,
  },

  profileBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },

  profileBadgeText: {
    fontSize: 10,
    color: "#4F46E5",
    fontWeight: "600",
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
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
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
    color: "#4F46E5",
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
    backgroundColor: "#F8F9FA",
  },

  // ========== PLACEHOLDER ==========
  placeholderContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
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

  // ========== SCREEN STYLES ==========
  screenContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 28,
  },

  screenHeader: {
    marginBottom: 28,
  },

  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 6,
  },

  screenSubtitle: {
    fontSize: 14,
    color: "#6C757D",
  },

  placeholderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  placeholderIcon: {
    fontSize: 56,
    marginBottom: 16,
    opacity: 0.3,
  },

  placeholderTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },

  placeholderDescription: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    maxWidth: 400,
  },

  // ========== EARNINGS SCREEN ==========
  earningsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 28,
  },

  earningsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  earningsLabel: {
    fontSize: 13,
    color: "#6C757D",
    marginBottom: 8,
    fontWeight: "500",
  },

  earningsValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#212529",
  },

  // ========== PROFILE SCREEN ==========
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },

  profileAvatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  profileDetails: {
    gap: 20,
  },

  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  profileLabel: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
  },

  profileValue: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "600",
  },

  editProfileButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },

  editProfileText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  orderCard: {
  backgroundColor: "#FFFFFF",
  padding: 20,
  borderRadius: 12,
  marginBottom: 12,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
},

orderTitle: {
  fontSize: 16,
  fontWeight: "700",
  color: "#212529",
  marginBottom: 6,
},

orderDescription: {
  fontSize: 13,
  color: "#6C757D",
  marginBottom: 8,
},

orderAmount: {
  fontSize: 14,
  fontWeight: "700",
  color: "#4F46E5",
},
buttonRow: {
  flexDirection: "row",
  marginTop: 12,
},

startButton: {
  backgroundColor: "#059669",
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 8,
},

endButton: {
  backgroundColor: "#DC2626",
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 8,
},

buttonText: {
  color: "#FFFFFF",
  fontWeight: "600",
  fontSize: 13,
},

completedBadge: {
  backgroundColor: "#D1FAE5",
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 8,
},

completedText: {
  color: "#059669",
  fontWeight: "600",
},
pauseButton: {
  backgroundColor: "#F59E0B",
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 8,
  marginRight: 8,
},

resumeButton: {
  backgroundColor: "#2563EB",
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 8,
},

modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
},

modalBox: {
  backgroundColor: "#FFFFFF",
  width: 350,
  padding: 20,
  borderRadius: 12,
},

modalTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 12,
},

input: {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 8,
  padding: 10,
  marginBottom: 16,
  minHeight: 60,
},

modalButtons: {
  flexDirection: "row",
  justifyContent: "space-between",
},

cancelButton: {
  backgroundColor: "#9CA3AF",
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 8,
},
orderHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

orderNumber: {
  fontSize: 14,
  fontWeight: "700",
  color: "#111827",
},

clientName: {
  fontSize: 13,
  color: "#6B7280",
  marginTop: 2,
},

expandedSection: {
  marginTop: 14,
  paddingTop: 14,
  borderTopWidth: 1,
  borderTopColor: "#F3F4F6",
},

detailLabel: {
  fontSize: 14,
  fontWeight: "600",
  marginBottom: 6,
},

detailText: {
  fontSize: 13,
  color: "#6B7280",
  marginBottom: 4,
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
  maxHeight: "85%",
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 28,
  elevation: 25,
},
modalTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: "#111827",
  marginBottom: 16,
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
  fontSize: 11,
  color: "#6B7280",
},

measurementValue: {
  fontSize: 13,
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
modalButtonRow: {
  flexDirection: "row",
  marginTop: 24,
  gap: 12,
  justifyContent: "flex-end",
},

closeBtn: {
  backgroundColor: "#F3F4F6",
  paddingHorizontal: 24,
  paddingVertical: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#D1D5DB",
},

closeBtnText: {
  color: "#374151",
  fontSize: 14,
  fontWeight: "600",
},
approvedBadge: {
  backgroundColor: "#DBEAFE",
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 8,
},

approvedText: {
  color: "#2563EB",
  fontWeight: "600",
},
filterRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 16,
  marginBottom: 16,
  gap: 10,
},

filterButton: {
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: 20,
  backgroundColor: "#F3F4F6",
},

filterButtonActive: {
  backgroundColor: "#4F46E5",
},

filterText: {
  fontSize: 12,
  fontWeight: "600",
  color: "#374151",
},

filterTextActive: {
  color: "#FFFFFF",
},


});