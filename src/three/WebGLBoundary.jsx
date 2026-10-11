import { Component } from 'react'

/** Keeps the page usable if WebGL is unavailable or a scene throws. */
export default class WebGLBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('[3D] scene disabled:', error?.message || error)
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
