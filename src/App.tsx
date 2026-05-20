import { EditorScanner } from "@/components/EditorScanner"
import { Cpu } from "lucide-react"

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
              <Cpu className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-sm font-semibold text-foreground">
                NexusAI
              </h1>
              <span className="text-xs text-muted-foreground">
                AI 技能跨编辑器同步工具
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
              </span>
              <span className="text-xs text-muted-foreground">运行中</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-6 pt-20 pb-16">
        <EditorScanner />
      </main>

      {/* 底部页脚 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="container mx-auto px-6 h-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>NexusAI</span>
            <span className="text-border">·</span>
            <span>by XP-Xiao</span>
          </div>
          <div className="text-xs text-muted-foreground">
            环境扫描器
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
