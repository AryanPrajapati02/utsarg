export default function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}