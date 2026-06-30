import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Settings } from '@/pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={
          <>
            <SignedIn>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </AppLayout>
            </SignedIn>
            <SignedOut>
              <div className="flex h-screen w-full items-center justify-center bg-matrix-bg relative">
                <div className="absolute inset-0 pointer-events-none bg-matrix-gradient opacity-80 z-0"></div>
                <div className="absolute inset-0 pointer-events-none bg-grid opacity-30 animate-grid-scroll z-0"></div>
                <div className="z-10">
                  <SignIn appearance={{
                    elements: {
                      card: "bg-matrix-surface border border-matrix-border shadow-[0_0_20px_rgba(0,255,65,0.15)]",
                      headerTitle: "text-matrix-primary font-mono",
                      headerSubtitle: "text-matrix-text opacity-70 font-mono",
                      formButtonPrimary: "bg-matrix-primary text-black hover:bg-matrix-primary/80 font-mono",
                      formFieldLabel: "text-matrix-text font-mono",
                      formFieldInput: "bg-black border-matrix-border text-matrix-primary focus:border-matrix-primary font-mono",
                      footerActionText: "text-matrix-text font-mono",
                      footerActionLink: "text-matrix-primary hover:text-matrix-primary/80 font-mono",
                      identityPreviewText: "text-matrix-text font-mono",
                      identityPreviewEditButtonIcon: "text-matrix-primary",
                    }
                  }} />
                </div>
              </div>
            </SignedOut>
          </>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
