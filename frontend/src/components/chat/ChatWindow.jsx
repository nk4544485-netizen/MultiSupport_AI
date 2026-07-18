import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

function ChatWindow() {
  return (
    <div className="flex-1 flex flex-col">

      <div className="flex-1 p-6 space-y-5 overflow-y-auto">

        <MessageBubble
          sender="user"
          message="How can I reset my password?"
        />

        <MessageBubble
          sender="ai"
          message="I can help you reset your password. Follow these steps..."
        />

      </div>

      <ChatInput />

    </div>
  );
}

export default ChatWindow;
