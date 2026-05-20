"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalBaseProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  height?: string;
  shadowColor?: string;
  borderColor?: string;
  blobColor?: string;
}

export default function ModalBase({
  open,
  onClose,
  children,
  maxWidth = "max-w-[500px]",
  height,
  shadowColor = "rgba(141,170,104,0.25)",
  borderColor = "border-[#eef2e8]",
  blobColor = "bg-[#8DAA68]",
}: ModalBaseProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-[#3b3a62]/30 backdrop-blur-sm overflow-y-auto overflow-x-hidden"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Contenedor centrado que permite scroll vertical en móvil */}
          <div className="flex min-h-full items-center justify-center px-4 py-6 md:py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`bg-white/95 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 w-full ${maxWidth} border relative overflow-hidden ${borderColor} ${height || ''}`}
              style={{ boxShadow: `0 20px 80px ${shadowColor}` }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón Cerrar */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-[#a0a0b2] hover:text-rose-500 transition-colors z-[350]"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>

              {/* Blob decorativo */}
              <div
                className={`absolute top-0 right-0 w-64 h-64 ${blobColor} rounded-full mix-blend-multiply filter blur-[80px] opacity-10 translate-x-1/2 -translate-y-1/3 pointer-events-none`}
              ></div>

              {children}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
