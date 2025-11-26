import type { BypassTarget } from "../types/bypass.types";
import type { MenuProps } from "antd";

export const BYPASS_TARGETS: Record<string, BypassTarget> = {
  system: {
    label: "✨ System",
    environments: {
      production: {
        label: "Production",
        url: "https://system.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      staging: {
        label: "Beta",
        url: "https://beta.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      development: {
        label: "Development",
        url: "https://dev.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
    },
  },
  academic: {
    label: "👩🏻‍🏫 Academic",
    environments: {
      production: {
        label: "Production",
        url: "https://academic.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      development: {
        label: "Development",
        url: "https://dev-academic.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      ui: {
        label: "Dev UI",
        url: "https://dev-ui-academic.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
    },
  },
  accounting: {
    label: "🧾 Accounting",
    environments: {
      production: {
        label: "Production",
        url: "https://accounting.schoolbright.co/Home/ByPass?token=",
      },
      development: {
        label: "Development",
        url: "https://dev-accounting.schoolbright.co/Home/ByPass?token=",
      },
    },
  },
  library: {
    label: "📔 Library",
    environments: {
      production: {
        label: "Production",
        url: "https://library.schoolbright.co/Home/ByPass?token=",
      },
      development: {
        label: "Development",
        url: "https://library-dev.schoolbright.co/Home/ByPass?token=",
      },
    },
  },
  canteen: {
    label: "🥪 Canteen",
    environments: {
      production: {
        label: "Production",
        url: "https://canteen.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      development: {
        label: "Development",
        url: "https://dev-canteen.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
    },
  },
  kindergarten: {
    label: "👶🏻 Kindergarten",
    environments: {
      production: {
        label: "Production",
        url: "https://kindergarten.schoolbright.co/Home/ByPass?token=",
      },
      legacy: {
        label: "Old Course",
        url: "https://kindergarten-dev.schoolbright.co/Home/ByPass?token=",
      },
      development: {
        label: "New Development",
        url: "https://kindergarten-log.schoolbright.co/Home/ByPass?token=",
      },
    },
  },
  activity: {
    label: "🎃 Mark Activity",
    environments: {
      production: {
        label: "Production",
        url: "https://markactivity.schoolbright.co/Home/ByPass?token=",
        extendPath: "&page=ActivityManagement",
      },
      development: {
        label: "Development",
        url: "https://dev-markactivity.schoolbright.co/Home/ByPass?token=",
        extendPath: "&page=ActivityManagement",
      },
    },
  },
  exam: {
    label: "🚀 SB Exam",
    environments: {
      production: {
        label: "Production",
        url: "https://exam.schoolbright.co/home/getToken?token=",
      },
      development: {
        label: "Development",
        url: "https://dev-exam.schoolbright.co/home/getToken?token=",
      },
    },
  },
};

export const buildBypassMenuItems = (): MenuProps["items"] =>
  Object.entries(BYPASS_TARGETS).map(([targetKey, target]) => ({
    key: targetKey,
    label: target.label,
    children: Object.entries(target.environments).map(
      ([environmentKey, environment]) => ({
        key: `${targetKey}|${environmentKey}`,
        label: environment.label,
      })
    ),
  }));
