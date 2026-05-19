"use client";

import React, { useEffect, useState } from "react";

export function FontLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // We can directly append the link tag to document.head on mount,
    // which makes it perfectly non-render-blocking during initial HTML load!
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    
    // Set loaded state when the font stylesheet has loaded
    link.onload = () => setLoaded(true);
    
    document.head.appendChild(link);

    return () => {
      // Optional cleanup if needed, but since it's a global font, keeping it loaded is usually fine.
    };
  }, []);

  return null;
}
