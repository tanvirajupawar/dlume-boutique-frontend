import React from "react";
import { View, Text } from "react-native";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.log("❌ COMPONENT CRASHED:", error);
    console.log("❌ STACK TRACE:", info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
          <Text>Something went wrong</Text>
          <Text>{String(this.state.error)}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}