export default function TimeChart() {
  const data = [7.13, 8.05, 7.45, 5.17, 0, 0, 0];
  return (
    <div className=" p-4 rounded-2xl shadow">
      <h2 className="font-semibold text-sm mb-2">Time</h2>
      <div className="flex justify-between items-end h-32">
        {data.map((val, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div
              className="w-6 rounded bg-blue-400"
              style={{ height: `${val * 10}px` }}
            ></div>
            <span className="text-xs mt-1">
              {val > 0 ? val.toFixed(2) : "0:00"}
            </span>
          </div>
        ))}
      </div>
      <div className="text-xs text-right text-gray-400 mt-2">5:17 today</div>
    </div>
  );
}
