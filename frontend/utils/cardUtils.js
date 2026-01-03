export const parseJSON = (str) => {
    try {
        return JSON.parse(str || "[]");
    } catch (e) {
        return [];
    }
};

export const generateVCardData = (card) => {
    if (!card) return "";
    const phones = parseJSON(card.phones);
    const emails = parseJSON(card.emails);
    return `BEGIN:VCARD
VERSION:3.0
FN:${card.name}
ORG:${card.company || ''}
TITLE:${card.designation || ''}
TEL:${phones[0] || ''}
EMAIL:${emails[0] || ''}
NOTE:${card.notes || 'Scanned with CardMate'}
END:VCARD`;
};
