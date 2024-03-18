import { streamToResponse } from "ai";
import { Request, Response } from "express";
import { ChatMessage, MessageContent, OpenAI } from "llamaindex";
import { createChatEngine } from "./engine";
import { LlamaIndexStream } from "./llamaindex-stream";
const convertMessageContent = (
  textMessage: string,
  imageUrl: string | undefined,
): MessageContent => {
  if (!imageUrl) return textMessage;
  return [
    {
      type: "text",
      text: textMessage,
    },
    {
      type: "image_url",
      image_url: {
        url: imageUrl,
      },
    },
  ];
};

export const detect = (req:any, res:any) => {
  try {
    return res.status(200).json({
      message: 'Connection success'
    });
  } catch (e) {
    console.log('error', e);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};
export const chat = async (req: Request, res: Response) => {
  try {
    const { chatMessages } = req.body;

    if (!Array.isArray(chatMessages)) {
      return res.status(400).json({
        error: "chatMessages must be an array.",
      });
    }

    // Finding the user message within the chatMessages array
    const userMessage = chatMessages.find(msg => msg.sender === "user" && msg.direction === "outgoing");

    if (!userMessage || !userMessage.message) {
      return res.status(400).json({
        error: "User message not found or invalid format in the payload.",
      });
    }

    // Extracting the user message content
    const userMessageContent = userMessage.message;

    // Ignore SSL certificate verification
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // Assuming you're using OpenAI, you'll need to modify this part
    const llm = new OpenAI({
      model: (process.env.MODEL as any) || "gpt-3.5-turbo",
    });

    const chatEngine = await createChatEngine(llm);

    // Calling LlamaIndex's ChatEngine to get a streamed response
    const response = await chatEngine.chat({
      message: userMessageContent,
      // Assuming you don't have previous chat history in this payload format
      chatHistory: [],
      stream: true,
    });

    let generatedText = '';

    // Iterate over the AsyncGenerator to extract data chunks
    for await (const chunk of response) {
      generatedText += chunk;
    }

    const jsonResponse = {
      success: true,
      message: {
        role: "assistant",
        content: generatedText.trim(), // Trim to remove leading/trailing whitespace
      },
    };

    // Send the JSON response
    res.json(jsonResponse);
    
  } catch (error) {
    console.error("[LlamaIndex]", error);
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
};


