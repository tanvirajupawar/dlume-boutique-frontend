import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

export default function DebugOrderScreen({ logs = [], onBack }) {
  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Debug Logs</Text>

        <TouchableOpacity onPress={onBack}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Logs */}
      <ScrollView style={styles.logBox}>
        {logs.length === 0 ? (
          <Text style={{ color: "#888" }}>No logs available</Text>
        ) : (
          logs.map((log, index) => (
            <View key={index} style={styles.logItem}>
              <Text style={styles.logTitle}>{log.title}</Text>
              <Text style={styles.logText}>{log.data}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  close: {
    color: "#EF4444",
    fontSize: 20,
    fontWeight: "700",
  },
  logBox: {
    flex: 1,
    backgroundColor: "#111",
    padding: 10,
    borderRadius: 10,
  },
  logItem: {
    marginBottom: 12,
  },
  logTitle: {
    color: "#00FFAA",
    fontWeight: "700",
    marginBottom: 4,
  },
  logText: {
    color: "#fff",
    fontSize: 12,
  },
});