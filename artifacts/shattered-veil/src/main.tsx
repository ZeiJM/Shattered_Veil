import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./battle/actionEconomy.css";
import "./battle/battleControlRailLayout.css";
import "./battle/battleControlRailFinalPolish.css";
import "./battle/p0p1BattleStability.css";
import "./battle/p2BattlefieldPolish.css";
import "./assetLoadingOptimization.css";
import { startBattleActionEconomyBridge } from "./battle/actionEconomyBridge";
import { startP4RuntimeBridge } from "./battle/p4RuntimeBridge";
import { startP4IntegrationFacade } from "./battle/p4IntegrationFacade";
import { startP0P1BattleStabilityPolish } from "./battle/p0p1BattleStability";
import { startP2BattlefieldPolish } from "./battle/p2BattlefieldPolish";
import { startP5FieldLifecycleBridge } from "./battle/p5FieldLifecycleBridge";
import { startAssetLoadingOptimization } from "./assetLoadingOptimization";
import { startCreateInlineInnateTitlePolish } from "./createInlineInnateTitle";

startBattleActionEconomyBridge();
startP4RuntimeBridge();
startP4IntegrationFacade();
startP0P1BattleStabilityPolish();
startP2BattlefieldPolish();
startP5FieldLifecycleBridge();
startAssetLoadingOptimization();
startCreateInlineInnateTitlePolish();

createRoot(document.getElementById("root")!).render(<App />);