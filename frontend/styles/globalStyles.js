import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get("window");

export const createStyles = (theme) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.bg },
    mainContainer: { flex: 1, backgroundColor: theme.bg },

    headerContainer: {
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: theme.bg, // Nothing OS: Headers are often just text on bg
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "900",
        color: theme.textPrimary,
        letterSpacing: -1, // Tight tracking
        fontFamily: 'monospace' // Vibe
    },

    // Feature UI Styles
    tagBadge: {
        backgroundColor: theme.secondary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: theme.border,
        marginRight: 8,
        marginBottom: 8,
    },
    tagText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: theme.textPrimary, fontFamily: 'monospace' },

    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 5,
    },
    locationText: { fontSize: 12, color: theme.textSecondary, fontFamily: 'monospace' },

    eventModeHeader: {
        backgroundColor: theme.primary,
        padding: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    eventModeText: { color: theme.bg, fontWeight: 'bold', fontSize: 12, fontFamily: 'monospace' },

    // Search Bar (Nothing OS: Minimal, outline)
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: 'transparent',
        borderRadius: 30,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginTop: 10,
        borderWidth: 1,
        borderColor: theme.border,
        gap: 10,
    },
    searchInput: { flex: 1, color: theme.textPrimary, fontSize: 16, fontFamily: 'monospace' },

    scrollContent: { paddingBottom: 100 },

    // Empty State
    emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 40 },
    emptyIllustration: { position: 'relative', marginBottom: 30 },
    cardOutline: {
        width: 160, height: 100,
        borderRadius: 16,
        borderWidth: 2, borderColor: theme.textSecondary,
        borderStyle: 'dashed', // Nothing OS loves dotted lines
        justifyContent: 'center', alignItems: 'center',
        transform: [{ rotate: '-6deg' }],
        backgroundColor: 'transparent'
    },
    cardEyes: { flexDirection: 'row', gap: 20, marginBottom: 10 },
    eye: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.textPrimary },
    cardLines: { width: 80, height: 8, borderRadius: 4, backgroundColor: theme.textSecondary },
    sparkle: { position: 'absolute', top: -15, right: -15 },
    emptyText: { fontSize: 24, fontWeight: "800", marginBottom: 10, color: theme.textPrimary, fontFamily: 'monospace' },
    emptySubText: { fontSize: 16, color: theme.textSecondary, textAlign: "center", marginBottom: 30, lineHeight: 24, fontFamily: 'monospace' },

    scanBtnMain: {
        backgroundColor: theme.primary,
        paddingHorizontal: 30,
        paddingVertical: 18,
        borderRadius: 30, // Pill shape
        borderWidth: 1,
        borderColor: theme.border,
    },
    scanBtnText: { color: theme.bg, fontWeight: "800", fontSize: 14, letterSpacing: 1, fontFamily: 'monospace' },

    // History / List
    historyList: { paddingHorizontal: 20, paddingTop: 20 },
    listSectionTitle: { fontSize: 13, fontWeight: "800", marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1.2, color: theme.textSecondary, fontFamily: 'monospace' },
    historyCard: {
        borderRadius: 16,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.card,
    },
    historyThumb: {
        width: 52, height: 52,
        borderRadius: 26,
        alignItems: "center", justifyContent: "center",
        marginRight: 16,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.secondary
    },
    historyBody: { flex: 1 },
    historyName: { fontSize: 17, fontWeight: "700", marginBottom: 2, color: theme.textPrimary, fontFamily: 'monospace' },
    historyDetail: { fontSize: 14, marginTop: 1, color: theme.textSecondary, fontFamily: 'monospace' },
    historyDate: { fontSize: 12, marginTop: 4, color: theme.textSecondary, fontFamily: 'monospace' },

    // Result Card
    activeResultCard: {
        margin: 20,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.bg
    },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    resultTitle: { fontWeight: "800", fontSize: 18, color: theme.textPrimary, fontFamily: 'monospace' },
    activeName: { fontSize: 28, fontWeight: "800", marginBottom: 5, color: theme.textPrimary, fontFamily: 'monospace' },
    activeDetail: { fontSize: 16, marginTop: 4, color: theme.textSecondary, fontFamily: 'monospace' },

    setOwnerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 30,
        marginTop: 25,
        gap: 8,
        backgroundColor: theme.primary
    },
    setOwnerBtnText: { color: theme.bg, fontWeight: '800', fontSize: 15, fontFamily: 'monospace' },

    // Profile
    userInfoCard: {
        marginHorizontal: 0, // Flat
        marginBottom: 30,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: theme.bg
    },
    avatarCircle: {
        width: 70, height: 70,
        borderRadius: 35,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: theme.primary,
    },
    avatarText: { color: theme.bg, fontSize: 28, fontWeight: '800', fontFamily: 'monospace' },
    profileName: { fontSize: 24, fontWeight: '800', marginBottom: 5, color: theme.textPrimary, fontFamily: 'monospace' },
    profileEmail: { fontSize: 14, color: theme.textSecondary, fontFamily: 'monospace' },

    ownerSection: { paddingHorizontal: 20, marginTop: 10 },
    ownerCardBig: {
        borderRadius: 24,
        padding: 0,
        marginBottom: 0,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.primary, // Inverse
    },

    noOwnerBox: {
        borderRadius: 24,
        padding: 35,
        alignItems: 'center',
        borderStyle: 'dashed', borderWidth: 2,
        borderColor: theme.border,
        backgroundColor: 'transparent'
    },
    noOwnerText: { fontSize: 20, fontWeight: '800', marginTop: 15, fontFamily: 'monospace' },
    noOwnerSub: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20, fontFamily: 'monospace' },

    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 30,
        gap: 10,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: 'transparent'
    },
    editBtnText: { fontWeight: '700', fontSize: 15, fontFamily: 'monospace' },

    deleteAccBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderWidth: 1,
        borderRadius: 30,
        gap: 10,
        borderColor: theme.error
    },
    deleteAccText: { fontWeight: '700', fontSize: 15, fontFamily: 'monospace' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
    bottomSheet: {
        borderTopLeftRadius: 35, borderTopRightRadius: 35,
        padding: 30,
        paddingTop: 20,
        paddingBottom: 40,
        backgroundColor: theme.bg,
        borderWidth: 1,
        borderColor: theme.border,
    },
    sheetHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 30, opacity: 0.3, backgroundColor: theme.textSecondary },
    sheetHeader: { fontSize: 22, marginBottom: 25, fontWeight: '800', color: theme.textPrimary, fontFamily: 'monospace' },
    sheetButton: { flexDirection: "row", alignItems: "center", paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
    sheetIconBox: { width: 50, alignItems: 'center' },
    sheetButtonText: { fontSize: 17, fontWeight: '600', color: theme.textPrimary, fontFamily: 'monospace' },

    // Details Modal
    detailCardTop: {
        alignItems: 'center',
        padding: 30,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 25,
        borderStyle: 'dashed', // Nothing OS vibe
    },
    detailAvatar: {
        width: 100, height: 100,
        borderRadius: 50,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 20
    },
    detailNameText: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8, fontFamily: 'monospace', lineHeight: 28 },
    detailSubText: { fontSize: 15, marginTop: 4, textAlign: 'center', fontFamily: 'monospace', opacity: 0.8 },

    // Detail Rows
    detailItem: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    detailLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1.5, fontFamily: 'monospace' },
    detailValue: { fontSize: 15, fontWeight: '500', lineHeight: 22, fontFamily: 'monospace', flexWrap: 'wrap' }, // Ensure wrapping

    confidenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 15,
        gap: 6
    },
    confidenceText: { fontSize: 12, fontWeight: '600', fontFamily: 'monospace' },

    quickActionBtn: { alignItems: 'center', gap: 8 },
    quickActionIcon: {
        width: 50, height: 50,
        borderRadius: 25,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 5
    },
    quickActionLabel: { fontSize: 12, fontWeight: '600', fontFamily: 'monospace' },

    detailInfoSection: { marginTop: 10 },

    toggleSwitch: {
        width: 52,
        height: 30,
        borderRadius: 15,
        padding: 3,
        borderWidth: 1,
        borderColor: theme.textPrimary
    },
    toggleKnob: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: theme.textPrimary
    },

    // Edit Modal Styles
    editFormGroup: { marginBottom: 20 },
    editLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 },
    editInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        fontFamily: 'monospace',
        marginBottom: 5
    },
    saveEditBtn: {
        marginTop: 10,
        backgroundColor: theme.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 40
    },
    saveEditBtnText: { color: theme.bg, fontSize: 16, fontWeight: '800', fontFamily: 'monospace' },
});
