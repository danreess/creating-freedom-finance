export interface Category {
  name: string;
  color: string;
  emoji: string;
  keywords: string[];
}

export const CATEGORIES: Category[] = [
  {
    name: "Groceries",
    color: "#22c55e",
    emoji: "🛒",
    keywords: ["woolworths", "coles", "aldi", "iga", "harris farm", "costco", "foodworks", "spar"],
  },
  {
    name: "Dining",
    color: "#f97316",
    emoji: "🍽️",
    keywords: ["mcdonald", "kfc", "hungry jacks", "subway", "ubereats", "doordash", "deliveroo", "menulog", "pizza", "cafe", "restaurant", "burger", "domino", "noodle"],
  },
  {
    name: "Transport",
    color: "#60a5fa",
    emoji: "🚗",
    keywords: ["uber", "ola", "didi", "petrol", "ampol", "bp ", "shell", "caltex", "7-eleven", "opal", "myki", "go card", "toll", "parking"],
  },
  {
    name: "Shopping",
    color: "#a78bfa",
    emoji: "🛍️",
    keywords: ["amazon", "ebay", "kmart", "target", "big w", "h&m", "zara", "uniqlo", "myer", "david jones", "cotton on", "asos"],
  },
  {
    name: "Utilities",
    color: "#fbbf24",
    emoji: "⚡",
    keywords: ["agl", "origin energy", "energy australia", "sydney water", "yarra water", "sa water", "optus", "telstra", "vodafone", "aussie broadband", "iinet", "tpg"],
  },
  {
    name: "Entertainment",
    color: "#ec4899",
    emoji: "🎬",
    keywords: ["netflix", "spotify", "apple.com", "disney", "amazon prime", "binge", "stan ", "youtube", "hbo", "paramount", "foxtel"],
  },
  {
    name: "Health",
    color: "#06b6d4",
    emoji: "🏥",
    keywords: ["chemist", "pharmacy", "priceline", "doctor", "medical", "dental", "physio", "gym", "fitness", "medicare", "bupa", "medibank", "ahm"],
  },
  {
    name: "Housing",
    color: "#6366f1",
    emoji: "🏠",
    keywords: ["rent", "mortgage", "home loan", "real estate", "strata", "body corp", "council rate", "water rate"],
  },
  {
    name: "Investments",
    color: "#10b981",
    emoji: "📈",
    keywords: ["pearler", "commsec", "stake", "etoro", "selfwealth", "superhero", "raiz", "spaceship", "coinspot", "crypto"],
  },
  {
    name: "Income",
    color: "#34d399",
    emoji: "💰",
    keywords: ["salary", "payroll", "employer", "wages", "centrelink", "ato refund"],
  },
  {
    name: "Transfers",
    color: "#94a3b8",
    emoji: "↔️",
    keywords: ["transfer", "payment to", "payment from", "bpay"],
  },
];

export const OTHER_CATEGORY: Category = {
  name: "Other",
  color: "#64748b",
  emoji: "📦",
  keywords: [],
};

export function categoriseTransaction(description: string, basiqSubclass?: string): Category {
  if (basiqSubclass) {
    const matched = CATEGORIES.find(
      (c) => c.name.toLowerCase() === basiqSubclass.toLowerCase()
    );
    if (matched) return matched;
  }

  const lower = description.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((k) => lower.includes(k))) return cat;
  }
  return OTHER_CATEGORY;
}
