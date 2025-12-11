import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import Html from 'react-pdf-html';

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

// --- Styles สำหรับ PDF Layout หลัก ---
const styles = StyleSheet.create({
    page: {
        paddingTop: 70.8,    // 2.5cm
        paddingBottom: 56.7, // 2cm
        paddingLeft: 56.7,   // 2cm
        paddingRight: 56.7,  // 2cm
        fontFamily: 'Sarabun',
        fontSize: 16,
        lineHeight: 1.1,
        color: '#000000',
    },
    pageNumber: {
        position: 'absolute',
        top: 40,
        right: 56.7,
        fontSize: 16,
        textAlign: 'right',
    },
    garudaContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    garuda: {
        width: 60,
        height: 'auto',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 700,
        textAlign: 'center',
        marginBottom: 5,
    },
    headerInfo: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 5,
        marginLeft: 70.8,
    },
    subHeader: {
        fontSize: 16,
        fontWeight: 700,
        marginTop: 8,
        marginBottom: 3,
        marginLeft: 70.8,
    },
    // Container สำหรับ HTML content ให้มีการจัดย่อหน้า
    contentBlock: {
        marginLeft: 70.8,
        marginBottom: 5,
    },
    // Layout สำหรับวาระย่อย
    subAgendaContainer: {
        marginLeft: 85,
        marginBottom: 4,
    },
    subAgendaRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    subAgendaNumber: {
        width: 75,
        fontWeight: 700,
    },
    subAgendaText: {
        flex: 1,
    },
    // Layout สำหรับ List
    listContainer: {
        marginLeft: 90,
        marginBottom: 5,
    },
    listRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    listNumber: {
        width: 30,
        textAlign: 'right',
        marginRight: 5,
    },
    listContent: {
        flex: 1,
        textAlign: 'justify'
    },
    emptyData: {
        marginLeft: 70.8,
        fontStyle: 'italic',
        color: '#666'
    },
    resolutionSection: {
        marginTop: 30,
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 20,
    },
    resolutionTitle: {
        textAlign: 'center',
        fontWeight: 700,
        fontSize: 16,
        marginBottom: 10,
    },
    signatureBlock: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    signatureRight: {
        width: '50%',
        alignItems: 'center',
    },
    signatureLine: {
        marginTop: 5,
        marginBottom: 5,
    },
    watermarkContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: -1,
    },
    watermarkText: {
        fontSize: 60,
        color: 'gray',
        opacity: 0.15, // จางๆ
        transform: 'rotate(-45deg)', // เอียง
        fontFamily: 'Sarabun',
        fontWeight: 700,
    },
});

// --- Styles สำหรับ HTML Content (CSS-like) ---
const htmlStylesheet = {
    // ตั้งค่า Default ให้ใช้ฟอนต์ไทยและขนาดที่ถูกต้อง
    p: {
        fontFamily: 'Sarabun',
        fontSize: 16,
        lineHeight: 1.1,
        margin: 0,
        textAlign: 'justify' as const
    },
    div: {
        fontFamily: 'Sarabun',
        fontSize: 16
    },
    strong: {
        fontFamily: 'Sarabun',
        fontWeight: 700
    },
    b: {
        fontFamily: 'Sarabun',
        fontWeight: 700
    },
    em: {
        fontFamily: 'Sarabun',
        fontStyle: 'italic'
    },
    i: {
        fontFamily: 'Sarabun',
        fontStyle: 'italic'
    },
    u: {
        textDecoration: 'underline'
    },
    ul: {
        margin: 0,
        paddingLeft: 15 // ระยะร่นของ bullet
    },
    ol: {
        margin: 0,
        paddingLeft: 15
    },
    li: {
        fontFamily: 'Sarabun',
        fontSize: 16,
        lineHeight: 1.1,
        padding: 0,
        margin: 0
    }
};

// --- Main Component ---

type MeetingProps = {
    meeting: any;
};

