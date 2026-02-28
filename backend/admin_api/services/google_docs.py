import html
import os
import re
from urllib.parse import urlparse


DOCS_SCOPES = ["https://www.googleapis.com/auth/documents.readonly"]
DOC_URL_RE = re.compile(r"/document/(?:u/\d+/)?d/([a-zA-Z0-9_-]+)")


def extract_doc_id(google_doc_url):
    if not isinstance(google_doc_url, str) or not google_doc_url.strip():
        raise ValueError("Invalid URL")

    parsed = urlparse(google_doc_url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Invalid URL")

    if "docs.google.com" not in parsed.netloc:
        raise ValueError("Invalid URL")

    match = DOC_URL_RE.search(parsed.path or "")
    if not match:
        raise ValueError("Missing doc ID")

    return match.group(1)


def fetch_google_doc(doc_id):
    service_account_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
    if not service_account_file:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_FILE is not configured")
    service_account_file = service_account_file.strip().strip('"').strip("'")
    service_account_file = os.path.expanduser(service_account_file)
    if not os.path.isabs(service_account_file):
        service_account_file = os.path.abspath(service_account_file)
    if not os.path.exists(service_account_file):
        raise FileNotFoundError(f"Service account file not found at: {service_account_file}")

    # Keep imports local so this module can be imported even when deps are missing
    # in environments where this endpoint is not used.
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    credentials = service_account.Credentials.from_service_account_file(
        service_account_file,
        scopes=DOCS_SCOPES,
    )
    service = build("docs", "v1", credentials=credentials, cache_discovery=False)
    return service.documents().get(documentId=doc_id).execute()


def convert_to_html(document):
    body = (document or {}).get("body", {})
    content = body.get("content", [])

    html_parts = []
    open_list_tag = None

    for block in content:
        paragraph = block.get("paragraph")
        if paragraph:
            is_bullet = bool(paragraph.get("bullet"))
            text_html = _render_paragraph_text(paragraph)
            if not text_html:
                continue

            if is_bullet:
                if open_list_tag is None:
                    open_list_tag = "ul"
                    html_parts.append("<ul>")
                html_parts.append(f"<li>{text_html}</li>")
                continue

            if open_list_tag is not None:
                html_parts.append(f"</{open_list_tag}>")
                open_list_tag = None

            style = (paragraph.get("paragraphStyle") or {}).get("namedStyleType", "")
            tag = _style_to_tag(style)
            html_parts.append(f"<{tag}>{text_html}</{tag}>")
            continue

        table = block.get("table")
        if table:
            if open_list_tag is not None:
                html_parts.append(f"</{open_list_tag}>")
                open_list_tag = None
            html_parts.append(_render_table(table))

    if open_list_tag is not None:
        html_parts.append(f"</{open_list_tag}>")

    return "\n".join(part for part in html_parts if part).strip()


def _style_to_tag(named_style):
    mapping = {
        "TITLE": "h1",
        "SUBTITLE": "h2",
        "HEADING_1": "h1",
        "HEADING_2": "h2",
        "HEADING_3": "h3",
        "HEADING_4": "h4",
        "HEADING_5": "h5",
        "HEADING_6": "h6",
    }
    return mapping.get(named_style, "p")


def _render_paragraph_text(paragraph):
    parts = []
    for element in paragraph.get("elements", []):
        text_run = element.get("textRun")
        if not text_run:
            continue
        rendered = _render_text_run(text_run)
        if rendered:
            parts.append(rendered)
    return "".join(parts).strip()


def _render_text_run(text_run):
    raw_text = text_run.get("content", "")
    text = raw_text.replace("\n", "")
    if not text:
        return ""

    value = html.escape(text)
    style = text_run.get("textStyle") or {}

    if style.get("bold"):
        value = f"<strong>{value}</strong>"
    if style.get("italic"):
        value = f"<em>{value}</em>"
    if style.get("underline"):
        value = f"<u>{value}</u>"
    if style.get("strikethrough"):
        value = f"<s>{value}</s>"

    link = (style.get("link") or {}).get("url")
    if link:
        href = html.escape(link, quote=True)
        value = (
            f'<a href="{href}" target="_blank" rel="noopener noreferrer">{value}</a>'
        )

    return value


def _render_table(table):
    rows_html = []
    for row in table.get("tableRows", []):
        cells_html = []
        for cell in row.get("tableCells", []):
            cell_text_parts = []
            for cell_block in cell.get("content", []):
                paragraph = cell_block.get("paragraph")
                if not paragraph:
                    continue
                rendered = _render_paragraph_text(paragraph)
                if rendered:
                    cell_text_parts.append(rendered)
            cells_html.append(f"<td>{'<br/>'.join(cell_text_parts)}</td>")
        rows_html.append(f"<tr>{''.join(cells_html)}</tr>")
    return f"<table><tbody>{''.join(rows_html)}</tbody></table>"
