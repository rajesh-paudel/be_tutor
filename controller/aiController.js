import { GoogleGenAI } from "@google/genai";

// Initialize the Google Gen AI client with environment configurations
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// @desc    Socratic AI Homework Helper and Doubt Solver
// @route   POST /api/ai/homework-helper
// @access  Private (Student Only)
export const solveHomeworkDoubt = async (req, res) => {
  try {
    const { studentQuestion, subjectContext } = req.body;

    // 1. Data Validation
    if (!studentQuestion) {
      return res.status(400).json({
        success: false,
        error:
          "Please submit a clear question or code roadblock for the AI to analyze.",
      });
    }

    // 2. Strict Socratic System Instructions Design
    const systemInstruction = `
      You are an expert, empathetic Socratic AI Homework Helper and Doubt Solver. 
      Your fundamental objective is to guide the student to understanding without ever providing the direct solution or final answer code.
      
      Follow these strict execution guardrails:
      1. CRITICAL: Never reveal the final numeric answer, final text conclusion, or complete block of working code.
      2. Breakdown Phase: Identify the core concept or theorem being tested in the student's question and explain it in one sentence.
      3. Conceptual Scaffolding: Provide a step-by-step conceptual blueprint, pseudo-code strategy, or a simplified analogy.
      4. Guiding Question: End your response with exactly one targeted follow-up question that prompts the student to think through the next chronological step of their execution logic.
      5. Tone: Maintain an encouraging, academic, peer-like tone. Format beautifully using standard Markdown styling rules.
    `;

    // 3. Dispatch structured payload to Gemini Runtime Core
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Subject Context: ${subjectContext || "General Computer Science"}\nStudent Question: ${studentQuestion}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, // Balances creative guidance with logical precision
      },
    });

    // 4. Return the processed structural hint text
    if (aiResponse && aiResponse.text) {
      return res.status(200).json({
        success: true,
        aiHint: aiResponse.text,
      });
    } else {
      throw new Error(
        "AI Engine generated an unreadable empty response sequence.",
      );
    }
  } catch (error) {
    console.error("AI Assistant Routing Fault:", error.message);
    return res.status(500).json({
      success: false,
      error:
        "The AI core was unable to process your request. Check your API configurations.",
    });
  }
};
