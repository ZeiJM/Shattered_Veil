import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./battle/actionEconomy.css";
import "./battle/battleControlRailLayout.css";
import { startBattleActionEconomyBridge } from "./battle/actionEconomyBridge";
import { startCreateInlineInnateTitlePolish } from "./createInlineInnateTitle";

startBattleActionEconomyBridge();
startCreateInlineInnateTitlePolish();

createRoot(document.getElementById("root")!).render(<App />);