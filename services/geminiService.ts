import { GoogleGenAI, Type } from "@google/genai";
import { StepType, GeneratedCreative, MarketingDetails } from "../types";

const SYSTEM_INSTRUCTION = `
당신은 '큐랑(Curang)' 브랜드를 담당하는 세계 최고의 퍼포먼스 마케터입니다.

[큐랑 브랜드 철학 및 핵심 가치]
1. **여행의 재정의**: 여행은 공항에서 시작되는 것이 아니라, 설레는 마음으로 현관문을 나서는 순간부터 시작됩니다. 일상(출근길)과 여행(이륙)의 경계를 허무는 라이프스타일 브랜드입니다.
2. **극강의 편리함**: 사용자의 시간을 아껴주는 스마트한 기능을 설계합니다. 짐을 싸고 푸는 번거로움은 큐랑이 해결하고, 사용자는 온전히 경험에 집중하도록 돕습니다.
3. **위트와 감성 (Q-Eyes)**: 가방 안쪽에 숨겨진 '큐-아이즈(Q-Eyes)' 심볼은 지루한 이동조차 즐거운 놀이가 될 수 있다는 브랜드의 위트를 상징합니다.
4. **기능과 감성의 조화**: 혁신적인 기능성을 갖추면서도 세련된 감성을 잃지 않는 디자인을 추구합니다.

당신의 목표는 위 브랜드 철학을 바탕으로 DCO(Dynamic Creative Optimization) 관점에서 최고의 광고 성과를 낼 수 있는 소재와 전략을 수립하는 것입니다.
항상 데이터에 기반한 논리적이고 설득력 있는 어조를 사용하십시오.

**[중요한 출력 규칙]**
모든 분석, 전략, 기획 내용은 **반드시 Markdown Table(표)** 형식으로 출력해야 합니다.
긴 줄글 설명을 지양하고, 인포그래픽처럼 한눈에 들어오는 구조화된 데이터를 제공하십시오.
`;

// Helper to get AI instance
const getAI = () => {
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_CUSTOM_API_KEY') : null;
  const apiKey = customKey || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

// New function for Deep Research
export const runDeepResearch = async (productName: string): Promise<{ features: string; usp: string; marketing: MarketingDetails }> => {
  const ai = getAI();
  const prompt = `
  Analyze the product '${productName}' for the brand 'Curang' (Premium Travel Goods).
  
  Task:
  1. If this is a known product, retrieve its specific details using Google Search.
  2. If it is a new or hypothetical product, generate plausible high-end specifications consistent with Curang's brand identity (premium, innovative, stylish).
  3. Infer additional marketing details needed for effective performance marketing.
  
  Output Requirements:
  - Return a JSON object.
  - 'features': A detailed list of 5-7 key product features (Korean).
  - 'usp': 3 powerful Unique Selling Points that differentiate this product from competitors (Korean).
  - 'marketing': An object with:
    - 'targetAudience': Detailed target audience description (Korean).
    - 'toneOfVoice': Recommended brand voice (Korean).
    - 'marketingGoal': Primary marketing objective (Korean).
    - 'additionalKeywords': 5-10 comma-separated keywords (Korean).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            features: { type: Type.STRING },
            usp: { type: Type.STRING },
            marketing: {
              type: Type.OBJECT,
              properties: {
                targetAudience: { type: Type.STRING },
                toneOfVoice: { type: Type.STRING },
                marketingGoal: { type: Type.STRING },
                additionalKeywords: { type: Type.STRING },
              },
              required: ["targetAudience", "toneOfVoice", "marketingGoal", "additionalKeywords"]
            }
          },
          required: ["features", "usp", "marketing"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Deep Research failed:", error);
    return {
      features: "검색에 실패했습니다. 직접 입력해주세요.",
      usp: "검색에 실패했습니다. 직접 입력해주세요.",
      marketing: {
        targetAudience: "분석 실패",
        toneOfVoice: "분석 실패",
        marketingGoal: "분석 실패",
        additionalKeywords: "분석 실패"
      }
    };
  }
};

export const generateHeroImage = async (productName: string): Promise<string | null> => {
  const ai = getAI();
  const prompt = `
    Create a high-end, cinematic 16:9 commercial hero image for a product named "${productName}".
    The brand is "Curang", a premium travel lifestyle brand.
    The image should look like a professional advertisement.
    Include the text "${productName}" in a stylish, modern, premium font as part of the visual composition.
    The background should be atmospheric and luxurious (e.g., a modern airport lounge, a luxury hotel, or a scenic travel destination).
    Style: Professional photography, clean, high-end.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    return null;
  } catch (error) {
    console.error("Hero image generation failed:", error);
    return null;
  }
};

