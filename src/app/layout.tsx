import './globals.css';

export const metadata = {
  title: 'Connect 4',
  description: '2 Player Connect4 game written in NextJS',
};

export default function RootLayout({children}: {children: React.ReactNode}) {

  return (
    
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}