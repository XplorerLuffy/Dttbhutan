/**
 * How a traveler says they will pay when booking a departure. Nothing is
 * charged on the site: the agency confirms the booking and the price first,
 * then the traveler pays the way they chose (the site's Terms say payment
 * arrangements are confirmed directly). The same three methods the database
 * already knows about for payments.
 */
export const PAYMENT_METHODS = ["BANK_TRANSFER", "MOBILE_WALLET", "CASH"] as const;
export type PaymentMethodChoice = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_LABEL: Record<PaymentMethodChoice, string> = {
  BANK_TRANSFER: "Bank transfer",
  MOBILE_WALLET: "Mobile wallet",
  CASH: "Cash at our office",
};

/** The editable wording shown on the payment step, from Site content. */
export type PaymentCopy = {
  intro: string;
  next: string;
  methods: Record<PaymentMethodChoice, string>;
};

export const isPaymentMethod = (v: string): v is PaymentMethodChoice => (PAYMENT_METHODS as readonly string[]).includes(v);
