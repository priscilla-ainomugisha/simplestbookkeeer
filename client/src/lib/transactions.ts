/**
 * Record audio from microphone
 * Returns a Promise that resolves with the audio Blob
 */
export const recordAudio = (): Promise<{ audioBlob: Blob, stop: () => void }> => {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        resolve({ audioBlob, stop });
      });

      // Start recording
      mediaRecorder.start();

      const stop = () => {
        mediaRecorder.stop();
        stream.getTracks().forEach((track) => track.stop());
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Format a transaction value for display based on its type
 */
export const formatTransactionValue = (amount: number, type: string): string => {
  return `${type === "income" ? "+" : "-"}${formatCurrency(amount)}`;
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/**
 * Parse a user message to extract transaction details
 */
export const parseUserMessage = (message: string): {
  type: "income" | "expense" | "unknown";
  amount: number | null;
  category: string | null;
} => {
  const lowerMessage = message.toLowerCase();
  
  // Determine transaction type
  let type: "income" | "expense" | "unknown" = "unknown";
  
  if (/sold|sales|earning|income|revenue|received/i.test(lowerMessage)) {
    type = "income";
  } else if (/spent|bought|paid|expense|cost|purchase/i.test(lowerMessage)) {
    type = "expense";
  }
  
  // Extract amount
  const amountMatch = lowerMessage.match(/\b(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)\b/);
  const amount = amountMatch ? parseFloat(amountMatch[0].replace(/,/g, '')) : null;
  
  // Extract category
  let category: string | null = null;
  
  if (type === "income") {
    if (/sales|sold|goods|products/i.test(lowerMessage)) {
      category = "Sales";
    } else if (/service|repair|work/i.test(lowerMessage)) {
      category = "Services";
    } else {
      category = "Other Income";
    }
  } else if (type === "expense") {
    if (/transport|taxi|bus|fare|car|petrol|gas|travel/i.test(lowerMessage)) {
      category = "Transport";
    } else if (/food|lunch|dinner|meal|eat/i.test(lowerMessage)) {
      category = "Food";
    } else if (/supply|supplies|material|stock|inventory/i.test(lowerMessage)) {
      category = "Supplies";
    } else if (/rent|lease|office/i.test(lowerMessage)) {
      category = "Rent";
    } else if (/utility|utilities|electric|water|bill|phone|internet/i.test(lowerMessage)) {
      category = "Utilities";
    } else if (/salary|wage|staff|employee|worker/i.test(lowerMessage)) {
      category = "Salaries";
    } else {
      category = "Other Expenses";
    }
  }
  
  return { type, amount, category };
};
