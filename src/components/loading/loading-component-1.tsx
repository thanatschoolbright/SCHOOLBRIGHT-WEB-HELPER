"use client";
import React, { useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";

export default function BaseLoadingComponent({
  title = "⏳ กำลังดาวน์โหลดข้อมูล...",
  message = "กรุณารอสักครู่ ข้อมูลอาจใช้เวลาสักครู่ในการโหลด",
  visible = true,
}: Readonly<{
  title?: string;
  message?: string;
  visible?: boolean;
}>) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShow(true);
    } else {
      const timeout = setTimeout(() => setShow(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <motion.div
            className="bg-white px-8 py-8 rounded-2xl shadow-2xl text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <motion.div
              className="flex justify-center mb-6"
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
                boxShadow: [],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "linear",
                boxShadow: {
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                },
                scale: {
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                },
                rotate: {
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                },
              }}
              style={{
                borderRadius: "50%",
                boxShadow: "0 0 0 0px #3b82f6",
              }}
            >
              <AiOutlineLoading3Quarters className="text-blue-600 text-5xl" />
            </motion.div>
            <motion.div
              className="text-2xl font-semibold text-gray-700 mb-2"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {title}
            </motion.div>
            <motion.div
              className="text-sm text-gray-500 mt-1"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {message}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
