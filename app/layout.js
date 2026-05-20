import './globals.css';

export const metadata = {
  title: 'Sarkardada.com - Public Accountability & Rating Platform',
  description: 'Track and evaluate the performance of Indian administrative officers, ministers, and public positions with verified citizen reviews.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="app-container">
          <header className="main-header">
            <div className="header-brand">
              <span className="brand-logo">⚖️</span>
              <a href="/" className="brand-name">SARKARDADA<span className="brand-domain">.com</span></a>
            </div>
            <nav className="header-nav">
              <a href="/" className="nav-link">Directory</a>
              <a href="/admin/dashboard" className="nav-link admin-pill">Admin Portal</a>
            </nav>
          </header>
          
          <main className="main-content">
            {children}
          </main>
          
          <footer className="main-footer">
            <p>© 2026 Sarkardada.com • Citizens Accountability Platform. All Rights Reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
