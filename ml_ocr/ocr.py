# bc_ocr_extractor.py (clean + improved structured output)
import re
import cv2
import numpy as np
import easyocr
import matplotlib.pyplot as plt
from collections import OrderedDict

# ---------------------------
# OCR Reader
# ---------------------------
reader = easyocr.Reader(["en"], gpu=False)

# ---------------------------
# Preprocessing
# ---------------------------
def preprocess_for_cards(image_bgr):
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    th = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=12
    )
    den = cv2.fastNlMeansDenoising(th, h=20)
    return den

# ---------------------------
# OCR extraction
# ---------------------------
def ocr_lines_from_image(img_path):
    img = cv2.imread(img_path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {img_path}")
    proc = preprocess_for_cards(img)
    results = reader.readtext(proc, detail=1)
    results_sorted = sorted(results, key=lambda r: min(pt[1] for pt in r[0]))
    text_lines = [r[1].strip() for r in results_sorted if r[1].strip()]
    confidences = [r[2] for r in results_sorted]
    avg_conf = float(np.mean(confidences)) if confidences else 0.0
    return {
        "raw_image": img,
        "proc_image": proc,
        "lines": text_lines,
        "confidences": confidences,
        "avg_confidence": avg_conf
    }

# ---------------------------
# Extraction functions
# ---------------------------
def extract_emails(full_text):
    email_re = r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}"
    emails = re.findall(email_re, full_text)
    if emails:
        return list(OrderedDict.fromkeys(emails))
    compressed = re.sub(r"\s+", "", full_text)
    fallback_full = re.findall(
        r"[A-Za-z0-9._%+\-]+(?:@|\(at\)|\[at\]|\(@)[A-Za-z0-9.\-]+(?:com|in|net|org|co|biz|info|edu|gov|io|tech|me|app)\b",
        compressed
    )
    fixed = []
    for c in fallback_full:
        # Normalize the separator
        c2 = re.sub(r"(\(at\)|\[at\]|\(@)", "@", c)
        # Fix missing dot before TLD
        c2 = re.sub(r"(com|in|net|org|co|biz|info|edu|gov|io|tech|me|app)$", r".\1", c2)
        # Avoid double dots
        c2 = c2.replace("..", ".")
        fixed.append(c2)
    return list(OrderedDict.fromkeys(fixed))

def extract_phones(full_text):
    phones = []
    # Match various phone formats but ignore 6-digit numbers that look like pincodes
    raw = re.findall(r"(?:\+?\d[\d\-\s\(\)]{6,}\d)", full_text)
    for p in raw:
        cleaned = re.sub(r"[^\d+]", "", p)
        digits_only = re.sub(r"[^\d]", "", cleaned)
        # Avoid common pincodes (6 digits) and very short/long numbers
        if (len(digits_only) >= 10 and len(digits_only) <= 13) or (len(digits_only) in [7, 8]):
            if not (len(digits_only) == 6):
                phones.append(cleaned)
    # Group landline segments if city code is separate (e.g. 044 4689 2301)
    # This logic looks for 3-4 digit blocks near 7-8 digit blocks
    parts = re.findall(r"\b\d{2,4}\b", full_text)
    for i in range(len(parts)-1):
        if len(parts[i]) in [3, 4] and len(parts[i+1]) in [7, 8]:
            combined = parts[i] + parts[i+1]
            if combined not in [p.replace("+", "").replace(" ", "") for p in phones]:
                phones.append(combined)
    
    return list(OrderedDict.fromkeys(phones))

def extract_websites(full_text):
    web_re = r"(https?://[A-Za-z0-9\-\._~:/\?#\[\]@!$&'()*+,;=%]+|www\.[A-Za-z0-9\-\._]+\.[A-Za-z]{2,}|[A-Za-z0-9\-\._]+\.(com|in|net|org|co|biz|info|io|tech|me|app)\b)"
    matches = re.findall(web_re, full_text)
    sites = []
    for m in matches:
        candidate = m[0] if isinstance(m, tuple) else m
        candidate = candidate.strip().rstrip(".,;")
        if "." in candidate and len(candidate) > 4:
            sites.append(candidate.lower())
    return list(OrderedDict.fromkeys(sites))

