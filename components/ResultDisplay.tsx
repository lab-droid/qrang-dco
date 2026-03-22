import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, Copy, Share2, Sparkles } from 'lucide-react';
import { GeneratedCreative } from '../types';

interface ResultDisplayProps {
  content: string;
}

const CreativeGallery: React.FC<{ data: GeneratedCreative[] }> = ({ data }) => {
    const handleDownload = (base64: string, id: number) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = `curang-ad-creative-${id + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-curang-accent w-6 h-6" />
                최종 결과물: 메타(Meta) AB 테스트용 소재
            </h2>
            <div className="p-4 bg-curang-primary/10 border border-curang-primary/30 rounded-xl mb-6">
                <p className="text-curang-primary text-sm font-semibold text-center">
                    💡 각 소재는 구매 전환(ROAS)을 극대화하기 위해 차별화된 "Hook" 메시지를 포함하고 있습니다.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((creative) => (
                    <div key={creative.id} className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden hover:border-curang-primary transition-colors group flex flex-col h-full">
                        {/* Aspect ratio set to match 4:5 (1080x1350) */}
                        <div className="relative aspect-[4/5] bg-slate-800">
                             <img 
                                src={`data:image/png;base64,${creative.imageBase64}`} 
                                alt={creative.title} 
                                className="w-full h-full object-cover"
                             />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button 
                                    onClick={() => handleDownload(creative.imageBase64, creative.id)}
                                    className="p-3 bg-white text-slate-900 rounded-full hover:bg-curang-primary hover:text-white transition-all transform hover:scale-110 shadow-lg"
                                    title="이미지 다운로드"
                                >
                                    <Download className="w-6 h-6" />
                                </button>
                             </div>
                        </div>
                        <div className="p-6 space-y-4 flex-1 flex flex-col">
                            <div>
                                <div className="inline-block px-2 py-1 rounded bg-slate-800 text-xs text-slate-400 mb-2 border border-slate-700">{creative.title}</div>
                                <h3 className="text-curang-primary font-bold text-lg leading-tight mb-2">ROAS 전략 포인트</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">{creative.reasoning}</p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-slate-800">
                                <p className="text-white font-bold text-sm mb-1">📢 광고 캡션 (Main)</p>
                                <p className="text-slate-300 text-sm mb-2">"{creative.mainCopy}"</p>
                                <p className="text-slate-500 text-xs">└ {creative.subCopy}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ content }) => {
  // Check for special Creative JSON marker
  const CREATIVE_START = '__JSON_CREATIVE_START__';
  const CREATIVE_END = '__JSON_CREATIVE_END__';

  if (content.includes(CREATIVE_START)) {
      const parts = content.split(CREATIVE_START);
      const preText = parts[0]; // Context before creatives
      const remaining = parts[1].split(CREATIVE_END);
      const jsonStr = remaining[0];
      const postText = remaining[1]; // Context after

      let creativeData: GeneratedCreative[] = [];
      try {
          creativeData = JSON.parse(jsonStr);
      } catch (e) {
          console.error("Failed to parse creative JSON");
      }

      return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            {preText && <MarkdownView content={preText} />}
            <CreativeGallery data={creativeData} />
            {postText && <MarkdownView content={postText} />}
        </div>
      );
  }

  return (
     <div className="animate-[fadeIn_0.5s_ease-out]">
        <MarkdownView content={content} />
     </div>
  );
};

const MarkdownView: React.FC<{ content: string }> = ({ content }) => (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 shadow-2xl overflow-hidden">
      <div className="prose prose-invert prose-blue max-w-none">
        <ReactMarkdown
            components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-curang-primary to-cyan-300 mb-6 pb-2 border-b border-slate-700" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-white mt-8 mb-4 flex items-center gap-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-curang-accent mt-6 mb-3" {...props} />,
                strong: ({node, ...props}) => <strong className="text-cyan-200 font-bold" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 text-slate-300" {...props} />,
                li: ({node, ...props}) => <li className="pl-1 marker:text-curang-primary" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-curang-accent pl-4 italic text-slate-400 my-4 bg-slate-900/50 p-4 rounded-r-lg" {...props} />,
                code: ({node, ...props}) => <code className="bg-slate-900 text-curang-accent px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                // Enhanced Table Styling for "Infographic" feel
                table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-6 rounded-xl border border-slate-600 shadow-lg">
                        <table className="min-w-full divide-y divide-slate-600 bg-slate-800" {...props} />
                    </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-slate-900/80" {...props} />,
                tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-700 bg-slate-800/50" {...props} />,
                tr: ({node, ...props}) => <tr className="hover:bg-slate-700/50 transition-colors" {...props} />,
                th: ({node, ...props}) => <th className="px-6 py-4 text-left text-xs font-bold text-curang-primary uppercase tracking-wider whitespace-nowrap" {...props} />,
                td: ({node, ...props}) => <td className="px-6 py-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed" {...props} />,
            }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
);

export default ResultDisplay;