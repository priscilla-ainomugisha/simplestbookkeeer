import twilio from 'twilio';

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client if credentials are available
const twilioClient = accountSid && authToken 
  ? twilio(accountSid, authToken)
  : null;

// Function to send WhatsApp message via Twilio
export async function sendWhatsAppMessage(
  to: string, 
  message: string
): Promise<void> {
  // Skip if Twilio is not configured
  if (!twilioClient || !twilioPhoneNumber) {
    console.log('Twilio not configured, skipping WhatsApp message');
    return;
  }

  try {
    // Format the recipient for WhatsApp
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const whatsappFrom = twilioPhoneNumber.startsWith('whatsapp:') 
      ? twilioPhoneNumber 
      : `whatsapp:${twilioPhoneNumber}`;

    // Send the message
    await twilioClient.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo
    });

    console.log(`WhatsApp message sent to ${to}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw new Error(`Failed to send WhatsApp message: ${(error as Error).message}`);
  }
}

// Function to check if Twilio is properly configured
export function isTwilioConfigured(): boolean {
  return !!(twilioClient && twilioPhoneNumber);
}
