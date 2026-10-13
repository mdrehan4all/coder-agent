import { writeFile, readFile, appendFile, rm, rename, mkdir } from 'node:fs/promises';

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
      name: "read_file",
      description: "Read the content of a specified file",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path or name of the file to read" },
        },
        required: ["filePath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Create a new file with the specified content or overwrite an existing file",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path or name of the file to create or overwrite" },
          content: { type: "string", description: "Content to write into the file" },
        },
        required: ["filePath", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "append_file",
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
  },
  //list files and folders in a directory
  {
    type: "function",
    function: {
      name: "list_directory",
      description: "List all files and folders in a specified directory",
      parameters: {
        type: "object",
        properties: {
          directoryPath: { type: "string", description: "Path to the directory to list" },
        },
        required: ["directoryPath"],
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

export async function createOrWriteFile(filePath, content) {
  try {
    await writeFile(filePath, content, 'utf8');
    return `Successfully created/overwritten file: ${filePath}`;
  } catch (error) {
    return `Failed to create file: ${error.message}`;
  }
}

export async function readFileData(filePath) {
  try {
    const data = await readFile(filePath, 'utf8');
    return data;
  } catch (error) {
    return `Failed to read file: ${error.message}`;
  }
}

export async function createOrAppendFile(filePath, content) {
  try {
    await appendFile(filePath, content, 'utf8');
    return `Successfully appended to file: ${filePath}`;
  } catch (error) {
    return `Failed to append to file: ${error.message}`;
  }
}

export async function deleteFile(filePath) {
  try {
    await rm(filePath, { force: true });
    return `Successfully deleted file: ${filePath}`;
  } catch (error) {
    return `Failed to delete file: ${error.message}`;
  }
}

export async function renameFile(oldPath, newPath) {
  try {
    await rename(oldPath, newPath);
    return `Successfully renamed file from ${oldPath} to ${newPath}`;
  } catch (error) {
    return `Failed to rename file: ${error.message}`;
  }
}

export async function createFolder(folderPath) {
  try {
    await mkdir(folderPath, { recursive: true });
    return `Successfully created folder: ${folderPath}`;
  } catch (error) {
    return `Failed to create folder: ${error.message}`;
  }
}

export async function renameFolder(oldPath, newPath) {
  try {
    await rename(oldPath, newPath);
    return `Successfully renamed folder from ${oldPath} to ${newPath}`;
  } catch (error) {
    return `Failed to rename folder: ${error.message}`;
  }
}

export async function deleteFolder(folderPath) {
  try {
    await rm(folderPath, { recursive: true, force: true });
    return `Successfully deleted folder: ${folderPath}`;
  } catch (error) {
    return `Failed to delete folder: ${error.message}`;
  }
}

export async function listDirectory(directoryPath) {
  try {
    const files = await readdir(directoryPath, { withFileTypes: true });
    const fileList = files.map(file => ({
      name: file.name,
      type: file.isDirectory() ? 'folder' : 'file'
    }));
    return JSON.stringify(fileList);
  } catch (error) {
    return `Failed to list directory: ${error.message}`;
  }
}