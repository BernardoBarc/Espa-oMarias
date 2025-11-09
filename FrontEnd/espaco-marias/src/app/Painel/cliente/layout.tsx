import React from "react";

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#232526] to-[#414345] flex flex-col">
      {children}
    </div>
  );
}
