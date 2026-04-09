import React, { useState } from "react";
import { View } from "react-native";
import StaffScreen from "./StaffScreen";
import StaffDetailScreen from "./StaffDetailScreen";

export default function StaffContainer() {
  const [currentView, setCurrentView] = useState("list"); // "list" or "detail"
  const [selectedStaff, setSelectedStaff] = useState(null);

  const handleViewStaff = (staff) => {
    setSelectedStaff(staff);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedStaff(null);
  };

  return (
    <View style={{ flex: 1 }}>
      {currentView === "list" ? (
        <StaffScreen onViewStaff={handleViewStaff} />
      ) : (
        <StaffDetailScreen
          staff={selectedStaff}
          onBack={handleBackToList}
        />
      )}
    </View>
  );
}