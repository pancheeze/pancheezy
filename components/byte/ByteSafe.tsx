"use client";

import { Component, ReactNode } from "react";
import Byte from "./Byte";

// If Byte ever crashes, hide him instead of breaking the whole page.
class ByteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Byte crashed and was hidden:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function ByteSafe() {
  return (
    <ByteBoundary>
      <Byte />
    </ByteBoundary>
  );
}
