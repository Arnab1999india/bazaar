export class ValidationUtil {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
    return passwordRegex.test(password);
  }

  static isValidPhoneNumber(phone: string): boolean {
    // Basic phone number validation (can be customized based on requirements)
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
  }

  static isValidPrice(price: number): boolean {
    return typeof price === "number" && price >= 0;
  }

  static isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return url.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/) !== null;
    } catch {
      return false;
    }
  }

  static sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, "");
  }

  static validateImageSize(size: number, maxSizeMB: number = 5): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  }

  static validateImageDimensions(
    width: number,
    height: number,
    maxDimension: number = 2048
  ): boolean {
    return width <= maxDimension && height <= maxDimension;
  }

  static isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  static isValidCategory(
    category: string,
    allowedCategories: string[]
  ): boolean {
    return allowedCategories.includes(category);
  }

  static validateProductInput(
    name: string,
    description: string,
    price: number
  ): string[] {
    const errors: string[] = [];

    if (!name || name.trim().length < 3) {
      errors.push("Product name must be at least 3 characters long");
    }

    if (!description || description.trim().length < 10) {
      errors.push("Product description must be at least 10 characters long");
    }

    if (!this.isValidPrice(price)) {
      errors.push("Invalid price value");
    }

    return errors;
  }
}