def looks_like_name(line):
    line = line.strip()
    if not line: return False
    if re.search(r"\d|@|www\.|http", line):
        return False
    # Exclude address and company keywords
    bad_keywords = r"\b(nagar|street|road|lane|tower|park|floor|block|sector|ltd|pvt|corp|inc|solutions|services|technologies|architects|associates|st\.|rd\.|logistics|department|dept|office)\b"
    if re.search(bad_keywords, line, re.I):
        return False
    if line.count(',') + line.count(';') + line.count(':') > 1:
        return False
    words = [w for w in re.split(r"[\s\.]+", line) if w]
    if not (1 <= len(words) <= 4):
        return False
    for w in words:
        if len(w) == 1 and w.isalpha():
            continue
        if not (w[0].isupper()):
            return False
    return True

def extract_name(lines):
    for i in range(min(4, len(lines))):
        if looks_like_name(lines[i]):
            return lines[i].strip()
    for ln in lines:
        if looks_like_name(ln):
            return ln.strip()
    return ""

def extract_job_title(lines):
    job_keywords = [
        "engineer","manager","director","executive","consultant","founder",
        "ceo","cto","cfo","president","vp","vice","coordinator","lead",
        "head","officer","architect","developer","designer","specialist",
        "supervisor","sales","marketing","operations","administrator","proprietor",
        "partner","owner","principal","representative","development","business",
        "secretary","assistant"
    ]
    for ln in lines:
        lw = ln.lower()
        if len(lw) < 3 or "@" in lw or re.search(r"www\.|http", lw):
            continue
        # Improved: Look for keywords even without surrounding spaces (handles "Dy.Manager")
        if any(k in lw for k in job_keywords):
            if not re.search(r"\b(pvt|ltd|llp|inc|industries|solutions|corp)\b", lw):
                return ln.strip()
    return ""

