import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Vercel Dashboard Running</h1>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
