import OpenAI from "openai";
import PromptSync from "prompt-sync";
import { writeFile, appendFile, rm, rename, mkdir } from 'node:fs/promises';
const prompt = PromptSync();

const MODEL_NAME = 'ornith:latest'; // Replace with your desired model name

// 1. Initialize the OpenAI client pointing to your local Ollama instance
const openai = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
});

function getWeather(args){
    return JSON.stringify({ 
      location: args.location, 
      temperature: "68°F", 
      condition: "Partly Cloudy" 
    });
}

// File and Folder Tool Implementations
async function createFile(filePath, content) {
  try {
    await writeFile(filePath, content, 'utf8');
    return `Successfully created file: ${filePath}`;
  } catch (error) {
    return `Failed to create file: ${error.message}`;
  }
}

async function updateFile(filePath, content) {
  try {
    await appendFile(filePath, content, 'utf8');
    return `Successfully updated file: ${filePath}`;
  } catch (error) {
    return `Failed to update file: ${error.message}`;
  }
}

async function deleteFile(filePath) {
  try {
    await rm(filePath, { force: true });
    return `Successfully deleted file: ${filePath}`;
  } catch (error) {
    return `Failed to delete file: ${error.message}`;
  }
}

async function renameFile(oldPath, newPath) {
  try {
    await rename(oldPath, newPath);
    return `Successfully renamed file from ${oldPath} to ${newPath}`;
  } catch (error) {
    return `Failed to rename file: ${error.message}`;
  }
}

async function createFolder(folderPath) {
  try {
    await mkdir(folderPath, { recursive: true });
    return `Successfully created folder: ${folderPath}`;
  } catch (error) {
    return `Failed to create folder: ${error.message}`;
  }
}

async function renameFolder(oldPath, newPath) {
  try {
    await rename(oldPath, newPath);
    return `Successfully renamed folder from ${oldPath} to ${newPath}`;
  } catch (error) {
    return `Failed to rename folder: ${error.message}`;
  }
}

async function deleteFolder(folderPath) {
  try {
    await rm(folderPath, { recursive: true, force: true });
    return `Successfully deleted folder: ${folderPath}`;
  } catch (error) {
    return `Failed to delete folder: ${error.message}`;
  }
}

// 2. Define custom tools the local agent can use
const tools = 

// 3. Mock function execution logic
async function executeTool(toolName, args) {
  if (toolName === "get_current_weather") return getWeather(args);
  if (toolName === "create_file") return await createFile(args.filePath, args.content);
  if (toolName === "update_file") return await updateFile(args.filePath, args.content);
  if (toolName === "delete_file") return await deleteFile(args.filePath);
  if (toolName === "rename_file") return await renameFile(args.oldPath, args.newPath);
  if (toolName === "create_folder") return await createFolder(args.folderPath);
  if (toolName === "rename_folder") return await renameFolder(args.oldPath, args.newPath);
  if (toolName === "delete_folder") return await deleteFolder(args.folderPath);
  
  return JSON.stringify({ error: "Tool not found" });
}

// 4. Helper function to handle streaming chat completions
async function streamChatCompletion(model, messages, tools = undefined) {
  const stream = await openai.chat.completions.create({
    model: model,
    think: false,
    reasoning_effort: 'none',
    messages: messages,
    tools: tools,
    stream: true,
    stream_options: { include_usage: true }
  });

  let fullContent = "";
  let fullReasoning = "";
  let toolCallsMap = {};

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;

    if (delta.reasoning) {
      process.stdout.write("\x1b[32m"+delta.reasoning+"\x1b[0m");
      fullReasoning += delta.reasoning;
    }

    if (delta.content) {
      process.stdout.write(delta.content);
      fullContent += delta.content;
    }

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        const index = tc.index;
        if (!toolCallsMap[index]) {
          toolCallsMap[index] = { id: "", type: "function", function: { name: "", arguments: "" } };
        }
        if (tc.id) toolCallsMap[index].id += tc.id;
        if (tc.function?.name) toolCallsMap[index].function.name += tc.function.name;
        if (tc.function?.arguments) toolCallsMap[index].function.arguments += tc.function.arguments;
      }
    }
  }

  console.log("\n");

  const tool_calls = Object.keys(toolCallsMap).length > 0 
    ? Object.values(toolCallsMap) 
    : undefined;

  return {
    role: "assistant",
    content: fullContent || null,
    tool_calls: tool_calls
  };
}

let messages = [];
// 5. Run the Local Agent Loop
async function runLocalAgent(userPrompt) {
  messages.push({ role: "user", content: userPrompt });

  console.log(`User Goal: "${userPrompt}"\n---`);
  console.log("🤖 [Agent Thinking & Responding]:");

  let responseMessage = await streamChatCompletion('gemma4:12b', messages, tools);
  messages.push(responseMessage);

  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    for (const toolCall of responseMessage.tool_calls) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log(`🛠️ Local Agent decided to use tool: ${functionName} with args:`, functionArgs);

      // Await the asynchronous tool execution
      const toolResult = await executeTool(functionName, functionArgs);
      console.log(`🛠️ Tool Output: ${toolResult}\n---`);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResult,
      });
    }

    console.log("🤖 [Agent Processing Tool Output]:");

    const secondResponseMessage = await streamChatCompletion('gemma4:12b', messages);
    messages.push(secondResponseMessage);
  }
}

// Execute the agent locally
while (true) {
  const message = prompt("Enter your message: ");
  if (message === 'exit') {
    break;
  }
  await runLocalAgent(message);
}
