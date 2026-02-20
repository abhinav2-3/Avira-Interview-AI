import fs from "fs";
import PDFParser from "pdf-parse-fork";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await PDFParser(buffer);
    return data.text;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function extractTextFromPdf2(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await PDFParser(dataBuffer);
    return data.text;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0"); // ensure 2 digits
  const month = String(date.getMonth() + 1).padStart(2, "0"); // JS months are 0-based
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
