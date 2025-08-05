"use strict";
/**
 * Utilidades para procesamiento de texto y parsing
 * Integra Control Tower MVP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextUtils = void 0;
class TextUtils {
    /**
     * Normaliza espacios en blanco en un texto
     */
    static normalizeWhitespace(text) {
        return text
            .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
            .replace(/\n\s*\n/g, '\n') // Múltiples saltos de línea a uno solo
            .trim();
    }
    /**
     * Limpia un texto eliminando caracteres especiales comunes
     */
    static cleanText(text) {
        return text
            .replace(/[""'']/g, '"') // Normalizar comillas
            .replace(/[–—]/g, '-') // Normalizar guiones
            .replace(/\u00A0/g, ' ') // Espacios no-break a espacios normales
            .replace(/\t/g, ' ') // Tabs a espacios
            .trim();
    }
    /**
     * Extrae un valor numérico de un texto
     */
    static extractNumber(text) {
        // Limpiar el texto de caracteres no numéricos excepto punto y coma
        const cleanedText = text.replace(/[^\d.,]/g, '');
        // Manejar formato con comas como separador de miles
        const normalizedText = cleanedText.replace(/,(?=\d{3})/g, '');
        const number = parseFloat(normalizedText);
        return isNaN(number) ? null : number;
    }
    /**
     * Extrae un porcentaje de un texto
     */
    static extractPercentage(text) {
        const percentageMatch = text.match(/(\d+(?:\.\d+)?)%/);
        if (percentageMatch) {
            const value = parseFloat(percentageMatch[1]);
            return isNaN(value) ? null : value;
        }
        return null;
    }
    /**
     * Capitaliza la primera letra de cada palabra
     */
    static capitalizeWords(text) {
        return text
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    /**
     * Extrae líneas que contienen un patrón específico
     */
    static extractLinesContaining(text, pattern) {
        const lines = text.split('\n');
        const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
        return lines.filter(line => regex.test(line)).map(line => line.trim());
    }
    /**
     * Busca el texto que viene después de una etiqueta específica
     */
    static extractAfterLabel(text, label, delimiter = '\n') {
        const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`${escapedLabel}\\s*:?\\s*(.+?)(?=${delimiter}|$)`, 'i');
        const match = text.match(pattern);
        return match ? match[1].trim() : null;
    }
    /**
     * Divide un texto en bloques basado en un separador
     */
    static splitIntoBlocks(text, separator) {
        const blocks = text.split(separator);
        return blocks
            .map(block => block.trim())
            .filter(block => block.length > 0);
    }
    /**
     * Valida si un texto parece ser un código SWIFT
     */
    static isValidSwiftCode(text) {
        const swiftPattern = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        return swiftPattern.test(text.replace(/\s/g, ''));
    }
    /**
     * Valida si un texto parece ser un número de cuenta bancaria
     */
    static isValidAccountNumber(text) {
        const cleanNumber = text.replace(/[\s-]/g, '');
        return /^\d{8,34}$/.test(cleanNumber);
    }
    /**
     * Extrae fechas en formato YYYY-MM-DD de un texto
     */
    static extractDates(text) {
        const datePattern = /\b(\d{4}-\d{2}-\d{2})\b/g;
        const matches = text.match(datePattern);
        return matches || [];
    }
    /**
     * Convierte una fecha en formato DD/MM/YYYY a YYYY-MM-DD
     */
    static convertDateFormat(dateString) {
        // Detectar formato DD/MM/YYYY o DD-MM-YYYY
        const ddmmyyyyMatch = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (ddmmyyyyMatch) {
            const [, day, month, year] = ddmmyyyyMatch;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // Detectar formato YYYY-MM-DD (ya válido)
        const yyyymmddMatch = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (yyyymmddMatch) {
            const [, year, month, day] = yyyymmddMatch;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return null;
    }
    /**
     * Encuentra el texto entre dos marcadores
     */
    static extractBetween(text, startMarker, endMarker) {
        const startIndex = text.indexOf(startMarker);
        if (startIndex === -1)
            return null;
        const searchStart = startIndex + startMarker.length;
        const endIndex = text.indexOf(endMarker, searchStart);
        if (endIndex === -1)
            return null;
        return text.substring(searchStart, endIndex).trim();
    }
    /**
     * Limpia caracteres especiales de nombres y mantiene solo letras, números y espacios
     */
    static sanitizeName(name) {
        return name
            .replace(/[^a-zA-Z0-9\s\.\-]/g, '') // Solo letras, números, espacios, puntos y guiones
            .replace(/\s{2,}/g, ' ') // Múltiples espacios a uno solo
            .trim();
    }
    /**
     * Extrae códigos de moneda (USD, EUR, etc.) de un texto
     */
    static extractCurrencyCode(text) {
        const currencyMatch = text.match(/\b(USD|EUR|GBP|COP|JPY|CAD|AUD|CHF|CNY)\b/i);
        return currencyMatch ? currencyMatch[1].toUpperCase() : null;
    }
    /**
     * Determina si un texto contiene información de Incoterms
     */
    static extractIncoterm(text) {
        const incotermPattern = /\b(EXW|FCA|FAS|FOB|CFR|CIF|CPT|CIP|DAT|DAP|DDP|DPU)\b/i;
        const match = text.match(incotermPattern);
        if (match) {
            // Buscar también la ubicación que sigue al incoterm
            const locationPattern = new RegExp(`${match[1]}\\s*-\\s*(.+?)(?=\\n|$)`, 'i');
            const locationMatch = text.match(locationPattern);
            if (locationMatch) {
                return `${match[1]} - ${locationMatch[1].trim()}`;
            }
            return match[1].toUpperCase();
        }
        return null;
    }
    /**
     * Valida y normaliza un nombre de país
     */
    static normalizeCountryName(countryName) {
        const countryMappings = {
            'MEXICO': 'MÉXICO',
            'CHINA': 'CHINA',
            'USA': 'ESTADOS UNIDOS',
            'US': 'ESTADOS UNIDOS',
            'UK': 'REINO UNIDO',
            'UNITED KINGDOM': 'REINO UNIDO',
            'GERMANY': 'ALEMANIA',
            'SPAIN': 'ESPAÑA',
            'FRANCE': 'FRANCIA',
            'ITALY': 'ITALIA',
            'BRAZIL': 'BRASIL',
            'COLOMBIA': 'COLOMBIA'
        };
        const normalizedInput = countryName.toUpperCase().trim();
        return countryMappings[normalizedInput] || this.capitalizeWords(countryName);
    }
    /**
     * Extrae términos de pago de un texto
     */
    static extractPaymentTerms(text) {
        // Buscar patrones comunes de términos de pago
        const paymentPatterns = [
            /(\d+%\s*(?:ADVANCE|ADELANTO|ANTICIPO).*?(?:\d+%.*?(?:BL|BILL OF LADING|DOCUMENTO|COPY))?)/i,
            /(CASH\s*(?:AGAINST|ON)\s*(?:DELIVERY|DOCUMENTS))/i,
            /(LETTER\s*OF\s*CREDIT)/i,
            /(OPEN\s*ACCOUNT)/i,
            /(\d+\s*DAYS?\s*(?:NET|PAYMENT))/i
        ];
        for (const pattern of paymentPatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        return null;
    }
    /**
     * Valida si un texto parece contener información válida de una operación
     */
    static isValidOperationText(text) {
        const requiredKeywords = ['CLIENTE', 'PAÍS', 'VALOR'];
        const foundKeywords = requiredKeywords.filter(keyword => text.toUpperCase().includes(keyword));
        return foundKeywords.length >= 2 && text.length > 50;
    }
    /**
     * Extrae números de teléfono de un texto
     */
    static extractPhoneNumbers(text) {
        const phonePattern = /(?:\+?[\d\s\-\(\)]{7,})/g;
        const matches = text.match(phonePattern);
        if (!matches)
            return [];
        return matches
            .map(phone => phone.replace(/[^\d+]/g, ''))
            .filter(phone => phone.length >= 7 && phone.length <= 15);
    }
    /**
     * Extrae direcciones de email de un texto
     */
    static extractEmails(text) {
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const matches = text.match(emailPattern);
        return matches || [];
    }
}
exports.TextUtils = TextUtils;
//# sourceMappingURL=textUtils.js.map