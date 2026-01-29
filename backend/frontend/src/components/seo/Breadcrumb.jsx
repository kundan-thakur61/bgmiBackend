'use client';

export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="breadcrumb" className="py-3 px-4">
      <ol 
        itemScope 
        itemType="https://schema.org/BreadcrumbList"
        className="flex flex-wrap items-center gap-2 text-sm"
      >
        {items.map((item, index) => (
          <li
            key={index}
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
            className="flex items-center"
          >
            {index < items.length - 1 ? (
              <>
                <a 
                  itemProp="item" 
                  href={item.url}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <span itemProp="name">{item.name}</span>
                </a>
                <span className="mx-2 text-gray-400">/</span>
              </>
            ) : (
              <span itemProp="name" className="text-gray-700 font-medium">
                {item.name}
              </span>
            )}
            <meta itemProp="position" content={index + 1} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
