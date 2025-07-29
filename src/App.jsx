import { useState, useEffect } from "react";
import "./App.css";

// Message component for displaying chat messages
const Message = ({ isUser, content }) => (
  <div className={`message ${isUser ? "user-message" : "ai-message"}`}>
    <div className="message-content">{content}</div>
  </div>
);

// Conversation item for sidebar history
const ConversationItem = ({ title, isActive, onClick }) => (
  <div
    className={`conversation-item ${isActive ? "active" : ""}`}
    onClick={onClick}
  >
    {title}
  </div>
);

function App() {
  // State management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState([
    { id: 1, title: "新对话", messages: [] },
  ]);
  const [activeConversationId, setActiveConversationId] = useState(1);
  const [newMessage, setNewMessage] = useState("");

  // Get current active conversation
  const activeConversation = conversations.find(
    (conv) => conv.id === activeConversationId
  );

  // Create new conversation
  const createNewConversation = () => {
    const newId = Math.max(...conversations.map((conv) => conv.id)) + 1;
    const newConv = { id: newId, title: "新对话", messages: [] };
    setConversations([...conversations, newConv]);
    setActiveConversationId(newId);
  };

  // Send message function
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    // Add user message
    const updatedConversations = conversations.map((conv) => {
      if (conv.id === activeConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, { isUser: true, content: newMessage }],
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setNewMessage("");

    // Simulate AI response after short delay
    setTimeout(() => {
      const withAiResponse = updatedConversations.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [
              ...conv.messages,
              {
                isUser: false,
                content: "这是AI的回复。您发送的内容是：" + newMessage,
              },
            ],
          };
        }
        return conv;
      });
      setConversations(withAiResponse);
    }, 1000);
  };

  // Handle conversation selection
  const selectConversation = (id) => {
    setActiveConversationId(id);
  };

  return (
    <div className="app-container">
      {/* Chat Area */}
      <div
        className={`chat-area ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <div className="chat-header">
          <h1>DSeek Chat</h1>
        </div>
        <div className="chat-messages">
          {activeConversation?.messages.map((msg, index) => (
            <Message key={index} isUser={msg.isUser} content={msg.content} />
          ))}
        </div>
        <div className="chat-input-area">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              !e.shiftKey &&
              (e.preventDefault(), sendMessage())
            }
            placeholder="输入消息...按Enter发送"
          />
          <button onClick={sendMessage}>发送</button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <button
          className="toggle-sidebar-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? "展开" : "收起"}
        </button>

        <div className="sidebar-header">
          <button onClick={createNewConversation} className="new-conv-btn">
            + 新对话
          </button>
        </div>

        <div className="conversation-history">
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              title={conv.title}
              isActive={conv.id === activeConversationId}
              onClick={() => selectConversation(conv.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
