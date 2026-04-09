import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import axios from "axios";

const BASE_URL = "https://dlume-boutique-backend.onrender.com";

export default function ReceiptListScreen({ onSelectReceipt }) {
  const { user } = useContext(AuthContext);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
const res = await axios.get(`${BASE_URL}/api/receipt`, {
  headers: {
    Authorization: `Bearer ${user?.token}`,
  },
});      if (res.data.success) {
        const sorted = res.data.data.sort(
          (a, b) => new Date(b.receipt_date) - new Date(a.receipt_date)
        );
        const formatted = sorted.map((receipt) => ({
          id: receipt._id,
          receiptNo: receipt.receipt_no,
          rawDate: receipt.receipt_date
            ? new Date(receipt.receipt_date).toISOString().split("T")[0]
            : "",
          date: receipt.receipt_date
            ? new Date(receipt.receipt_date).toLocaleDateString("en-GB")
            : "",
          amount: receipt.total_amount || 0,
          mode: receipt.payment_mode || "-",
        }));
        setReceipts(formatted);
      }
    } catch (err) {
      console.log("RECEIPT LIST ERROR:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceipt = async (receiptId) => {
    try {
      const res = await axios.delete(`${BASE_URL}/api/receipt/${receiptId}`, {
  headers: {
    Authorization: `Bearer ${user?.token}`,
  },
});
      if (res.data.success) {
        Alert.alert("Deleted", "Receipt deleted successfully");
        fetchReceipts();
      }
    } catch (err) {
      console.log("DELETE RECEIPT ERROR:", err.message);
      Alert.alert("Error", "Failed to delete receipt");
    }
  };

  const buildMarkedDates = () => {
    if (!startDate && !endDate) return {};
    const marked = {};
    if (startDate && !endDate) {
      marked[startDate] = { startingDay: true, endingDay: true, color: "#2563EB", textColor: "#fff" };
      return marked;
    }
    if (startDate && endDate) {
      let current = new Date(startDate);
      const end = new Date(endDate);
      while (current <= end) {
        const key = current.toISOString().split("T")[0];
        const isStart = key === startDate;
        const isEnd = key === endDate;
        marked[key] = {
          color: isStart || isEnd ? "#2563EB" : "#BFDBFE",
          textColor: isStart || isEnd ? "#fff" : "#1D4ED8",
          startingDay: isStart,
          endingDay: isEnd,
        };
        current.setDate(current.getDate() + 1);
      }
    }
    return marked;
  };

  const handleDayPress = (day) => {
    const picked = day.dateString;
    if (selectingFor === "start") {
      setStartDate(picked);
      setEndDate("");
      setSelectingFor("end");
    } else {
      if (picked < startDate) {
        setEndDate(startDate);
        setStartDate(picked);
      } else {
        setEndDate(picked);
      }
      setCalendarVisible(false);
      setSelectingFor(null);
    }
  };

  const openCalendar = (forWhich) => {
    setSelectingFor(forWhich);
    setCalendarVisible(true);
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const formatDisplay = (ymd) => {
    if (!ymd) return "";
    const [y, m, d] = ymd.split("-");
    return `${d}/${m}/${y}`;
  };

  const filteredReceipts = receipts.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      item.receiptNo?.toLowerCase().includes(query) ||
      item.date?.toLowerCase().includes(query);

    let matchesRange = true;
    if (startDate && item.rawDate) matchesRange = item.rawDate >= startDate;
    if (endDate && item.rawDate) matchesRange = matchesRange && item.rawDate <= endDate;

    return matchesSearch && matchesRange;
  });

  const totalAmount = filteredReceipts.reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0
  );

  const renderRow = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onSelectReceipt(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.colReceipt}>
        <Text style={styles.receiptText}>{item.receiptNo}</Text>
      </View>
      <View style={styles.colDate}>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <View style={styles.colAmount}>
        <Text style={styles.amountText}>₹{Number(item.amount).toLocaleString()}</Text>
      </View>
      <View style={styles.colMode}>
        <Text style={styles.modeText}>{item.mode}</Text>
      </View>
      <View style={styles.colDelete}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Delete Receipt",
              "Are you sure you want to delete this receipt?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: () => handleDeleteReceipt(item.id) },
              ]
            )
          }
        >
          <Feather name="trash-2" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* ── HEADER ── */}
        <View style={styles.header}>

         <View style={styles.titleRow}>

  {/* Title LEFT */}
  <Text style={styles.headerTitle}>Receipts</Text>

  {/* Search RIGHT */}
  <View style={styles.searchContainer}>
    <Feather name="search" size={15} color="#9CA3AF" style={{ marginRight: 8 }} />

    <TextInput
      style={styles.searchInput}
      placeholder="Search receipts…"
      placeholderTextColor="#9CA3AF"
      value={searchQuery}
      onChangeText={setSearchQuery}
    />

    {searchQuery.length > 0 && (
      <TouchableOpacity onPress={() => setSearchQuery("")}>
        <Feather name="x" size={14} color="#9CA3AF" />
      </TouchableOpacity>
    )}
  </View>

