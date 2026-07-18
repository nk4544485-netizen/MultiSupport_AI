import { useState } from "react";

function InputBox({ onSend }) {
    const [message, setMessage] = useState("");

    const send = () => {
        if (!message.trim()) return;

        onSend(message);
        setMessage("");
    };

    return (
        <div className="input-box">
            <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
            />

            <button onClick={send}>
                Send
            </button>
        </div>
    );
}

export default InputBox;