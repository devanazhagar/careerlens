/**
 * Attempts to extract and parse JSON from a string that might contain 
 * markdown code blocks or other stray text.
 * @param {string} text - The raw text from the AI.
 * @returns {object} The parsed JSON object.
 * @throws {Error} If no valid JSON is found.
 */
const cleanJSON = (text) => {
    if (!text) throw new Error("Empty input for JSON parsing");

    let cleaned = text.trim();

    // 1. Try direct parse
    try {
        return JSON.parse(cleaned);
    } catch (e) { }

    // 2. Remove Markdown code blocks if present
    const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
        let content = markdownMatch[1].trim();
        try {
            return JSON.parse(content);
        } catch (e) {
            cleaned = content; // Fallthrough to more aggressive cleaning
        }
    }

    // 3. Find the outermost braces/brackets
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    const startIdx = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;

    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    const endIdx = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;

    if (startIdx !== -1) {
        // If endIdx is missing or before startIdx, try to repair
        if (endIdx === -1 || endIdx <= startIdx) {
            cleaned = repairJSON(cleaned.substring(startIdx));
        } else {
            cleaned = cleaned.substring(startIdx, endIdx + 1);
        }

        // Strategy: Progressive Cleaning
        const cleanAttempts = [
            (s) => s,
            (s) => s.replace(/,\s*([}\]])/g, '$1'), // Remove trailing commas
            (s) => s.replace(/[\u201C\u201D]/g, '"'), // Replace smart quotes
            (s) => s.replace(/\n/g, ' '), // Flatten newlines
        ];

        for (const attempt of cleanAttempts) {
            try {
                const potentialJson = attempt(cleaned);
                return JSON.parse(potentialJson);
            } catch (e) { }
        }

        throw new Error("Failed to parse AI JSON response after extraction and cleaning attempts: " + cleaned.substring(0, 100) + "...");
    }

    throw new Error("No valid JSON structure found in AI response: " + cleaned.substring(0, 100) + "...");
};

/**
 * Super robust repair for truncated JSON.
 * Appends missing closing braces/brackets in the correct order.
 */
const repairJSON = (jsonPart) => {
    let stack = [];
    for (let char of jsonPart) {
        if (char === '{') stack.push('}');
        else if (char === '[') stack.push(']');
        else if (char === '}' || char === ']') {
            if (stack.length > 0 && stack[stack.length - 1] === char) {
                stack.pop();
            }
        }
    }
    return jsonPart + stack.reverse().join('');
};

module.exports = { cleanJSON };
