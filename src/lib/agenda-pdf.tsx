import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'

const MISSION =
  '“OUR MISSION is to be an outstanding teaching and research university, ' +
  'educating for life and addressing the challenges facing our society.”'

type Protocol = {
  id: string
  serial_text: string | null
  title: string | null
  applicant_title: string | null
  applicant_firstname: string | null
  applicant_surname: string | null
}

type Props = {
  meetingDateFormatted: string
  apologisedNames: string[]
  fastTracked: Protocol[]
  forReview: Protocol[]
  agendaSentTo: string
  nextMeeting: string | null
  chairName: string
  chairEmail: string
  signatureUrl: string | null
  uctShieldBase64: string
  drcLogoBase64: string
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 42,
    paddingHorizontal: 42,
    paddingBottom: 70,
    color: '#111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1f2937',
    marginBottom: 16,
  },
  headerLogo: { width: 50, height: 50, objectFit: 'contain' },
  headerTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  meetingTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 2,
  },
  centerLine: { textAlign: 'center', marginBottom: 1 },
  meetingDate: { fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 1 },
  meetingNote: { textAlign: 'center', color: '#525252', fontSize: 9, marginTop: 6 },
  agendaTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginTop: 18,
    marginBottom: 18,
  },
  section: { marginBottom: 14 },
  sectionHeader: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  sectionContent: { marginLeft: 12, color: '#374151', lineHeight: 1.4 },
  italicMuted: {
    fontFamily: 'Helvetica-Oblique',
    color: '#a3a3a3',
    marginLeft: 12,
  },
  protocolItem: {
    marginLeft: 12,
    marginBottom: 8,
  },
  protocolName: { fontFamily: 'Helvetica-Bold' },
  protocolTitle: { color: '#374151', marginLeft: 12, marginTop: 2 },
  sentToText: { color: '#374151' },
  bold: { fontFamily: 'Helvetica-Bold' },
  signature: {
    width: 100, height: 50, objectFit: 'contain',
    marginTop: 8, marginBottom: 4,
  },
  signatureSpacer: { height: 50, marginTop: 8, marginBottom: 4 },
  chairName: {
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chairRole: {
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 42,
    right: 42,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
  },
  mission: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 7.5,
    color: '#9ca3af',
    flex: 1,
    textAlign: 'center',
    // matches the page-number slot on the right so the mission stays centered on the page
    paddingLeft: 80,
  },
  pageNumber: {
    fontSize: 9,
    color: '#525252',
    width: 80,
    textAlign: 'right',
  },
})

export function AgendaDocument({
  meetingDateFormatted,
  apologisedNames,
  fastTracked,
  forReview,
  agendaSentTo,
  nextMeeting,
  chairName,
  chairEmail,
  signatureUrl,
  uctShieldBase64,
  drcLogoBase64,
}: Props) {
  return (
    <Document title={`DRC Protocol Review Agenda ${meetingDateFormatted}`}>
      <Page size="A4" style={styles.page}>

        {/* UCT Header */}
        <View style={styles.header}>
          <Image src={`data:image/png;base64,${uctShieldBase64}`} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>University of Cape Town</Text>
          <Image src={`data:image/png;base64,${drcLogoBase64}`} style={styles.headerLogo} />
        </View>

        {/* Meeting info block */}
        <View style={{ marginBottom: 18 }}>
          <Text style={styles.meetingTitle}>Department of Surgery Research Committee</Text>
          <Text style={styles.centerLine}>13:45 Committee Members only</Text>
          <Text style={styles.centerLine}>14:00 Investigators</Text>
          <Text style={styles.meetingDate}>{meetingDateFormatted}</Text>
          <Text style={styles.centerLine}>Venue: via Zoom</Text>
          <Text style={styles.meetingNote}>
            Should you be unable to attend and wish to have your apologies recorded,
            {'\n'}email <Text style={styles.bold}>{chairEmail}</Text>
          </Text>
        </View>

        <Text style={styles.agendaTitle}>Agenda</Text>

        {/* 1. Apologies */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionHeader}>1. Apologies</Text>
          {apologisedNames.length > 0 ? (
            <Text style={styles.sectionContent}>{apologisedNames.join(', ')}</Text>
          ) : (
            <Text style={styles.italicMuted}>None recorded</Text>
          )}
        </View>

        {/* 2. Minutes */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>2. Minutes of Previous Meeting</Text>
        </View>

        {/* 3. Matters of Urgency */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>3. Matters of Urgency</Text>
        </View>

        {/* 4. Fast-Tracked */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            4. Fast-Tracked Protocols <Text style={{ fontFamily: 'Helvetica-Oblique', color: '#525252' }}>(Do not need to attend meeting)</Text>
          </Text>
          {fastTracked.length > 0 ? fastTracked.map((p, i) => {
            const initial = p.applicant_firstname?.[0]?.toUpperCase()
            const surname = p.applicant_surname?.toUpperCase() ?? ''
            const applicant = [
              p.applicant_title,
              initial ? `${initial} ${surname}` : surname,
            ].filter(Boolean).join(' ')
            return (
              <View key={p.id} style={styles.protocolItem} wrap={false}>
                <Text style={styles.protocolName}>
                  4.{i + 1} {applicant} (Protocol No.: {p.serial_text ?? '—'})
                </Text>
                <Text style={styles.protocolTitle}>{p.title ?? 'Untitled Protocol'}</Text>
              </View>
            )
          }) : (
            <Text style={styles.italicMuted}>None</Text>
          )}
        </View>

        {/* 5. Protocols For Review */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>5. Protocols For Review (14:00)</Text>
          {forReview.length > 0 ? forReview.map((p, i) => {
            const initial = p.applicant_firstname?.[0] ? `${p.applicant_firstname[0]} ` : ''
            const applicant = [
              p.applicant_title,
              `${initial}${p.applicant_surname ?? ''}`,
            ].filter(Boolean).join(' ')
            return (
              <View key={p.id} style={styles.protocolItem} wrap={false}>
                <Text style={styles.protocolName}>
                  5.{i + 1} {applicant} (Protocol No.: {p.serial_text ?? '—'})
                </Text>
                <Text style={styles.protocolTitle}>{p.title ?? 'Untitled Protocol'}</Text>
              </View>
            )
          }) : (
            <Text style={styles.italicMuted}>None</Text>
          )}
        </View>

        {/* 6. Agenda Sent To */}
        <View style={styles.section} wrap={false}>
          <Text>
            <Text style={styles.sectionHeader}>6. Agenda Sent to: </Text>
            <Text style={styles.sentToText}>{agendaSentTo}</Text>
          </Text>
        </View>

        {/* Next Meeting */}
        {nextMeeting ? (
          <Text style={{ marginBottom: 14 }}>
            Next Meeting <Text style={styles.bold}>{nextMeeting}</Text>
          </Text>
        ) : null}

        {/* Sign-off */}
        <Text style={{ marginBottom: 8 }}>Yours sincerely</Text>
        {signatureUrl ? (
          <Image src={signatureUrl} style={styles.signature} />
        ) : (
          <View style={styles.signatureSpacer} />
        )}
        <Text style={styles.chairName}>{chairName.toUpperCase()}</Text>
        <Text style={styles.chairRole}>Chair: Surgical DRC</Text>

        {/* Fixed footer — repeats on every page */}
        <View style={styles.footer} fixed>
          <Text style={styles.mission}>{MISSION}</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
