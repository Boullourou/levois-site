/** Public UI only. Values resolve through src/styles/tokens.css; no private-theme inheritance. */
export default {
  "content": [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"
  ],
  "theme": {
    "extend": {
      "colors": {
        "papier": "var(--levois-paper)",
        "papier-vif": "var(--levois-surface)",
        "encre": "var(--levois-ink)",
        "encre-2": "var(--levois-dark-field)",
        "brun": "var(--levois-muted)",
        "argile": "var(--levois-accent)",
        "argile-lum": "var(--levois-on-dark)",
        "argile-pale": "var(--levois-selected)",
        "beige": "var(--levois-line)"
      },
      "fontFamily": {
        "display": [
          "Satoshi",
          "sans-serif"
        ],
        "sans": [
          "Satoshi",
          "sans-serif"
        ]
      },
      "fontSize": {
        "hero": [
          "clamp(2.5rem, 8.5vw, 6.5rem)",
          {
            "lineHeight": "1.02",
            "letterSpacing": "-0.03em",
            "fontWeight": "500"
          }
        ],
        "display": [
          "clamp(36px,4.2vw,60px)",
          {
            "lineHeight": "1.1",
            "letterSpacing": "-.035em",
            "fontWeight": "400"
          }
        ],
        "h2": [
          "clamp(29px,3.2vw,43px)",
          {
            "lineHeight": "1.15",
            "letterSpacing": "-.025em",
            "fontWeight": "400"
          }
        ],
        "h3": [
          "clamp(1.3rem, 2.5vw, 1.7rem)",
          {
            "lineHeight": "1.25",
            "letterSpacing": "-0.01em",
            "fontWeight": "500"
          }
        ],
        "body-lg": [
          "1.125rem",
          {
            "lineHeight": "1.7"
          }
        ],
        "eyebrow": [
          "0.6875rem",
          {
            "lineHeight": "1",
            "letterSpacing": "0.18em",
            "fontWeight": "500"
          }
        ]
      },
      "maxWidth": {
        "prose": "68ch",
        "editorial": "760px",
        "page": "1280px",
        "wide": "1440px"
      },
      "spacing": {
        "edge": "20px",
        "edge-md": "48px",
        "section": "88px",
        "section-md": "128px",
        "section-lg": "168px"
      },
      "transitionTimingFunction": {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      "borderRadius": {
        "card": "var(--levois-choice-radius)",
        "panel": "var(--levois-sheet-radius)"
      }
    }
  },
  "plugins": []
};
