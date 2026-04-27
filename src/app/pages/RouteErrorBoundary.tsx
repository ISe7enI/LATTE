import { AlertTriangle, RefreshCw } from "lucide-react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "页面加载失败";
  let message = "发生了意外错误，请稍后重试。";

  if (isRouteErrorResponse(error)) {
    title = `错误 ${error.status}`;
    message = error.statusText || message;
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#141414] p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="text-red-400 mt-0.5" size={20} />
          <div>
            <h1 className="text-[18px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">{title}</h1>
            <p className="text-[12px] text-white/60 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 rounded-lg border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors text-[12px]"
          >
            返回上页
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-2.5 rounded-lg bg-[#d3a971] text-black hover:opacity-90 transition-opacity text-[12px] flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            刷新重试
          </button>
        </div>
      </div>
    </div>
  );
}