export const generateStepContent = async (
  step: StepType,
  productName: string,
  productFeatures: string,
  productUSP: string,
  marketingDetails: MarketingDetails,
  previousContext: string,
  uploadedImages: string[] = [] 
): Promise<string> => {
  const ai = getAI();
  const textModel = "gemini-3-pro-preview";

  let prompt = "";
  let thinkingBudget = 0;

  const marketingContext = `
  [마케팅 상세 정보]
  타겟 오디언스: ${marketingDetails.targetAudience}
  톤앤매너: ${marketingDetails.toneOfVoice}
  마케팅 목표: ${marketingDetails.marketingGoal}
  추가 키워드: ${marketingDetails.additionalKeywords}
  `;

  switch (step) {
    case StepType.SEARCH:
      prompt = `
      [STEP 1: 광고 소재 찾기]
      대상 제품: ${productName}
      핵심 특징: ${productFeatures}
      USP (고유 판매 제안): ${productUSP}
      ${marketingContext}
      
      참고 이미지 개수: ${uploadedImages.length}개

      다음 항목을 분석하여 **하나의 통합된 Markdown Table**로 작성하십시오.
      
      | 구분 | 상세 내용 | 비고 (Insight) |
      |---|---|---|
      | **트렌드 훅(Hook)** | (가장 소구력 있는 훅 5가지) | |
      | **핵심 키워드** | (경쟁사 대비 차별화 키워드) | |
      | **타겟 페르소나** | (타겟 고객의 여행/라이프스타일 정의) | |
      
      *줄글 설명 없이 위 표 형식으로만 깔끔하게 출력하세요.*
      `;
      thinkingBudget = 2048; 
      break;

    case StepType.PLANNING:
      prompt = `
      [STEP 2: 광고 소재 기획]
      
      이전 단계 분석 결과:
      ${previousContext}

      DCO 소재 기획안을 **Markdown Table**로 작성하십시오.
      
      **표 컬럼 구성**:
      1. **컨셉명**: (예: 감성 중심, 기능 중심 등)
      2. **비주얼 디렉팅**: (이미지 톤앤매너, 연출 가이드)
      3. **메인 카피**: (헤드라인)
      4. **서브 카피**: (상세 문구)
      
      총 3가지의 상이한 컨셉을 제안하세요.
      `;
      thinkingBudget = 4096;
      break;

    case StepType.CHANNELS:
      prompt = `
      [STEP 3: 효과적인 마케팅 채널]

      기획된 소재 및 분석:
      ${previousContext}

      최적의 미디어 믹스 전략을 **Markdown Table**로 작성하십시오.

      **표 컬럼 구성**:
      1. **채널명**: (Meta, YouTube, TikTok 등)
      2. **선정 이유**: (해당 채널이 적합한 논리적 이유)
      3. **타겟팅 전략**: (구체적인 관심사, 행동 타겟팅 옵션)
      4. **소재 최적화 가이드**: (해당 채널에 맞는 포맷 및 스타일 제안)
      
      텍스트 나열을 지양하고 표를 사용하여 인포그래픽처럼 보이게 하세요.
      `;
      thinkingBudget = 2048;
      break;

    case StepType.STRATEGY:
      prompt = `
      [STEP 4: 성과 최적화 전략]

      채널 및 소재:
      ${previousContext}

      운영 및 성과 최적화 전략을 **Markdown Table**로 요약하십시오.

      **표 1: 예산 및 일정**
      | 구분 | 내용 | 비고 |
      |---|---|---|
      | **예산 배분** | (테스트 vs 본캠페인 비율 등) | |
      | **운영 기간** | (단계별 일정) | |

      **표 2: KPI 및 목표**
      | 지표 | 목표 수치 | 측정 방법 |
      |---|---|---|
      | **CTR** | | |
      | **ROAS** | | |
      | **CVR** | | |
      
      모든 내용은 표 안에 포함시키세요.
      `;
      thinkingBudget = 4096;
      break;

    case StepType.CREATION: // This is now the FINAL step
      // Pass USP to image generation logic as well
      const creativeContext = `
      [최종 결과물 생성 요청]
      USP: ${productUSP}
      
      지금까지의 전략 및 기획:
      ${previousContext}
      `;
      return await generateAdCreatives(ai, productName, productFeatures, creativeContext, uploadedImages);

    case StepType.FINAL:
       return "";
  }

  try {
    const parts: any[] = [{ text: prompt }];
    
    // Add images to context if available and relevant
    if (step === StepType.SEARCH && uploadedImages.length > 0) {
        uploadedImages.forEach(imgBase64 => {
            parts.push({
                inlineData: {
                    mimeType: "image/png", 
                    data: imgBase64
                }
            });
        });
    }

    const response = await ai.models.generateContent({
      model: textModel,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: thinkingBudget },
      },
    });

    return response.text || "생성된 내용이 없습니다.";
  } catch (error) {
    console.error(`Error in step ${step}:`, error);
    throw error;
  }
};

