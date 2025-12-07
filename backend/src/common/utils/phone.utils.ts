/**
 * Phone utility functions for Brazilian phone number formatting and validation
 */
export class PhoneUtils {
  /**
   * Validate Brazilian mobile phone number
   * Expected format: (34) 99876-5432 or 34998765432
   * @param phone - Phone number to validate
   * @returns true if valid Brazilian mobile number
   */
  static validateBrazilianPhone(phone: string): boolean {
    if (!phone) return false;

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Brazilian mobile: DDD (2 digits) + 9 (mobile indicator) + 8 digits
    // Total: 11 digits
    // DDD must start with 1-9, mobile must start with 9
    return /^[1-9]{2}9[0-9]{8}$/.test(cleaned);
  }

  /**
   * Convert Brazilian phone number to WhatsApp ID format
   * @param phone - Phone number in any format
   * @returns WhatsApp ID (e.g., 5534998765432@c.us)
   */
  static toWhatsAppId(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    return `55${cleaned}@c.us`;
  }

  /**
   * Convert WhatsApp ID back to friendly format
   * @param whatsappId - WhatsApp ID (e.g., 5534998765432@c.us)
   * @returns Friendly format (e.g., (34) 99876-5432)
   */
  static toFriendlyFormat(whatsappId: string): string {
    // Remove @c.us and country code (55)
    const digits = whatsappId.replace(/\D/g, '').substring(2);

    if (digits.length !== 11) return whatsappId;

    // Format: (XX) 9XXXX-XXXX
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  }

  /**
   * Format phone number for display
   * @param phone - Phone number (11 digits)
   * @returns Formatted phone (e.g., (34) 99876-5432)
   */
  static formatDisplay(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length !== 11) return phone;

    // Format: (XX) 9XXXX-XXXX
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }

  /**
   * Clean phone number (remove all non-digit characters)
   * @param phone - Phone number in any format
   * @returns Only digits
   */
  static cleanPhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Extract WhatsApp phone number from ID
   * @param whatsappId - WhatsApp ID (e.g., 5534998765432@c.us)
   * @returns Phone number without country code (e.g., 34998765432)
   */
  static extractPhoneFromWhatsAppId(whatsappId: string): string {
    return whatsappId.replace(/\D/g, '').substring(2);
  }
}
