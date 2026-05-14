import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./battle/actionEconomy.css";
import { startBattleActionEconomyBridge } from "./battle/actionEconomyBridge";

startBattleActionEconomyBridge();

createRoot(document.getElementById("root")!).render(<App />);