import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// --- Helper Functions ---
const getFontSrc = (filename: string) => {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/fonts/${filename}`;
    }
    return `/fonts/${filename}`;
};

const getImageUrl = (filename: string) => {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/images/${filename}`;
    }
    return `/images/${filename}`;
};

// --- Font Registration ---
Font.register({
    family: 'Sarabun',
    fonts: [
        { src: getFontSrc('THSarabunNew.ttf') },
        { src: getFontSrc('THSarabunNew-Bold.ttf'), fontWeight: 700 },
        { src: getFontSrc('THSarabunNew-Italic.ttf'), fontStyle: 'italic' },
        { src: getFontSrc('THSarabunNew-BoldItalic.ttf'), fontWeight: 700, fontStyle: 'italic' }
    ]
});

// --- Styles ---
const styles = StyleSheet.create({
    page: { paddingTop: 70.8, paddingBottom: 56.7, paddingLeft: 56.7, paddingRight: 56.7, fontFamily: 'Sarabun', color: '#000000' },
    pageNumber: { position: 'absolute', top: 40, right: 56.7, fontSize: 16, textAlign: 'right' },
    garudaContainer: { alignItems: 'center', marginBottom: 10 },
    garuda: { width: 60, height: 'auto' },
    headerTitle: { fontWeight: 700, textAlign: 'center', marginBottom: 5 },
    headerInfo: { textAlign: 'center', marginBottom: 10 },
    sectionTitle: { fontWeight: 700, marginBottom: 2, marginLeft: 70.8 },
    subHeader: { fontWeight: 700, marginBottom: 3, marginLeft: 70.8 },
    contentBlock: { marginLeft: 70.8, marginBottom: 5 },
    subAgendaContainer: { marginLeft: 85, marginBottom: 4 },
    subAgendaRow: { flexDirection: 'row', marginBottom: 2 },
    subAgendaNumber: { width: 75, fontWeight: 700 },
    subAgendaText: { flex: 1 },
    listContainer: { marginLeft: 90, marginBottom: 5 },
    listRow: { flexDirection: 'row', marginBottom: 2 },
    listNumber: { width: 30, textAlign: 'right', marginRight: 5 },
    listContent: { flex: 1, textAlign: 'justify' },
    emptyData: { marginLeft: 70.8, fontStyle: 'italic', color: '#666' },
    resolutionSection: { marginTop: 30, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 20 },
    resolutionTitle: { textAlign: 'center', fontWeight: 700, fontSize: 16, marginBottom: 10 },
    signatureBlock: { marginTop: 30, flexDirection: 'row', justifyContent: 'flex-end' },
    signatureRight: { width: '50%', alignItems: 'center' },
    signatureLine: { marginTop: 5, marginBottom: 5 },
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: -1 },
    watermarkText: { fontSize: 60, color: 'gray', opacity: 0.15, transform: 'rotate(-45deg)', fontFamily: 'Sarabun', fontWeight: 700 },
});

