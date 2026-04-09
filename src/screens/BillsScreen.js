import React, { useState, useEffect } from "react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import { Feather } from "@expo/vector-icons";

const BASE_URL = "https://dlume-boutique-backend.onrender.com";

export default function BillsScreen() {
   const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [bills, setBills] = useState([]);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
const response = await axios.get(`${BASE_URL}/api/invoices`, {
  headers: {
    Authorization: `Bearer ${user?.token}`,
  },
});      const invoices =
        response.data?.data?.invoices ||
        response.data?.data ||
        response.data ||
        [];

      if (!Array.isArray(invoices)) {
        setBills([]);
        return;
      }

      const sortedInvoices = invoices.sort(
        (a, b) => new Date(b.invoice_date) - new Date(a.invoice_date)
      );

      const formatted = sortedInvoices.map((invoice) => ({
        id: invoice._id,
        orderNumber: invoice.order_id?.order_no || "-",
        invoiceDate: invoice.order_id?.order_date
          ? new Date(invoice.order_id.order_date).toLocaleDateString("en-GB")
          : "",
        customer:
          (invoice.client_id?.first_name || "") +
          " " +
          (invoice.client_id?.last_name || ""),
        total: invoice.order_id?.total || 0,
      }));

      setBills(formatted);
    } catch (error) {
      console.log("Error fetching bills", error.response?.data || error.message);
    }
  };

  const filteredBills = bills.filter((bill) => {
    const query = searchQuery.toLowerCase().trim();
    const customer = bill.customer ? bill.customer.toLowerCase() : "";
    const date = bill.invoiceDate ? bill.invoiceDate.toLowerCase() : "";
    const orderNo = bill.orderNumber
      ? bill.orderNumber.toString().toLowerCase()
      : "";
    return (
      customer.includes(query) ||
      date.includes(query) ||
      orderNo.includes(query)
    );
  });

  const getBase64Image = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.log("Image base64 error:", url, error.message);
      return null;
    }
  };

  const handleViewPDF = async (bill) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/invoices/${bill.id}`, {
  headers: {
    Authorization: `Bearer ${user?.token}`,
  },
});
      if (!response.data.success) {
        alert("Invoice not found");
        return;
      }

      const invoice = response.data.data;

      // ─── FIELD RESOLUTION ─────────────────────────────────────────────────
      // The invoice API response nests order data under `order_id`.
      // AddOrderScreen saves payment fields as:
      //   received_amount, discount, payment_method, balance
      // The invoice document may also have these at the top level — so we
      // check both places with fallbacks to catch either API shape.
      // ──────────────────────────────────────────────────────────────────────
      const order = invoice.order_id || {};
      console.log("🧾 ORDER DATA:", order);
console.log("💰 RECEIVED AMOUNT:", order.received_amount);
console.log("💰 INVOICE RECEIVED:", invoice.received_amount);

      const discount = Number(
        order.discount ?? invoice.discount ?? 0
      );
const paid = Number(
  invoice.paid_amount ??
  invoice.received_amount ??
  invoice.order_id?.received_amount ??
  0
);



const paymentMethod =
        order.payment_method ||
        invoice.payment_method ||
        "";
      const paymentStatus =
        order.payment_status ||
        invoice.payment_status ||
        "Pending";

      const orderId = order._id || invoice.order_id;



      let garmentsSource = [];
      if (orderId) {
        try {
          const garmentRes = await axios.get(
            `${BASE_URL}/api/order-details/order/${orderId}`
          );
          garmentsSource = garmentRes.data?.data || [];
        } catch (e) {
          garmentsSource = invoice.garments || [];
        }
      }

      const orderNo   = order.order_no || "-";
      const orderDate = order.order_date
        ? new Date(order.order_date).toLocaleDateString("en-GB")
        : "—";

      const rawDelivery = garmentsSource?.find((g) => g.delivery_date)?.delivery_date;

      // Safely parse delivery date — handles both ISO ("2025-03-15T00:00:00.000Z")
      // and dd/mm/yyyy strings. new Date("15/03/2025") returns Invalid Date in
      // most JS engines because that format is non-standard.
      const parseDeliveryDate = (raw) => {
        if (!raw) return null;
        if (raw.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(raw)) {
          const d = new Date(raw);
          return isNaN(d) ? null : d;
        }
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
          const [dd, mm, yyyy] = raw.split("/");
          const d = new Date(`${yyyy}-${mm}-${dd}`);
          return isNaN(d) ? null : d;
        }
        const d = new Date(raw);
        return isNaN(d) ? null : d;
      };

      // parsedDelivery kept for reference; per-garment dates are in the table rows

      // Subtotal: re-calculate from garment data (source of truth)
      const subtotal = garmentsSource.reduce((sum, garment) => {
        const base  = Number(garment.price || 0);
        const extra = (garment.extraWork || []).reduce(
          (s, w) => s + Number(w.amount || 0), 0
        );
        return sum + base + extra;
      }, 0);

const grandTotal = Number(invoice.total || (subtotal - discount));
const actualPaid = Number(
  order.initial_advance ?? 0
);
console.log("✅ FINAL ACTUAL PAID:", actualPaid);
const balance = grandTotal - actualPaid;
const isPaid     = balance <= 0 && grandTotal > 0;
      // Convert images to base64
      const garmentsWithBase64 = await Promise.all(
        garmentsSource.map(async (g) => {
          const clothUrl = g.clothImage
            ? g.clothImage.startsWith("http")
              ? g.clothImage
              : `${BASE_URL}/uploads/${g.clothImage}`
            : null;
          const designUrl = g.designImage
            ? g.designImage.startsWith("http")
              ? g.designImage
              : `${BASE_URL}/uploads/${g.designImage}`
            : null;
          return {
            ...g,
            clothBase64:  clothUrl  ? await getBase64Image(clothUrl)  : null,
            designBase64: designUrl ? await getBase64Image(designUrl) : null,
          };
        })
      );

      const hasImages = garmentsWithBase64.some(
        (g) => g.clothBase64 || g.designBase64
      );

      // ─── IMAGE CARDS ───────────────────────────────────────────────────────
      // expo-print's WebKit renderer ignores CSS object-fit on <img>.
      // Using background-image with background-size:contain is the only
      // reliable way to fit an image inside a fixed square without cropping.
      // ──────────────────────────────────────────────────────────────────────
const makeImageCell = (base64, label) => `
  <div style="
    width:25%;
    padding:6px;
  ">
    <div style="
      font-size:10px;
      font-weight:600;
      color:#666;
      margin-bottom:4px;
      text-align:center;
    ">
      ${label}
    </div>

    <div style="
      width:100%;
      height:110px;
      border:1px solid #ddd;
      border-radius:6px;
      background:#f9f9f9;
      background-image:url('${base64}');
      background-repeat:no-repeat;
      background-position:center;
      background-size:contain;
    "></div>
  </div>
