import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply custom CSS for the voice recording animation
const styleElement = document.createElement("style");
styleElement.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  .recording {
    animation: pulse 1.5s infinite;
    background-color: #F44336 !important;
  }
  
  /* Typing indicator animation */
  .typing-indicator span {
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: #606060;
    border-radius: 50%;
    margin-right: 3px;
    animation: typing 1.5s infinite;
  }
  
  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
  }
`;
document.head.appendChild(styleElement);

createRoot(document.getElementById("root")!).render(<App />);
