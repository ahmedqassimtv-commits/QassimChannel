/* عرض النص العربي بثبات بدون حركة الطلوع والنزول حفاظاً على الهوية */
export default function RollText({ children, className = '' }) {
  return <span className={className}>{children}</span>
}
