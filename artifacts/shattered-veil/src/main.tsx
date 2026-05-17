import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./battle/actionEconomy.css";
import "./battle/battleControlRailLayout.css";
import "./battle/battleControlRailFinalPolish.css";
import { startBattleActionEconomyBridge } from "./battle/actionEconomyBridge";
import { startP4RuntimeBridge } from "./battle/p4RuntimeBridge";
import { startP4IntegrationFacade } from "./battle/p4IntegrationFacade";
import { startCreateInlineInnateTitlePolish } from "./createInlineInnateTitle";

startBattleActionEconomyBridge();
startP4RuntimeBridge();
startP4IntegrationFacade();
startCreateInlineInnateTitlePolish();

createRoot(document.getElementById("root")!).render(<App />);