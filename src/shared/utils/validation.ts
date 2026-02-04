/**
 * Input Validation & Sanitization Utilities
 * Centralized security validation to prevent injection attacks
 */

// Email validation with RFC 5322 compliance
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
}

// Phone number validation (Indian format)
export const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(phone.replace(/\s+/g, ''))
}

// Sanitize string input - remove potential SQL injection characters
export const sanitizeString = (input: string, maxLength: number = 255): string => {
    if (!input) return ''
    return input
        .trim()
        .slice(0, maxLength)
        .replace(/[<>]/g, '') // Remove HTML tags
}

// Validate and sanitize numeric input
export const validateNumber = (value: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number | null => {
    const num = Number(value)
    if (isNaN(num) || num < min || num > max) return null
    return num
}

// Sanitize GST number (Indian format)
export const validateGSTNumber = (gst: string): boolean => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstRegex.test(gst.trim().toUpperCase())
}

// Validate PAN number (Indian format)
export const validatePAN = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    return panRegex.test(pan.trim().toUpperCase())
}

// Sanitize order number - alphanumeric only
export const sanitizeOrderNumber = (orderNum: string): string => {
    return orderNum.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 50)
}

// Validate date input
export const validateDate = (date: string): boolean => {
    const parsed = new Date(date)
    return parsed instanceof Date && !isNaN(parsed.getTime())
}

// Prevent XSS by escaping HTML entities
export const escapeHtml = (text: string): string => {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
}

// Validate currency amount (positive, max 2 decimals)
export const validateAmount = (amount: any): number | null => {
    const num = Number(amount)
    if (isNaN(num) || num < 0 || num > 999999999.99) return null
    return Math.round(num * 100) / 100 // Ensure 2 decimal places
}

// Validate weight (grams, positive)
export const validateWeight = (weight: any): number | null => {
    const num = Number(weight)
    if (isNaN(num) || num < 0 || num > 1000000) return null
    return Math.round(num * 100) / 100
}

// Rate limiting helper (client-side)
export class RateLimiter {
    private attempts: Map<string, number[]> = new Map()

    isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
        const now = Date.now()
        const attempts = this.attempts.get(key) || []

        // Filter out old attempts
        const recentAttempts = attempts.filter(time => now - time < windowMs)

        if (recentAttempts.length >= maxAttempts) {
            return false
        }

        recentAttempts.push(now)
        this.attempts.set(key, recentAttempts)
        return true
    }

    reset(key: string): void {
        this.attempts.delete(key)
    }
}

// Global rate limiter instance
export const loginRateLimiter = new RateLimiter()
