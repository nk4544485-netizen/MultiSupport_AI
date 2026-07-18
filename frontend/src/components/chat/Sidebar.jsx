function Sidebar() {
  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 p-5">
      <button className="w-full bg-blue-600 py-3 rounded-lg hover:bg-blue-700">
        + New Chat
      </button>

      <h2 className="text-white mt-8 mb-4 font-semibold">
        Chat History
      </h2>

      <div className="space-y-3">
        <div className="bg-slate-800 p-3 rounded-lg text-gray-300 cursor-pointer hover:bg-slate-700">
          Billing Issue
        </div>

        <div className="bg-slate-800 p-3 rounded-lg text-gray-300 cursor-pointer hover:bg-slate-700">
          Refund Request
        </div>
      </div>
    </div>
  );
}

export default Sidebar;