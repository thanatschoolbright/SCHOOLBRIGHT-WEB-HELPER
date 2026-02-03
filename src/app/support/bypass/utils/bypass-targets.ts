import type { MenuProps } from "antd";
import type { BypassTarget } from "../types/bypass.types";

export const BYPASS_TARGETS: Record<string, BypassTarget> = {
  system: {
    label: "ระบบบริหารจัดการโรงเรียน",
    environments: {
      production: {
        label: "ใช้งานจริง",
        url: "https://system.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      staging: {
        label: "ทดสอบเบต้า",
        url: "https://beta.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      development: {
        label: "เซิร์ฟเวอร์นักพัฒนา",
        url: "https://dev.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
    },
  },
  academic: {
    label: "ระบบวิชาการและผลการเรียน",
    environments: {
      production: {
        label: "ใช้งานจริง",
        url: "https://academic.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      development: {
        label: "เซิร์ฟเวอร์นักพัฒนา",
        url: "https://dev-academic.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      ui: {
        label: "ทดสอบการออกแบบ (UI)",
        url: "https://dev-ui-academic.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
    },
  },
  accounting: {
    label: "ระบบบัญชีและการเงิน",
    environments: {
      production: {
        label: "ใช้งานจริง",
        url: "https://accounting.schoolbright.co/Home/ByPass?token=",
      },
      development: {
        label: "เซิร์ฟเวอร์นักพัฒนา",
        url: "https://dev-accounting.schoolbright.co/Home/ByPass?token=",
      },
    },
  },
  library: {
    label: "ระบบห้องสมุดดิจิทัล",
    environments: {
      production: {
        label: "ใช้งานจริง",
        url: "https://library.schoolbright.co/Home/ByPass?token=",
      },
      development: {
        label: "เซิร์ฟเวอร์นักพัฒนา",
        url: "https://library-dev.schoolbright.co/Home/ByPass?token=",
      },
    },
  },
  canteen: {
    label: "ระบบโรงอาหารและร้านค้า",
    environments: {
      production: {
        label: "ใช้งานจริง",
        url: "https://canteen.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      development: {
        label: "เซิร์ฟเวอร์นักพัฒนา",
        url: "https://dev-canteen.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
    },
  },
  kindergarten: {
    label: "ระบบอนุบาลและพัฒนาการ",
    environments: {
      production: {
        label: "ใช้งานจริง",
        url: "https://kindergarten.schoolbright.co/Home/ByPass?token=",
      },
      legacy: {
        label: "เวอร์ชั่นเดิม",
        url: "https://kindergarten-dev.schoolbright.co/Home/ByPass?token=",
      },
      development: {
        label: "เซิร์ฟเวอร์นักพัฒนาใหม่",
        url: "https://kindergarten-log.schoolbright.co/Home/ByPass?token=",
      },
    },
  },
  activity: {
    label: "ระบบกิจกรรมและชุมนุม",
    environments: {
      production: {
        label: "ใช้งานจริง",
        url: "https://markactivity.schoolbright.co/Home/ByPass?token=",
        extendPath: "&page=ActivityManagement",
      },
      development: {
        label: "เซิร์ฟเวอร์นักพัฒนา",
        url: "https://dev-markactivity.schoolbright.co/Home/ByPass?token=",
        extendPath: "&page=ActivityManagement",
      },
    },
  },
  exam: {
    label: "ระบบสอบออนไลน์และคลังข้อสอบ",
    environments: {
      production: {
        label: "ใช้งานจริง",
        url: "https://exam.schoolbright.co/home/getToken?token=",
      },
      development: {
        label: "เซิร์ฟเวอร์นักพัฒนา",
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
