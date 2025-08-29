type DropdownItem = {
  label: string;
  onClick: () => void;
  textColor?: string;
};

interface DropdownButtonComponentProps {
  id: string;
  items: DropdownItem[];
  textColor?: string;
}

export default function DropdownButtonComponent({
  id,
  items,
  textColor,
}: DropdownButtonComponentProps) {
  const toggleDropdown = () => {
    const el = document.getElementById(`dropdown-${id}`);
    if (el) {
      el.classList.toggle("scale-95");
      el.classList.toggle("scale-100");
      el.classList.toggle("opacity-0");
      el.classList.toggle("opacity-100");
      el.classList.toggle("pointer-events-none");
      el.classList.toggle("pointer-events-auto");
      el.classList.toggle("translate-y-0");
      el.classList.toggle("-translate-y-2");
    }
  };

  const buttonClasses =
    "group relative block px-4 py-2 text-sm text-left w-full text-gray-700 dark:text-white hover:bg-gradient-to-r from-purple-50 to-purple-100 dark:from-gray-600 dark:to-gray-700 hover:scale-105 hover:translate-x-1 cursor-pointer transition-transform duration-200 overflow-hidden border-b border-gray-200 dark:border-gray-600 last:border-0";

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={toggleDropdown}
        className="p-2 rounded-md bg-gradient-to-r from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-800 text-gray-700 dark:text-white hover:scale-110 active:scale-95 shadow-md transition-transform duration-200 focus:outline-none"
      >
        ⋮
      </button>
      <div
        id={`dropdown-${id}`}
        className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden z-10 animate-dropdownSlide transition-all duration-300 origin-top-right scale-95 opacity-0 pointer-events-none transform -translate-y-2"
      >
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`${buttonClasses} ${item.textColor}`}
          >
            <span className="relative z-10 ">{item.label}</span>
            <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full"></span>
          </button>
        ))}
      </div>
    </div>
  );
}
