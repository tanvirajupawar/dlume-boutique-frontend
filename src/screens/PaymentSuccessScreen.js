import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentSuccessScreen({
  amount,
  method,
  date,
  customer,
  onDone,
  onBack,
}) {
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(10)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(14)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);

    // 1. Check circle pops in
    Animated.spring(checkScale, {
      toValue: 1,
      friction: 6,
      tension: 45,
      useNativeDriver: true,
    }).start();
    Animated.timing(checkOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 2. Title + subtitle fade in
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 500, easing: ease, useNativeDriver: true }),
      ]).start();
    }, 400);

    // 3. Card slides up
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 500, easing: ease, useNativeDriver: true }),
      ]).start();
    }, 650);

    // 4. Buttons fade in
    setTimeout(() => {
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 950);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerWrapper}>

        {/* Success Icon */}
        <Animated.View style={[styles.iconCircle, {
          transform: [{ scale: checkScale }],
          opacity: checkOpacity,
        }]}>
          <Text style={styles.checkIcon}>✓</Text>
        </Animated.View>

        {/* Title + Subtitle */}
        <Animated.View style={{
          alignItems: "center",
          opacity: titleOpacity,
          transform: [{ translateY: titleY }],
        }}>
          <Text style={styles.title}>Payment Successful</Text>
          <Text style={styles.subtitle}>
            The payment has been recorded successfully.
          </Text>
        </Animated.View>

        {/* Summary Card */}
        <Animated.View style={[styles.card, {
          opacity: cardOpacity,
          transform: [{ translateY: cardY }],
        }]}>
          <View style={styles.row}>
<Text style={styles.label}>
  {customer?.contact_no_1 ? "Customer" : "Staff"}
</Text>
          <Text style={styles.value}>
  {customer?.first_name || "—"} {customer?.last_name || ""}
</Text>

          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount Paid</Text>
            <Text style={styles.amount}>₹{amount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{method}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date</Text>
            <Text style={styles.value}>{date}</Text>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={{ alignItems: "center", opacity: btnOpacity }}>
          <TouchableOpacity style={styles.doneButton} onPress={onDone}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
  },
  centerWrapper: {
    width: 420,
    maxWidth: "90%",
    alignItems: "center",
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E6F4EA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  checkIcon: {
    fontSize: 42,
    color: "#16A34A",
    fontWeight: "bold",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16A34A",
  },
  doneButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 14,
  },
  doneText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  backText: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "500",
  },
});