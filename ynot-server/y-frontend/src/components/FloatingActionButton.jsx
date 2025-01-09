import React from "react";
import "../styles/FloatingActionButton.css";

function FloatingActionButton({ onClick }) {
  return (
    <button className="floating-action-button" onClick={onClick}>
      +
    </button>
  );
}

export default FloatingActionButton;