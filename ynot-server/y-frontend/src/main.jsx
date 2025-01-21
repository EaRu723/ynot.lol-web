import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { OwnIDInit } from "@ownid/react";

const OWNID_APP_ID = import.meta.env.VITE_OWNID_APP_ID;

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <OwnIDInit config={{ appId: OWNID_APP_ID }} />
    <App />
  </BrowserRouter>,
);
