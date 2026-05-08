import type { ReactNode } from 'react'
import './globals.css'

export const metadata = {
  title: 'Dworks',
  description: '자연어와 레퍼런스로 웹 디자인 시안을 생성하고 캔버스에서 편집·고도화하는 디자인툴',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
