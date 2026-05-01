import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const UCT_BLUE  = '#003B6F'
const CHAIR_BLUE = '#1a5f8a'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    paddingTop: 36,
    paddingBottom: 72,
    paddingHorizontal: 56,
    color: '#000',
  },

  // ── Header ──────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  crestLeft:  { width: 52, height: 62 },
  crestRight: { width: 48, height: 58 },
  uctTitle: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
    color: UCT_BLUE,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  rule: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    marginBottom: 18,
  },

  // ── Address block (right-aligned) ────────────────────────────
  addressWrap: {
    alignSelf: 'flex-end',
    textAlign: 'right',
    marginBottom: 6,
  },
  addrBold:  { fontFamily: 'Helvetica-Bold', fontSize: 10, lineHeight: 1.5 },
  addrChair: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: CHAIR_BLUE, lineHeight: 1.5 },
  addrLine:  { fontSize: 10, lineHeight: 1.5 },
  addrEmail: { fontSize: 10, lineHeight: 1.5 },

  // ── Date ────────────────────────────────────────────────────
  dateWrap: { alignSelf: 'flex-end', fontSize: 10, marginBottom: 18 },

  // ── Body ────────────────────────────────────────────────────
  recipientBlock: { marginBottom: 10 },
  bodyLine:  { fontSize: 10.5, lineHeight: 1.6 },
  gap:       { marginBottom: 12 },
  gapSm:     { marginBottom: 6 },
  titleBold: { fontFamily: 'Helvetica-Bold', fontSize: 10.5, marginBottom: 12 },
  para:      { fontSize: 10.5, lineHeight: 1.8, marginBottom: 14 },

  // ── Sign-off ─────────────────────────────────────────────────
  signatureImg:  { width: 110, height: 56, marginTop: 22, marginBottom: 2 },
  sigName:       { fontFamily: 'Helvetica-Bold', fontSize: 10 },

  // ── Footer ───────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 56,
    right: 56,
    borderTopWidth: 0.5,
    borderTopColor: '#bbb',
    paddingTop: 6,
    fontSize: 8,
    fontFamily: 'Helvetica-Oblique',
    color: '#555',
    textAlign: 'center',
  },
})

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export type ApprovalLetterProps = {
  // Protocol
  serialText: string
  title: string
  applicantTitle: string
  applicantFirstname: string
  applicantSurname: string
  approvalDate: string   // ISO string

  // Chair
  chairTitle: string
  chairFirstname: string
  chairSurname: string
  chairEmail: string

  // Images (base64 data URIs or file paths)
  uctCrestSrc:  string
  deptCrestSrc: string
  signatureSrc: string | null
}

export default function ApprovalLetter({
  serialText, title,
  applicantTitle, applicantFirstname, applicantSurname,
  approvalDate,
  chairTitle, chairFirstname, chairSurname, chairEmail,
  uctCrestSrc, deptCrestSrc, signatureSrc,
}: ApprovalLetterProps) {
  const initial       = applicantFirstname.charAt(0)
  const chairFullUC   = `${chairTitle.toUpperCase()} ${chairFirstname.toUpperCase()} ${chairSurname.toUpperCase()}`

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.headerRow}>
          <Image style={s.crestLeft}  src={uctCrestSrc} />
          <Text style={s.uctTitle}>UNIVERSITY OF CAPE TOWN</Text>
          <Image style={s.crestRight} src={deptCrestSrc} />
        </View>
        <View style={s.rule} />

        {/* Address block */}
        <View style={s.addressWrap}>
          <Text style={s.addrBold}>Department of Surgery</Text>
          <Text style={s.addrBold}>Departmental Research Committee</Text>
          <Text style={s.addrChair}>{chairTitle} {chairFirstname} {chairSurname}</Text>
          <Text style={s.addrLine}>Groote Schuur Hospital</Text>
          <Text style={s.addrLine}>Observatory 7925</Text>
          <Text style={s.addrLine}>South Africa</Text>
          <Text style={s.addrLine}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Tel </Text>(021) 404 5108</Text>
          <Text style={s.addrEmail}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Email</Text>:{chairEmail}</Text>
        </View>

        {/* Date */}
        <View style={s.dateWrap}>
          <Text>{fmtDate(approvalDate)}</Text>
        </View>

        {/* Recipient */}
        <View style={s.recipientBlock}>
          <Text style={s.bodyLine}>{applicantTitle} {initial} {applicantSurname}</Text>
          <Text style={s.bodyLine}>Department of Surgery</Text>
          <Text style={s.bodyLine}>University of Cape Town</Text>
        </View>

        <View style={s.gap} />
        <Text style={s.bodyLine}>Dear {applicantTitle} {applicantSurname}</Text>
        <View style={s.gap} />
        <Text style={s.bodyLine}>RE: Project {serialText}</Text>
        <View style={s.gap} />

        {/* Title */}
        <Text style={s.titleBold}>PROJECT TITLE: {title}</Text>

        {/* Body */}
        <Text style={s.para}>
          The above protocol has been reviewed by the Department of Surgery Research Committee. I am
          pleased to inform you that the committee approved the scientific merit of the study, and endorse
          the protocol for submission to the relevant ethics committee.
        </Text>

        <Text style={s.para}>
          Although this letter serves as confirmation that the above protocol has successfully passed
          through the surgical DRC, respective ethics committees still require DRC chair signature
          before submission.
        </Text>

        <Text style={s.para}>
          Please use the above project number in all future correspondence,
        </Text>

        <Text style={s.bodyLine}>Yours sincerely</Text>

        {/* Signature */}
        {signatureSrc
          ? <Image style={s.signatureImg} src={signatureSrc} />
          : <View style={{ height: 60 }} />
        }

        <Text style={s.sigName}>{chairFullUC}</Text>
        <Text style={s.sigName}>CHAIR: SURGICAL DRC</Text>

        {/* Footer */}
        <Text style={s.footer}>
          "OUR MISSION is to be an outstanding teaching and research university, educating for life
          and addressing the challenges facing our society."
        </Text>

      </Page>
    </Document>
  )
}
