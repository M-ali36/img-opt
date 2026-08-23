import "./globals.css";

export const metadata = {
  title: "Bravebison Image Resizer",
  description: "Bravebison Image Resizer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Bravebison Image Resizer</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
