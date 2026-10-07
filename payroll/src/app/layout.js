import "./globals.css";

export const metadata = {
  title: "Workora Payroll",
  description: "Payroll and attendance portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
