import cv2
import numpy as np
import easyocr
import matplotlib.pyplot as plt
import re

# ------------------------------------------------------
# 1. Initialize OCR Reader
# ------------------------------------------------------
reader = easyocr.Reader(['en'], gpu=False)


# ------------------------------------------------------
# 2. Utility functions
# ------------------------------------------------------
def get_confidence(results):
    if not results:
        return 0
    return np.mean([prob for (_, _, prob) in results])


def raw_preprocess(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    gray = cv2.equalizeHist(gray)
    return gray


def minimal_preprocess(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 15
    )


def advanced_preprocess(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=30)

    kernel = np.array([[0, -1, 0],
                       [-1, 5, -1],
                       [0, -1, 0]])
    sharpened = cv2.filter2D(denoised, -1, kernel)
    return sharpened


# ------------------------------------------------------
# 3. UPGRADED ENTITY EXTRACTION (MAIN FIX)
# ------------------------------------------------------
def extract_structured_data(text_lines):

    # join with single spaces for line-based patterns
    full_text = " ".join(text_lines)
    # also create a compressed no-space version for damaged emails / numbers
    compressed = re.sub(r"\s+", "", full_text)

    # ------------------------------------------------------
    #  EMAIL EXTRACTION (SUPER FIXED)
    # ------------------------------------------------------
    email_pattern = r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
    # try normal email detection (works when OCR captured dot)
    emails = re.findall(email_pattern, full_text)

    if not emails:
        # handle cases where OCR dropped the dot before TLD (e.g., velmachinescom)
        # search in compressed string for common tlds (no dot)
        temp_pattern = r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+(?:com|in|net|org|co|gov|edu|info|biz)"
        candidates = re.findall(temp_pattern, compressed)

        fixed_emails = []
        for c in candidates:
            # Insert dot before the trailing tld (last group)
            c_fixed = re.sub(r"(com|in|net|org|co|gov|edu|info|biz)$", r".\1", c)
            fixed_emails.append(c_fixed)
        emails = fixed_emails

    # remove duplicates and keep order
    seen = set()
    emails = [e for e in emails if not (e in seen or seen.add(e))]

    # also attempt to correct common OCR confusions inside emails
    clean_emails = []
    for e in emails:
        e2 = e.replace(" ", "")
        e2 = e2.replace(",com", ".com").replace("com,", ".com")
        # fix common char confusions
        e2 = e2.replace("(@", "@").replace("(at)", "@")
        e2 = e2.replace("dot", ".") if "dot" in e2 and "@" in e2 else e2
        clean_emails.append(e2)
    emails = clean_emails

    # ------------------------------------------------------
    # PHONE FIXING (OCR-AWARE)
    # ------------------------------------------------------
    phones = []
    # collect numeric groups of length 6-13 (covers local and with country code)
    raw_numbers = re.findall(r"\d[\d\-\s]{5,}\d", full_text)

    for p in raw_numbers:
        # remove spaces and hyphens
        clean = re.sub(r"[^\d+]", "", p)
        # heuristics: valid phone lengths for India are usually 10 (mobile) or with country 12-13 (+91)
        if 6 <= len(clean) <= 14:
            phones.append(clean)

    # also try compressed digits only (some broken OCR gave splits)
    extra_nums = re.findall(r"\d{6,11}", compressed)
    for n in extra_nums:
        if n not in phones:
            phones.append(n)

    # normalize formatting (keep digits only)
    phones = [re.sub(r"[^\d+]", "", p) for p in phones]
    # remove duplicates while preserving order
    phones = list(dict.fromkeys(phones))

    # ------------------------------------------------------
    # NAME DETECTION (IMPROVED)
    # ------------------------------------------------------
    # heuristic: candidate name lines are short (1-3 words), contain capital letters, and not job titles
    name = ""
    job_keywords = set(["engineer", "sales", "manager", "director", "consultant",
                        "development", "business", "head", "marketing", "account"])
    for t in text_lines:
        t_stripped = t.strip()
        if not t_stripped:
            continue
        words = t_stripped.split()
        # skip if contains digits or is likely an address/company/phone label
        if any(ch.isdigit() for ch in t_stripped):
            continue
        lw = t_stripped.lower()
        if any(k in lw for k in job_keywords):
            continue
        # Accept if 1-3 words and first word capitalized
        if 1 <= len(words) <= 3 and words[0][0].isupper():
            # ensure it's not a known company phrase
            if not re.search(r"(pvt|ltd|llp|limited|industries|solutions|machines|tools|logistics|technologies)", lw):
                name = t_stripped
                break

    # ------------------------------------------------------
    # COMPANY DETECTION (IMPROVED)
    # ------------------------------------------------------
    company = ""
    # priority patterns: lines containing company suffixes or common company words
    company_suffix_regex = re.compile(
        r"\b(?:pvt\.?\s*ltd\.?|private limited|ltd\.?|llp\b|inc\.?|corporation|corp\.?|industries|engineering|technologies|solutions|services|logistics|machines|tools)\b",
        flags=re.IGNORECASE
    )

    # if a line contains both uppercase words and company suffix -> strong candidate
    for t in text_lines:
        if company_suffix_regex.search(t):
            company = t.strip()
            break

    # fallback: look for strong ORG-like lines (many capitalized words)
    if not company:
        for t in text_lines:
            words = t.split()
            cap_count = sum(1 for w in words if w and w[0].isupper())
            if cap_count >= 2 and len(t) > 6:
                # skip if looks like a person name or title line
                if not re.search(r"\b(Sales|Engineer|Manager|Director|Mobile|Phone|Email|Tel)\b", t, flags=re.IGNORECASE):
                    company = t.strip()
                    break

    # last-resort cleanup: remove leading bullets/numbers
    company = company.strip()

    # ------------------------------------------------------
    # ADDRESS DETECTION (MULTI-LINE SMART MERGE)
    # ------------------------------------------------------
    address_words = [
        "road", "street", "nagar", "area", "chennai", "coimbatore",
        "bangalore", "tower", "lane", "salai", "cross", "park",
        "park", "level", "unit", "pincode", "pin", "sector", "sector"
    ]

    address_lines = []
    # group contiguous lines that look like address (so multi-line addresses merge)
    i = 0
    N = len(text_lines)
    while i < N:
        t = text_lines[i]
        lw = t.lower()
        if any(w in lw for w in address_words) or re.search(r"\b\d{3}\s?\d{3}\b", lw):  # numeric postal fragments
            group = [t.strip()]
            j = i + 1
            # absorb following lines that also look like address or contain numbers / commas
            while j < N and (any(w in text_lines[j].lower() for w in address_words) or re.search(r"\d", text_lines[j]) or ',' in text_lines[j]):
                group.append(text_lines[j].strip())
                j += 1
            addr = ", ".join(group)
            address_lines.append(addr)
            i = j
        else:
            i += 1

    # keep unique addresses preserving order
    seen_addr = set()
    address_lines = [a for a in address_lines if not (a in seen_addr or seen_addr.add(a))]

    return {
        "name": name,
        "company": company,
        "emails": emails,
        "phones": phones,
        "address": address_lines
    }


# ------------------------------------------------------
# 4. OCR Pipeline (UNTOUCHED) + Matplotlib Visuals (RESTORED)
# ------------------------------------------------------
def run_ocr_pipeline(img_path, conf_threshold=0.7):

    image = cv2.imread(img_path)
    if image is None:
        print("❌ ERROR: Cannot load image!")
        return

    print("\n--- Stage 1: Raw OCR (Light Preprocess) ---")
    raw_img = raw_preprocess(image)
    raw_results = reader.readtext(raw_img)
    raw_conf = get_confidence(raw_results)
    print(f"Raw confidence = {raw_conf:.2f}")

    best_stage = "raw"
    best_conf = raw_conf
    best_results = raw_results
    best_img = raw_img

    # MINIMAL
    if raw_conf < conf_threshold:
        print("\n--- Stage 2: Minimal Preprocessing ---")
        minimal_img = minimal_preprocess(image)
        min_results = reader.readtext(minimal_img)
        min_conf = get_confidence(min_results)
        print(f"Minimal confidence = {min_conf:.2f}")

        if min_conf > best_conf:
            best_conf = min_conf
            best_stage = "minimal"
            best_results = min_results
            best_img = minimal_img

        if min_conf < conf_threshold:
            print("\n--- Stage 3: Advanced Preprocessing ---")
            adv_img = advanced_preprocess(image)
            adv_results = reader.readtext(adv_img)
            adv_conf = get_confidence(adv_results)
            print(f"Advanced confidence = {adv_conf:.2f}")

            if adv_conf > best_conf:
                best_conf = adv_conf
                best_stage = "advanced"
                best_results = adv_results
                best_img = adv_img

    print(f"\n✅ Best stage selected: {best_stage} (Confidence = {best_conf:.2f})")

    # Visualize bounding boxes + overlay text
    vis_img = image.copy()
    for (bbox, text, prob) in best_results:
        (tl, tr, br, bl) = bbox
        tl = tuple(map(int, tl))
        br = tuple(map(int, br))
        cv2.rectangle(vis_img, tl, br, (0,255,0), 2)
        # draw white background for text for readability
        cv2.putText(vis_img, text, (tl[0], max(10, tl[1]-10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,0), 4, cv2.LINE_AA)
        cv2.putText(vis_img, text, (tl[0], max(10, tl[1]-10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (1,1,1), 1, cv2.LINE_AA)
        
        

    # Plot processed image + OCR result (restored)
    plt.figure(figsize=(12, 6))
    plt.subplot(1, 2, 1)
    if len(best_img.shape) == 2:
        plt.imshow(best_img, cmap="gray")
    else:
        plt.imshow(cv2.cvtColor(best_img, cv2.COLOR_BGR2RGB))
    plt.title(f"Processed Image ({best_stage})")
    plt.axis("off")

    plt.subplot(1, 2, 2)
    plt.imshow(cv2.cvtColor(vis_img, cv2.COLOR_BGR2RGB))
    plt.title("OCR Result")
    plt.axis("off")
    plt.show()

    # Print extracted text lines (cleaned)
    print("\n--- Extracted Text ---")
    extracted_lines = []
    for (_, text, prob) in best_results:
        # small cleaning
        text_clean = text.replace(";", "").strip()
        print(text_clean, f"(Conf: {prob:.2f})")
        extracted_lines.append(text_clean)

    # STRUCTURED EXTRACTION
    structured = extract_structured_data(extracted_lines)

    print("\n===============================")
    print("     FINAL STRUCTURED OUTPUT  ")
    print("===============================")
    for k, v in structured.items():
        print(f"{k}: {v}")

    return structured


# ------------------------------------------------------
# Run the program (change path as needed)
# ------------------------------------------------------
if __name__ == "__main__":
    results = run_ocr_pipeline(
        r"C:\Users\mohanraj\OneDrive\Desktop\finalyr project\WhatsApp Image 2025-08-27 at 19.35.23_1f5b3499.jpg"
    )
