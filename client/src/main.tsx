import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </QueryClientProvider>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
