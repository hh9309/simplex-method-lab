import React, { useState } from 'react';
import { Sparkles, Settings, Send, AlertCircle } from 'lucide-react';
import { TableauState, AIConfig } from '../types';

interface AIInsightPanelProps {
  state: TableauState | null;
  config: AIConfig;
  onConfigChange: (config: AIConfig) => void;
  explanation: string;
  loading: boolean;
  onGenerateExplanation: () => void;
  onAskQuestion: (question: string) => void;
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({
  state,
  config,
  onConfigChange,
  explanation,
  loading,
  onGenerateExplanation,
  onAskQuestion,
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const [mode, setMode] = useState<'explanation' | 'chat'>('explanation');

  const handleSendQuestion = () => {
    if (!customQuestion.trim()) return;
    onAskQuestion(customQuestion);
    setCustomQuestion("");
  };

  const hasKey = config.provider === 'gemini' 
    ? !!config.geminiKey
    : !!config.deepSeekKey;

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[300px]">
      
      {/* Header */}
      <div className="p-4 border-b border-surface-100 flex justify-between items-center bg-surface-50">
        <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500"/>
            <h3 className="font-bold text-slate-700">AI 智能洞察</h3>
        </div>
        <button 
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`p-1.5 rounded-md transition-colors ${isConfigOpen ? 'bg-primary text-white' : 'hover:bg-surface-200 text-slate-500'}`}
            title="模型设置"
        >
            <Settings size={18} />
        </button>
      </div>

      {/* Configuration Area (Collapsible) */}
      {isConfigOpen && (
        <div className="p-4 bg-surface-50 border-b border-surface-200 animate-in slide-in-from-top-2">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">模型选择</label>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => onConfigChange({...config, provider: 'gemini'})}
                            className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-all ${config.provider === 'gemini' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-surface-200 text-slate-600 hover:border-surface-300'}`}
                        >
                            Gemini 2.5
                        </button>
                        <button 
                            onClick={() => onConfigChange({...config, provider: 'deepseek'})}
                            className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-all ${config.provider === 'deepseek' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-surface-200 text-slate-600 hover:border-surface-300'}`}
                        >
                            DeepSeek V3
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">API 凭证</label>
                    {config.provider === 'gemini' ? (
                        <input 
                            type="password" 
                            placeholder="输入 Google Gemini API Key" 
                            value={config.geminiKey || ''}
                            onChange={(e) => onConfigChange({...config, geminiKey: e.target.value})}
                            className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                    ) : (
                        <input 
                            type="password" 
                            placeholder="输入 DeepSeek API Key (sk-...)" 
                            value={config.deepSeekKey || ''}
                            onChange={(e) => onConfigChange({...config, deepSeekKey: e.target.value})}
                            className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Tabs */}
        <div className="flex border-b border-surface-100">
            <button 
                onClick={() => setMode('explanation')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mode === 'explanation' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                当前步骤解释
            </button>
            <button 
                onClick={() => setMode('chat')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mode === 'chat' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                自定义问答
            </button>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50/30 min-h-[200px]">
             {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div>
                    </div>
                    <span className="text-sm">AI 正在思考中...</span>
                </div>
             ) : (
                 <div className="prose prose-sm prose-slate max-w-none">
                    {mode === 'explanation' ? (
                        explanation ? (
                            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{explanation}</div>
                        ) : (
                            <div className="text-center text-slate-400 py-8">
                                <p>暂无解释。</p>
                                <button onClick={onGenerateExplanation} className="mt-2 text-primary hover:underline text-sm">
                                    生成当前步骤解释
                                </button>
                            </div>
                        )
                    ) : (
                        explanation && mode === 'chat' ? (
                             <div className="bg-white p-3 rounded-lg border border-surface-200 shadow-sm text-slate-700 mb-4">
                                <span className="text-xs font-bold text-slate-400 block mb-1">AI 回答:</span>
                                {explanation}
                             </div>
                        ) : (
                            <div className="text-center text-slate-400 py-8">
                                请在下方输入关于当前单纯形表的问题。
                            </div>
                        )
                    )}
                 </div>
             )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-100 bg-white">
            {mode === 'explanation' ? (
                 <button 
                    onClick={onGenerateExplanation}
                    disabled={loading || !state}
                    className="w-full py-2 bg-surface-100 hover:bg-surface-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                    <Sparkles size={16} /> 刷新解释
                 </button>
            ) : (
                <div className="flex gap-2">
                    <input 
                        type="text"
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
                        placeholder="例如：为什么要选择 x2 入基？"
                        className="flex-1 px-3 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                    <button 
                        onClick={handleSendQuestion}
                        disabled={loading || !customQuestion.trim() || !state}
                        className="p-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Send size={18} />
                    </button>
                </div>
            )}
            
            {/* Key Status Indicator */}
            {!hasKey && (
                <div className="mt-2 text-xs text-red-500 text-center flex items-center justify-center gap-1">
                    <AlertCircle size={12} />
                    请点击齿轮图标配置 API Key
                </div>
            )}
        </div>
      </div>
    </div>
  );
};