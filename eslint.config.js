import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import unusedImports from "eslint-plugin-unused-imports";

// ใช้ tseslint.config เพื่อช่วยรวม Array ของ Config ได้ง่ายและถูกต้องสำหรับ TypeScript
export default tseslint.config(
  {
    // 1. โฟลเดอร์ที่ละเว้นการตรวจ (Ignore)
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "generated/**",
      "public/sw.js",
      "public/scripts/**",
      "config/.eslintrc.json",
      "*.config.js", // ละเว้นไฟล์ config นอกสุดเพื่อไม่ให้ตีกับ TS Rules
      "**/*.config.ts", // <-- เพิ่มบรรทัดนี้ (ละเว้น tailwind.config.ts ฯลฯ)
      "config/**",      // <-- เพิ่มบรรทัดนี้ (ละเว้นไฟล์ในโฟลเดอร์ config)
    ],
  },

  // 2. มาตรฐานพื้นฐานของ JS และ TypeScript (แบบเข้มงวดสุด)
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.strictTypeChecked, // เปิดกฎ Strict ขั้นสุดของ TS
  ...tseslint.configs.stylisticTypeChecked, // บังคับสไตล์การเขียน TS ให้เหมือนกันทั้งทีม

  {
    // 3. ตั้งค่า Parser และ Environment
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tseslint.parser,
      parserOptions: {
        projectService: true, // ให้ ESLint อ่าน tsconfig.json ของโปรเจกต์
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "readonly", // ไม่ต้อง import React ใน Next.js
      },
    },
  },

  {
    // 4. ลงทะเบียน Plugins ทั้งหมด
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
      "unused-imports": unusedImports,
    },

    // 5. กฎระดับ Enterprise
    rules: {
      // --- Next.js & React Rules ---
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules, // สำหรับ React 17+
      ...hooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules, // บังคับเรื่อง Accessibility

      // --- Enterprise Strict Rules ---

      // Hooks ต้องใส่ Dependency ครบ ห้ามเตือนเฉยๆ (ให้พังเลยถ้าไม่ครบ)
      "react-hooks/exhaustive-deps": "error",

      // ปิดกฎ React PropTypes เพราะเราใช้ TypeScript แล้ว
      "react/prop-types": "off",

      // ห้ามมี console.log หลุดไปบน Production (อนุญาตแค่ warn กับ error)
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // บังคับใช้ === เสมอ ห้ามใช้ ==
      eqeqeq: ["error", "always"],

      // --- Typescript Strict Rules ---

      // ห้ามใช้ type `any` เด็ดขาด (ถ้าจำเป็นจริงๆ ต้องใช้ // eslint-disable-next-line)
      "@typescript-eslint/no-explicit-any": "error",

      // ห้ามมีตัวแปรที่ประกาศแล้วไม่ได้ใช้ (ถ้าตั้งใจไม่ใช้ให้ขึ้นต้นด้วย _)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // --- Auto-fixable Clean Code ---

      // ลบ Import ที่ไม่ได้ใช้อัตโนมัติ (ช่วยลด Bundle size)
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
    settings: {
      react: {
        version: "19.2",
      },
    },
  },
);
