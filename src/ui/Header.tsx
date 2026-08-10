import type { ReactNode } from 'react'

interface Props {
  title: string
  left?: ReactNode
  right?: ReactNode
}

export function Header({ title, left, right }: Props) {
  return (
    <header className="header">
      <div className="header-slot">{left}</div>
      <h1>{title}</h1>
      <div className="header-slot right">{right}</div>
    </header>
  )
}

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="btn-link" onClick={onClick}>
      ‹ {label}
    </button>
  )
}