// --- ✅ Custom HTML Parser (แก้ปัญหา Eo is not a function) ---
const HtmlText = ({ content, fontSize = 16, lineHeight = 1.1 }: { content: string, fontSize?: number, lineHeight?: number }) => {
    if (!content) return <Text style={{ fontSize }}>-</Text>;

    // แปลง <br>, <p> และลบ tags ที่ไม่จำเป็น (รวม h1-h6)
    let processed = content
        .replace(/&nbsp;/g, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/?h[1-6][^>]*>/gi, ''); // ลบ heading tags ทั้งหมด (h1-h6)

    // แยกข้อความด้วย tags ตัวหนา/ตัวเอียง/ขีดเส้นใต้
    const parts = processed.split(/(<\/?(?:b|strong|i|em|u)[^>]*>)/gi);

    let isBold = false;
    let isItalic = false;
    let isUnderline = false;

    const renderedParts: React.ReactElement[] = [];

    parts.forEach((part, index) => {
        // Update state flags based on tags
        if (part.match(/^<(b|strong)>/i)) {
            isBold = true;
            return;
        }
        if (part.match(/^<\/(b|strong)>/i)) {
            isBold = false;
            return;
        }
        if (part.match(/^<(i|em)>/i)) {
            isItalic = true;
            return;
        }
        if (part.match(/^<\/(i|em)>/i)) {
            isItalic = false;
            return;
        }
        if (part.match(/^<u>/i)) {
            isUnderline = true;
            return;
        }
        if (part.match(/^<\/u>/i)) {
            isUnderline = false;
            return;
        }

        // Only render non-tag content
        if (part && part.trim()) {
            renderedParts.push(
                <Text key={index} style={{
                    fontFamily: 'Sarabun',
                    fontWeight: isBold ? 700 : 400,
                    fontStyle: isItalic ? 'italic' : 'normal',
                    textDecoration: isUnderline ? 'underline' : 'none',
                }}>
                    {part}
                </Text>
            );
        }
    });

    return (
        <Text style={{ fontSize, lineHeight, textAlign: 'justify' }}>
            {renderedParts.length > 0 ? renderedParts : '-'}
        </Text>
    );
};

// --- Main Component ---
type MeetingProps = { meeting: any; };

