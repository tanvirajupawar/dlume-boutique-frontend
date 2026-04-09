import React, { useState } from "react";
import { View } from "react-native";

import CustomerScreen from "./CustomerScreen";
import CustomerDetailScreen from "./CustomerDetailScreen";
import PaymentScreen from "./PaymentScreen";
import PaymentSuccessScreen from "./PaymentSuccessScreen";

export default function CustomerContainer({
  onViewCustomer,
  onAddCustomer,
}) {
  const [currentView, setCurrentView] = useState("list");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
const [successData, setSuccessData] = useState(null);
const [refreshKey, setRefreshKey] = useState(0);
  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedCustomer(null);
  };

  const handleBackToDetail = () => {
    setCurrentView("detail");
  };

  return (
    <View style={{ flex: 1 }}>

      {/* ================= LIST ================= */}
      {currentView === "list" && (
<CustomerScreen
  refreshKey={refreshKey}
  onViewCustomer={handleViewCustomer}
  onAddCustomer={onAddCustomer}
/>
      )}

      {/* ================= DETAIL ================= */}
      {currentView === "detail" && selectedCustomer && (
        <CustomerDetailScreen
          customer={selectedCustomer}
          onBack={handleBackToList}
          onPay={(data) => {
            setPaymentData(data);
            setCurrentView("payment");
          }}
        />
      )}

{/* ================= PAYMENT ================= */}
{currentView === "payment" && paymentData && (
  <PaymentScreen
    {...paymentData}
    onBack={handleBackToDetail}
    onSuccess={(data) => {
      setSuccessData(data);
      setCurrentView("success");
    }}
  />
)}

{/* ================= SUCCESS ================= */}
{currentView === "success" && successData && (
  <PaymentSuccessScreen
    {...successData}
    onDone={() => {
      setRefreshKey(prev => prev + 1); // refresh customer list
      setCurrentView("detail");        // stay on customer detail
    }}
  />
)}



    </View>
  );
}
