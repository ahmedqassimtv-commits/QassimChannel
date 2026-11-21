/* ══ نص بيلفّ لفوق لما الماوس يقف على العنصر ═══════════════════════════
   زي حركة اللينكات في موقع لاندو، بس كلمة كلمة مش حرف حرف:
   تقطيع العربي لحروف بيفك اتصالها. النسخة التانية من كل كلمة
   مرسومة بـ ::after (data-t) فمفيش تكرار في الـ DOM.
   الحركة بتشتغل لما أي أب فيه الكلاس qz-roll-host يتعمله hover/focus. */

export default function RollText({ children, className = '' }) {
  const text = String(children ?? '').trim()
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <span className={`qz-roll ${className}`}>
      <span className="sr-only">{text}</span>
      <span className="qz-roll-track" aria-hidden="true">
        {words.map((w, k) => (
          <span key={k} className="qz-roll-w" data-t={w} style={{ '--k': k }}>
            {w}
          </span>
        ))}
      </span>
    </span>
  )
}