const EbookPdfDocument: React.FC<MeetingProps> = ({ meeting }) => {

    const formattedDate = meeting.meetingDate
        ? new Date(meeting.meetingDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
        : '-';

    const getMeetingTitle = (code: string | null | undefined) => {
        switch (code) {
            case '001':
                return 'รายงานการประชุมอนุกรรมการ (ภาค/กทม.)';
            case '002':
                return 'รายงานการประชุมคณะอนุกรรมการตรวจสอบทรัพย์สินทั่วไป';
            case '003':
                return 'รายงานการประชุมคณะอนุกรรมการตรวจสอบทรัพย์สินมูลค่า 1 ล้านบาทขึ้นไป';
            default:
                // กรณีไม่มี Code หรือไม่ตรง ให้ใช้ค่า Default (หรือ 002 ตามความเหมาะสม)
                return 'รายงานการประชุมคณะอนุกรรมการตรวจสอบทรัพย์สิน';
        }
    };

    const translateStatus = (status: string | null | undefined) => {
        if (!status) return '';
        switch (status) {
            case 'reject': return 'ยกคำร้อง';
            case 'seize': return 'ยึดทรัพย์';
            case 'pending': return 'รอตรวจสอบ';
            default: return status; // กรณีมีสถานะอื่น ให้แสดงค่าเดิมไปก่อน
        }
    };

    // Helpers สำหรับดึงข้อมูล
    const parseSubAgendas = (jsonString?: string) => {
        try {
            const parsed = JSON.parse(jsonString || '{}');
            return Array.isArray(parsed.subAgendas) ? parsed.subAgendas : [];
        } catch { return []; }
    };

    const parseContent = (jsonString?: string) => {
        try {
            const parsed = JSON.parse(jsonString || '{}');
            if (typeof parsed === 'string') return parsed;
            return null;
        } catch {
            return jsonString || '';
        }
    };

    const parseListItems = (jsonString?: string, key: string = 'items') => {
        try {
            const parsed = JSON.parse(jsonString || '{}');
            return Array.isArray(parsed[key]) ? parsed[key] : [];
        } catch { return []; }
    };

    const parseDialogData = (jsonString?: string) => {
        try {
            const parsed = JSON.parse(jsonString || '{}');
            return Array.isArray(parsed.dialogData) ? parsed.dialogData : [];
        } catch { return []; }
    };

    // Component ช่วยแสดงผล HTML เพื่อลดโค้ดซ้ำ
    const HtmlContent = ({ content }: { content: string }) => {
        if (!content) return <Text>-</Text>;
        return (
            <Html stylesheet={htmlStylesheet}>
                {content}
            </Html>
        );
    };

    // Prepare Data
    const agenda1Subs = parseSubAgendas(meeting.agendaOneData);
    const agenda1Text = parseContent(meeting.agendaOneData);

    const agenda2Subs = parseSubAgendas(meeting.agendaTwoData);
    const agenda2Text = parseContent(meeting.agendaTwoData);

    const agenda3Subs = parseSubAgendas(meeting.agendaThreeData);
    const agenda3Text = parseContent(meeting.agendaThreeData);

    const agenda4Items = parseListItems(meeting.agendaFourData, 'items');
    const agenda4Assets = parseDialogData(meeting.agendaFourData);

    const agenda5Items = parseListItems(meeting.agendaFiveData, 'items');
    const agenda5Assets = parseDialogData(meeting.agendaFiveData);

    const watermarkText = "เอกสารลับ (Confidential)";

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Watermark */}
                <View style={styles.watermarkContainer} fixed>
                    <Text style={styles.watermarkText}>{watermarkText}</Text>
                </View>

                {/* Page Number */}
                <Text style={styles.pageNumber} render={({ pageNumber }) => `หน้า ${pageNumber}`} fixed />

                {/* Garuda */}
                <View style={styles.garudaContainer}>
                    <Image style={styles.garuda} src={getImageUrl('garuda.png')} />
                </View>

                {/* --- ส่วน Header ที่แก้ไขแล้ว --- */}
                <Text style={styles.headerTitle}>
                    {getMeetingTitle(meeting.meetingTypeCode)}
                </Text>

                {/* Description (ถ้ามี HTML) */}
                {meeting.description ? (
                    <View style={{ marginBottom: 5, alignItems: 'center' }}>
                        <Html stylesheet={{ ...htmlStylesheet, p: { ...htmlStylesheet.p, textAlign: 'center', fontSize: 18 } }}>
                            {meeting.description}
                        </Html>
                    </View>
                ) : null}

                <Text style={styles.headerInfo}>
                    {`ครั้งที่ ${meeting.meetingNo || '-'} เมื่อวันที่ ${formattedDate} ณ ${meeting.location || '-'} เวลา ${meeting.meetingTime ? meeting.meetingTime.substring(0, 5) : '-'} น.`}
                </Text>

                {/* --- Body Content (เหมือนเดิม) --- */}
                <Text style={styles.sectionTitle}>ผู้มาประชุม</Text>
                <View style={styles.listContainer}>
                    {(!meeting.attendees || meeting.attendees.length === 0) ? (
                        <Text style={styles.emptyData}>- ไม่มีข้อมูล -</Text>
                    ) : (
                        meeting.attendees.map((attendee: any, index: number) => (
                            <View key={index} style={styles.listRow}>
                                <Text style={styles.listNumber}>{index + 1}.</Text>
                                <Text style={styles.listContent}>
                                    {`${attendee.prename}${attendee.firstname} ${attendee.lastname} ${attendee.department ? `(${attendee.department})` : ''}`}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Agendas 1-3 */}
                <Text style={styles.sectionTitle}>ระเบียบวาระที่ ๑</Text>
                {agenda1Subs.length > 0 ? (
                    <View style={styles.subAgendaContainer}>
                        {agenda1Subs.map((sub: any, index: number) => (
                            <View key={index} style={styles.subAgendaRow}>
                                <Text style={styles.subAgendaNumber}>{`วาระย่อยที่ 1.${index + 1}`}</Text>
                                <View style={styles.subAgendaText}><HtmlContent content={sub.detail} /></View>
                            </View>
                        ))}
                    </View>
                ) : (<View style={styles.contentBlock}><HtmlContent content={agenda1Text || ""} /></View>)}

                <Text style={styles.sectionTitle}>ระเบียบวาระที่ ๒</Text>
                {agenda2Subs.length > 0 ? (
                    <View style={styles.subAgendaContainer}>
                        {agenda2Subs.map((sub: any, index: number) => (
                            <View key={index} style={styles.subAgendaRow}>
                                <Text style={styles.subAgendaNumber}>{`วาระย่อยที่ 2.${index + 1}`}</Text>
                                <View style={styles.subAgendaText}><HtmlContent content={sub.detail} /></View>
                            </View>
                        ))}
                    </View>
                ) : (<View style={styles.contentBlock}><HtmlContent content={agenda2Text || ""} /></View>)}

                <Text style={styles.sectionTitle}>ระเบียบวาระที่ ๓</Text>
                {agenda3Subs.length > 0 ? (
                    <View style={styles.subAgendaContainer}>
                        {agenda3Subs.map((sub: any, index: number) => (
                            <View key={index} style={styles.subAgendaRow}>
                                <Text style={styles.subAgendaNumber}>{`วาระย่อยที่ 3.${index + 1}`}</Text>
                                <View style={styles.subAgendaText}><HtmlContent content={sub.detail} /></View>
                            </View>
                        ))}
                    </View>
                ) : (<View style={styles.contentBlock}><HtmlContent content={agenda3Text || ""} /></View>)}

                {/* Agenda 4 */}
                <Text style={styles.sectionTitle}>ระเบียบวาระที่ ๔</Text>
                <Text style={styles.subHeader}>๔.๑ รายชื่อผู้เกี่ยวข้อง</Text>
                <View style={styles.listContainer}>
                    {agenda4Items.length === 0 ? (<Text style={styles.emptyData}>- ไม่มีรายชื่อ -</Text>) : (
                        agenda4Items.map((item: any, index: number) => (
                            <View key={index} style={styles.listRow}>
                                <Text style={styles.listNumber}>{item.order || index + 1}.</Text>
                                <Text style={styles.listContent}>{`${item.name} ${item.region !== '-' ? `(${item.region})` : ''}`}</Text>
                            </View>
                        ))
                    )}
                </View>
                <Text style={styles.subHeader}>๔.๒ รายการทรัพย์สิน</Text>
                <View style={styles.listContainer}>
                    {agenda4Assets.length === 0 ? (<Text style={styles.emptyData}>- ไม่มีรายการทรัพย์สิน -</Text>) : (
                        agenda4Assets.map((asset: any, index: number) => (
                            <View key={index} style={styles.listRow}>
                                <Text style={styles.listNumber}>{index + 1}.</Text>
                                <Text style={styles.listContent}>
                                    {`${asset.asset}`}
                                    {asset.fileNo && asset.fileNo !== '-' ? ` (${asset.fileNo})` : ''}
                                    {` มูลค่า ${asset.amount} บาท`}
                                    {asset.status ? ` [${translateStatus(asset.status)}]` : ''}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Agenda 5 */}
                <Text style={styles.sectionTitle}>ระเบียบวาระที่ ๕</Text>
                <Text style={styles.subHeader}>๕.๑ รายชื่อผู้เกี่ยวข้อง</Text>
                <View style={styles.listContainer}>
                    {agenda5Items.length === 0 ? (<Text style={styles.emptyData}>- ไม่มีรายชื่อ -</Text>) : (
                        agenda5Items.map((item: any, index: number) => (
                            <View key={index} style={styles.listRow}>
                                <Text style={styles.listNumber}>{item.order || index + 1}.</Text>
                                <Text style={styles.listContent}>{item.name}</Text>
                            </View>
                        ))
                    )}
                </View>
                <Text style={styles.subHeader}>๕.๒ รายการทรัพย์สิน</Text>
                <View style={styles.listContainer}>
                    {agenda5Assets.length === 0 ? (<Text style={styles.emptyData}>- ไม่มีรายการทรัพย์สิน -</Text>) : (
                        agenda5Assets.map((asset: any, index: number) => (
                            <View key={index} style={styles.listRow}>
                                <Text style={styles.listNumber}>{index + 1}.</Text>
                                <Text style={styles.listContent}>
                                    {`${asset.asset}`}
                                    {asset.fileNo && asset.fileNo !== '-' ? ` (${asset.fileNo})` : ''}
                                    {` มูลค่า ${asset.amount} บาท`}
                                    {asset.status ? ` [${translateStatus(asset.status)}]` : ''}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Resolution */}
                {(meeting.resolutionDetail || meeting.resolutionFourData || meeting.resolutionFiveData) && (
                    <View style={styles.resolutionSection}>
                        <Text style={styles.resolutionTitle}>สรุปมติที่ประชุม</Text>
                        {meeting.resolutionDetail && (
                            <View wrap={false} style={{ marginBottom: 10 }}>
                                <Text style={styles.subHeader}>มติทั่วไป</Text>
                                <View style={styles.contentBlock}><HtmlContent content={meeting.resolutionDetail} /></View>
                            </View>
                        )}
                        {meeting.resolutionFourData && (
                            <View wrap={false} style={{ marginBottom: 10 }}>
                                <Text style={styles.subHeader}>มติวาระที่ ๔</Text>
                                <View style={styles.contentBlock}><HtmlContent content={meeting.resolutionFourData} /></View>
                            </View>
                        )}
                        {meeting.resolutionFiveData && (
                            <View wrap={false} style={{ marginBottom: 10 }}>
                                <Text style={styles.subHeader}>มติวาระที่ ๕</Text>
                                <View style={styles.contentBlock}><HtmlContent content={meeting.resolutionFiveData} /></View>
                            </View>
                        )}
                    </View>
                )}

                {/* Signature */}
                <View style={styles.signatureBlock} wrap={false}>
                    <View style={styles.signatureRight}>
                        <Text>ลงชื่อ................................................ผู้จดรายงานการประชุม</Text>
                        <Text style={styles.signatureLine}>{`(................................................)`}</Text>
                        <Text style={styles.signatureLine}>ตำแหน่ง................................................</Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
};

export default EbookPdfDocument;