// Dedicated function to handle the complex Image Generation step
async function generateAdCreatives(
    ai: GoogleGenAI, 
    productName: string, 
    productFeatures: string, 
    context: string,
    uploadedImages: string[]
): Promise<string> {
    
    // 1. Plan the 5 creatives (Prompts & Copy) using JSON Schema
    const planningPrompt = `
    Based on the provided strategy and context, create 5 distinct **High-Performance Meta Ad Creatives** for A/B testing.
    
    Product: ${productName}
    Features: ${productFeatures}
    Context: ${context}
    
    OBJECTIVE:
    - Generate creatives designed to **EXPLODE ROAS** and drive **IMMEDIATE CONVERSION**.
    - Each creative must have a **Single, Powerful Visual** that communicates the benefit instantly.
    
    CRITICAL INSTRUCTION FOR 'textOverlay':
    - The 'textOverlay' is the text burned onto the image.
    - It must be a **HOOK** (Short, punchy, provocative).
    - Examples: "짐싸기, 3분이면 끝.", "이게 진짜 여행이죠.", "공항패션의 완성".
    - DO NOT use generic labels. Use copy that triggers desire.
    - Keep it under 15 characters if possible, 2 lines max.

    Return JSON format with 5 items. Each item must have:
    - title: Concept title (e.g., "Convenience Focus", "Style Focus")
    - textOverlay: The Hooking Korean text to be on the image.
    - imagePrompt: A detailed instruction for the image generator to create a high-end, commercial-grade image.
    - mainCopy: Powerful Korean headline for the ad post (Caption).
    - subCopy: Persuasive Korean sub-text for the ad post (Caption).
    - reasoning: Why this will achieve high ROAS.
    `;

    const planResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: planningPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        textOverlay: { type: Type.STRING },
                        imagePrompt: { type: Type.STRING },
                        mainCopy: { type: Type.STRING },
                        subCopy: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["title", "textOverlay", "imagePrompt", "mainCopy", "subCopy", "reasoning"]
                }
            }
        }
    });

    const creativePlans = JSON.parse(planResponse.text || "[]");
    
    // 2. Generate Images for each plan (Parallel)
    const imagePromises = creativePlans.map(async (plan: any, index: number) => {
        try {
            // Logic to use reference images 100%
            // We cycle through uploaded images if available
            const sourceImage = uploadedImages.length > 0 
                ? uploadedImages[index % uploadedImages.length] 
                : null;
            
            const parts: any[] = [];
            let promptText = "";

            if (sourceImage) {
                // Image-to-Image / Editing Mode
                parts.push({
                    inlineData: {
                        mimeType: "image/png", // Assuming PNG/JPEG compatibility
                        data: sourceImage
                    }
                });
                // ENHANCED PROMPT FOR CONSISTENCY + APPEAL
                promptText = `
                Instructions for Image Generation (Img2Img):
                1. **PRODUCT CONSISTENCY IS PARAMOUT**: You MUST use the provided reference image as the base. The product's shape, color, and design details MUST remain recognizable.
                2. **ENHANCE VISUAL APPEAL**: While keeping the product consistent, significantly upgrade the visual quality.
                   - Apply **Cinematic Lighting** (e.g., Golden Hour, Studio Softbox, Neon Rim Light depending on the concept).
                   - Improve the background to be more **Premium & Atmospheric** (e.g., Luxury Hotel Lobby, Modern Airport Lounge, Nature Glamping).
                   - Make the image look like a **High-End Magazine Advertisement**.
                3. **TEXT OVERLAY**: Overlay the following Korean text on the image.
                   - Font: Modern, Bold, Sans-serif.
                   - Color: High contrast (White or Black) with subtle shadow for readability.
                   - Position: Center, Top, or Bottom (wherever it fits best without obscuring the product).
                
                Text to Overlay:
                "${plan.textOverlay}"
                `;
            } else {
                // Text-to-Image Fallback (if no images uploaded)
                promptText = `
                Create a high-end, commercial product advertisement image in vertical format (4:5 ratio).
                
                Visual Direction:
                - Subject: ${productName} (${productFeatures})
                - Style: Professional, Luxurious, Cinematic, Travel-vibe.
                - Lighting: High-quality studio lighting or atmospheric natural light.
                - Composition: Dynamic angle, focused on the product.
                
                Concept Detail: ${plan.imagePrompt}
                
                Important: Overlay the following Korean text on the image clearly and stylishly. Make it look like a real Instagram Ad.
                Text: "${plan.textOverlay}"
                `;
            }

            parts.push({ text: promptText });

            const imageResponse = await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts },
                config: {
                    imageConfig: {
                        aspectRatio: "3:4", // Closest to 4:5 (1080x1350)
                        imageSize: "1K"
                    }
                }
            });

            let base64Data = "";
            for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    base64Data = part.inlineData.data;
                    break;
                }
            }

            if (base64Data) {
                return {
                    id: index,
                    title: plan.title,
                    mainCopy: plan.mainCopy,
                    subCopy: plan.subCopy,
                    imageBase64: base64Data,
                    reasoning: plan.reasoning
                } as GeneratedCreative;
            }
            return null;
        } catch (e) {
            console.error("Image gen failed for index " + index, e);
            return null;
        }
    });

    const generatedImages = await Promise.all(imagePromises);
    
    // Filter out failures
    const successfulCreatives = generatedImages.filter((c): c is GeneratedCreative => c !== null);

    return `__JSON_CREATIVE_START__${JSON.stringify(successfulCreatives)}__JSON_CREATIVE_END__`;
}
