'use client'

import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * React Error Boundary 组件
 * 用于捕获子组件中的渲染错误，防止整个应用崩溃
 */
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 可以在这里上报错误到错误追踪服务
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // 使用自定义 fallback 或默认错误 UI
      return (
        this.props.fallback || (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <h2 style={{ marginBottom: '1rem' }}>出错了</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              抱歉，页面加载时出现了问题。请刷新页面重试。
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              刷新页面
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
