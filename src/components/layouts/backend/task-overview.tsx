export default function TaskOverview() {
  return (
    <div className=" p-4 rounded-2xl shadow">
      <h2 className="text-sm font-semibold">Task</h2>
      <p className="text-3xl font-bold">94%</p>
      <p className="text-xs text-gray-400 mb-2">Involvement work</p>
      <div className="h-20">{/* Sparkline chart placeholder */}</div>
      <div className="text-xs space-y-1 mt-3">
        <p>
          To do <span className="float-right">54%</span>
        </p>
        <p>
          In progress <span className="float-right">84%</span>
        </p>
        <p>
          Finish date <span className="float-right">78%</span>
        </p>
      </div>
    </div>
  );
}
