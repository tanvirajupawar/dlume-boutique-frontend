import React, { useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { Modal, ScrollView } from "react-native";
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Alert } from "react-native";

export default function StaffScreen({ onViewStaff }) {
  const { user } = useContext(AuthContext);
const [searchQuery, setSearchQuery] = useState("");
const [staff, setStaff] = useState([]);
const [showAddPanel, setShowAddPanel] = useState(false);


const [formData, setFormData] = useState({
  first_name: "",
  last_name: "",
   password: "",
  contact_no_1: "",
  contact_no_2: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  pincode: "",
  designation: "",
});

React.useEffect(() => {
  fetchStaff();
}, []);

const fetchStaff = async () => {
  try {
  const response = await axios.get(
  "https://dlume-boutique-backend.onrender.com/api/staff",
  {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  }
);

    if (response.data.success) {
      setStaff(response.data.data);
    }
  } catch (error) {
    console.log("Fetch staff error:", error.message);
  }
};


const handleDeleteStaff = async (staffId) => {
  try {
    const response = await axios.delete(`https://dlume-boutique-backend.onrender.com/api/staff/${staffId}`, {
  headers: {
    Authorization: `Bearer ${user?.token}`,
  },
});

    if (response.data.success) {
      Alert.alert("Deleted", "Staff deleted successfully");
      fetchStaff();
    }
  } catch (error) {
    console.log("Delete staff error:", error.message);
    Alert.alert("Error", "Failed to delete staff");
  }
};

const filteredStaff = staff.filter((member) => {
  const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
const phone = member.contact_no_1 || "";
  const city = member.city || "";

  return (
    fullName.includes(searchQuery.toLowerCase()) ||
    phone.includes(searchQuery) ||
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );
});


  const handleViewDetails = (member) => {
    if (onViewStaff) {
      onViewStaff(member);
    }
  };

const renderStaffRow = ({ item }) => (
  <TouchableOpacity 
    style={styles.staffRow}
    onPress={() => handleViewDetails(item)}
    activeOpacity={0.7}
  >
<View style={styles.staffName}>
  <Text style={styles.nameText} numberOfLines={1}>
    {item.first_name} {item.last_name}
  </Text>
</View>

<View style={styles.staffPhone}>
  <Text style={styles.phoneText} numberOfLines={1}>
  {item.contact_no_1 || "—"}
  </Text>
</View>

    <View style={styles.staffAddress}>
      <Text style={styles.addressText} numberOfLines={1}>
        {item.city || "—"}
      </Text>
    </View>

    <View style={styles.staffRole}>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>
          {item.designation || "Staff"}
        </Text>
      </View>
    </View>

    <View style={styles.staffDelete}>
  <TouchableOpacity
    onPress={() =>
      Alert.alert(
        "Delete Staff",
        "Are you sure you want to delete this staff member?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", onPress: () => handleDeleteStaff(item._id) },
        ]
      )
    }
  >
    <Feather name="trash-2" size={18} color="#DC2626" />
  </TouchableOpacity>
</View>
  </TouchableOpacity>
);


const handleSubmit = async () => {
  try {
 if (!formData.first_name || !formData.last_name) {
  alert("First Name and Last Name are required");
  return;
}
    // Remove password completely
    const { password, ...staffOnlyData } = formData;

const response = await axios.post(  "https://dlume-boutique-backend.onrender.com/api/staff",
  staffOnlyData,
  {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  }
);

    if (response.data.success) {
      alert("Staff created successfully");

      await fetchStaff();
      setShowAddPanel(false);

      setFormData({
        first_name: "",
        last_name: "",
        password: "",
        contact_no_1: "",
        contact_no_2: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        pincode: "",
        designation: "",
      });
    }
  } catch (error) {
    console.log("Add staff error:", error.response?.data || error.message);
    alert("Failed to add staff");
  }
};






  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Staff Management</Text>
          <View style={styles.headerRight}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search Staff"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
<TouchableOpacity 
  style={styles.addButton}
  onPress={() => setShowAddPanel(true)}
>
              <Text style={styles.addButtonText}>+ Add Staff</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <View style={styles.staffName}>
            <Text style={styles.tableHeaderText}>Name</Text>
          </View>
          <View style={styles.staffPhone}>
            <Text style={styles.tableHeaderText}>Phone</Text>
          </View>
          <View style={styles.staffAddress}>
            <Text style={styles.tableHeaderText}>Address</Text>
          </View>
          <View style={styles.staffRole}>
            <Text style={styles.tableHeaderText}>Role</Text>
          </View>
          <View style={styles.staffDelete}>
  <Feather name="trash-2" size={16} color="#6B7280" />
</View>
        </View>

        {/* Staff List */}
        <FlatList
          data={filteredStaff}
          renderItem={renderStaffRow}
keyExtractor={(item) => item._id}
          style={styles.staffList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No staff members found</Text>
            </View>
          }
        />
      </View>

<Modal
  visible={showAddPanel}
  animationType="slide"
  transparent
>
  <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowAddPanel(false)}
            style={styles.backButtonStyled}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backTextStyled}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Add Staff</Text>

          <TouchableOpacity
            style={styles.saveHeaderButton}
            onPress={handleSubmit}
          >
            <Text style={styles.saveHeaderText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }}>

          {/* SAME STRUCTURE AS StaffDetailScreen */}
<ScrollView
  style={{ flex: 1 }}
  contentContainerStyle={{ padding: 16 }}
  showsVerticalScrollIndicator={false}
