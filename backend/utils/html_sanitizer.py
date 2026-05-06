import bleach

ALLOWED_TAGS = [
    "p", "br", "strong", "em", "u", "s",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "blockquote",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "span", "div", "pre", "code", "mark",
]

ALLOWED_ATTRS = {
    "a":   ["href", "title", "target", "rel"],
    "img": ["src", "alt", "width", "height"],
    "*":   ["class"],
}

ALLOWED_PROTOCOLS = ["http", "https", "mailto"]


def sanitize_html(raw: str) -> str:
    """Strip any tags / attributes not in the allowlist before persisting."""
    if not raw:
        return ""
    return bleach.clean(
        raw,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
    )
