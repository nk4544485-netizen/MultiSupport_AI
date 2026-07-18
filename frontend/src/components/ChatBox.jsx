import Message from "./Message";

function ChatBox({ messages }) {
    return (
        <div className="chat-box">
            {messages.map((msg, index) => (
                <Message
                    key={index}
                    sender={msg.sender}
                    text={msg.text}
                />
            ))}
        </div>
    );
}

export default ChatBox;