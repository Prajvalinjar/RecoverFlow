export interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  badge?: string;
  matchPrefixes?: string[];
}

export interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

export const NAV_SECTIONS: NavSectionConfig[] = [
  {
    title: "COMMAND",
    items: [
      {
        id: "overview",
        label: "Overview",
        href: "/dashboard",
        matchPrefixes: ["/dashboard"],
      },
      {
        id: "cases",
        label: "Recovery Cases",
        href: "/cases",
        badge: "14",
        matchPrefixes: ["/cases"],
      },
    ],
  },
  {
    title: "RECOVERY",
    items: [
      {
        id: "payments",
        label: "Payments",
        href: "/payments",
        matchPrefixes: ["/payments"],
      },
      {
        id: "jobs",
        label: "Jobs & Queue",
        href: "/jobs",
        badge: "4",
        matchPrefixes: ["/jobs"],
      },
      {
        id: "reconciliation",
        label: "Reconciliation",
        href: "/reconciliation",
        matchPrefixes: ["/reconciliation"],
      },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      {
        id: "analytics",
        label: "Recovery Analytics",
        href: "/analytics",
        matchPrefixes: ["/analytics"],
      },
      {
        id: "flow",
        label: "Recovery Flow",
        href: "/recovery-flow",
        matchPrefixes: ["/recovery-flow"],
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        id: "providers",
        label: "Providers",
        href: "/providers",
        matchPrefixes: ["/providers"],
      },
      {
        id: "workers",
        label: "Workers",
        href: "/workers",
        matchPrefixes: ["/workers"],
      },
      {
        id: "health",
        label: "System Health",
        href: "/system-health",
        matchPrefixes: ["/system-health"],
      },
      {
        id: "audit",
        label: "Audit Trail",
        href: "/audit",
        matchPrefixes: ["/audit"],
      },
      {
        id: "control",
        label: "Operations Control",
        href: "/operations",
        matchPrefixes: ["/operations"],
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        matchPrefixes: ["/settings"],
      },
    ],
  },
];

export interface NavRouteState {
  activeId: string;
  currentSection: string;
  currentPage: string;
  currentHref: string;
}

const DEFAULT_ROUTE_STATE: NavRouteState = {
  activeId: "overview",
  currentSection: "COMMAND",
  currentPage: "Overview",
  currentHref: "/dashboard",
};

/**
 * Derives the active navigation item, section title, and page title from the pathname.
 */
export function getNavStateFromPathname(pathname: string | null): NavRouteState {
  if (!pathname) return DEFAULT_ROUTE_STATE;

  const normalized = pathname.replace(/\/+$/, "") || "/";

  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.href === normalized) {
        return {
          activeId: item.id,
          currentSection: section.title,
          currentPage: item.label,
          currentHref: item.href,
        };
      }

      if (item.matchPrefixes) {
        for (const prefix of item.matchPrefixes) {
          if (
            normalized === prefix ||
            normalized.startsWith(`${prefix}/`)
          ) {
            return {
              activeId: item.id,
              currentSection: section.title,
              currentPage: item.label,
              currentHref: item.href,
            };
          }
        }
      }
    }
  }

  return DEFAULT_ROUTE_STATE;
}
