"use client";

import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type MsgType = "CHAT" | "JOIN" | "LEAVE";

type Message = {
  sender: string;
  content?: string;
  type: MsgType;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    if (!savedUsername) {
      window.location.href = "/login";
      return;
    }

    setUsername(savedUsername);
    setMessages([]);
    connect(savedUsername);

    // Hämta tidigare meddelanden från databasen
    fetch("http://localhost:8080/api/chat/messages")
      .then((res) => res.json())
      .then((data: Message[]) => {
        setMessages(data);
      })
      .catch((err) => console.error("Kunde inte hämta meddelanden:", err));

    return () => {
      disconnect(savedUsername);
    };
  }, []);

  const connect = (username: string) => {
    if (stompClientRef.current?.connected) return;

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ Ansluten till WebSocket");

        client.subscribe(
          "/topic/chat",
          (message) => {
            const body: Message = JSON.parse(message.body);
            setMessages((prev) => [...prev, body]);
          },
          { id: "chat-sub" }
        );

        client.publish({
          destination: "/app/chat.send",
          body: JSON.stringify({ sender: username, type: "JOIN" }),
        });
      },
      onStompError: (frame) => {
        console.error("STOMP Error:", frame);
      },
    });

    client.activate();
    stompClientRef.current = client;
  };

  const disconnect = (username: string) => {
    const client = stompClientRef.current;
    if (client?.connected) {
      client.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ sender: username, type: "LEAVE" }),
      });
      client.unsubscribe("chat-sub");
      client.deactivate();
      stompClientRef.current = null;
    }
  };

  const sendMessage = async () => {
    if (input.trim() === "" || !stompClientRef.current?.connected) return;

    const message: Message = {
      sender: username,
      content: input,
      type: "CHAT",
    };

    // Skicka via WebSocket
    stompClientRef.current.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(message),
    });

    // Skicka till databasen
    try {
      await fetch("http://localhost:8080/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error("Kunde inte spara meddelandet i DB", error);
    }

    setInput("");
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Hej {username} 👋</h1>

        <div className="border rounded p-4 mb-4 h-80 overflow-y-scroll bg-gray-100">
          {messages.map((msg, i) => (
            <div key={i} className="mb-1">
              <strong>{msg.sender}</strong>:{" "}
              {msg.type === "CHAT" ? (
                msg.content
              ) : (
                <em>{msg.type.toLowerCase()} the chat</em>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="border p-2 flex-1 rounded"
            placeholder="Skriv ett meddelande..."
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Skicka
          </button>
        </div>
      </div>
    </main>
  );
}
