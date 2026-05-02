import React, { Component } from 'react'

interface Props { children: React.ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-db-bg flex flex-col items-center justify-center px-4 text-center gap-4">
          <div className="text-5xl opacity-30">⚠️</div>
          <h1 className="text-xl font-black">Something went wrong</h1>
          <p className="text-db-text2 text-sm max-w-xs">
            An unexpected error occurred. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-db-red text-white font-bold px-6 py-3 rounded-2xl hover:brightness-110 active:scale-95 transition-all"
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
