import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MAX_QUESTION_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 20; // ~10 back-and-forth turns
const MAX_SUBJECT_LENGTH = 100;

const SYSTEM_INSTRUCTION = `
  You are an expert, empathetic Socratic AI Homework Helper and Doubt Solver.
  Your fundamental objective is to guide the student to understanding without ever providing the direct solution or final answer code.

  Follow these strict execution guardrails:
  1. CRITICAL: Never reveal the final numeric answer, final text conclusion, or complete block of working code.
  2. Breakdown Phase: Identify the core concept or theorem being tested in the student's question and explain it in one sentence.
  3. Conceptual Scaffolding: Provide a step-by-step conceptual blueprint, pseudo-code strategy, or a simplified analogy.
  4. Guiding Question: End your response with exactly one targeted follow-up question that prompts the student to think through the next chronological step of their execution logic.
  5. Tone: Maintain an encouraging, academic, peer-like tone. Format using standard Markdown.
  6. If the student's message is unrelated to academics or homework, gently redirect them back to their studies instead of answering off-topic requests.
`;

// @desc    Socratic AI Homework Helper and Doubt Solver (multi-turn)
// @route   POST /api/ai/homework-helper
// @access  Private (Student Only)
export const solveHomeworkDoubt = async (req, res) => {
  try {
    const { studentQuestion, subjectContext, history } = req.body;

    // ---- Validation ----
    if (
      !studentQuestion ||
      typeof studentQuestion !== "string" ||
      !studentQuestion.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Please submit a clear question for the AI to analyze.",
      });
    }

    if (studentQuestion.length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Your question is too long. Please keep it under ${MAX_QUESTION_LENGTH} characters.`,
      });
    }

    const cleanSubject =
      typeof subjectContext === "string"
        ? subjectContext.trim().slice(0, MAX_SUBJECT_LENGTH)
        : "";

    let cleanHistory = [];
    if (history !== undefined) {
      if (!Array.isArray(history)) {
        return res.status(400).json({
          success: false,
          error: "Conversation history must be an array.",
        });
      }

      cleanHistory = history
        .filter(
          (msg) =>
            msg &&
            (msg.role === "user" || msg.role === "model") &&
            typeof msg.text === "string" &&
            msg.text.trim().length > 0,
        )
        .slice(-MAX_HISTORY_MESSAGES)
        .map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.text.slice(0, MAX_QUESTION_LENGTH) }],
        }));
    }

    // ---- Build conversation contents ----
    const contents = [
      ...cleanHistory,
      {
        role: "user",
        parts: [
          {
            text: cleanSubject
              ? `Subject Context: ${cleanSubject}\nStudent Question: ${studentQuestion.trim()}`
              : `Student Question: ${studentQuestion.trim()}`,
          },
        ],
      },
    ];

    // ---- Call Gemini ----
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    if (!aiResponse?.text) {
      throw new Error("AI engine returned an empty response.");
    }

    return res.status(200).json({
      success: true,
      aiHint: aiResponse.text,
    });
  } catch (error) {
    console.error("AI Assistant error:", error.message);
    return res.status(500).json({
      success: false,
      error:
        "The AI assistant couldn't process your request. Please try again.",
    });
  }
};
