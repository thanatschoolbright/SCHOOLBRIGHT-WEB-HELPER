type DropdownItem = {
    label: string;
    onClick: () => void;
};

interface DropdownButtonComponentProps {
    id: string;
    items: DropdownItem[];
}

export default function DropdownButtonComponent({id, items}: DropdownButtonComponentProps) {
    const toggleDropdown = () => {
        const el = document.getElementById(`dropdown-${id}`);
        if (el) {
            el.classList.toggle("scale-95");
            el.classList.toggle("scale-100");
            el.classList.toggle("opacity-0");
            el.classList.toggle("opacity-100");
            el.classList.toggle("pointer-events-none");
            el.classList.toggle("pointer-events-auto");
        }
    };

    const buttonClasses =
        "group relative block px-4 py-2 text-sm text-left w-full text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 overflow-hidden";

    return (
        <td className="p-4 text-sm text-gray-900 dark:text-gray-200">
            <div className="relative inline-block text-left">
                <button
                    onClick={toggleDropdown}
                    className="p-2 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                >
                    ⋮
                </button>
                <div
                    id={`dropdown-${id}`}
                    className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10 transition-all duration-200 origin-top-right scale-95 opacity-0 pointer-events-none"
                >
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.onClick}
                            className={buttonClasses}
                        >
                            <span className="relative z-10">{item.label}</span>
                            <span
                                className="absolute left-0 bottom-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full"></span>
                        </button>
                    ))}
                </div>
            </div>
        </td>
    );
}