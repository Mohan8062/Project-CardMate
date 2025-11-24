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
        r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+(?:com|in|net|org|co|biz|info|edu|gov)\b",
        compressed
    )
    fixed = []
    for c in fallback_full:
        c2 = re.sub(r"(com|in|net|org|co|biz|info|edu|gov)$", r".\1", c)
        c2 = c2.replace("(at)", "@").replace("[at]", "@").replace("(@", "@")
        c2 = c2.replace(",com", ".com").replace("com,", ".com")
        fixed.append(c2)
    return list(OrderedDict.fromkeys(fixed))

def extract_phones(full_text):
    phones = []
    raw = re.findall(r"(?:\+?\d[\d\-\s\(\)]{5,}\d)", full_text)
    for p in raw:
        cleaned = re.sub(r"[^\d+]", "", p)
        digits_only = re.sub(r"[^\d]", "", cleaned)
        if 6 <= len(digits_only) <= 14:
            phones.append(cleaned)
    compressed = re.sub(r"\s+", "", full_text)
    extra = re.findall(r"\d{6,14}", compressed)
    for e in extra:
        if e not in phones:
            phones.append(e)
    return list(OrderedDict.fromkeys(phones))

def extract_websites(full_text):
    web_re = r"(https?://[A-Za-z0-9\-\._~:/\?#\[\]@!$&'()*+,;=%]+|www\.[A-Za-z0-9\-\._]+\.[A-Za-z]{2,}|[A-Za-z0-9\-\._]+\.(com|in|net|org|co|biz|info|io|tech)\b)"
    matches = re.findall(web_re, full_text)
    sites = []
    for m in matches:
        candidate = m[0] if isinstance(m, tuple) else m
        candidate = candidate.strip().rstrip(".,;")
        sites.append(candidate)
    return list(OrderedDict.fromkeys(sites))

def looks_like_name(line):
    words = [w for w in re.split(r"\s+", line.strip()) if w]
    if not (1 <= len(words) <= 3):
        return False
    if re.search(r"\d|@|www\.|http", line):
        return False
    company_bad = re.compile(
        r"\b(pvt|ltd|llp|private|limited|industries|solutions|machines|technologies|services|inc)\b",
        re.I
    )
    if company_bad.search(line):
        return False
    for w in words:
        if re.fullmatch(r"[A-Z]\.", w):
            continue
        if not (w[0].isupper() and (len(w) == 1 or w[1:].islower())):
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
        "supervisor","sales","marketing","operations","administrator"
    ]
    for ln in lines:
        lw = ln.lower()
        if len(lw) < 3 or "@" in lw or re.search(r"www\.|http", lw):
            continue
        if any(k in lw for k in job_keywords):
            if not re.search(r"\b(pvt|ltd|llp|inc|industries|solutions)\b", lw):
                return ln.strip()
    return "(not detected)"

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
        "road","street","nagar","lane","tower","park","sector","phase","building","block",
        "pincode","pin","near","opp","chennai","bangalore","coimbatore","kolkata","mumbai",
        "delhi","hyderabad","no.","no","nos","addr","village"
    ]
    addr_candidates = []
    i = 0
    N = len(lines)
    while i < N:
        ln = lines[i].lower()
        pin_match = re.search(r"\b\d{6}\b", ln)
        house_match = re.search(r"\b\d{1,4}\/?\d{0,4}\b", ln)
        if any(k in ln for k in addr_keywords) or pin_match or house_match:
            group = [lines[i].strip()]
            j = i + 1
            while j < N and (re.search(r"\d|,|-|road|street|lane|nagar|sector", lines[j].lower())):
                group.append(lines[j].strip())
                j += 1
            addr_candidates.append(", ".join(group))
            i = j
        else:
            i += 1
    return list(OrderedDict.fromkeys(addr_candidates)) if addr_candidates else []

# ---------------------------
# Structured extraction
# ---------------------------
def extract_structured_from_image(img_path, visualize=False):
    ocr_data = ocr_lines_from_image(img_path)
    lines = ocr_data["lines"]
    full_text = "\n".join(lines)

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

    if visualize:
        vis = ocr_data["raw_image"].copy()
        for bbox, text, prob in reader.readtext(preprocess_for_cards(ocr_data["raw_image"]), detail=1):
            pts = np.int32(bbox)
            x_min, y_min = int(np.min(pts[:,0])), int(np.min(pts[:,1]))
            x_max, y_max = int(np.max(pts[:,0])), int(np.max(pts[:,1]))
            cv2.rectangle(vis, (x_min, y_min), (x_max, y_max), (0,255,0), 1)
            cv2.putText(vis, text, (x_min, max(10, y_min-8)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,0), 3, cv2.LINE_AA)
            cv2.putText(vis, text, (x_min, max(10, y_min-8)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1, cv2.LINE_AA)
        plt.figure(figsize=(10,6))
        plt.imshow(cv2.cvtColor(vis, cv2.COLOR_BGR2RGB))
        plt.axis("off")
        plt.title("OCR Visualization")
        plt.show()

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