const EbookPdfDocument: React.FC<MeetingProps> = ({ meeting }) => {
    const config = meeting.config || {
        fontSize: 16,
        lineHeight: 1.1,
        marginTop: 70.8,
        marginLeft: 56.7,
        marginRight: 56.7,
        marginBottom: 56.7,
        sectionTitleIndent: 70.8,
        subHeaderIndent: 70.8,
        subAgendaIndent: 85,
        attendeeListIndent: 90,
        itemListIndent: 90,
        assetListIndent: 90,
        resolutionIndent: 70.8,
        sectionSpacing: 14.173
    };
    const formattedDate = meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';

    const getMeetingTitle = (code: string) => {
        if (code === '001') return 'รายงานการประชุมอนุกรรมการ (ภาค/กทม.)';
        if (code === '002') return 'รายงานการประชุมคณะอนุกรรมการตรวจสอบทรัพย์สินทั่วไป';
        if (code === '003') return 'รายงานการประชุมคณะอนุกรรมการตรวจสอบทรัพย์สินมูลค่า 1 ล้านบาทขึ้นไป';
        return 'รายงานการประชุมคณะอนุกรรมการตรวจสอบทรัพย์สิน';
    };

    const translateStatus = (status: string) => {
        if (status === 'reject') return 'ยกคำร้อง';
        if (status === 'seize') return 'ยึดทรัพย์';
        if (status === 'pending') return 'รอตรวจสอบ';
        return status || '';
    };

    const parseJson = (data: any, key?: string) => {
        if (typeof data === 'object' && data !== null) return key ? data[key] : data;
        try {
            const parsed = JSON.parse(data || '{}');
            return key ? (parsed[key] || []) : parsed;
        } catch { return key ? [] : (data || ''); }
    };

    const parseResolution = (data: any) => {
        if (!data) return '';
        try {
            const parsed = JSON.parse(data);
            return typeof parsed === 'object' ? (parsed.detail || '') : parsed;
        } catch { return data; }
    };

    const resolutionDetailText = parseResolution(meeting.resolutionDetail);
    const agenda1Subs = parseJson(meeting.agendaOneData, 'subAgendas');
    const agenda1Text = typeof parseJson(meeting.agendaOneData) === 'string' ? parseJson(meeting.agendaOneData) : '';
    const agenda2Subs = parseJson(meeting.agendaTwoData, 'subAgendas');
    const agenda2Text = typeof parseJson(meeting.agendaTwoData) === 'string' ? parseJson(meeting.agendaTwoData) : '';
    const agenda3Subs = parseJson(meeting.agendaThreeData, 'subAgendas');
    const agenda3Text = typeof parseJson(meeting.agendaThreeData) === 'string' ? parseJson(meeting.agendaThreeData) : '';
    const agenda4Items = parseJson(meeting.agendaFourData, 'items');
    const agenda4Assets = parseJson(meeting.agendaFourData, 'dialogData');
    const agenda5Items = parseJson(meeting.agendaFiveData, 'items');
    const agenda5Assets = parseJson(meeting.agendaFiveData, 'dialogData');

    return (
        <Document>
            <Page size="A4" style={[styles.page, { paddingTop: config.marginTop, paddingLeft: config.marginLeft, paddingRight: config.marginRight, paddingBottom: config.marginBottom, fontSize: config.fontSize, lineHeight: config.lineHeight }]}>
                <View style={styles.watermarkContainer} fixed><Text style={styles.watermarkText}>เอกสารลับ (Confidential)</Text></View>
                <Text style={[styles.pageNumber, { fontSize: config.fontSize }]} render={({ pageNumber }) => `หน้า ${pageNumber}`} fixed />

                <View style={styles.garudaContainer}><Image style={styles.garuda} src={getImageUrl('garuda.png')} /></View>
                <Text style={[styles.headerTitle, { fontSize: config.fontSize + 2 }]}>{getMeetingTitle(meeting.meetingTypeCode)}</Text>

                {meeting.description && (
                    <View style={{ marginBottom: 5, alignItems: 'center' }}>
                        <HtmlText content={meeting.description} fontSize={config.fontSize + 2} />
                    </View>
                )}

                <Text style={[styles.headerInfo, { fontSize: config.fontSize }]}>
                    {`ครั้งที่ ${meeting.meetingNo || '-'} เมื่อวันที่ ${formattedDate} ณ ${meeting.location || '-'} เวลา ${meeting.meetingTime ? meeting.meetingTime.substring(0, 5) : '-'} น.`}
                </Text>

                <Text style={[styles.sectionTitle, { fontSize: config.fontSize, marginBottom: config.sectionSpacing, marginLeft: config.sectionTitleIndent }]}>ผู้มาประชุม</Text>
                <View style={[styles.listContainer, { marginLeft: config.attendeeListIndent }]}>
                    {(!meeting.attendees || meeting.attendees.length === 0) ? (
                        <Text style={[styles.emptyData, { fontSize: config.fontSize, marginLeft: 0 }]}>- ไม่มีข้อมูล -</Text>
                    ) : (
                        meeting.attendees.map((att: any, index: number) => (
                            <View key={index} style={styles.listRow}>
                                <Text style={[styles.listNumber, { fontSize: config.fontSize }]}>{index + 1}.</Text>
                                <Text style={[styles.listContent, { fontSize: config.fontSize }]}>{`${att.prename || ''}${att.firstname} ${att.lastname} ${att.department ? `(${att.department})` : ''}`}</Text>
                            </View>
                        ))
                    )}
                </View>

                <Text style={[styles.sectionTitle, { fontSize: config.fontSize, marginBottom: config.sectionSpacing, marginLeft: config.sectionTitleIndent }]}>ระเบียบวาระที่ ๑</Text>
                {agenda1Subs.length > 0 ? (
                    <View style={[styles.subAgendaContainer, { marginLeft: config.subAgendaIndent }]}>
                        {agenda1Subs.map((sub: any, i: number) => (
                            <View key={i} style={styles.subAgendaRow}>
                                <Text style={[styles.subAgendaNumber, { fontSize: config.fontSize }]}>{`วาระย่อยที่ 1.${i + 1}`}</Text>
                                <View style={styles.subAgendaText}><HtmlText content={sub.detail || ''} fontSize={config.fontSize} /></View>
                            </View>
                        ))}
                    </View>
                ) : (<View style={[styles.contentBlock, { marginLeft: config.sectionTitleIndent }]}><HtmlText content={agenda1Text} fontSize={config.fontSize} /></View>)}

                <Text style={[styles.sectionTitle, { fontSize: config.fontSize, marginBottom: config.sectionSpacing, marginLeft: config.sectionTitleIndent }]}>ระเบียบวาระที่ ๒</Text>
                {agenda2Subs.length > 0 ? (
                    <View style={[styles.subAgendaContainer, { marginLeft: config.subAgendaIndent }]}>
                        {agenda2Subs.map((sub: any, i: number) => (
                            <View key={i} style={styles.subAgendaRow}>
                                <Text style={[styles.subAgendaNumber, { fontSize: config.fontSize }]}>{`วาระย่อยที่ 2.${i + 1}`}</Text>
                                <View style={styles.subAgendaText}><HtmlText content={sub.detail || ''} fontSize={config.fontSize} /></View>
                            </View>
                        ))}
                    </View>
                ) : (<View style={[styles.contentBlock, { marginLeft: config.sectionTitleIndent }]}><HtmlText content={agenda2Text} fontSize={config.fontSize} /></View>)}

                <Text style={[styles.sectionTitle, { fontSize: config.fontSize, marginBottom: config.sectionSpacing, marginLeft: config.sectionTitleIndent }]}>ระเบียบวาระที่ ๓</Text>
                {agenda3Subs.length > 0 ? (
                    <View style={[styles.subAgendaContainer, { marginLeft: config.subAgendaIndent }]}>
                        {agenda3Subs.map((sub: any, i: number) => (
                            <View key={i} style={styles.subAgendaRow}>
                                <Text style={[styles.subAgendaNumber, { fontSize: config.fontSize }]}>{`วาระย่อยที่ 3.${i + 1}`}</Text>
                                <View style={styles.subAgendaText}><HtmlText content={sub.detail || ''} fontSize={config.fontSize} /></View>
                            </View>
                        ))}
                    </View>
                ) : (<View style={[styles.contentBlock, { marginLeft: config.sectionTitleIndent }]}><HtmlText content={agenda3Text} fontSize={config.fontSize} /></View>)}

                <Text style={[styles.sectionTitle, { fontSize: config.fontSize, marginBottom: config.sectionSpacing, marginLeft: config.sectionTitleIndent }]}>ระเบียบวาระที่ ๔</Text>
                <Text style={[styles.subHeader, { fontSize: config.fontSize, marginLeft: config.subHeaderIndent }]}>๔.๑ รายชื่อผู้เกี่ยวข้อง</Text>
                <View style={[styles.listContainer, { marginLeft: config.itemListIndent }]}>
                    {agenda4Items.length === 0 ? <Text style={[styles.emptyData, { fontSize: config.fontSize, marginLeft: 0 }]}>- ไม่มีรายชื่อ -</Text> : agenda4Items.map((item: any, i: number) => (
                        <View key={i} style={styles.listRow}>
                            <Text style={[styles.listNumber, { fontSize: config.fontSize }]}>{item.order || i + 1}.</Text>
                            <Text style={[styles.listContent, { fontSize: config.fontSize }]}>{`${item.name} ${item.region ? `(${item.region})` : ''}`}</Text>
                        </View>
                    ))}
                </View>
                <Text style={[styles.subHeader, { fontSize: config.fontSize, marginLeft: config.subHeaderIndent }]}>๔.๒ รายการทรัพย์สิน</Text>
                <View style={[styles.listContainer, { marginLeft: config.assetListIndent }]}>
                    {agenda4Assets.length === 0 ? <Text style={[styles.emptyData, { fontSize: config.fontSize, marginLeft: 0 }]}>- ไม่มีทรัพย์สิน -</Text> : agenda4Assets.map((asset: any, i: number) => (
                        <View key={i} style={styles.listRow}>
                            <Text style={[styles.listNumber, { fontSize: config.fontSize }]}>{i + 1}.</Text>
                            <Text style={[styles.listContent, { fontSize: config.fontSize }]}>{`${asset.asset} ${asset.fileNo ? `(${asset.fileNo})` : ''} มูลค่า ${asset.amount} บาท [${translateStatus(asset.status)}]`}</Text>
                        </View>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { fontSize: config.fontSize, marginBottom: config.sectionSpacing, marginLeft: config.sectionTitleIndent }]}>ระเบียบวาระที่ ๕</Text>
                <Text style={[styles.subHeader, { fontSize: config.fontSize, marginLeft: config.subHeaderIndent }]}>๕.๑ รายชื่อผู้เกี่ยวข้อง</Text>
                <View style={[styles.listContainer, { marginLeft: config.itemListIndent }]}>
                    {agenda5Items.length === 0 ? <Text style={[styles.emptyData, { fontSize: config.fontSize, marginLeft: 0 }]}>- ไม่มีรายชื่อ -</Text> : agenda5Items.map((item: any, i: number) => (
                        <View key={i} style={styles.listRow}>
                            <Text style={[styles.listNumber, { fontSize: config.fontSize }]}>{item.order || i + 1}.</Text>
                            <Text style={[styles.listContent, { fontSize: config.fontSize }]}>{item.name}</Text>
                        </View>
                    ))}
                </View>
                <Text style={[styles.subHeader, { fontSize: config.fontSize, marginLeft: config.subHeaderIndent }]}>๕.๒ รายการทรัพย์สิน</Text>
                <View style={[styles.listContainer, { marginLeft: config.assetListIndent }]}>
                    {agenda5Assets.length === 0 ? <Text style={[styles.emptyData, { fontSize: config.fontSize, marginLeft: 0 }]}>- ไม่มีทรัพย์สิน -</Text> : agenda5Assets.map((asset: any, i: number) => (
                        <View key={i} style={styles.listRow}>
                            <Text style={[styles.listNumber, { fontSize: config.fontSize }]}>{i + 1}.</Text>
                            <Text style={[styles.listContent, { fontSize: config.fontSize }]}>{`${asset.asset} ${asset.fileNo ? `(${asset.fileNo})` : ''} มูลค่า ${asset.amount} บาท [${translateStatus(asset.status)}]`}</Text>
                        </View>
                    ))}
                </View>

                {(meeting.resolutionDetail || meeting.resolutionFourData || meeting.resolutionFiveData) && (
                    <View style={styles.resolutionSection}>
                        <Text style={[styles.resolutionTitle, { fontSize: config.fontSize }]}>สรุปมติที่ประชุม</Text>
                        {resolutionDetailText ? (
                            <View wrap={false} style={{ marginBottom: 10 }}>
                                <Text style={[styles.subHeader, { fontSize: config.fontSize, marginLeft: config.resolutionIndent }]}>มติทั่วไป</Text>
                                <View style={[styles.contentBlock, { marginLeft: config.resolutionIndent }]}><HtmlText content={resolutionDetailText} fontSize={config.fontSize} /></View>
                            </View>
                        ) : null}
                        {meeting.resolutionFourData && (
                            <View wrap={false} style={{ marginBottom: 10 }}>
                                <Text style={[styles.subHeader, { fontSize: config.fontSize, marginLeft: config.resolutionIndent }]}>มติวาระที่ ๔</Text>
                                <View style={[styles.contentBlock, { marginLeft: config.resolutionIndent }]}><HtmlText content={meeting.resolutionFourData} fontSize={config.fontSize} /></View>
                            </View>
                        )}
                        {meeting.resolutionFiveData && (
                            <View wrap={false} style={{ marginBottom: 10 }}>
                                <Text style={[styles.subHeader, { fontSize: config.fontSize, marginLeft: config.resolutionIndent }]}>มติวาระที่ ๕</Text>
                                <View style={[styles.contentBlock, { marginLeft: config.resolutionIndent }]}><HtmlText content={meeting.resolutionFiveData} fontSize={config.fontSize} /></View>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.signatureBlock} wrap={false}>
                    <View style={styles.signatureRight}>
                        <Text style={{ fontSize: config.fontSize }}>ลงชื่อ................................................ผู้จดรายงานการประชุม</Text>
                        <Text style={[styles.signatureLine, { fontSize: config.fontSize }]}>{`(................................................)`}</Text>
                        <Text style={[styles.signatureLine, { fontSize: config.fontSize }]}>ตำแหน่ง................................................</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default EbookPdfDocument;