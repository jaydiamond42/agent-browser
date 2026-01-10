# veb

Headless browser automation CLI for agents and humans.

## Installation

```bash
pnpm install
npx playwright install chromium
pnpm build
```

## Usage

```bash
# Open a URL (auto-starts browser daemon)
veb open https://example.com

# Click elements
veb click "#submit-btn"
veb click "text=Sign In"

# Type into inputs
veb type "#email" hello@example.com
veb type "#search" "search query"

# Press keyboard keys
veb press Enter
veb press Tab

# Wait for things
veb wait "#loading"              # wait for selector
veb wait --text "Welcome"        # wait for text
veb wait 2000                    # wait 2 seconds

# Take screenshots
veb screenshot page.png
veb screenshot --full page.png   # full page
veb screenshot -s "#hero"        # specific element

# Get accessibility snapshot (great for AI agents)
veb snapshot

# Extract HTML content
veb extract "table"
veb extract "#main"

# Evaluate JavaScript
veb eval "document.title"
veb eval "window.location.href"

# Scroll the page
veb scroll down 500
veb scroll up
veb scroll -s "#container" down

# Interact with dropdowns
veb select "#country" "US"

# Hover over elements
veb hover "#menu"

# Close browser (stops daemon)
veb close
```

## Agent Mode

Use `--json` flag for machine-readable output:

```bash
veb open https://example.com --json
# {"id":"abc123","success":true,"data":{"url":"https://example.com/","title":"Example Domain"}}

veb snapshot --json
# {"id":"def456","success":true,"data":{"snapshot":"..."}}
```

## How It Works

veb runs a background daemon that keeps the browser open between commands. The first command automatically starts the daemon. Use `veb close` to shut it down.

## Commands Reference

| Command | Description |
|---------|-------------|
| `open <url>` | Navigate to a URL |
| `click <selector>` | Click an element |
| `type <selector> <text>` | Type text into an element |
| `press <key>` | Press a keyboard key |
| `wait <selector\|text\|ms>` | Wait for condition |
| `screenshot [path]` | Take a screenshot |
| `snapshot` | Get accessibility tree |
| `extract <selector>` | Get element HTML |
| `eval <script>` | Run JavaScript |
| `scroll <dir> [amount]` | Scroll page |
| `hover <selector>` | Hover over element |
| `select <selector> <val>` | Select dropdown option |
| `close` | Close browser |

## Options

| Option | Description |
|--------|-------------|
| `--json` | Output raw JSON |
| `--full, -f` | Full page screenshot |
| `--text, -t` | Wait for text |
| `--selector, -s` | Target element |
| `--debug` | Show debug timing info |
| `--help, -h` | Show help |

## Selectors

veb supports all Playwright selectors:

- CSS: `#id`, `.class`, `div.container`
- Text: `text=Click me`, `"Click me"`
- XPath: `xpath=//button`
- Role: `role=button[name="Submit"]`

## License

MIT
