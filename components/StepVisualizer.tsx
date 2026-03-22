import React from 'react';
import { StepType, StepStatus, ProcessingStep } from '../types';
import { CheckCircle2, Loader2, Circle, BrainCircuit, Target, Megaphone, LineChart, FileText, Palette } from 'lucide-react';

interface StepVisualizerProps {
  steps: ProcessingStep[];
  currentStepIndex: number;
}

const getIcon = (type: StepType) => {
  switch (type) {
    case StepType.SEARCH: return <Target className="w-6 h-6" />;
    case StepType.PLANNING: return <BrainCircuit className="w-6 h-6" />;
    case StepType.CREATION: return <Palette className="w-6 h-6" />;
    case StepType.CHANNELS: return <Megaphone className="w-6 h-6" />;
    case StepType.STRATEGY: return <LineChart className="w-6 h-6" />;
    default: return <FileText className="w-6 h-6" />;
  }
};

const StepVisualizer: React.FC<StepVisualizerProps> = ({ steps, currentStepIndex }) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex && step.status === StepStatus.PROCESSING;
        const isCompleted = step.status === StepStatus.COMPLETED;
        const isPending = step.status === StepStatus.IDLE;

        return (
          <div 
            key={step.id} 
            className={`relative flex items-center p-4 rounded-xl border transition-all duration-500 overflow-hidden ${
              isActive 
                ? 'bg-curang-surface border-curang-primary shadow-[0_0_15px_rgba(14,165,233,0.3)] scale-105' 
                : isCompleted 
                  ? 'bg-slate-900/50 border-curang-primary/30 opacity-80' 
                  : 'bg-slate-900/30 border-slate-700 opacity-50'
            }`}
          >
            {/* Background Animation for Active Step */}
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-curang-primary/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
            )}

            <div className={`mr-4 flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full border-2 ${
               isActive ? 'border-curang-primary text-curang-primary animate-pulse' : 
               isCompleted ? 'border-green-500 text-green-500 bg-green-500/10' : 
               'border-slate-600 text-slate-600'
            }`}>
              {isActive ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 z-10">
              <div className="flex items-center gap-2 mb-1">
                 <span className={`${isActive ? 'text-curang-primary' : 'text-slate-400'}`}>
                    {getIcon(step.id)}
                 </span>
                 <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {step.label}
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-light">{step.description}</p>
            </div>

            {/* Connecting Line (except last) */}
            {index < steps.length - 1 && (
              <div className={`absolute left-[2.25rem] -bottom-8 w-0.5 h-6 ${isCompleted ? 'bg-curang-primary' : 'bg-slate-700'}`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepVisualizer;