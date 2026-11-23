import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-[color:var(--qz-sage)]/15 px-5 py-8 text-xs text-[color:var(--qz-sage)]/80 sm:flex-row sm:px-8">
      <Link to="/" className="font-display text-sm font-bold text-[color:var(--qz-mint)]">
        قاسم<span className="text-[color:var(--qz-sage)]">.</span> مساحة للصورة والحكاية
      </Link>
      <p>محتوى يُشاهد بتأنٍ، وحكايات تستحق أن تُروى.</p>
      <span>© {new Date().getFullYear()} جميع الحقوق محفوظة</span>
    </footer>
  )
}