def is_all_caps_line(line):
    words = [w for w in re.split(r"\s+", line) if w.isalpha()]
    if not words:
        return False
    cap_count = sum(1 for w in words if w.isupper())
    return cap_count >= max(1, len(words) // 1)

def extract_company(lines):
    company_blocks = []
    i = 0
    N = len(lines)
    while i < N:
        if is_all_caps_line(lines[i]):
            block = [lines[i].strip()]
            j = i + 1
            while j < N and (is_all_caps_line(lines[j]) or len(lines[j].split()) <= 3):
                block.append(lines[j].strip())
                j += 1
            company_blocks.append(" ".join(block))
            i = j
        else:
            i += 1
    if company_blocks:
        return max(company_blocks, key=lambda s: len(s))
    suffix_re = re.compile(
        r"\b(pvt\.?\s*ltd|private limited|ltd\.?|llp\b|inc\.?|industries|corporation|technologies|solutions|services)\b",
        re.I
    )
    for ln in lines:
        if suffix_re.search(ln):
            return ln.strip()
    return ""

def extract_address(lines):
    addr_keywords = [
        "road","street","st.","rd.","nagar","lane","tower","park","sector","phase","building","block",
        "pincode","pin","near","opp","chennai","bangalore","coimbatore","kolkata","mumbai",
        "delhi","hyderabad","no.","no","nos","addr","village","industrial","estate"
    ]
    addr_candidates = []
    i = 0
    N = len(lines)
    while i < N:
        ln = lines[i].lower()
        pin_match = re.search(r"\b\d{6}\b", ln)
        if any(f" {k}" in f" {ln}" for k in addr_keywords) or pin_match:
            group = [lines[i].strip()]
            j = i + 1
            while j < N:
                next_ln = lines[j].lower()
                if (re.search(r"\d|,|-", next_ln) or any(k in next_ln for k in ["road","street","nagar"])):
                    if "@" in next_ln or "www" in next_ln: break
                    group.append(lines[j].strip())
                    j += 1
                else: break
            
            addr_str = ", ".join(group)
            # Remove segments that look purely like phone numbers or landlines
            segments = [s.strip() for s in addr_str.split(",")]
            filtered_segments = []
            for s in segments:
                digits_only = re.sub(r"\D", "", s)
                # Ignore segments that are mostly digits (like phone numbers) but keep those with address markers
                has_marker = any(k in s.lower() for k in ["no", "level", "unit", "floor", "highway", "tower"])
                if not has_marker and len(digits_only) >= 7 and s.replace(" ", "").replace("-", "").replace("+", "").isdigit():
                    continue
                filtered_segments.append(s)
            
            if filtered_segments:
                addr_candidates.append(", ".join(filtered_segments))
            i = j
        else: i += 1
    
    filtered = [a for a in addr_candidates if len(a) > 10 and not re.fullmatch(r"[\d\s\-+\(\),]+", a)]
    return list(OrderedDict.fromkeys(filtered))

# ---------------------------
# Structured extraction
# ---------------------------
def extract_qr_data(img):
    try:
        detector = cv2.QRCodeDetector()
        val, points, qrcode = detector.detectAndDecode(img)
        if val:
            return val
    except:
        pass
    return None

def parse_vcard(vcard_text):
    data = {}
    if "BEGIN:VCARD" not in vcard_text.upper():
        return None
    
    name_match = re.search(r"\bN:(?:[^;]*;)?([^;\n]+)", vcard_text)
    if name_match: data["name"] = name_match.group(1).replace(";", " ").strip()
    
    org_match = re.search(r"\bORG:([^\n]+)", vcard_text)
    if org_match: data["company"] = org_match.group(1).split(";")[0].strip()
    
    title_match = re.search(r"\bTITLE:([^\n]+)", vcard_text)
    if title_match: data["designation"] = title_match.group(1).strip()
    
    phones = re.findall(r"\bTEL(?:;[^:]*)?:([^\n]+)", vcard_text)
    if phones: data["phones"] = [p.strip() for p in phones]
    
    emails = re.findall(r"\bEMAIL(?:;[^:]*)?:([^\n]+)", vcard_text)
    if emails: data["emails"] = [e.strip() for e in emails]
    
    return data

def extract_structured_from_image(img_path, visualize=False):
    ocr_data = ocr_lines_from_image(img_path)
    img = ocr_data["raw_image"]
    lines = ocr_data["lines"]
    full_text = "\n".join(lines)

    # 1. Try QR Code first
    qr_text = extract_qr_data(img)
    qr_data = parse_vcard(qr_text) if qr_text else None

    # 2. OCR Extraction
    structured = {
        "name": extract_name(lines),
        "designation": extract_job_title(lines),
        "company": extract_company(lines),
        "phones": extract_phones(full_text),
        "emails": extract_emails(full_text),
        "addresses": extract_address(lines),
        "websites": extract_websites(full_text),
        "ocr_avg_confidence": ocr_data["avg_confidence"]
    }

    # 3. Merge QR data if found (QR is more accurate)
    if qr_data:
        for k, v in qr_data.items():
            if v: structured[k] = v

    # 4. Clean up Company (Fix "FIRSTLIFT LOGISTICS PVT LTD FIRSTLIFT")
    if structured["company"]:
        parts = structured["company"].split()
        unique_parts = []
        seen = set()
        for p in parts:
            clean_p = re.sub(r'[^\w]', '', p).upper()
            if clean_p not in seen or len(clean_p) < 4:
                unique_parts.append(p)
                seen.add(clean_p)
        structured["company"] = " ".join(unique_parts)

    return structured

# ---------------------------
# CLI Run
# ---------------------------
if __name__ == "__main__":
    image_path = r"C:\Users\mohanraj\OneDrive\Desktop\finalyr project\WhatsApp Image 2025-08-27 at 19.41.36_28e3dd69.jpg"
    visualize = True
    result = extract_structured_from_image(image_path, visualize=visualize)
    from pprint import pprint
    pprint(result)
