function MessageBubble({ sender, message }) {
  const isUser = sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xl px-4 py-3 rounded-xl ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-slate-800 text-white"
        }`}
      >
        {message}
      </div>
    </div>
  );
}

export default MessageBubble;