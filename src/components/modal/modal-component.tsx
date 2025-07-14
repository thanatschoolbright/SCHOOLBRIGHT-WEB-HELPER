"use client";

import {ReactNode} from "react";
import {AnimatePresence, motion} from "framer-motion";

interface ModalComponentProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export default function ModalComponent({
                                           isOpen,
                                           onClose,
                                           title,
                                           children,
                                       }: ModalComponentProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 🟤 Background overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
                        onClick={onClose}
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                    />

                    {/* ⚪ Modal */}
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        transition={{duration: 0.3, type: "spring", stiffness: 200, damping: 20}}
                    >
                        <div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden">
                            {/* 🔵 Header */}
                            <div
                                className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* 🟢 Content */}
                            <div className="p-6">{children}</div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}