import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="브레드크럼" className={`flex ${className}`}>
      <ol className="flex items-center space-x-1 text-sm text-gray-500">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
            )}
            
            {item.current ? (
              <span 
                className="font-medium text-gray-900 truncate max-w-[200px]" 
                aria-current="page"
                title={item.label}
              >
                {item.label}
              </span>
            ) : item.href ? (
              <Link 
                href={item.href}
                className="hover:text-gray-700 transition-colors truncate max-w-[200px]"
                title={item.label}
              >
                {item.label}
              </Link>
            ) : (
              <span className="truncate max-w-[200px]" title={item.label}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

