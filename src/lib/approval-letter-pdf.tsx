import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 55,
    color: '#111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#111',
    paddingBottom: 12,
    marginBottom: 20,
  },
  logo: { width: 55, height: 55, objectFit: 'contain' },
  headerTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'center', flex: 1 },
  chairBlock: { textAlign: 'right', marginBottom: 18, lineHeight: 1.5 },
  chairName: { fontFamily: 'Helvetica-Bold', color: '#1d4ed8' },
  bold: { fontFamily: 'Helvetica-Bold' },
  italic: { fontFamily: 'Helvetica-Oblique' },
  body: { lineHeight: 1.7, marginBottom: 10 },
  projectTitle: { fontFamily: 'Helvetica-Bold', marginBottom: 14 },
  signature: { width: 120, height: 60, objectFit: 'contain', marginBottom: 4 },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 55,
    right: 55,
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 6,
    fontSize: 7.5,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
})

type Protocol = {
  serial_text: string | null
  approved_title: string | null
  title: string | null
  applicant_title: string | null
  applicant_firstname: string | null
  applicant_surname: string | null
  approval_date: string | null
  meeting_date: string | null
}

type Chair = {
  professional_title: string | null
  firstname: string | null
  surname: string | null
  email: string | null
  signature_url: string | null
} | null

type Props = {
  protocol: Protocol
  chair: Chair
  uctLogoBase64: string
  drcLogoBase64: string
  letterType: 'approved' | 'minor_amendment' | 'major_amendment' | 'fast_track_rejected'
}

export function ApprovalLetterPDF({ protocol, chair, uctLogoBase64, drcLogoBase64, letterType }: Props) {
  const chairName = chair
    ? [chair.professional_title, chair.firstname, chair.surname].filter(Boolean).join(' ')
    : 'Dr Claire Warden'

  const firstInitial = protocol.applicant_firstname?.charAt(0) ?? ''
  const addresseeLine = [
    protocol.applicant_title,
    firstInitial ? `${firstInitial} ${protocol.applicant_surname}` : protocol.applicant_surname,
  ].filter(Boolean).join(' ')

  const salutation = [protocol.applicant_title, protocol.applicant_surname].filter(Boolean).join(' ')

  const approvalDate = protocol.approval_date
    ? new Date(protocol.approval_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

  const projectTitle = protocol.approved_title || protocol.title || 'Untitled Protocol'

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Image style={styles.logo} src={`data:image/png;base64,${uctLogoBase64}`} />
          <Text style={styles.headerTitle}>University of Cape Town</Text>
          <Image style={styles.logo} src={`data:image/png;base64,${drcLogoBase64}`} />
        </View>

        {/* Chair address block */}
        <View style={styles.chairBlock}>
          <Text style={styles.bold}>Department of Surgery</Text>
          <Text>Departmental Research Committee</Text>
          <Text style={styles.chairName}>{chairName}</Text>
          <Text>Groote Schuur Hospital</Text>
          <Text>Observatory 7925</Text>
          <Text>South Africa</Text>
          <Text><Text style={styles.bold}>Tel</Text> (021) 404 5108</Text>
          <Text><Text style={styles.bold}>Email</Text>:{chair?.email ?? 'claire.warden@uct.ac.za'}</Text>
        </View>

        {/* Date */}
        <Text style={{ marginBottom: 16 }}>{approvalDate}</Text>

        {/* Addressee */}
        <View style={{ marginBottom: 16 }}>
          <Text>{addresseeLine}</Text>
          <Text>Department of Surgery</Text>
          <Text>University of Cape Town</Text>
        </View>

        <Text style={{ marginBottom: 10 }}>Dear {salutation}</Text>
        <Text style={{ marginBottom: 10 }}>RE: Project {protocol.serial_text ?? ''}</Text>
        <Text style={styles.projectTitle}>PROJECT TITLE: {projectTitle}</Text>

        {/* Body — varies by letter type */}
        {letterType === 'fast_track_rejected' ? (
          <>
            <Text style={styles.body}>
              {'Thank you for your recent protocol submission for consideration for '}
              <Text style={styles.bold}>fast tracking / Expedited Review.</Text>
              {` Following committee review it was determined that the protocol requires your attendance (or a nominated proxy) for full review at the next DRC meeting${protocol.meeting_date ? ` (${protocol.meeting_date})` : ''}.`}
            </Text>
            <Text style={{ ...styles.body, marginBottom: 24 }}>
              You will be notified of details of the meeting via e-mail notification prior to the meeting.
            </Text>
          </>
        ) : letterType === 'major_amendment' ? (
          <>
            <Text style={styles.body}>
              The above proposal has been reviewed by the Department of Surgery Research Committee. Please could you address the comments made in the tracked change document with respect to the study.
            </Text>
            <Text style={styles.body}>
              {'Please include the above project reference number on resubmission of your corrected protocol. Should you wish to dispute the comments and recommendations provided by the DRC, please provide a cover letter with '}
              <Text style={styles.italic}>track-changed</Text>
              {' response the relevant comment. Your final approval letter will be issued on receipt of the corrected protocol'}
            </Text>
            <Text style={{ ...styles.body, marginBottom: 24 }}>
              Committee members are available and willing to assist you with any queries regarding this protocol.
            </Text>
          </>
        ) : letterType === 'approved' ? (
          <>
            <Text style={styles.body}>
              The above protocol has been reviewed by the Department of Surgery Research Committee. I am pleased to inform you that the committee approved the scientific merit of the study, and endorse the protocol for submission to the relevant ethics committee.
            </Text>
            <Text style={styles.body}>
              Although this letter serves as confirmation that the above protocol has successfully passed through the surgical DRC, respective ethics committees still require DRC chair signature before submission.
            </Text>
            <Text style={{ ...styles.body, marginBottom: 24 }}>
              Please use the above project number in all future correspondence,
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.body}>
              {'The above proposal has been reviewed by the Department of Surgery Research Committee. I am pleased to inform you that the committee approved the scientific merit of the study, '}
              <Text style={styles.bold}>pending</Text>
              {' the correction/consideration of the '}
              <Text style={styles.bold}>minor amendments</Text>
              {' noted in the attached document.'}
            </Text>
            <Text style={styles.body}>
              {'Please include the above project reference number on resubmission of your corrected protocol. Should you wish to dispute the comments and recommendations provided by the DRC, please provide a cover letter with '}
              <Text style={styles.italic}>track-changed</Text>
              {' response the relevant comment. Your final approval letter will be issued on receipt of the corrected protocol'}
            </Text>
            <Text style={{ ...styles.body, marginBottom: 24 }}>
              Committee members are available and willing to assist you with any queries regarding this protocol.
            </Text>
          </>
        )}

        <Text style={{ marginBottom: 16 }}>Yours sincerely</Text>

        {chair?.signature_url && (
          <Image style={styles.signature} src={chair.signature_url} />
        )}

        <Text style={styles.bold}>{chairName.toUpperCase()}</Text>
        <Text>CHAIR: SURGICAL DRC</Text>

        <Text style={styles.footer}>
          "OUR MISSION is to be an outstanding teaching and research university, educating for life and addressing the challenges facing our society."
        </Text>
      </Page>
    </Document>
  )
}
