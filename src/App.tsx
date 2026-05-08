import { EditorScanner } from "@/components/EditorScanner"
import { Sparkles, Zap } from "lucide-react"

function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] grid-pattern noise-overlay">
      {/* 背景光效 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[150px]" />
      </div>

      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/[0.06]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e1e2e] to-[#12121a] border border-white/[0.08] shadow-lg">
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Nexus<span className="text-gradient">AI</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                AI 技能跨编辑器终极桥梁
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs text-emerald-400 font-medium">运行中</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>第一阶段</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-6 pt-24 pb-24 relative z-10">
        <EditorScanner />
      </main>

      {/* 底部页脚 */}
      <footer className="fixed bottom-0 left-0 right-0 glass-panel border-t border-white/[0.06]">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">NexusAI</span>
            <span className="text-slate-600">·</span>
            <span>by XP-Xiao</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
              环境扫描器
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
