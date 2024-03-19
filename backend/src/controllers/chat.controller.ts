import { streamToResponse } from "ai";
import { Request, Response } from "express";
import { ChatMessage, MessageContent, OpenAI } from "llamaindex";
import { createChatEngine } from "./engine";
import { LlamaIndexStream } from "./llamaindex-stream";
const env = process.env["NODE_ENV"];
import multer from 'multer';
import path from 'path';
import generateScript from './engine/generate.js';

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
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'data/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage: storage }).single('file');
export const generate = async(req: any, res: any) => {
  try {
    await generateScript();
    res.status(200).json({ message: 'Generation script executed successfully' });
  } catch (error) {
    console.error('Error executing generation script:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
export const uploadFile = (req: any, res: any) => {
  try {
    upload(req, res, async function (err: any) {
      if (err instanceof multer.MulterError) {
        console.error('Multer Error:', err);
        return res.status(400).json({ error: 'Multer error occurred' });
      } else if (err) {
        console.error('Unknown Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      res.status(200).json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
        size: req.file.size
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
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
    const userMessage = chatMessages.find(msg => msg.sender === "user" && msg.direction === "outgoing");

    if (!userMessage || !userMessage.message) {
      return res.status(400).json({
        error: "User message not found or invalid format in the payload.",
      });
    }

    const userMessageContent = userMessage.message;

    if(String(process.env.DEVELOPMENT) === "0"){
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    const llm = new OpenAI({
      model: (process.env.MODEL as any) || "gpt-3.5-turbo",
    });

    const chatEngine = await createChatEngine(llm);

    const response = await chatEngine.chat({
      message: userMessageContent,
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
        content: generatedText.trim(),
      },
    };

    res.json(jsonResponse);
    
  } catch (error) {
    console.error("[LlamaIndex]", error);
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
};


