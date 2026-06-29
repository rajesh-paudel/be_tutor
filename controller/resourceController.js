import Resource from "../models/Resource.js";
import { GoogleGenAI } from "@google/genai";

// Initialize the Google Gen AI client with environment configurations
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// @desc    Upload educational text content and generate an automated AI Summary
// @route   POST /api/resources
// @access  Private (Teacher Only)
export const uploadResource = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { title, description, subject, textContent, fileUrl, fileType } =
      req.body;

    // 1. Data Validation
    if (!title || !subject || !textContent) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required resource parameters (Title, Subject, and Text Content).",
      });
    }

    // 2. AI Prompt Construction (System Constraint Guardrailing)
    const summaryPrompt = `
      You are an elite academic assistant integrated into a student tutor web application platform.
      Analyze the following lecture notes/textbook content carefully.
      Generate a concise, high-impact summary utilizing clean Markdown syntax. 
      Include bullet points for fundamental formulas/concepts, key terms, and a short 2-sentence concluding takeaway.
      
      Content to Summarize:
      ${textContent}
    `;

    let derivedAiSummary = "AI Summarizer failed to initialize.";

    try {
      // 3. Connect to Gemini 2.5 Flash API to create the overview summary content
      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: summaryPrompt,
      });

      if (aiResponse && aiResponse.text) {
        derivedAiSummary = aiResponse.text;
      }
    } catch (aiError) {
      console.error("Gemini API Integration Fault:", aiError.message);
      // Fallback gracefully so a network drop doesn't crash the entire transaction runtime
      derivedAiSummary =
        "The AI module was temporarily unavailable to summarize this content.";
    }

    // 4. Persistence into MongoDB Collection Layer
    const resource = await Resource.create({
      teacherId,
      title,
      description: description || "",
      subject,
      fileUrl: fileUrl || "text_content_submission", // Holds target URLs if you layer in file uploads later
      fileType: fileType || "pdf",
      aiSummary: derivedAiSummary,
    });

    return res.status(201).json({
      success: true,
      message: "Resource published and successfully distilled by AI Core.",
      data: resource,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Fetch all available resources (Filterable by subject category)
// @route   GET /api/resources
// @access  Private (Authenticated Users)
export const getResources = async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = {};

    if (subject) {
      filter.subject = { $regex: new RegExp(subject, "i") };
    }

    const resources = await Resource.find(filter)
      .populate("teacherId", "name profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
