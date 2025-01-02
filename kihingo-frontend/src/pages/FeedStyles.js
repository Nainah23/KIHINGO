const styles = {
    fadeIn: `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }`,
    scrollVerse: `
      @keyframes scrollVerse {
        0% {
          transform: translateX(100%);
        }
        100% {
          transform: translateX(-100%);
        }
      }`,
    animations: `
      .animate-fadeIn {
        animation: fadeIn 0.2s ease-in-out;
      }
  
      .scrolling-verse {
        animation: scrollVerse 15s linear;
        white-space: nowrap;
      }`,
    scrollbar: `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
  
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
  
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(139, 92, 246, 0.3);
        border-radius: 3px;
      }
  
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(139, 92, 246, 0.5);
      }`
  };
  
  export default styles;