type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="6" width="116" height="116" rx="28" fill="url(#bg)" />
      <rect x="33" y="24" width="57" height="80" rx="10" fill="#F8FAFC" stroke="#16376A" strokeWidth="5" />
      <path d="M53 16h17c5 0 9 4 9 9v6H44v-6c0-5 4-9 9-9Z" fill="#E5E7EB" stroke="#16376A" strokeWidth="5" />
      <path d="M41 51 53 63 75 40" stroke="#3CC11A" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M48 78h24" stroke="#B8C4D4" strokeWidth="6" strokeLinecap="round" />
      <path d="M48 89h20" stroke="#B8C4D4" strokeWidth="6" strokeLinecap="round" />
      <path d="m73 74 13-13c3-3 7-3 10 0l16 16c3 3 3 7 0 10l-6 6c-3 3-7 3-10 0L80 77c-3-3-3-7 0-10Z" fill="#FFD53D" stroke="#16376A" strokeWidth="5" />
      <path d="m67 64 6-6c2-2 6-2 8 0l20 20c2 2 2 6 0 8l-6 6c-2 2-6 2-8 0L67 72c-2-2-2-6 0-8Z" fill="#FF5A1F" stroke="#16376A" strokeWidth="5" />
      <defs>
        <linearGradient id="bg" x1="20" y1="14" x2="109" y2="113" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2FA4EA" />
          <stop offset="1" stopColor="#1E5CB7" />
        </linearGradient>
      </defs>
    </svg>
  );
}
