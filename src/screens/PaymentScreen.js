import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import axios from "axios";

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

function CalendarPicker({ visible, selectedDate, onSelect, onClose }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d) =>
    d &&
    selectedDate.getDate() === d &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getFullYear() === viewYear;

  const isToday = (d) =>
    d &&
    today.getDate() === d &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;



  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={cal.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={cal.box}>
          {/* Header */}
          <View style={cal.header}>
            <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
              <Text style={cal.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={cal.monthTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
              <Text style={cal.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={cal.dayRow}>
            {DAY_NAMES.map((d) => (
              <Text key={d} style={cal.dayLabel}>{d}</Text>
            ))}
          </View>

          {/* Date grid */}
          <View style={cal.grid}>
            {cells.map((d, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  cal.cell,
                  isSelected(d) && cal.cellSelected,
                  isToday(d) && !isSelected(d) && cal.cellToday,
                  !d && cal.cellEmpty,
                ]}
                onPress={() => {
                  if (!d) return;
                  onSelect(new Date(viewYear, viewMonth, d));
                }}
                disabled={!d}
              >
                <Text
                  style={[
                    cal.cellText,
                    isSelected(d) && cal.cellTextSelected,
                    isToday(d) && !isSelected(d) && cal.cellTextToday,
                  ]}
                >
                  {d || ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={cal.actions}>
            <TouchableOpacity onPress={onClose} style={cal.closeBtn}>
              <Text style={cal.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function Dropdown({ visible, options, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={dd.overlay} activeOpacity={1} onPress={onClose}>
        <View style={dd.box}>
          <Text style={dd.title}>Select Payment Method</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={dd.item} onPress={() => onSelect(item)}>
                <Text style={dd.itemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function PaymentScreen({
  orders,   
  totalAmount,
  customer,
  type,
  onBack,
  onSuccess,
}) {

console.log("PaymentScreen props:", {
  orders,
  totalAmount,
  customer,
  type,
});
  const [amount, setAmount] = useState(
  totalAmount ? totalAmount.toString() : "0"
);
  const [method, setMethod] = useState("");
const selectedDate = new Date();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
const isMultipleOrders = orders?.length > 1;
  useEffect(() => {
  if (isMultipleOrders) {
    setAmount(totalAmount?.toString() || "0");
  }
}, [isMultipleOrders, totalAmount]);

  const formattedDate = selectedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const handleSubmit = () => {
  const numericAmount = Number(amount);

  if (!method) { Alert.alert("Error", "Please select payment method"); return; }
  if (isNaN(numericAmount) || numericAmount <= 0) { Alert.alert("Error", "Enter valid amount"); return; }
  if (numericAmount > totalAmount) { Alert.alert("Error", "Amount cannot exceed outstanding balance"); return; }

  Alert.alert("Confirm Payment", `Amount: ₹${numericAmount}\nMethod: ${method}\nDate: ${formattedDate}`, [
    { text: "Cancel", style: "cancel" },
    {
      text: "Confirm",
      onPress: async () => {
        try {
          setLoading(true);
          const isStaffPayment = type === "staff";
          const url = isStaffPayment
            ? "https://dlume-boutique-backend.onrender.com/api/add-staff-payment"
            : "https://dlume-boutique-backend.onrender.com/api/add-payment";

          // ✅ FIX 1: Scale applied_amount proportionally to what the user entered
          const totalBalance = (orders || []).reduce((s, o) => s + Number(o.applied_amount || 0), 0);
          const ratio = totalBalance > 0 ? numericAmount / totalBalance : 1;

          const cleanOrders = (orders || []).map(o => ({
            order_id: String(o.order_id || o._id || o),
            applied_amount: Number((Number(o.applied_amount || 0) * ratio).toFixed(2)),
          }));

 const body = isStaffPayment
  ? {
      customer_id: customer?._id,
      orders: cleanOrders,
      taskIds: (orders || []).map(o => String(o.task_id)), // staff needs taskIds
      amount: numericAmount,
      payment_mode: method,
      payment_date: selectedDate,
    }
  : {
      customer_id: customer?._id,
      orders: cleanOrders,
      orderIds: cleanOrders.map(o => o.order_id),          //  customer needs orderIds
      amount: numericAmount,
      payment_mode: method,
      payment_date: selectedDate,
    };
          const response = await axios.post(url, body);

          if (response.data.success) {
            // ✅ FIX 2: Pass the actual numericAmount, not recomputed finalAmount
            onSuccess({
              amount: numericAmount,
              method,
              customer,
              date: formattedDate,
              receipt: response.data.receipt,
            });
          } else {
            Alert.alert("Payment Failed", response.data.message);
          }
        } catch (error) {
          Alert.alert("Payment Failed", error.response?.data?.message || "Server error");
        } finally {
          setLoading(false);
        }
      },
    },
  ]);
};





  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Outstanding Balance */}
          <View style={styles.outstandingCard}>
            <Text style={styles.outstandingLabel}>Outstanding Balance</Text>
<Text style={styles.outstandingValue}>
  {"₹" + Number(totalAmount || 0).toFixed(2)}
</Text>
          </View>

          {/* Payment Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Details</Text>

            {/* Amount */}
            <Text style={styles.label}>Payment Amount *</Text>
           <TextInput
  style={[
    styles.input,
    isMultipleOrders && { backgroundColor: "#eee", color: "#888" },
  ]}
  value={amount}
  keyboardType="numeric"
  onChangeText={setAmount}
  editable={!isMultipleOrders}
/>
            <Text style={styles.maxText}>
              Maximum: ₹{totalAmount?.toFixed(2)}
            </Text>

            {/* Payment Method Dropdown */}
            <Text style={styles.label}>Payment Method *</Text>
            <TouchableOpacity
              style={[styles.input, styles.dropdownTrigger]}
              onPress={() => setShowDropdown(true)}
              activeOpacity={0.7}
            >
              <Text style={method ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {method || "Select payment method"}
              </Text>
              <Text style={styles.dropdownArrow}>▾</Text>
            </TouchableOpacity>

    {/* Payment Date */}
<Text style={styles.label}>Payment Date</Text>
<View style={styles.input}>
  <Text style={styles.dropdownValue}>📅 {formattedDate}</Text>
</View>

</View>

{/* Buttons */}
<View style={styles.buttonRow}>
  <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
    <Text style={styles.cancelText}>Cancel</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.submitBtn, loading && { opacity: 0.6 }]}
    onPress={handleSubmit}
    disabled={loading}
  >
    <Text style={styles.submitText}>
      {loading ? "Processing..." : "Submit Payment"}
    </Text>
  </TouchableOpacity>
</View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals outside ScrollView */}
    
      <Dropdown
        visible={showDropdown}
        options={PAYMENT_METHODS}
        onSelect={(item) => { setMethod(item); setShowDropdown(false); }}
        onClose={() => setShowDropdown(false)}
      />
    </SafeAreaView>
  );
}

/* ─── Main Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },
  content: { padding: 16, paddingBottom: 40, flexGrow: 1 },

  outstandingCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    alignItems: "center",
  },
  outstandingLabel: { fontSize: 14, color: "#666", marginBottom: 6 },
  outstandingValue: { fontSize: 24, fontWeight: "bold", color: "#d32f2f" },

  card: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: "#333" },

  label: { fontSize: 14, marginBottom: 6, marginTop: 12, color: "#555", fontWeight: "500" },
  input: {
    backgroundColor: "#f9fafc",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  maxText: { fontSize: 12, color: "#888", marginTop: 4 },

  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownPlaceholder: { fontSize: 14, color: "#aaa" },
  dropdownValue: { fontSize: 14, color: "#333" },
  dropdownArrow: { fontSize: 16, color: "#666" },

  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  cancelBtn: {
    flex: 1, backgroundColor: "#e0e0e0", paddingVertical: 14,
    borderRadius: 10, alignItems: "center", marginRight: 10,
  },
  cancelText: { color: "#333", fontWeight: "600" },
  submitBtn: {
    flex: 1, backgroundColor: "#2e7d32", paddingVertical: 14,
    borderRadius: 10, alignItems: "center",
  },
  submitText: { color: "#ffffff", fontWeight: "600" },
});

/* ─── Calendar Styles ─────────────────────────────────────────────────────── */
const cal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center",
  },
  box: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20,
    width: 320, elevation: 10,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  navBtn: { padding: 6 },
  navArrow: { fontSize: 26, color: "#2e7d32", lineHeight: 28 },
  monthTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  dayRow: { flexDirection: "row", marginBottom: 6 },
  dayLabel: { flex: 1, textAlign: "center", fontSize: 12, color: "#888", fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    justifyContent: "center", alignItems: "center",
    borderRadius: 100, marginVertical: 2,
  },
  cellEmpty: {},
  cellSelected: { backgroundColor: "#2e7d32" },
  cellToday: { borderWidth: 1.5, borderColor: "#2e7d32" },
  cellText: { fontSize: 13, color: "#333" },
  cellTextSelected: { color: "#fff", fontWeight: "bold" },
  cellTextToday: { color: "#2e7d32", fontWeight: "bold" },
  actions: { marginTop: 12, alignItems: "flex-end" },
  closeBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#f0f0f0", borderRadius: 8 },
  closeBtnText: { color: "#555", fontWeight: "600" },
});

/* ─── Dropdown Styles ─────────────────────────────────────────────────────── */
const dd = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center",
  },
  box: {
    backgroundColor: "#fff", borderRadius: 14, width: 300,
    maxHeight: 360, overflow: "hidden", elevation: 10,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10,
  },
  title: {
    fontSize: 15, fontWeight: "bold", color: "#333",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee",
  },
  item: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  itemText: { fontSize: 15, color: "#333" },
});