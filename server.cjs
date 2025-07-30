// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dseek-chat")
  .then(() => console.log("MongoDB connected"))
  .catch((err) =>
    console.error("MongoDB connection error:", process.env.MONGODB_URI, err)
  );

// Conversation Model
const ConversationSchema = new mongoose.Schema({
  title: { type: String, required: true, default: "新对话" },
  messages: [
    {
      isUser: { type: Boolean, required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const Conversation = mongoose.model("Conversation", ConversationSchema);

// API Endpoints
// Get application configuration including API keys
app.get("/api/config", (req, res) => {
  res.json({
    apiKey: process.env.DEEPSEEK_API_KEY,
  });
});

// Save conversation
app.post("/api/conversations", async (req, res) => {
  try {
    const conversation = new Conversation(req.body);
    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Failed to save conversation" });
  }
});

// Get all conversations
app.get("/api/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ createdAt: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Update conversation
app.put("/api/conversations/:id", async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Failed to update conversation" });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
