export const LOW_STOCK_THRESHOLD = 3;

export const DISPLAY_TYPES: Array<"Normal" | "Holo" | "Prize Card"> = [
  "Normal",
  "Holo",
  "Prize Card",
];

export const TYPE_LABELS: Record<string, string> = {
  Normal: "Normal",
  Holo: "Holo",
  "Prize Card": "Prize Card",
};

export const TYPE_COLORS: Record<string, string> = {
  Normal: "bg-gray-200 text-gray-800",
  Holo: "bg-blue-100 text-blue-800 border border-blue-300",
  "Prize Card": "bg-yellow-100 text-yellow-800 border border-yellow-400",
};

export const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61578802334775";

export const GROUP_LABELS: Record<string, string> = {
  pokemon: "Pokemon",
  suppoter: "Suppoter",
  item: "Item",
  tool: "Tool",
  stadium: "Stadium",
  "special energy": "Special Energy",
  energy: "Energy",
};
