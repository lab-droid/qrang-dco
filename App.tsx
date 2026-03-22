import React, { useState, useEffect, useRef } from 'react';
import { StepType, StepStatus, ProcessingStep, MarketingDetails } from './types';
import { generateStepContent, runDeepResearch, generateHeroImage } from './services/geminiService';
import StepVisualizer from './components/StepVisualizer';
import ResultDisplay from './components/ResultDisplay';
import Footer from './components/Footer';
import { Sparkles, Play, Briefcase, BrainCircuit, Upload, X, Search, Zap, Settings, Target, MessageSquare, Goal, Hash, CheckCircle, AlertCircle, Home, HelpCircle, Info } from 'lucide-react';

const INITIAL_STEPS: ProcessingStep[] = [
  { id: StepType.SEARCH, label: '광고 소재 찾기', description: '트렌드 분석 및 훅(Hook) 발굴', status: StepStatus.IDLE },
  { id: StepType.PLANNING, label: '광고 소재 기획', description: '비주얼 컨셉 및 카피라이팅', status: StepStatus.IDLE },
  { id: StepType.CHANNELS, label: '효과적인 마케팅 채널', description: '미디어 믹스 및 타겟팅', status: StepStatus.IDLE },
  { id: StepType.STRATEGY, label: '광고 소재 마케팅 전략', description: '예산 배분 및 KPI 설정', status: StepStatus.IDLE },
  { id: StepType.CREATION, label: '최종 결과물 (AB 테스트)', description: 'ROAS 극대화 소재 5종 생성', status: StepStatus.IDLE },
];

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [finalResult, setFinalResult] = useState<string>('');
  
  // Input State
  const [productName, setProductName] = useState(''); 
  const [productFeatures, setProductFeatures] = useState('');
  const [productUSP, setProductUSP] = useState('');
  const [marketingDetails, setMarketingDetails] = useState<MarketingDetails>({
    targetAudience: '',
    toneOfVoice: '',
    marketingGoal: '',
    additionalKeywords: ''
  });
  const [isResearching, setIsResearching] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [isGeneratingHero, setIsGeneratingHero] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'applied' | 'missing'>('missing');
  const [showHowToUse, setShowHowToUse] = useState(false);
  
  // Image Upload State
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Update document title
  useEffect(() => {
    if (productName) {
      document.title = `${productName} - 큐랑 DCO AI`;
    } else {
      document.title = '큐랑 DCO AI';
    }
  }, [productName]);

  // Check API Key Status
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        setApiKeyStatus(hasKey ? 'applied' : 'missing');
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-runner logic
  useEffect(() => {
    if (!hasStarted || currentStepIndex === -1) return;

    const executeStep = async () => {
      const currentStep = steps[currentStepIndex];
      
      setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: StepStatus.PROCESSING } : s));

      try {
        let previousContext = "";
        for (let i = 0; i < currentStepIndex; i++) {
           let resultText = steps[i].result || '';
           if (resultText.includes('__JSON_CREATIVE_START__')) {
              resultText = "(이미지 5종 생성 완료 - 비주얼 및 카피라이팅 데이터 포함)";
           }
           previousContext += `\n\n--- [${steps[i].label} 결과] ---\n${resultText}`;
        }

        const result = await generateStepContent(
          currentStep.id, 
          productName, 
          productFeatures, 
          productUSP,
          marketingDetails,
          previousContext,
          uploadedImages
        );

        setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: StepStatus.COMPLETED, result: result } : s));

        if (currentStepIndex < steps.length - 1) {
          const delay = currentStep.id === StepType.CREATION ? 1500 : 800;
          setTimeout(() => setCurrentStepIndex(prev => prev + 1), delay);
        } else {
          setTimeout(() => {
            const elements = document.querySelectorAll('.result-block');
            const lastElement = elements[elements.length - 1];
            lastElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 500);
        }
      } catch (error) {
        console.error("Step execution failed", error);
        setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: StepStatus.ERROR } : s));
      }
    };

    executeStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, hasStarted]);

  const handleStart = async () => {
    if (!productName.trim()) {
        alert("제품명을 입력해주세요.");
        return;
    }
    setHasStarted(true);
    setCurrentStepIndex(0);
    
    // Generate Hero Image in background
    setIsGeneratingHero(true);
    try {
      const img = await generateHeroImage(productName);
      setHeroImage(img);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingHero(false);
    }
  };

  const handleDeepResearch = async () => {
    if (!productName) {
        alert("제품명을 입력해주세요.");
        return;
    }
    setIsResearching(true);
    try {
        const data = await runDeepResearch(productName);
        setProductFeatures(data.features);
        setProductUSP(data.usp);
        setMarketingDetails(data.marketing);
    } catch (error) {
        console.error(error);
        alert("딥리서치 중 오류가 발생했습니다.");
    } finally {
        setIsResearching(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (files.length + uploadedImages.length > 10) {
        alert("최대 10개까지만 이미지를 업로드할 수 있습니다.");
        return;
    }

    Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const rawBase64 = base64String.split(',')[1];
            setUploadedImages(prev => [...prev, rawBase64]);
        };
        reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleApiKeySetting = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
          try {
            await aistudio.openSelectKey();
          } catch (e) {
            console.error(e);
          }
      } else {
          alert("이 기능은 Google AI Studio 환경에서만 지원됩니다.");
      }
  };

  const handleHome = () => {
    setHasStarted(false);
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: StepStatus.IDLE, result: undefined })));
    setCurrentStepIndex(-1);
    setHeroImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen font-sans text-white bg-curang-dark selection:bg-curang-primary selection:text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
         <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-curang-primary/10 rounded-full blur-[100px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-[80px]"></div>
      </div>

      {/* Navigation Bar */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
          <button
              onClick={handleHome}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-all backdrop-blur-md shadow-lg"
          >
              <Home className="w-4 h-4" />
              <span>홈</span>
          </button>
          <button
              onClick={() => setShowHowToUse(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-all backdrop-blur-md shadow-lg"
          >
              <HelpCircle className="w-4 h-4" />
              <span>사용방법</span>
          </button>
      </div>

      {/* API Key Button */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter backdrop-blur-md border ${
            apiKeyStatus === 'applied' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {apiKeyStatus === 'applied' ? (
              <><CheckCircle className="w-3 h-3" /> API KEY 적용됨</>
            ) : (
              <><AlertCircle className="w-3 h-3" /> API KEY 필요</>
            )}
          </div>
          <button
              onClick={handleApiKeySetting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-all backdrop-blur-md shadow-lg"
          >
              <Settings className="w-4 h-4" />
              <span>API Key 설정</span>
          </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        
        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500">
            큐랑 DCO AI
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-light max-w-2xl mx-auto">
            세계 최고의 퍼포먼스 마케터 페르소나와 함께<br/>
            가장 강력한 광고 소재와 마케팅 전략을 자동으로 생성합니다.
          </p>
        </header>

        {!hasStarted ? (
          /* Input Section */
          <div className="max-w-3xl mx-auto bg-slate-800/50 backdrop-blur-md p-8 rounded-3xl border border-slate-700 shadow-2xl">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">제품명 (Build Name)</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Briefcase className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                                <input 
                                    type="text" 
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-curang-primary focus:border-transparent transition-all outline-none"
                                    placeholder="예: 큐랑 보야저 프로"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Deep Research Button */}
                    <button 
                        onClick={handleDeepResearch}
                        disabled={isResearching}
                        className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-cyan-400 font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isResearching ? (
                            <BrainCircuit className="w-5 h-5 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5" />
                        )}
                        <span>{isResearching ? "제품 분석 중..." : "딥리서치로 정보 자동생성"}</span>
                        {!isResearching && <Sparkles className="w-4 h-4 opacity-50 group-hover:opacity-100" />}
                    </button>
                </div>

                <div>
                     <label className="block text-sm font-medium text-slate-400 mb-2">참고 이미지 (최대 10장)</label>
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-slate-900/50 border border-dashed border-slate-600 hover:border-curang-primary rounded-xl py-3 px-4 flex items-center justify-center gap-2 cursor-pointer transition-colors text-slate-400 hover:text-white h-[108px]"
                     >
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">이미지 업로드 ({uploadedImages.length}/10)</span>
                     </div>
                     <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                     />
                </div>
              </div>
              
              {/* Image Previews */}
              {uploadedImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                      {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-slate-700 group">
                              <img src={`data:image/png;base64,${img}`} alt="preview" className="w-full h-full object-cover" />
                              <button 
                                onClick={() => removeImage(idx)}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                              >
                                  <X className="w-4 h-4" />
                              </button>
                          </div>
                      ))}
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">제품 특징 및 핵심 정보</label>
                    <textarea 
                      value={productFeatures}
                      onChange={(e) => setProductFeatures(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white h-32 focus:ring-2 focus:ring-curang-primary focus:border-transparent transition-all outline-none resize-none text-sm leading-relaxed"
                      placeholder="제품의 주요 특징을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-1">
                        <Zap className="w-4 h-4 text-curang-accent" />
                        USP (고유 판매 제안)
                    </label>
                    <textarea 
                      value={productUSP}
                      onChange={(e) => setProductUSP(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white h-32 focus:ring-2 focus:ring-curang-accent focus:border-transparent transition-all outline-none resize-none text-sm leading-relaxed"
                      placeholder="경쟁사와 차별화되는 핵심 포인트"
                    />
                  </div>
              </div>

              {/* Inferred Marketing Details */}
              <div className="pt-4 border-t border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-curang-primary" />
                  AI 추론 마케팅 상세 항목
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                        <Target className="w-3 h-3" /> 타겟 오디언스
                      </label>
                      <input 
                        type="text"
                        value={marketingDetails.targetAudience}
                        onChange={(e) => setMarketingDetails({...marketingDetails, targetAudience: e.target.value})}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:ring-1 focus:ring-curang-primary outline-none"
                        placeholder="예: 2030 트렌디한 해외여행객"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> 톤앤매너
                      </label>
                      <input 
                        type="text"
                        value={marketingDetails.toneOfVoice}
                        onChange={(e) => setMarketingDetails({...marketingDetails, toneOfVoice: e.target.value})}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:ring-1 focus:ring-curang-primary outline-none"
                        placeholder="예: 세련된, 위트있는, 신뢰감 있는"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                        <Goal className="w-3 h-3" /> 마케팅 목표
                      </label>
                      <input 
                        type="text"
                        value={marketingDetails.marketingGoal}
                        onChange={(e) => setMarketingDetails({...marketingDetails, marketingGoal: e.target.value})}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:ring-1 focus:ring-curang-primary outline-none"
                        placeholder="예: 신규 고객 확보 및 브랜드 인지도 제고"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> 추가 키워드
                      </label>
                      <input 
                        type="text"
                        value={marketingDetails.additionalKeywords}
                        onChange={(e) => setMarketingDetails({...marketingDetails, additionalKeywords: e.target.value})}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:ring-1 focus:ring-curang-primary outline-none"
                        placeholder="예: 여행, 캐리어, 프리미엄, 라이프스타일"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleStart}
                className="w-full group relative bg-gradient-to-r from-curang-primary to-cyan-600 hover:to-cyan-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] transition-all transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>솔루션 자동 실행</span>
                  <Play className="w-5 h-5 fill-current" />
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Execution & Results Section */
          <div className="space-y-8">
            {/* Hero Image Section */}
            <div className="w-full aspect-video rounded-3xl overflow-hidden bg-slate-800/50 border border-slate-700 relative shadow-2xl">
              {heroImage ? (
                <img 
                  src={`data:image/png;base64,${heroImage}`} 
                  alt={productName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : isGeneratingHero ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <Sparkles className="w-12 h-12 mb-4 animate-pulse" />
                  <p className="text-sm font-medium">Build Hero Image 생성 중...</p>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-700">
                  <p className="text-sm font-medium">이미지를 생성할 수 없습니다.</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
              <div className="absolute bottom-8 left-8">
                <h2 className="text-4xl font-black text-white drop-shadow-lg">{productName}</h2>
                <p className="text-slate-300 mt-2 font-medium">AI-Powered Performance Marketing Strategy</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/50 rounded-full h-4 border border-slate-700 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-curang-primary to-cyan-400 transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(0, ((currentStepIndex + 1) / steps.length) * 100)}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black text-white drop-shadow-md">
                  PROGRESS: {Math.round(Math.max(0, ((currentStepIndex + 1) / steps.length) * 100))}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" ref={containerRef}>
            
            {/* Left Column: Process Visualizer (Sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit space-y-8">
              <div className="bg-slate-800/30 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-curang-accent animate-ping"></div>
                  실시간 분석 중
                </h3>
                <StepVisualizer steps={steps} currentStepIndex={currentStepIndex} />
              </div>
              
              {/* Context Info Card */}
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Product</h4>
                    <p className="text-lg font-bold text-white">{productName}</p>
                </div>

                {uploadedImages.length > 0 && (
                    <div className="flex -space-x-2 overflow-hidden py-1">
                        {uploadedImages.slice(0, 5).map((img, i) => (
                            <img key={i} src={`data:image/png;base64,${img}`} className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 object-cover" alt="" />
                        ))}
                        {uploadedImages.length > 5 && (
                            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold ring-2 ring-slate-900">+{uploadedImages.length - 5}</div>
                        )}
                    </div>
                )}
                
                <div className="pt-2 border-t border-slate-800">
                     <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Features</h4>
                     <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{productFeatures}</p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                     <h4 className="text-xs font-semibold text-curang-accent uppercase tracking-wider mb-1">USP</h4>
                     <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{productUSP}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Results */}
            <div className="lg:col-span-8 space-y-8">
               {/* Render all completed or active steps */}
               {steps.map((step, index) => {
                   if (step.status === StepStatus.IDLE) return null;
                   
                   return (
                       <div key={step.id} className="result-block">
                           {step.status === StepStatus.PROCESSING ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center p-8 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 animate-pulse">
                                    <div className="w-16 h-16 mb-6 rounded-full bg-slate-800 flex items-center justify-center animate-glow">
                                    <BrainCircuit className="w-8 h-8 text-curang-primary animate-spin" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">
                                    {step.label} 진행 중...
                                    </h2>
                                    <p className="text-slate-400 max-w-md">
                                    Gemini가 데이터를 분석하고 컨텐츠를 생성하고 있습니다.
                                    </p>
                                </div>
                           ) : step.result ? (
                               <ResultDisplay content={step.result} />
                           ) : null}
                       </div>
                   )
               })}
            </div>
          </div>
        </div>
      )}
      </div>

      <Footer />

      {/* How to Use Modal */}
      {showHowToUse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowHowToUse(false)}></div>
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-curang-primary/20 flex items-center justify-center">
                  <Info className="w-6 h-6 text-curang-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">큐랑 DCO AI 사용방법</h2>
                  <p className="text-xs text-slate-400">효과적인 퍼포먼스 마케팅을 위한 가이드</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHowToUse(false)}
                className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[70vh] space-y-8 custom-scrollbar">
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-curang-primary flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-curang-primary text-white text-xs">1</span>
                  제품 정보 입력
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  분석하고자 하는 <strong>제품명</strong>을 입력하세요. 제품의 특징이나 USP를 직접 입력할 수도 있지만, 
                  <span className="text-cyan-400 font-bold"> '딥리서치'</span> 버튼을 클릭하면 AI가 웹상의 정보를 분석하여 제품 특징, USP, 타겟 오디언스 등을 자동으로 추론해줍니다.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-bold text-curang-primary flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-curang-primary text-white text-xs">2</span>
                  이미지 업로드 (선택사항)
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  제품의 실제 사진이나 참고 이미지를 최대 10장까지 업로드할 수 있습니다. 
                  이미지를 업로드하면 AI가 이를 분석하여 <strong>제품의 외형을 유지하면서도 더 매력적인 광고 소재</strong>를 생성하는 데 활용합니다.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-bold text-curang-primary flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-curang-primary text-white text-xs">3</span>
                  솔루션 자동 실행
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  모든 정보가 준비되었다면 '솔루션 자동 실행' 버튼을 누르세요. 큐랑 DCO AI는 다음 5단계를 거쳐 결과를 도출합니다:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
                  <li className="flex items-start gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <Search className="w-4 h-4 text-curang-primary shrink-0" />
                    <span><strong>소재 찾기:</strong> 트렌드 분석 및 소구점 발굴</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <Briefcase className="w-4 h-4 text-curang-primary shrink-0" />
                    <span><strong>소재 기획:</strong> 비주얼 컨셉 및 카피라이팅</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <Target className="w-4 h-4 text-curang-primary shrink-0" />
                    <span><strong>채널 전략:</strong> 최적의 미디어 믹스 제안</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <Zap className="w-4 h-4 text-curang-primary shrink-0" />
                    <span><strong>마케팅 전략:</strong> 예산 배분 및 KPI 설정</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700 md:col-span-2">
                    <Sparkles className="w-4 h-4 text-curang-accent shrink-0" />
                    <span><strong>최종 결과물:</strong> ROAS 극대화를 위한 AB 테스트용 소재 5종 생성</span>
                  </li>
                </ul>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-bold text-curang-primary flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-curang-primary text-white text-xs">4</span>
                  결과 활용
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  생성된 광고 소재와 전략을 바탕으로 실제 마케팅 캠페인을 집행하세요. 
                  특히 마지막 단계에서 생성된 5종의 소재는 <strong>DCO(다이나믹 크리에이티브 최적화)</strong>를 위해 설계되었으므로, 성과 측정 후 가장 효율이 좋은 소재를 집중 운영하는 것이 좋습니다.
                </p>
              </section>
            </div>

            <div className="p-6 bg-slate-800/50 border-t border-slate-800 text-center">
              <button 
                onClick={() => setShowHowToUse(false)}
                className="px-8 py-2.5 bg-curang-primary hover:bg-curang-primary/80 text-white font-bold rounded-xl transition-all"
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;