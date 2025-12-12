"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative h-screen flex flex-col md:flex-row justify-center items-center px-10 bg-gradient-to-br from-white to-gray-100 overflow-hidden"
    >
      {/* Gradient Light Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-20 w-60 h-60  opacity-30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gray-200 opacity-20 rounded-full blur-3xl"></div>
      </div>

      {/* Glassmorphism Card */}
      <motion.div
        className="/30 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-10 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-10 relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Text Content */}
        <div className="text-center md:text-left space-y-6">
          <motion.h1
            className="text-5xl font-bold text-gray-800"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Hi, I'm <span className="text-blue-500">Marlon</span>
          </motion.h1>
          <motion.p
            className="text-lg text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            A Passionate Web Designer & Developer
          </motion.p>
          <motion.button
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
            whileHover={{ scale: 1.05 }}
          >
            Contact Me
          </motion.button>
        </div>

        {/* Profile Image with Cloud Effect */}
        <div className="relative w-72 h-72 md:w-96 md:h-96">
          <motion.div
            className="absolute inset-0 bg-blue-500 rounded-full w-full h-full -z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          <Image
            src="/profile.jpg"
            alt="Marlon"
            width={320}
            height={320}
            className="object-cover rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
