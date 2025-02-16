import { FC, ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-[#25364D] py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-center">
          <img 
            src="https://prosecurelsp.com/images/logo.png" 
            alt="ProSecureLSP Logo" 
            className="h-12 w-auto"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 md:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#25364D] py-4 px-6 text-white text-center">
        <p className="text-sm">
          © {currentYear} ProSecureLSP. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Layout;