>

  <View style={styles.topRowModal}>

    {/* Personal Information Card */}
    <View style={styles.cardHalf}>
      <Text style={styles.cardTitle}>Personal Information</Text>

      <View style={styles.cardContent}>
        <TextInput
          style={styles.input}
          placeholder="First Name *"
          value={formData.first_name}
          onChangeText={(text) =>
            setFormData({ ...formData, first_name: text })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Last Name *"
          value={formData.last_name}
          onChangeText={(text) =>
            setFormData({ ...formData, last_name: text })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Phone"
          keyboardType="numeric"
          value={formData.contact_no_1}
          onChangeText={(text) =>
            setFormData({ ...formData, contact_no_1: text })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Designation"
          value={formData.designation}
          onChangeText={(text) =>
            setFormData({ ...formData, designation: text })
          }
        />
      </View>
    </View>

    {/* Address Information Card */}
    <View style={styles.cardHalf}>
      <Text style={styles.cardTitle}>Address Information</Text>

      <View style={styles.cardContent}>
        <TextInput
          style={styles.input}
          placeholder="Address Line 1"
          value={formData.address_line_1}
          onChangeText={(text) =>
            setFormData({ ...formData, address_line_1: text })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Address Line 2"
          value={formData.address_line_2}
          onChangeText={(text) =>
            setFormData({ ...formData, address_line_2: text })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="City"
          value={formData.city}
          onChangeText={(text) =>
            setFormData({ ...formData, city: text })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="State"
          value={formData.state}
          onChangeText={(text) =>
            setFormData({ ...formData, state: text })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Pincode"
          keyboardType="numeric"
          value={formData.pincode}
          onChangeText={(text) =>
            setFormData({ ...formData, pincode: text })
          }
        />
      </View>
    </View>

  </View>

</ScrollView>
        </ScrollView>

      </SafeAreaView>
    </KeyboardAvoidingView>
  </View>
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
    minWidth: 250,
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

  // ========== STAFF LIST ==========
  staffList: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 24,
  },
  staffRow: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },

  // ========== COLUMNS ==========
staffName: {
  flex: 1.8,
  justifyContent: "center",
},

nameText: {
  fontSize: 14,
  color: "#111827",
  fontWeight: "600",
},

staffPhone: {
  flex: 1.6,
  justifyContent: "center",
},

phoneText: {
  fontSize: 13,
  color: "#111827",
  fontWeight: "500",
},

staffAddress: {
  flex: 1.6,
  justifyContent: "center",
},

addressText: {
  fontSize: 13,
  color: "#6B7280",
  fontWeight: "400",
},

staffRole: {
  flex: 1,
  justifyContent: "center",
  alignItems: "flex-start",
},
  roleBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
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
  input: {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  padding: 10,
  borderRadius: 6,
  marginBottom: 12,
},
sheetOverlay: {
  flex: 1,
  backgroundColor: "#F9FAFB",
  justifyContent: "flex-end",
},

sheetContainer: {
  flex: 1,
  backgroundColor: "#FFFFFF",
  paddingHorizontal: 28,
  paddingTop: 20,
  paddingBottom: 20,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
},

sheetHandle: {
  width: 50,
  height: 4,
  backgroundColor: "#D1D5DB",
  alignSelf: "center",
  borderRadius: 3,
  marginBottom: 18,
},

sheetTitle: {
  fontSize: 20,
  fontWeight: "600",
  color: "#111827",
  marginBottom: 24,
},

formRow: {
  flexDirection: "row",
  gap: 24,
},

formColumn: {
  flex: 1,
},

sheetInput: {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 8,
  paddingVertical: 14,
  paddingHorizontal: 14,
  fontSize: 14,
  color: "#111827",
  marginBottom: 16,
  backgroundColor: "#FFFFFF",
},

sheetButtons: {
  flexDirection: "row",
  justifyContent: "flex-end",
  alignItems: "center",
  borderTopWidth: 1,
  borderTopColor: "#E5E7EB",
  paddingTop: 20,
},

cancelBtn: {
  backgroundColor: "#E5E7EB",
  paddingHorizontal: 22,
  paddingVertical: 10,
  borderRadius: 8,
  marginRight: 14,
},

cancelText: {
  fontSize: 14,
  fontWeight: "500",
  color: "#374151",
},

saveBtn: {
  backgroundColor: "#2563EB",
  paddingHorizontal: 22,
  paddingVertical: 10,
  borderRadius: 8,

  shadowColor: "#2563EB",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 3,
},

saveText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#FFFFFF",
},
formContent: {
  paddingBottom: 40,
},

saveHeaderButton: {
  backgroundColor: "#2563EB",
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: 20,
},

saveHeaderText: {
  color: "#FFFFFF",
  fontWeight: "600",
},
cardFull: {
  backgroundColor: "#FFFFFF",
  borderRadius: 10,
  padding: 16,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  marginBottom: 16,
},
topRowModal: {
  flexDirection: "row",
  gap: 16,
},

cardHalf: {
  flex: 1,
  backgroundColor: "#FFFFFF",
  borderRadius: 10,
  padding: 16,
  borderWidth: 1,
  borderColor: "#E5E7EB",
},
cardTitle: {
  fontSize: 14,
  fontWeight: "600",
  color: "#666666",
  marginBottom: 14,   // 👈 ADD THIS
  textTransform: "uppercase",
  letterSpacing: 0.5,
},
cardTitle: {
  fontSize: 14,
  fontWeight: "600",
  color: "#666666",
  marginBottom: 14,   // 👈 ADD THIS
  textTransform: "uppercase",
  letterSpacing: 0.5,
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
header: {
  backgroundColor: "#FFFFFF",
  paddingHorizontal: 20,
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: "#E5E7EB",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

staffDelete: {
  flex: 0.6,
  alignItems: "center",
},
});