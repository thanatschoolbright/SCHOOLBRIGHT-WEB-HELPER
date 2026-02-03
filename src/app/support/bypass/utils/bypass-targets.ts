import type { MenuProps } from "antd";
import type { BypassTarget } from "../types/bypass.types";

export const BYPASS_TARGETS: Record<string, BypassTarget> = {
  system: {
    label: "ระบบหลัก (System)",
    environments: {
      production: {
        label: "ใช้งานจริง (Production)",
        url: "https://system.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      staging: {
        label: "ทดสอบฟีเจอร์ (Beta)",
        url: "https://beta.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      development: {
        label: "ระบบพัฒนา (Development)",
        url: "https://dev.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
    },
  },
  academic: {
    label: "ระบบวิชาการ (Academic)",
    environments: {
      production: {
        label: "ใช้งานจริง (Production)",
        url: "https://academic.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      development: {
        label: "ระบบพัฒนา (Development)",
        url: "https://dev-academic.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      ui: {
        label: "ทดสอบหน้าตา (Dev UI)",
        url: "https://dev-ui-academic.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
    },
  },
  accounting: {
    label: "ระบบบัญชี (Accounting)",
    environments: {
      production: {
        label: "ใช้งานจริง (Production)",
        url: "https://accounting.schoolbright.co/Home/ByPass?token=",
      },
      development: {
        label: "ระบบพัฒนา (Development)",
        url: "https://dev-accounting.schoolbright.co/Home/ByPass?token=",
      },
    },
  },
  library: {
    label: "ระบบห้องสมุด (Library)",
    environments: {
      production: {
        label: "ใช้งานจริง (Production)",
        url: "https://library.schoolbright.co/Home/ByPass?token=",
      },
      development: {
        label: "ระบบพัฒนา (Development)",
        url: "https://library-dev.schoolbright.co/Home/ByPass?token=",
      },
    },
  },
  canteen: {
    label: "ระบบโรงอาหาร (Canteen)",
    environments: {
      production: {
        label: "ใช้งานจริง (Production)",
        url: "https://canteen.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      development: {
        label: "ระบบพัฒนา (Development)",
        url: "https://dev-canteen.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
    },
  },
  kindergarten: {
    label: "ระบบอนุบาล (Kindergarten)",
    environments: {
      production: {
        label: "ใช้งานจริง (Production)",
        url: "https://kindergarten.schoolbright.co/Home/ByPass?token=",
      },
      legacy: {
        label: "เวอร์ชั่นเดิม (Old Course)",
        url: "https://kindergarten-dev.schoolbright.co/Home/ByPass?token=",
      },
      development: {
        label: "ระบบพัฒนาใหม่ (Development)",
        url: "https://kindergarten-log.schoolbright.co/Home/ByPass?token=",
      },
    },
  },
  activity: {
    label: "ระบบกิจกรรม (Activity)",
    environments: {
      production: {
        label: "ใช้งานจริง (Production)",
        url: "https://markactivity.schoolbright.co/Home/ByPass?token=",
        extendPath: "&page=ActivityManagement",
      },
      development: {
        label: "ระบบพัฒนา (Development)",
        url: "https://dev-markactivity.schoolbright.co/Home/ByPass?token=",
        extendPath: "&page=ActivityManagement",
      },
    },
  },
  exam: {
    label: "คลังข้อสอบ (SB Exam)",
    environments: {
      production: {
        label: "ใช้งานจริง (Production)",
        url: "https://exam.schoolbright.co/home/getToken?token=",
      },
      development: {
        label: "ระบบพัฒนา (Development)",
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
      }),
    ),
  }));
