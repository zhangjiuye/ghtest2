import { useState, useEffect } from "react";
import "./App.css";
import { sendChatMessage } from "./services/api";

// Message component for displaying chat messages
const Message = ({ isUser, content }) => (
  <div className={`message ${isUser ? "user-message" : "ai-message"}`}>
    <div
      className="message-content"
      dangerouslySetInnerHTML={{ __html: content }}
    ></div>
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
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load conversations from backend on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/conversations");
        if (!response.ok) throw new Error("Failed to fetch conversations");
        const data = await response.json();
        // Normalize conversations to use id instead of _id
        const normalizedConversations = data.map((conv) => ({
          ...conv,
          id: conv._id, // Map _id to id
          isModified: false, // Ensure isModified is set
        }));
        setConversations(normalizedConversations);
        if (normalizedConversations.length > 0) {
          setActiveConversationId(normalizedConversations[0].id);
        }
      } catch (err) {
        setError("无法加载对话历史: " + err.message);
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Save conversation to backend whenever conversations change
  useEffect(() => {
    if (conversations.length === 0 || loading) return;

    const saveConversations = async () => {
      try {
        // For each conversation not yet saved to backend
        for (const conv of conversations) {
          if (!conv._id) {
            // Create new conversation
            const response = await fetch(
              "http://127.0.0.1:5000/api/conversations",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(conv),
              }
            );
            if (!response.ok) throw new Error("Failed to save conversation");
            const savedConv = await response.json();
            // Update to use backend-generated _id as id
            setConversations((prev) =>
              prev.map((c) =>
                c.id === conv.id
                  ? { ...savedConv, id: savedConv._id, _id: undefined }
                  : c
              )
            );
          } else if (conv.isModified) {
            // Update existing conversation
            const response = await fetch(
              `http://127.0.0.1:5000/api/conversations/${conv._id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: conv.messages,
                  title: conv.title,
                }),
              }
            );
            if (!response.ok) throw new Error("Failed to update conversation");
            // Clear the modified flag
            setConversations((prev) =>
              prev.map((c) =>
                c._id === conv._id ? { ...c, isModified: false } : c
              )
            );
          }
        }
      } catch (err) {
        setError("保存对话失败: " + err.message);
        console.error("Error saving conversations:", err);
      }
    };

    saveConversations();
  }, [conversations]);

  // Get current active conversation
  const activeConversation = conversations.find(
    (conv) => conv._id === activeConversationId
  );

  // Create new conversation
  const createNewConversation = () => {
    const conversationName = prompt("请输入对话名称:", "新对话");
    if (!conversationName) return;
    const newConv = {
      id: Date.now().toString(),
      title: conversationName,
      messages: [],
      isModified: true,
    };
    setConversations([newConv, ...conversations]);
    setActiveConversationId(newConv.id);
  };

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Add user message
    const updatedConversations = conversations.map((conv) => {
      if (
        conv._id === activeConversationId ||
        conv.id === activeConversationId
      ) {
        return {
          ...conv,
          messages: [...conv.messages, { isUser: true, content: newMessage }],
          isModified: true,
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setNewMessage("");

    try {
      // Get API key from backend or environment variable
      const apiKeyResponse = await fetch("http://127.0.0.1:5000/api/config");
      if (!apiKeyResponse.ok) throw new Error("无法获取API密钥");

      const config = await apiKeyResponse.json();
      const apiKey = config.apiKey || config.deepseekApiKey; // 兼容两种格式

      if (!apiKey) throw new Error("未配置API密钥");

      // 调用 DeepSeek API
      const aiResponse = await sendChatMessage(newMessage, apiKey);

      const withAiResponse = updatedConversations.map((conv) => {
        if (
          conv._id === activeConversationId ||
          conv.id === activeConversationId
        ) {
          return {
            ...conv,
            messages: [
              ...conv.messages,
              { isUser: false, content: aiResponse },
            ],
            isModified: true,
          };
        }
        return conv;
      });
      setConversations(withAiResponse);
    } catch (error) {
      console.error("API调用错误:", error);
      const errorMessage = error.response
        ? `API错误: ${error.response.status} ${error.response.statusText}`
        : error.message;

      const withErrorResponse = updatedConversations.map((conv) => {
        if (
          conv._id === activeConversationId ||
          conv.id === activeConversationId
        ) {
          return {
            ...conv,
            messages: [
              ...conv.messages,
              {
                isUser: false,
                content: `抱歉，无法获取AI响应: ${errorMessage}`,
              },
            ],
            isModified: true,
          };
        }
        return conv;
      });
      setConversations(withErrorResponse);
    }
  };

  // Handle conversation selection
  const selectConversation = (id) => {
    setActiveConversationId(id);
  };

  if (loading) return <div className="loading">加载对话历史中...</div>;
  if (error) return <div className="error">{error}</div>;

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
            <Message
              key={`msg-${index}`}
              isUser={msg.isUser}
              content={msg.content}
            />
          )) || <div className="empty-state">选择或创建一个对话开始聊天</div>}
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
