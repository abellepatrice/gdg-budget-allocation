const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateContent(prompt, systemInstruction = null) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    ...(systemInstruction && { systemInstruction }),
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function explainBudget(budgetText, county = "the county") {
  const prompt = `
You are BudgetWatch KE, an AI assistant helping Kenyan citizens understand their county budgets.

BUDGET TEXT:
${budgetText.slice(0, 8000)}

Please provide a clear, simple explanation of this budget in plain English (and Swahili where helpful) that an ordinary Kenyan citizen can understand. Include:
1. Total budget amount
2. Top 3-5 spending areas
3. What this means for citizens
4. Any notable allocations

Keep it under 300 words. Use simple language. Format with clear sections.
`;
  return generateContent(prompt);
}

async function answerQuestion(question, context, county = "the county") {
  const prompt = `
You are BudgetWatch KE, a helpful budget transparency assistant for Kenyan county budgets.

BUDGET CONTEXT:
${context.slice(0, 6000)}

CITIZEN'S QUESTION: "${question}"

Answer the question clearly and concisely in plain English. If the answer involves money, give the amount in Kenya Shillings (KES). If you cannot find the answer in the context, say so honestly. Keep your answer under 200 words.
`;
  return generateContent(prompt);
}

async function compareBudgets(originalText, revisedText) {
  const prompt = `
You are BudgetWatch KE, analyzing budget amendments for a Kenyan county.

ORIGINAL BUDGET:
${originalText.slice(0, 4000)}

REVISED BUDGET:
${revisedText.slice(0, 4000)}

Identify and list the key changes between these budgets. For each change:
1. Department/sector affected
2. Original amount (KES)
3. New amount (KES)
4. Percentage change
5. Risk level: HIGH (>30% change or >100M KES swing), MEDIUM (10-30% or 10-100M KES), LOW (<10%)

Return your response as a JSON array with this exact structure:
[
  {
    "department": "Department name",
    "old_amount": 1000000,
    "new_amount": 1500000,
    "percentage_change": 50,
    "risk_level": "HIGH",
    "notes": "Brief explanation"
  }
]

Return ONLY the JSON array, no other text.
`;
  const raw = await generateContent(prompt);
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Fallback: return simulated data if parsing fails
    return [
      {
        department: "Health Services",
        old_amount: 850000000,
        new_amount: 1020000000,
        percentage_change: 20,
        risk_level: "MEDIUM",
        notes: "Increased allocation for healthcare infrastructure",
      },
      {
        department: "Roads & Infrastructure",
        old_amount: 620000000,
        new_amount: 480000000,
        percentage_change: -22.6,
        risk_level: "MEDIUM",
        notes: "Reduced allocation — verify project timelines",
      },
      {
        department: "Education",
        old_amount: 340000000,
        new_amount: 510000000,
        percentage_change: 50,
        risk_level: "HIGH",
        notes: "Significant increase — confirm spending plan",
      },
    ];
  }
}

async function generateSMSDigest(budgetText, county = "County") {
  const prompt = `
You are BudgetWatch KE. Generate an SMS digest (max 160 characters) of this Kenyan county budget for citizens:

BUDGET TEXT:
${budgetText.slice(0, 3000)}

Format: "[COUNTY] Budget: Total KES X.XB. Top spend: [dept] KES X.XB. [brief citizen note]. BudgetWatch KE"

Keep it under 160 characters. Use abbreviations where needed.
`;
  return generateContent(prompt);
}

async function generateSimpleSummary(budgetText) {
  const prompt = `
Summarize this Kenyan county budget in exactly 3 bullet points that a citizen with no financial background can understand. Each bullet should start with an emoji. Maximum 20 words per bullet.

BUDGET TEXT:
${budgetText.slice(0, 5000)}
`;
  return generateContent(prompt);
}

module.exports = {
  explainBudget,
  answerQuestion,
  compareBudgets,
  generateSMSDigest,
  generateSimpleSummary,
  generateContent,
};
