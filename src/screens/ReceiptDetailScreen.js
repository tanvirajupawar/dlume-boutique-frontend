import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
const BASE_URL = "https://dlume-boutique-backend.onrender.com";

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

export default function ReceiptScreen({ receiptId, onBack }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!receiptId) {
      setReceipt(null);
      setLoading(false);
      return;
    }
    fetchReceipt();
  }, [receiptId]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/receipt/${receiptId}`);
      if (res.data.success) {
        setReceipt(res.data.data);
      } else {
        setReceipt(null);
      }
    } catch (err) {
      console.log("RECEIPT FETCH ERROR:", err.message);
      setReceipt(null);
    } finally {
      setLoading(false);
    }
  };

const generatePDF = async () => {
  if (!receipt) return;





  try {
  const customer = receipt.orders?.[0]?.order_id?.customer_id;

  const html = `
  <html>
  <head>
  <style>
    body {
      font-family: 'Helvetica', Arial, sans-serif;
      padding: 40px;
      color: #1f2937;
    }

    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 3px solid #111827;
      padding-bottom: 15px;
    }

    .brand {
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 1px;
    }

    .tagline {
      font-size: 13px;
      color: #6b7280;
    }

    .receipt-info {
      text-align: right;
      font-size: 13px;
    }

    .status {
      margin-top: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      display: inline-block;
      background-color: #d1fae5;
      color: #059669;
    }

    .section {
      margin-top: 30px;
    }

    .section-title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #374151;
      text-transform: uppercase;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    th {
      background-color: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-size: 13px;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }

    .summary-box {
      margin-top: 30px;
      width: 320px;
      float: right;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .total-row {
      font-weight: bold;
      font-size: 16px;
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
    }

    .footer {
      margin-top: 70px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  </style>
  </head>

  <body>

  <div class="header">
    <div>
      <div class="brand">ARCHIE'S</div>
      <div class="tagline">Luxury Custom Tailoring</div>
    </div>

    <div class="receipt-info">
      <div><strong>Receipt No:</strong> ${receipt.receipt_no}</div>
      <div><strong>Date:</strong> ${new Date(receipt.receipt_date).toLocaleDateString("en-GB")}</div>
      <div class="status">Paid</div>
    </div>
  </div>

  ${
    customer
      ? `
      <div class="section">
        <div class="section-title">Customer Details</div>
        <div><strong>Name:</strong> ${customer.first_name || ""} ${customer.last_name || ""}</div>
        <div><strong>Mobile:</strong> ${customer.contact_no_1 || ""}</div>
      </div>
      `
      : ""
  }

  <div class="section">
    <div class="section-title">Payment Details</div>
    <div><strong>Mode:</strong> ${receipt.payment_mode}</div>
    ${
      receipt.transaction_no
        ? `<div><strong>Transaction No:</strong> ${receipt.transaction_no}</div>`
        : ""
    }
  </div>

  <div class="section">
    <div class="section-title">Linked Orders</div>

    <table>
      <tr>
        <th>Order No</th>
        <th>Total</th>
      </tr>
      ${
    receipt.orders?.map(
  (o) => `
    <tr>
      <td>${o.order_id?.order_no}</td>
      <td>₹${o.applied_amount}</td>
    </tr>
  `
)
          .join("") || ""
      }
    </table>
  </div>

  <div class="summary-box">
    <div class="summary-row total-row">
      <span>Amount Paid</span>
      <span>₹${receipt.total_amount}</span>
    </div>
  </div>

  <div style="clear: both;"></div>

  <div class="footer">
    Thank you for choosing ARCHIE'S.  
    This is a system-generated receipt.
  </div>

  </body>
  </html>
  `;

    // 1️⃣ Generate PDF
    const { uri } = await Print.printToFileAsync({ html });

    // 2️⃣ Clean receipt number
    const cleanReceiptNo = (receipt.receipt_no || "Receipt")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");

    const newFileName = `Receipt_${cleanReceiptNo}.pdf`;

    // 3️⃣ Create proper path
    const newPath = FileSystem.documentDirectory + newFileName;

    // 4️⃣ Delete old file if exists (important for multiple clicks)
    const fileInfo = await FileSystem.getInfoAsync(newPath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(newPath);
    }

    // 5️⃣ Copy newly generated file
    await FileSystem.copyAsync({
      from: uri,
      to: newPath,
    });

    // 6️⃣ Share file
    await Sharing.shareAsync(newPath);

  } catch (error) {
    console.log("PDF GENERATION ERROR:", error);
  }
};


  if (!receiptId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No receipt selected.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Receipt not found.</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

 const customer = receipt.orders?.[0]?.order_id?.customer_id;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 🔹 Top Action Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={18}
            color="#111827"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={generatePDF}>
          <MaterialCommunityIcons
            name="share-variant"
            size={16}
            color="#2563EB"
          />
        </TouchableOpacity>
      </View>

      {/* 🔹 Receipt Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.brand}>D'Lume Boutique</Text>
          <Text style={styles.subtitle}>Payment Receipt</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Row label="Receipt No." value={receipt.receipt_no} />
          <Row
            label="Date"
            value={new Date(receipt.receipt_date).toLocaleDateString(
              "en-GB"
            )}
          />
        </View>

        {customer && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer</Text>
              <Row
                label="Name"
                value={`${customer.first_name} ${customer.last_name}`}
              />
              <Row label="Phone" value={customer.contact_no_1} />
            </View>
          </>
        )}

        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Linked Orders</Text>
        {receipt.orders?.map((item) => (
  <Row
    key={item._id}
    label={`Order #${item.order_id?.order_no}`}
    value={`₹ ${item.applied_amount}`}
  />
))}
        </View>

        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Row label="Mode" value={receipt.payment_mode} />
          {receipt.transaction_no && (
            <Row label="Transaction No." value={receipt.transaction_no} />
          )}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Amount Paid</Text>
        <Text style={styles.totalValue}>₹ {receipt.total_amount}</Text>
        </View>

        <Text style={styles.footer}>
          Thank you for your payment 🙏
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingTop: 28, // 🔥 added spacing from top
    paddingHorizontal: 16,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  backBtn: {
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 8,
    elevation: 2,
  },

  shareBtn: {
    backgroundColor: "#E0F2FE",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 3,
  },

  header: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },

  brand: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 1.5,
  },

  subtitle: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },

  section: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  rowLabel: {
    fontSize: 13,
    color: "#6B7280",
  },

  rowValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 24,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
  },

  backLink: {
    color: "#2563EB",
    fontWeight: "600",
  },
});