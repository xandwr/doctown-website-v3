/**
 * Language support configuration for AST parsing.
 * Based on builder/src/pipeline/ingest.rs MultiLanguageExtractor.
 *
 * These languages have full AST support via tree-sitter and can generate
 * high-quality documentation with symbol extraction.
 */

// Languages with full AST support
export const SUPPORTED_LANGUAGES = new Set([
  "Rust",
  "Python",
  "JavaScript",
  "TypeScript",
  "Go",
  "Java",
  "C",
  "C++",
  "Ruby",
  "C#",
  "PHP",
  "Swift",
  "Scala",
  "Shell",
]);

// Map common GitHub language names to our internal names
const LANGUAGE_ALIASES: Record<string, string> = {
  TypeScript: "TypeScript",
  JavaScript: "JavaScript",
  Python: "Python",
  Rust: "Rust",
  Go: "Go",
  Java: "Java",
  C: "C",
  "C++": "C++",
  Ruby: "Ruby",
  "C#": "C#",
  PHP: "PHP",
  Swift: "Swift",
  Scala: "Scala",
  Shell: "Shell",
  Bash: "Shell",
};

/**
 * Check if a language has AST support
 */
export function hasASTSupport(language: string | null): boolean {
  if (!language) return false;

  const normalizedLang = LANGUAGE_ALIASES[language] || language;
  return SUPPORTED_LANGUAGES.has(normalizedLang);
}

/**
 * Language theme configuration
 * Maps languages to their representative colors from the design system
 */
export interface LanguageTheme {
  borderColor: string;
  textColor: string;
  dotColor: string;
  hoverBorderColor: string;
}

const LANGUAGE_THEMES: Record<string, LanguageTheme> = {
  // Rust - classic rust orange
  Rust: {
    borderColor: "border-lang-rust/30",
    textColor: "text-lang-rust",
    dotColor: "bg-lang-rust",
    hoverBorderColor: "hover:border-lang-rust/50",
  },
  // Python - bright blue
  Python: {
    borderColor: "border-lang-python/30",
    textColor: "text-lang-python",
    dotColor: "bg-lang-python",
    hoverBorderColor: "hover:border-lang-python/50",
  },
  // JavaScript - bright yellow
  JavaScript: {
    borderColor: "border-lang-javascript/30",
    textColor: "text-lang-javascript",
    dotColor: "bg-lang-javascript",
    hoverBorderColor: "hover:border-lang-javascript/50",
  },
  // TypeScript - blue
  TypeScript: {
    borderColor: "border-lang-typescript/30",
    textColor: "text-lang-typescript",
    dotColor: "bg-lang-typescript",
    hoverBorderColor: "hover:border-lang-typescript/50",
  },
  // Go - cyan
  Go: {
    borderColor: "border-lang-go/30",
    textColor: "text-lang-go",
    dotColor: "bg-lang-go",
    hoverBorderColor: "hover:border-lang-go/50",
  },
  // Java - orange
  Java: {
    borderColor: "border-lang-java/30",
    textColor: "text-lang-java",
    dotColor: "bg-lang-java",
    hoverBorderColor: "hover:border-lang-java/50",
  },
  // C - blue-gray
  C: {
    borderColor: "border-lang-cpp/30",
    textColor: "text-lang-cpp",
    dotColor: "bg-lang-cpp",
    hoverBorderColor: "hover:border-lang-cpp/50",
  },
  // C++ - blue
  "C++": {
    borderColor: "border-lang-cpp/30",
    textColor: "text-lang-cpp",
    dotColor: "bg-lang-cpp",
    hoverBorderColor: "hover:border-lang-cpp/50",
  },
  // Ruby - red
  Ruby: {
    borderColor: "border-lang-ruby/30",
    textColor: "text-lang-ruby",
    dotColor: "bg-lang-ruby",
    hoverBorderColor: "hover:border-lang-ruby/50",
  },
  // C# - green
  "C#": {
    borderColor: "border-lang-csharp/30",
    textColor: "text-lang-csharp",
    dotColor: "bg-lang-csharp",
    hoverBorderColor: "hover:border-lang-csharp/50",
  },
  // PHP - purple
  PHP: {
    borderColor: "border-lang-php/30",
    textColor: "text-lang-php",
    dotColor: "bg-lang-php",
    hoverBorderColor: "hover:border-lang-php/50",
  },
  // Swift - orange
  Swift: {
    borderColor: "border-lang-swift/30",
    textColor: "text-lang-swift",
    dotColor: "bg-lang-swift",
    hoverBorderColor: "hover:border-lang-swift/50",
  },
  // Scala - red
  Scala: {
    borderColor: "border-lang-scala/30",
    textColor: "text-lang-scala",
    dotColor: "bg-lang-scala",
    hoverBorderColor: "hover:border-lang-scala/50",
  },
  // Shell/Bash - green
  Shell: {
    borderColor: "border-lang-shell/30",
    textColor: "text-lang-shell",
    dotColor: "bg-lang-shell",
    hoverBorderColor: "hover:border-lang-shell/50",
  },
};

// Default theme for unsupported or unknown languages
const DEFAULT_THEME: LanguageTheme = {
  borderColor: "border-border-default",
  textColor: "text-text-tertiary",
  dotColor: "bg-text-muted",
  hoverBorderColor: "hover:border-border-strong",
};

/**
 * Get the theme for a specific language
 */
export function getLanguageTheme(language: string | null): LanguageTheme {
  if (!language) return DEFAULT_THEME;

  const normalizedLang = LANGUAGE_ALIASES[language] || language;
  return LANGUAGE_THEMES[normalizedLang] || DEFAULT_THEME;
}

/**
 * Get a display-friendly status for a language
 */
export function getLanguageStatus(language: string | null): {
  supported: boolean;
  label: string;
  icon: string;
} {
  const supported = hasASTSupport(language);

  return {
    supported,
    label: supported ? "AST Support" : "Limited Support",
    icon: supported ? "✓" : "○",
  };
}
