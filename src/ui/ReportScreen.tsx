import { useMemo, useState } from 'react'
import { buildReport } from '../domain/report'
import type { Group } from '../domain/types'
import { BackButton, Header } from './Header'
import { goBack, paths } from './useRoute'

/**
 * Vista de sólo lectura con el texto listo para copiar y pegar en WhatsApp
 * o Telegram. No hay integración con esas apps: es texto plano y nada más.
 */
export function ReportScreen({ group }: { group: Group }) {
  const report = useMemo(() => buildReport(group), [group])
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Si el navegador no deja copiar, el texto se puede seleccionar a mano.
      setCopied(false)
    }
  }

  return (
    <>
      <Header
        title="Reporte"
        left={<BackButton label={group.name} onClick={() => goBack(paths.group(group.id))} />}
      />
      <main className="content">
        <textarea className="report" readOnly value={report} onFocus={(e) => e.target.select()} />
        <button type="button" className="btn block" onClick={copy}>
          {copied ? '¡Copiado!' : 'Copiar reporte'}
        </button>
      </main>
    </>
  )
}
