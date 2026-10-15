import OpenAI from "openai";
import PromptSync from "prompt-sync";
import { tools, getTime, getWeather, readFileData, createOrWriteFile, createOrAppendFile, deleteFile, renameFile, createFolder, renameFolder, deleteFolder, listDirectory } from './tools.js';

const prompt = PromptSync();

const MODEL_NAME = 'LFM2.5-24B-A2B-UD-Q3_K_XL:latest';
//'nvidia_Nemotron-Cascade-2-30B-A3B-Q4_0:latest'; //'myqwen30b:latest'; //'gemma4:26b'; // Replace with your desired model name

const openai = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
  timeout: Infinity,
});


// Function execution logic
async function executeTool(toolName, args) {
  if (toolName === "get_current_weather") return getWeather(args);
  if (toolName === "get_current_time") return getTime(args);
  // File and Folder Tool Implementations
  if (toolName === "read_file") return await readFileData(args.filePath);
  if (toolName === "write_file") return await createOrWriteFile(args.filePath, args.content);
  if (toolName === "append_file") return await createOrAppendFile(args.filePath, args.content);
  if (toolName === "delete_file") return await deleteFile(args.filePath);
  if (toolName === "rename_file") return await renameFile(args.oldPath, args.newPath);
  if (toolName === "create_folder") return await createFolder(args.folderPath);
  if (toolName === "rename_folder") return await renameFolder(args.oldPath, args.newPath);
  if (toolName === "delete_folder") return await deleteFolder(args.folderPath);
  if (toolName === "list_directory") return await listDirectory(args.directoryPath);

  return JSON.stringify({ error: "Tool not found" });
}

// Helper function to handle streaming chat completions
async function streamChatCompletion(model, messages, tools = undefined) {
  const stream = await openai.chat.completions.create({
    model: model,
    think: true,
    reasoning_effort: 'none',
    messages: messages,
    tools: tools,
    stream: true,
    tool_choice: 'auto',
    // stream_options: { include_usage: true }
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

let messages = [
    { 
        role: "system", 
        content: `Your name is Romy.
You are a local agent running in a local environment.
You have access to various tools check tools passed to you.
You can call tools if needed.
Analyse the user's request carefully and make sure if two tool calls required call in one go.` 
    }
];
// 5. Run the Local Agent Loop
async function runLocalAgent(userPrompt) {
  messages.push({ role: "user", content: userPrompt });

  console.log(`User Goal: "${userPrompt}"\n---`);

  let taskCompleted = false;

  // Loop until the agent stops calling tools
  while (!taskCompleted) {
    console.log("🤖 [Agent Thinking & Responding]:");
    
    let responseMessage = await streamChatCompletion(MODEL_NAME, messages, tools);
    messages.push(responseMessage);
    // console.log("[Agent Response Object]:", responseMessage); // Optional: comment out for cleaner logs

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        // Handle potential parsing errors if the model outputs malformed JSON
        let functionArgs;
        try {
            functionArgs = JSON.parse(toolCall.function.arguments);
        } catch (e) {
            functionArgs = toolCall.function.arguments;
            console.log(`⚠️ Failed to parse args for ${functionName}:`, e);
        }

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
      // The loop repeats here, sending the tool outputs back to the LLM
    } else {
      // If there are no tool calls, the agent has provided its final text response
      taskCompleted = true;
    }
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
