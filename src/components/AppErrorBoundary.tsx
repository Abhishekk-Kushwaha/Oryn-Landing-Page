import { Component, type ErrorInfo, type PropsWithChildren } from "react";

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<
  PropsWithChildren<{}>,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  private removeWindowListeners?: () => void;

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AppErrorBoundary caught a render error:", error, errorInfo);
  }

  componentDidMount() {
    const onError = (event: ErrorEvent) => {
      const fallbackError =
        event.error instanceof Error
          ? event.error
          : new Error(event.message || "Unexpected application error");
      this.setState({ error: fallbackError });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const fallbackError =
        reason instanceof Error
          ? reason
          : new Error(
              typeof reason === "string"
                ? reason
                : "Unexpected async application error",
            );

      const msg = fallbackError.message || "";
      if (
        msg.includes("WebSocket closed without opened") ||
        msg.includes("failed to connect to websocket")
      ) {
        return;
      }

      this.setState({ error: fallbackError });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    this.removeWindowListeners = () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }

  componentWillUnmount() {
    this.removeWindowListeners?.();
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--app-bg)", color: "var(--text-primary)" }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.16),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(52,211,153,0.12),transparent_24%),linear-gradient(180deg,#101826_0%,#090b0f_100%)]" />
          <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6 py-10">
            <div className="w-full rounded-[28px] p-8 backdrop-blur-xl oryn-surface-modal">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
                <span className="text-2xl font-semibold">!</span>
              </div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-rose-300/82">
                Something Went Wrong
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]" style={{ color: "var(--text-primary)" }}>
                Oryn hit an unexpected error.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                The app ran into a problem and stopped rendering safely. You can
                try refreshing now, or dismiss this screen and continue if the
                issue was temporary.
              </p>

              <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: "var(--surface-border)", background: "var(--hover-overlay)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                  Error Details
                </p>
                <p className="mt-2 break-words text-sm" style={{ color: "var(--text-primary)" }}>
                  {this.state.error.message || "Unknown error"}
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-sky-300/14 bg-[linear-gradient(180deg,rgba(88,124,205,0.78),rgba(51,74,126,0.92))] px-6 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(88,124,205,1)]"
                >
                  Reload App
                </button>
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold"
                  style={{ border: "1px solid var(--surface-border-strong)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
                >
                  Try Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
