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
  // Rust - warm rust/orange tones
  Rust: {
    borderColor: "border-rust/40",
    textColor: "text-rust",
    dotColor: "bg-rust",
    hoverBorderColor: "hover:border-rust/60",
  },
  // Python - blue tones
  Python: {
    borderColor: "border-action-primary/40",
    textColor: "text-action-primary",
    dotColor: "bg-action-primary",
    hoverBorderColor: "hover:border-action-primary/60",
  },
  // JavaScript - warning/yellow tones
  JavaScript: {
    borderColor: "border-warning/40",
    textColor: "text-warning",
    dotColor: "bg-warning",
    hoverBorderColor: "hover:border-warning/60",
  },
  // TypeScript - bright blue tones
  TypeScript: {
    borderColor: "border-action-primary/40",
    textColor: "text-action-primary-light",
    dotColor: "bg-action-primary-light",
    hoverBorderColor: "hover:border-action-primary/60",
  },
  // Go - cyan/teal tones
  Go: {
    borderColor: "border-info/40",
    textColor: "text-info",
    dotColor: "bg-info",
    hoverBorderColor: "hover:border-info/60",
  },
  // Java - orange/rust tones
  Java: {
    borderColor: "border-rust/40",
    textColor: "text-rust",
    dotColor: "bg-rust",
    hoverBorderColor: "hover:border-rust/60",
  },
  // C - gray/static tones
  C: {
    borderColor: "border-static/40",
    textColor: "text-shadow",
    dotColor: "bg-static",
    hoverBorderColor: "hover:border-static/60",
  },
  // C++ - gray tones, slightly lighter
  "C++": {
    borderColor: "border-dust/40",
    textColor: "text-echo",
    dotColor: "bg-dust",
    hoverBorderColor: "hover:border-dust/60",
  },
  // Ruby - red/blood tones
  Ruby: {
    borderColor: "border-action-danger/40",
    textColor: "text-action-danger",
    dotColor: "bg-action-danger",
    hoverBorderColor: "hover:border-action-danger/60",
  },
  // C# - purple/private tones
  "C#": {
    borderColor: "border-privacy-private/40",
    textColor: "text-privacy-private",
    dotColor: "bg-privacy-private",
    hoverBorderColor: "hover:border-privacy-private/60",
  },
  // PHP - purple tones
  PHP: {
    borderColor: "border-privacy-private/40",
    textColor: "text-privacy-private-light",
    dotColor: "bg-privacy-private-light",
    hoverBorderColor: "hover:border-privacy-private/60",
  },
  // Swift - orange tones
  Swift: {
    borderColor: "border-rust/40",
    textColor: "text-rust",
    dotColor: "bg-rust",
    hoverBorderColor: "hover:border-rust/60",
  },
  // Scala - red tones
  Scala: {
    borderColor: "border-action-danger/40",
    textColor: "text-action-danger-light",
    dotColor: "bg-action-danger-light",
    hoverBorderColor: "hover:border-action-danger/60",
  },
  // Shell/Bash - green tones
  Shell: {
    borderColor: "border-success/40",
    textColor: "text-success",
    dotColor: "bg-success",
    hoverBorderColor: "hover:border-success/60",
  },
};

// Default theme for unsupported or unknown languages
const DEFAULT_THEME: LanguageTheme = {
  borderColor: "border-fog",
  textColor: "text-shadow",
  dotColor: "bg-corpse",
  hoverBorderColor: "hover:border-ash",
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
