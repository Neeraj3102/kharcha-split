import QRCode from 'qrcode';

/**
 * Constructs a standard NPCI UPI Intent URI
 * Format: upi://pay?pa={UPI_ID}&pn={NAME}&am={AMOUNT}&cu=INR&tn={NOTE}
 */
export function generateUpiUri(
  upiId: string,
  payeeName: string,
  amount: number,
  note = 'KharchaSplit Settlement'
): string {
  const cleanUpi = upiId.trim();
  const cleanName = payeeName.trim();
  const cleanAmount = amount.toFixed(2);
  const cleanNote = note.trim();

  const params = new URLSearchParams({
    pa: cleanUpi,
    pn: cleanName,
    am: cleanAmount,
    cu: 'INR',
    tn: cleanNote,
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Generates a high-resolution QR Code data URL (PNG) completely client-side in the browser
 */
export async function generateUpiQrCode(
  upiUri: string,
  options: {
    color?: { dark: string; light: string };
    width?: number;
  } = {}
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(upiUri, {
      width: options.width || 320,
      margin: 2,
      color: options.color || {
        dark: '#08080a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate UPI QR code:', err);
    throw err;
  }
}