`;

const imageCardsHTML = `
  <div style="
    width:100%;
    display:flex;
    flex-wrap:wrap;
  ">
 ${garmentsWithBase64.flatMap((g, i) => {
  const cells = [];

  if (g.clothBase64)
    cells.push(makeImageCell(g.clothBase64, `G${i + 1} — Cloth`));

  // ❌ HIDE DESIGN IMAGE (do not delete)
  // if (g.designBase64)
  //   cells.push(makeImageCell(g.designBase64, `G${i + 1} — Design`));

  return cells;
}).join("")}
  </div>
`;

      // ─── GARMENT ROWS ──────────────────────────────────────────────────────
     const garmentRowsHTML = garmentsWithBase64
  .map((garment, index) => {
    const basePrice  = Number(garment.price || 0);
    const extraTotal = (garment.extraWork || []).reduce(
      (s, w) => s + Number(w.amount || 0), 0
    );
    const garmentTotal = basePrice + extraTotal;

    const workLines = [
      ...(basePrice > 0
        ? [`<div style="font-size:12px;color:#555;margin-bottom:3px;">Base price: ₹${basePrice.toLocaleString()}</div>`]
        : []),
      ...(garment.extraWork || []).map(
        (w) => `<div style="font-size:12px;color:#777;margin-bottom:3px;">${w.name}: ₹${Number(w.amount || 0).toLocaleString()}</div>`
      ),
    ].join("") || "<span style='color:#ccc;font-size:12px;'>—</span>";

    const gDelivery = parseDeliveryDate(garment.delivery_date);
    const gDeliveryStr = gDelivery
      ? gDelivery.toLocaleDateString("en-GB")
      : "—";

    return `
      <tr>
        <td style="padding:13px 14px;font-weight:700;font-size:13px;color:#222;border-bottom:1px solid #eee;">
          Garment ${index + 1}
        </td>

        <!-- 🔥 IMAGE COLUMN -->
