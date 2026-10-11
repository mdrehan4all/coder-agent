import { writeFile, appendFile, rm, rename, mkdir } from 'node:fs/promises';

export const tools = [
  {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "Get the current weather for a given location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "The city and state, e.g. San Francisco, CA" },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_current_time",
      description: "Get current time",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_file",
      description: "Create a new file with the specified content",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path or name of the file to create" },
          content: { type: "string", description: "Content to write into the file" },
        },
        required: ["filePath", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_file",
      description: "Append content to an existing file",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path or name of the file to update" },
          content: { type: "string", description: "Content to append to the file" },
        },
        required: ["filePath", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_file",
      description: "Delete a specified file",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path or name of the file to delete" },
        },
        required: ["filePath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rename_file",
      description: "Rename or move a file",
      parameters: {
        type: "object",
        properties: {
          oldPath: { type: "string", description: "Current file path" },
          newPath: { type: "string", description: "New file path" },
        },
        required: ["oldPath", "newPath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_folder",
      description: "Create a new directory (creates parent directories if needed)",
      parameters: {
        type: "object",
        properties: {
          folderPath: { type: "string", description: "Path or name of the folder to create" },
        },
        required: ["folderPath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rename_folder",
      description: "Rename or move a folder",
      parameters: {
        type: "object",
        properties: {
          oldPath: { type: "string", description: "Current folder path" },
          newPath: { type: "string", description: "New folder path" },
        },
        required: ["oldPath", "newPath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_folder",
      description: "Delete a folder and all its content recursively",
      parameters: {
        type: "object",
        properties: {
          folderPath: { type: "string", description: "Path or name of the folder to delete" },
        },
        required: ["folderPath"],
      },
    },
  }
];

// Functions

export function getTime(){
  const now = new Date();
  return now.toString()
}

export function getWeather(args) {
  console.log("Fetching weather for location:", args.location);
  return `Current weather of ${args.location} is sunny and temperature is 40°C.`;
}

export async function createFile(filePath, content) {
  try {
    await writeFile(filePath, content, 'utf8');
    return `Successfully created file: ${filePath}`;
  } catch (error) {
    return `Failed to create file: ${error.message}`;
  }
}