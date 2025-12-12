"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      const sections = ["home", "about", "skills", "works", "contact"];
      const scrollPos = window.scrollY + 100;

      sections.forEach((section) => {
        const elem = document.getElementById(section);
        if (
          elem &&
          elem.offsetTop <= scrollPos &&
          elem.offsetTop + elem.offsetHeight > scrollPos
        ) {
          setActive(section);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full flex justify-center z-50">
      <motion.nav
        className={` shadow-md py-4 px-10 transition-all duration-500 ${
          isScrolled
            ? "rounded-full w-[60%] backdrop-blur-md shadow-lg mt-3 px-10 py-2"
            : "w-full"
        }`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ul className="flex justify-center space-x-6">
          {["Home", "About", "Skills", "Works", "Contact"].map((item) => {
            const itemKey = item.toLowerCase();
            return (
              <li key={item}>
                <Link href={`#${itemKey}`} scroll={false}>
                  <motion.span
                    className={`font-medium text-gray-800 hover:text-blue-500 relative ${
                      active === itemKey
                        ? "border-b-2 border-blue-500 pb-1"
                        : ""
                    }`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item}
                    {/* ขีดเส้นล่างที่มี Animation */}
                    {active === itemKey && (
                      <motion.div
                        className="absolute left-0 bottom-0 h-[2px] bg-blue-500"
                        layoutId="underline"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      />
                    )}
                  </motion.span>
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.nav>
    </div>
  );
}
