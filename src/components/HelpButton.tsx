interface HelpButtonProps {
  onClick: () => void;
}

/**
 * Fixed-position "?" help button visible on every screen.
 * Bottom-right on desktop, top-right on mobile.
 * Opens the rules modal on click.
 */
export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-xl font-bold text-gray-300 shadow-lg transition-colors z-40 focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label="Open game rules"
    >
      ?
    </button>
  );
}
