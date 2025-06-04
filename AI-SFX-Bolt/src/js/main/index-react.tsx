import React from "react";
import ReactDOM from "react-dom/client";
import { initBolt } from "../lib/utils/bolt";
import { initAutoReconnect } from "../lib/auto-reconnect";
import "../index.scss";
import { App } from "./main";

// Initialize auto-reconnect for development
initAutoReconnect();

initBolt();

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
