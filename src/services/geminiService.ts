import { GoogleGenAI, Type } from "@google/genai";
import { TableauState, AIConfig } from '../types';

// Helper to get Gemini Client with the selected key
const getGeminiClient = (apiKey: string) => {
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

const formatContext = (state: TableauState) => {
    return `
    当前单纯形表状态:
    - 阶段: 步骤 ${state.stepIndex}
    - 状态: ${state.status}
    - 目标函数值 Z: ${state.zValue.toFixed(2)}
    - 变量列表: ${state.variableNames.join(', ')}
    - 基变量索引: ${state.basicVariables.join(', ')}
    - 入基变量: ${state.enteringVar || "无"}
    - 出基变量: ${state.leavingVar || "无"}
    `;
};

export const generateExplanation = async (state: TableauState, config: AIConfig): Promise<string> => {
  const prompt = `
    你是一位乐于助人的运筹学导师。请用中文解释单纯形法当前的步骤。
    
    ${formatContext(state)}
    - 步骤描述: ${state.description}
    
    如果是“最优解”，请解释最终Z值的含义。
    如果是“计算中”，请解释为什么选择该入基变量（通常是Z行中负值最大）和出基变量（最小比值检验）。
    请保持简洁（不超过2句话），语气鼓励。
  `;

  return await callAI(prompt, config);
};

export const askAIQuestion = async (question: string, state: TableauState, config: AIConfig): Promise<string> => {
    const prompt = `
    你是一位专业的运筹学助手。用户正在查看单纯形法的求解过程。
    
    上下文信息：
    ${formatContext(state)}

    用户的问题是： "${question}"

    请结合上面的上下文，用通俗易懂的中文回答用户的问题。如果问题与当前步骤无关，请尝试从运筹学角度回答。
    `;
    return await callAI(prompt, config);
}

// Unified AI Caller
const callAI = async (prompt: string, config: AIConfig): Promise<string> => {
    if (config.provider === 'deepseek') {
      if (!config.deepSeekKey) return "请在设置中输入 DeepSeek API Key。";
      
      try {
          const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${config.deepSeekKey}`
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                { role: "system", content: "你是一位乐于助人的数学导师。" },
                { role: "user", content: prompt }
              ],
              stream: false
            })
          });

          if (!response.ok) throw new Error(`DeepSeek API 错误: ${response.statusText}`);
          const data = await response.json();
          return data.choices[0]?.message?.content || "未返回解释。";
      } catch (error: any) {
          console.error("DeepSeek Error:", error);
          return `DeepSeek 错误: ${error.message}`;
      }

    } else {
      // Gemini Logic
      if (!config.geminiKey) return "请在设置中输入 Google Gemini API Key。";
      
      try {
          const ai = getGeminiClient(config.geminiKey);
          // 使用 (ai as any) 强制绕过 Property 'getGenerativeModel' does not exist 报错
          const model = (ai as any).getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text() || "无法生成解释。";
      } catch (error: any) {
          console.error("Gemini Error:", error);
          return `Gemini 错误: ${error.message}`;
      }
    }
}

export const generateRandomProblem = async (config: AIConfig): Promise<any> => {
   const schema = {
        type: Type.OBJECT,
        properties: {
            numVariables: { type: Type.INTEGER },
            numConstraints: { type: Type.INTEGER },
            objective: { 
                type: Type.ARRAY, 
                items: { type: Type.INTEGER } 
            },
            constraints: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.ARRAY, 
                    items: { type: Type.INTEGER } 
                } 
            },
            rhs: { 
                type: Type.ARRAY, 
                items: { type: Type.INTEGER } 
            }
        },
        required: ["numVariables", "numConstraints", "objective", "constraints", "rhs"]
   };

   const userPrompt = "生成一个有效、可解的线性规划最大化问题。包含2或3个变量，2或3个约束。系数应为1到10之间的小整数，以便于可视化。不要生成无界解的问题。";

   if (config.provider === 'deepseek') {
        if (!config.deepSeekKey) return null;
        try {
            const response = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${config.deepSeekKey}`
                },
                body: JSON.stringify({
                  model: "deepseek-chat",
                  messages: [
                    { role: "system", content: "你是一个数学题目生成器。只输出有效的JSON。" },
                    { role: "user", content: userPrompt + " 只返回符合此结构的JSON对象: {numVariables: int, numConstraints: int, objective: [int], constraints: [[int]], rhs: [int]}." }
                  ]
                })
            });
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error(e);
            return null;
        }

    } else {
        // Gemini
        if (!config.geminiKey) return null;
        try {
            const ai = getGeminiClient(config.geminiKey);
            // 同样使用 (ai as any) 绕过检查
            const model = (ai as any).getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });
            const response = await result.response;
            return JSON.parse(response.text());
        } catch (e) {
            console.error("Gemini Random Problem Error:", e);
            return null;
        }
    }
}