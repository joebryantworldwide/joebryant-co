// Joe Bryant | Access — shared vocabulary.

export const STATUSES = [
  "Planning",
  "Availability Requested",
  "Confirmed",
  "Awaiting Payment Verification",
  "Shoot Completed",
  "Editing",
  "Gallery Delivered",
  "Completed",
];

export const ROLES = [
  "Client / Owner",
  "Assistant",
  "Marketing Director",
  "Accountant",
  "Homeowner",
  "Viewer",
];

export const ACCESS_LEVELS = [
  { value: "full", label: "Full project" },
  { value: "prep", label: "Prep guide only" },
  { value: "gallery", label: "Gallery only" },
  { value: "billing", label: "Billing only" },
  { value: "view", label: "View only" },
];

export const MANUAL_PAYMENT_METHODS = [
  "Cash",
  "Wire",
  "Zelle",
  "Venmo",
  "Apple Cash",
  "Cash App",
];

export const MANUAL_PAYMENT_NOTICE =
  "Joe has been notified of your payment selection. Once Joe confirms receipt, you'll be notified automatically. Don't worry — your project is confirmed and currently awaiting payment verification.";

export const PAYMENT_RULES = [
  "A 50% non-refundable retainer is required once Joe approves the project.",
  "The full balance is due by the end of the shoot day.",
  "Manual payments are confirmed personally by Joe before the project status updates.",
];

export const SERVICES = [
  { value: "photography", label: "Architectural Photography", price: 0 },
  { value: "drone", label: "Drone / Aerial", price: 150 },
  { value: "twilight", label: "Twilight", price: 250 },
  { value: "styling", label: "Styling / Cleanup Prep", price: 450 },
];