</View>

          {/* Row 2: Total + Date range filter */}
         <View style={styles.filterRow}>

  {/* FILTER LEFT */}
  <View style={styles.filterLeft}>
    <Feather name="calendar" size={14} color="#6B7280" />

    <TouchableOpacity
      style={[styles.dateChip, startDate ? styles.dateChipActive : null]}
      onPress={() => openCalendar("start")}
    >
      <Text
        style={[
          styles.dateChipText,
          startDate ? styles.dateChipTextActive : null,
        ]}
      >
        {startDate ? formatDisplay(startDate) : "From"}
      </Text>
    </TouchableOpacity>

    <View style={styles.dateSeparator} />

    <TouchableOpacity
      style={[styles.dateChip, endDate ? styles.dateChipActive : null]}
      onPress={() => openCalendar("end")}
    >
      <Text
        style={[
          styles.dateChipText,
          endDate ? styles.dateChipTextActive : null,
        ]}
      >
        {endDate ? formatDisplay(endDate) : "To"}
      </Text>
    </TouchableOpacity>

    {(startDate || endDate) && (
      <TouchableOpacity onPress={clearDateFilter} style={styles.clearBtn}>
        <Feather name="x-circle" size={15} color="#DC2626" />
      </TouchableOpacity>
    )}
  </View>

  {/* TOTAL RIGHT */}
  <View style={styles.totalBox}>
    <Text style={styles.totalLabel}>TOTAL</Text>
    <Text style={styles.totalAmount}>₹{totalAmount.toLocaleString()}</Text>
  </View>

</View>

        </View>

        {/* ── TABLE HEADER ── */}
        <View style={styles.tableHeader}>
          <View style={styles.colReceipt}>
            <Text style={styles.tableHeaderText}>Receipt No</Text>
          </View>
          <View style={styles.colDate}>
            <Text style={styles.tableHeaderText}>Date</Text>
          </View>
          <View style={styles.colAmount}>
            <Text style={styles.tableHeaderText}>Amount</Text>
          </View>
          <View style={styles.colMode}>
            <Text style={styles.tableHeaderText}>Mode</Text>
          </View>
          <View style={styles.colDelete}>
            <Feather name="trash-2" size={14} color="#D1D5DB" />
          </View>
        </View>

        {/* ── LIST ── */}
        <FlatList
          data={filteredReceipts}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No receipts found.</Text>
          }
        />

        {/* ── CALENDAR MODAL ── */}
        <Modal
          visible={calendarVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCalendarVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setCalendarVisible(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectingFor === "start" ? "Select Start Date" : "Select End Date"}
                </Text>
                <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                  <Feather name="x" size={20} color="#374151" />
                </TouchableOpacity>
              </View>

              {startDate && selectingFor === "end" && (
                <Text style={styles.rangeHint}>
                  Start: {formatDisplay(startDate)} — tap end date
                </Text>
              )}

              <Calendar
                onDayPress={handleDayPress}
                markingType="period"
                markedDates={buildMarkedDates()}
                theme={{
                  backgroundColor: "#ffffff",
                  calendarBackground: "#ffffff",
                  textSectionTitleColor: "#6B7280",
                  selectedDayBackgroundColor: "#2563EB",
                  selectedDayTextColor: "#ffffff",
                  todayTextColor: "#2563EB",
                  dayTextColor: "#111827",
                  textDisabledColor: "#D1D5DB",
                  dotColor: "#2563EB",
                  arrowColor: "#2563EB",
                  monthTextColor: "#111827",
                  textDayFontSize: 13,
                  textMonthFontSize: 14,
                  textMonthFontWeight: "700",
                  textDayHeaderFontSize: 11,
                }}
              />

              {(startDate || endDate) && (
                <TouchableOpacity
                  onPress={() => { clearDateFilter(); setCalendarVisible(false); }}
                  style={styles.modalClearBtn}
                >
                  <Text style={styles.modalClearText}>Clear selection</Text>
                </TouchableOpacity>
              )}
            </Pressable>
          </Pressable>
        </Modal>

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

  // ── Header ── (matches BillsScreen)
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  searchContainer: {
    width: 220,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },

  // ── Filter row (Total + Date range) ──
filterRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

  filterLeft: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},
  totalBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.8,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A",
  },
  filterRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  dateChip: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#F9FAFB",
  },
  dateChipActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  dateChipText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  dateChipTextActive: {
    color: "#2563EB",
  },
  dateSeparator: {
    width: 10,
    height: 1,
    backgroundColor: "#D1D5DB",
  },
  clearBtn: {
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Table ──
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
  row: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },
  colReceipt: { flex: 1.5 },
  colDate: { flex: 1.5 },
  colAmount: { flex: 1 },
  colMode: { flex: 1 },
  colDelete: { flex: 0.3, alignItems: "center" },

  receiptText: { fontWeight: "600", color: "#111827", fontSize: 13 },
  dateText: { color: "#374151", fontSize: 13 },
  amountText: { fontWeight: "700", color: "#16A34A", fontSize: 13 },
  modeText: { fontWeight: "500", color: "#2563EB", fontSize: 13 },
  emptyText: { textAlign: "center", marginTop: 40, color: "#9CA3AF", fontSize: 14 },

  // ── Calendar Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    width: "100%",
    maxWidth: 380,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  rangeHint: {
    fontSize: 11,
    color: "#2563EB",
    textAlign: "center",
    paddingVertical: 6,
    backgroundColor: "#EFF6FF",
  },
  modalClearBtn: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
  },
  modalClearText: { color: "#DC2626", fontWeight: "600", fontSize: 13 },
});