<td style="padding:10px;border-bottom:1px solid #eee;width:15%;">
  <div style="
    width:100%;
    display:flex;
    justify-content:center;
    align-items:center;
  ">
    ${
      garment.clothBase64
        ? `<div style="
            width:60px;
            height:60px;
            border-radius:6px;
            background-image:url('${garment.clothBase64}');
            background-size:contain;
            background-repeat:no-repeat;
            background-position:center;
          "></div>`
        : `<span style="color:#ccc;">—</span>`
    }
  </div>
</td>

        <td style="padding:13px 14px;border-bottom:1px solid #eee;">
          ${workLines}
        </td>

        <td style="padding:13px 14px;text-align:center;border-bottom:1px solid #eee;">
          ${gDeliveryStr}
        </td>

        <td style="padding:13px 14px;text-align:right;border-bottom:1px solid #eee;">
          ₹${garmentTotal.toLocaleString()}
        </td>
      </tr>
    `;
  })
  .join("");

      // ─── CONDITIONAL PAYMENT ROWS ──────────────────────────────────────────
      const discountRowHTML = discount > 0
        ? `<tr>
            <td style="padding:10px 16px;font-size:12px;color:#555;border-bottom:1px solid #eee;">Discount</td>
            <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#c05c00;text-align:right;border-bottom:1px solid #eee;">− ₹${discount.toLocaleString()}</td>
           </tr>`
        : "";

      const methodBadge = paymentMethod
        ? ` <span style="font-size:10px;background:#f0fdf4;color:#15803d;padding:2px 7px;border-radius:4px;font-weight:700;border:1px solid #bbf7d0;">${paymentMethod}</span>`
        : "";

      // ─── FULL HTML ─────────────────────────────────────────────────────────
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
* { box-sizing:border-box; margin:0; padding:0; }

body {
  font-family: Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #222;
  background: #fff;
  line-height: 1.5;
}

/* 🔥 PRINT FIXES */
@page {
  margin: 24px;
}

table {
  page-break-inside: auto;
}

tr {
  page-break-inside: avoid;
  page-break-after: auto;
}

thead {
  display: table-header-group;
}

tfoot {
  display: table-footer-group;
}

/* Avoid breaking important sections */
.section-block {
  page-break-inside: auto;
}

/* Prevent image break */
.image-block {
  page-break-inside: auto;
}

/* Prevent summary split */
.summary-block {
  page-break-inside: avoid;
}
</style>
</head>
<body>

<!-- HEADER -->
<div style="padding:28px 40px 22px;border-bottom:2px solid #222;display:flex;justify-content:space-between;align-items:flex-start;">
  <div>
  <div style="font-size:28px;font-weight:800;letter-spacing:2px;">
  ARCHIE'S
</div>
<div style="font-size:11px;color:#888;margin-top:2px;">
  Custom Tailoring & Designer Wear
</div>
  </div>
  <div style="text-align:right;">
    <div style="font-size:12px;color:#555;margin-bottom:3px;"><b>Order No:</b> ${orderNo}</div>
    <div style="font-size:12px;color:#555;margin-bottom:3px;"><b>Order Date:</b> ${orderDate}</div>
 
  </div>
</div>

<!-- CUSTOMER -->
<div style="padding:18px 40px;background:#F9FAFB;border-bottom:1px solid #E5E7EB;">
  <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:5px;">Customer</div>
  <div style="font-size:15px;font-weight:700;color:#222;">${invoice.client_id?.first_name || ""} ${invoice.client_id?.last_name || ""}</div>
  ${invoice.client_id?.contact_no_1
    ? `<div style="font-size:12px;color:#666;margin-top:3px;">${invoice.client_id.contact_no_1}</div>`
    : ""}
</div>



<!-- COST BREAKDOWN -->
<div class="section-block" style="padding:22px 40px;border-bottom:1px solid #e5e5e5;">
  <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:12px;">Cost Breakdown</div>
<table style="width:100%;border-collapse:collapse;table-layout:fixed;">
    <thead>
      <tr>
        <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#555;border-top:1.5px solid #222;border-bottom:1.5px solid #222;width:25%;">Garment</th>
          <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#555;border-top:1.5px solid #222;border-bottom:1.5px solid #222;width:25%;text-align:center;">Image</th>
        <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#555;border-top:1.5px solid #222;border-bottom:1.5px solid #222;">Work Details</th>
              

        <th style="padding:10px 14px;text-align:center;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#555;border-top:1.5px solid #222;border-bottom:1.5px solid #222;width:15%;">Delivery</th>
        <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#555;border-top:1.5px solid #222;border-bottom:1.5px solid #222;width:15%;">Amount</th>
      </tr>
    </thead>
    <tbody>${garmentRowsHTML}</tbody>
  </table>
</div>

<!-- PAYMENT SUMMARY -->
<div class="section-block summary-block" style="padding:22px 40px;display:flex;justify-content:flex-end;">  <table style="width:280px;border-collapse:collapse;border:1px solid #e5e5e5;border-radius:6px;overflow:hidden;">
    <tr>
      <td colspan="2" style="padding:10px 16px;background:#222;color:#fff;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Payment Summary</td>
    </tr>
    <tr>
      <td style="padding:10px 16px;font-size:12px;color:#555;border-bottom:1px solid #eee;">Subtotal</td>
      <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#222;text-align:right;border-bottom:1px solid #eee;">₹${subtotal.toLocaleString()}</td>
    </tr>
    ${discountRowHTML}
    <tr style="background:#f8f8f8;">
      <td style="padding:13px 16px;font-size:14px;font-weight:800;color:#222;border-top:1.5px solid #222;border-bottom:1.5px solid #222;">Grand Total</td>
      <td style="padding:13px 16px;font-size:16px;font-weight:900;color:#222;text-align:right;border-top:1.5px solid #222;border-bottom:1.5px solid #222;">₹${grandTotal.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="padding:10px 16px;font-size:12px;color:#555;border-bottom:1px solid #eee;">Advance Paid${methodBadge}</td>
      <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#16a34a;text-align:right;border-bottom:1px solid #eee;">₹${actualPaid.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#222;">Balance Due</td>
      <td style="padding:12px 16px;font-size:14px;font-weight:800;color:${balance <= 0 ? "#16a34a" : "#dc2626"};text-align:right;">
        ${balance <= 0 ? "Paid✓" : "₹" + balance.toLocaleString()}
      </td>
    </tr>
  </table>
</div>

<!-- FOOTER -->
<div style="padding:16px 40px;border-top:1.5px solid #222;display:flex;justify-content:space-between;align-items:center;">
<div style="font-size:10px;color:#6B7280;">
  Thank you for choosing Archie's. Custom garments are non-refundable.
</div>
  <div style="font-size:11px;font-weight:900;letter-spacing:4px;text-transform:uppercase;color:#222;">Archie's</div>
</div>

</body>
</html>`;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const customerName = `${invoice.client_id?.first_name || ""}_${invoice.client_id?.last_name || ""}`
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "");

      const newFileName = `${customerName || "Customer"}_${orderNo}_${Date.now()}.pdf`;
      const originalFile = new File(uri);
      const newFile = new File(Paths.document, newFileName);

      await originalFile.move(newFile);
      await Sharing.shareAsync(newFile.uri);

    } catch (error) {
      console.log("PDF error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to generate PDF. Please try again.");
    }
  };

  const handleDeleteBill = async (billId) => {
    try {
      const response = await axios.delete(`${BASE_URL}/api/invoices/${billId}`, {
  headers: {
    Authorization: `Bearer ${user?.token}`,
  },
});
      if (response.data.success) {
        Alert.alert("Deleted", "Invoice deleted successfully");
        fetchBills();
      }
    } catch (error) {
      console.log("Delete bill error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to delete invoice");
    }
  };

  const renderBillRow = ({ item }) => (
    <View style={styles.billRow}>
      <View style={styles.billNumber}>
        <Text style={styles.numberText}>{item.orderNumber}</Text>
      </View>
      <View style={styles.billDate}>
        <Text style={styles.dateText}>{item.invoiceDate}</Text>
      </View>
      <View style={styles.billCustomer}>
        <Text style={styles.customerText}>{item.customer}</Text>
      </View>
      <View style={styles.billTotal}>
        <Text style={styles.totalText}>
          ₹{Number(item.total || 0).toLocaleString()}
        </Text>
      </View>
      <View style={styles.billPdf}>
        <TouchableOpacity onPress={() => handleViewPDF(item)}>
          <MaterialCommunityIcons name="file-pdf-box" size={22} color="#DC2626" />
        </TouchableOpacity>
      </View>
      <View style={styles.billDelete}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Delete Invoice",
              "Are you sure you want to delete this invoice?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: () => handleDeleteBill(item.id) },
              ]
            )
          }
        >
          <Feather name="trash-2" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Customer Bills</Text>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Bills"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.tableHeader}>
          <View style={styles.billNumber}>
            <Text style={styles.tableHeaderText}>Order No</Text>
          </View>
          <View style={styles.billDate}>
            <Text style={styles.tableHeaderText}>Order Date</Text>
          </View>
          <View style={styles.billCustomer}>
            <Text style={styles.tableHeaderText}>Customer</Text>
          </View>
          <View style={styles.billTotal}>
            <Text style={styles.tableHeaderText}>Total</Text>
          </View>
          <View style={styles.billPdf}>
            <MaterialCommunityIcons name="file-pdf-box" size={18} color="#6B7280" />
          </View>
          <View style={styles.billDelete}>
            <Feather name="trash-2" size={16} color="#6B7280" />
          </View>
        </View>

        <FlatList
          data={filteredBills}
          renderItem={renderBillRow}
          keyExtractor={(item) => item.id}
          style={styles.billsList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No bills found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1, backgroundColor: "#F9FAFB" },
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
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#111827" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 300,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: "#111827" },
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
  billsList: { flex: 1, backgroundColor: "#FFFFFF" },
  listContent: { paddingHorizontal: 24 },
  billRow: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },
  billNumber: { flex: 1.2 },
  numberText: { fontSize: 13, fontWeight: "600", color: "#1E293B" },
  billDate: { flex: 1.5 },
  dateText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  billCustomer: { flex: 2 },
  customerText: { fontSize: 14, color: "#111827", fontWeight: "500" },
  billTotal: { flex: 1 },
  totalText: { fontSize: 14, color: "#111827", fontWeight: "600" },
  billPdf: { flex: 0.2, alignItems: "center" },
  billDelete: { flex: 0.5, alignItems: "center" },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#9CA3AF", fontWeight: "500" },
});