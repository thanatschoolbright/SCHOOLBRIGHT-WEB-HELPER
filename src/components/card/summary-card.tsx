import React from "react";

type SummaryCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  bgColor?: string; // tailwind bg class เช่น 'bg-blue-500'
};

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  bgColor = "bg-blue-500",
}) => {
  return (
    <div
      className={`relative overflow-hidden text-white rounded-xl p-5 shadow-xl w-full transition duration-300 hover:scale-[1.03] ring-1 ring-white/10 backdrop-blur-sm  bg-cover bg-center ${bgColor}`}
    >
      <div className="relative z-10">
        <p className="text-sm font-semibold mb-2 tracking-wide">{title}</p>
        <h2 className="text-4xl font-extrabold leading-snug drop-shadow-sm">
          {value}
        </h2>
        {subtitle && (
          <p className="text-xs mt-2 text-white/90 italic">{subtitle}</p>
        )}
      </div>
      {/* เพิ่ม overlay เบา ๆ ด้านหลังให้พื้นหลังดูมีมิติ */}
      <div className="absolute inset-0 bg-black/10 z-0" />
    </div>
  );
};

export default SummaryCard;
