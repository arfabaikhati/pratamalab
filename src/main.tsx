import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Root from "./Root";

const container = document.getElementById("root")!;
createRoot(container).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
