import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { addLogListener, removeLogListener } from "../utils/logger";

export default function DebugConsole() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const listener = (msg) => {
      setLogs((prev) => [msg, ...prev.slice(0, 50)]);
    };

    addLogListener(listener);

    return () => removeLogListener(listener);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView>
        {logs.map((log, i) => (
          <Text key={i} style={styles.text}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 200,
    backgroundColor: "#000",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  text: {
    color: "#0f0",
    fontSize: 12,
    marginBottom: 4,
  },
});