/**
 * Export des composants de caisse
 */

// Composants principaux
export { CaisseProductGrid } from "./caisse-product-grid";
export { CaisseCart } from "./caisse-cart";
export { CaissePayment } from "./caisse-payment";
export { ModePanel } from "./mode-panel";
export { ProductSearchModal } from "./product-search-modal";
export { DiscountModal } from "./discount-modal";
export { QuantityInput } from "./quantity-input";
export { LineNotesPopover } from "./line-notes-popover";
export { SupplementSelector } from "./supplement-selector";

// Module Session Caisse
export { SessionStatus } from "./session-status";
export { OpenSessionDialog } from "./open-session-dialog";
export { CloseSessionDialog } from "./close-session-dialog";
export { SessionHistory } from "./session-history";
export { SessionRequired, useSessionRequired } from "./session-required";

// Module Commandes en attente
export { PendingOrdersModal } from "./pending-orders-modal";
export { OrderDetailsModal } from "./order-details-modal";

// Module Impression
export {
  PrintButton,
  PrintTicketButton,
  PrintRapportZButton,
  TestPrintButton,
} from "./print-button";
export { CartPrintActions } from "./cart-print-actions";

// Types re-exports
export type {
  SessionActive,
  SessionHistoryItem,
  SessionStats,
  RapportZ,
} from "@/actions/sessions";
