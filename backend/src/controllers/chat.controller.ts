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



// Your existing chat function
export const chat = async (req: Request, res: Response) => {
  try {
    const { message, sender } = req.body;
    console.log('message:', message);

    if (!message || sender !== "user") {
      return res.status(400).json({
        error: "The message and sender fields are required in the request body, and the sender must be 'user'",
      });
    }

    // Ignore SSL certificate verification
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // Assuming you're using OpenAI, you'll need to modify this part
    const llm = new OpenAI({
      model: (process.env.MODEL as any) || "gpt-3.5-turbo",
    });

    const chatEngine = await createChatEngine(llm);

    // Convert message content from your format to LlamaIndex/OpenAI format
    const userMessageContent = message;

    // Calling LlamaIndex's ChatEngine to get a streamed response
    const response = await chatEngine.chat({
      message: userMessageContent,
      // Assuming you don't have previous chat history in this payload format
      chatHistory: [],
      stream: true,
    });

    // Return a stream, which can be consumed by the Vercel/AI client
    const { stream, data: streamData } = LlamaIndexStream(response, {
      // Assuming you don't have image URL in this payload format
      parserOptions: {},
    });

    // Pipe LlamaIndexStream to response
    const processedStream = stream.pipeThrough(streamData.stream);
    return streamToResponse(processedStream, res, {
      headers: {
        // response MUST have the `X-Experimental-Stream-Data: 'true'` header
        // so that the client uses the correct parsing logic
        "X-Experimental-Stream-Data": "true",
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Expose-Headers": "X-Experimental-Stream-Data",
      },
    });
  } catch (error) {
    console.error("[LlamaIndex]", error);
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
};


