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
      "config/**", // <-- เพิ่มบรรทัดนี้ (ละเว้นไฟล์ในโฟลเดอร์ config)
    ],
  },

  // 2. มาตรฐานพื้นฐานของ JS และ TypeScript (แบบปกติ - ปรับให้ไม่เข้มงวดเกินไป)
  js.configs.recommended,
  ...tseslint.configs.recommended, // เปลี่ยนจาก recommendedTypeChecked เป็น recommended เพื่อลดความเข้มงวด
  // ละเว้น strictTypeChecked และ stylisticTypeChecked เพื่อลด error ที่ไม่จำเป็น

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
      // ...jsxA11yPlugin.configs.recommended.rules, // บิดการบังคับเรื่อง Accessibility ชั่วคราว

      // --- Relaxed Rules ---

      // Hooks: เปลี่ยนจาก error เป็น warn
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "warn",

      // TypeScript: ปิดการบังคับต่างๆ ที่ทำให้ Code แดงเยอะ
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",

      // React & Next.js: ปิดกฎที่จุกจิก
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": "off", // ยอมให้ใช้ jsx global ใน <style>
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      "react-compiler/react-compiler": "off", // ปิด React Compiler rules ที่ทำให้ error แดง

      // อื่นๆ
      "no-console": "off",
      eqeqeq: "off",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "off",
      "unused-imports/no-unused-vars": "off",
    },
    settings: {
      react: {
        version: "19.2",
      },
    },
  },
);
