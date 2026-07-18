function ChatInput() {
  return (
    <div className="border-t border-slate-800 p-5 flex gap-4">

      <input
        className="flex-1 bg-slate-800 rounded-lg px-4 py-3 text-white outline-none"
        placeholder="Type your message..."
      />

      <button className="bg-blue-600 px-6 rounded-lg hover:bg-blue-700">
        Send
      </button>

    </div>
  );
}

export default ChatInput;