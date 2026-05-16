import "./globals.css";

export const metadata = {
  title: "BudgetWatch KE — County Budget Intelligence",
  description: "Making Kenyan county budgets understandable to every citizen.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
        <footer className="footer">
          <p>
            🇰🇪 BudgetWatch KE — Built for the people of Kenya &nbsp;|&nbsp;
            <a href="https://github.com">Open Source</a> &nbsp;|&nbsp; 
            Powered by Gemini AI
          </p>
        </footer>
      </body>
    </html>
  );
}

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a href="/" className="navbar-brand">
          <div className="navbar-logo">BW</div>
          <span className="navbar-name">
            Budget<span>Watch</span> KE
          </span>
        </a>
        <ul className="navbar-nav">
          <li><a href="/">Home</a></li>
          <li><a href="/chat">Ask Budget</a></li>
          <li><a href="/amendments">Amendments</a></li>
          <li><a href="/compare">Compare</a></li>
          <li><a href="/sms">SMS Digest</a></li>
        </ul>
      </div>
    </nav>
  );
}
