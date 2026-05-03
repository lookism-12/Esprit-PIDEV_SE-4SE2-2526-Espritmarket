package esprit_market.service.negociationService;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import esprit_market.dto.negociation.NegociationResponse;
import esprit_market.dto.negociation.ProposalResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Generates a professional ISP-style contract PDF (Tunisianet / Topnet style)
 * when a negotiation is accepted.
 */
@Service
@RequiredArgsConstructor
public class NegociationPdfService {

    private static final DateTimeFormatter DATE_FMT  = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATE_ONLY = DateTimeFormatter.ofPattern("dd MMMM yyyy");

    // ── Brand palette ─────────────────────────────────────────────────────
    private static final Color PRIMARY    = new Color(139, 0, 0);
    private static final Color GOLD       = new Color(224, 184, 74);
    private static final Color DARK       = new Color(20, 20, 20);
    private static final Color LIGHT_BG   = new Color(255, 249, 242);
    private static final Color HEADER_BG  = new Color(25, 25, 25);
    private static final Color BORDER_CLR = new Color(220, 210, 195);
    private static final Color GREEN      = new Color(16, 185, 129);
    private static final Color GRAY_TEXT  = new Color(100, 100, 100);
    private static final Color STRIPE     = new Color(248, 244, 238);

    // ── Fonts ─────────────────────────────────────────────────────────────
    private static final Font F_COMPANY   = new Font(Font.HELVETICA, 20, Font.BOLD,   Color.WHITE);
    private static final Font F_TAGLINE   = new Font(Font.HELVETICA,  8, Font.NORMAL, GOLD);
    private static final Font F_DOC_TITLE = new Font(Font.HELVETICA, 16, Font.BOLD,   PRIMARY);
    private static final Font F_REF       = new Font(Font.HELVETICA,  9, Font.NORMAL, GRAY_TEXT);
    private static final Font F_SECTION   = new Font(Font.HELVETICA, 11, Font.BOLD,   PRIMARY);
    private static final Font F_LABEL     = new Font(Font.HELVETICA,  9, Font.BOLD,   GRAY_TEXT);
    private static final Font F_VALUE     = new Font(Font.HELVETICA, 10, Font.NORMAL, DARK);
    private static final Font F_TH        = new Font(Font.HELVETICA,  9, Font.BOLD,   Color.WHITE);
    private static final Font F_TD        = new Font(Font.HELVETICA,  9, Font.NORMAL, DARK);
    private static final Font F_TOTAL_LBL = new Font(Font.HELVETICA, 11, Font.BOLD,   DARK);
    private static final Font F_TOTAL_VAL = new Font(Font.HELVETICA, 13, Font.BOLD,   PRIMARY);
    private static final Font F_LEGAL     = new Font(Font.HELVETICA,  7, Font.ITALIC, GRAY_TEXT);
    private static final Font F_FOOTER    = new Font(Font.HELVETICA,  8, Font.NORMAL, GRAY_TEXT);
    private static final Font F_STAMP     = new Font(Font.HELVETICA, 14, Font.BOLD,   GREEN);

    // ─────────────────────────────────────────────────────────────────────

    public byte[] generateNegociationPdf(NegociationResponse neg) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 45, 45, 55, 65);
        PdfWriter writer = PdfWriter.getInstance(doc, out);

        // Page event — header bar + footer
        writer.setPageEvent(new PdfPageEventHelper() {
            @Override
            public void onEndPage(PdfWriter w, Document d) {
                PdfContentByte cb = w.getDirectContent();
                // Top red bar
                cb.setColorFill(PRIMARY);
                cb.rectangle(0, d.top() + 30, d.right() + 45, 8);
                cb.fill();
                // Gold thin line
                cb.setColorFill(GOLD);
                cb.rectangle(0, d.top() + 28, d.right() + 45, 2);
                cb.fill();
                // Bottom footer bar
                cb.setColorFill(HEADER_BG);
                cb.rectangle(0, 0, d.right() + 45, 30);
                cb.fill();
                // Footer text
                Phrase footer = new Phrase(
                    "EspritMarket · Negotiation Contract · " +
                    LocalDateTime.now().format(DATE_FMT) +
                    "  |  Page " + w.getPageNumber(),
                    F_FOOTER);
                ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, footer,
                    (d.left() + d.right()) / 2, 10, 0);
            }
        });

        doc.open();

        addHeader(doc, neg);
        addParties(doc, neg);
        addServiceDetails(doc, neg);
        addProposalHistory(doc, neg);
        addPricingSummary(doc, neg);
        addTerms(doc);
        addStamp(doc);

        doc.close();
        return out.toByteArray();
    }

    // ── 1. Header ─────────────────────────────────────────────────────────

    private void addHeader(Document doc, NegociationResponse neg) throws DocumentException {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{1.4f, 2.6f});
        t.setSpacingAfter(18);

        // Left — logo block
        PdfPCell logo = new PdfPCell();
        logo.setBackgroundColor(HEADER_BG);
        logo.setBorder(Rectangle.NO_BORDER);
        logo.setPadding(16);
        logo.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph em = new Paragraph("EspritMarket", F_COMPANY);
        em.setAlignment(Element.ALIGN_CENTER);
        logo.addElement(em);

        Paragraph tag = new Paragraph("Smart Marketplace · Tunisia", F_TAGLINE);
        tag.setAlignment(Element.ALIGN_CENTER);
        logo.addElement(tag);

        // Gold divider
        PdfPTable div = new PdfPTable(1);
        div.setWidthPercentage(60);
        div.setHorizontalAlignment(Element.ALIGN_CENTER);
        PdfPCell dc = new PdfPCell();
        dc.setBackgroundColor(GOLD);
        dc.setFixedHeight(2);
        dc.setBorder(Rectangle.NO_BORDER);
        div.addCell(dc);
        logo.addElement(div);

        Paragraph addr = new Paragraph(
            "\nEsprit University, Tunis\ncontact@espritmarket.tn\n+216 71 000 000",
            new Font(Font.HELVETICA, 7, Font.NORMAL, new Color(180, 180, 180)));
        addr.setAlignment(Element.ALIGN_CENTER);
        logo.addElement(addr);
        t.addCell(logo);

        // Right — document title
        PdfPCell title = new PdfPCell();
        title.setBackgroundColor(LIGHT_BG);
        title.setBorder(Rectangle.NO_BORDER);
        title.setPadding(16);
        title.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph docTitle = new Paragraph("NEGOTIATION CONTRACT", F_DOC_TITLE);
        docTitle.setAlignment(Element.ALIGN_RIGHT);
        title.addElement(docTitle);

        Paragraph docSub = new Paragraph("Offer Acceptance Confirmation", 
            new Font(Font.HELVETICA, 9, Font.NORMAL, GRAY_TEXT));
        docSub.setAlignment(Element.ALIGN_RIGHT);
        title.addElement(docSub);

        title.addElement(new Paragraph(" "));

        String ref = "REF: EM-" + neg.getId().substring(0, 8).toUpperCase();
        title.addElement(new Paragraph(ref, new Font(Font.HELVETICA, 9, Font.BOLD, PRIMARY)));

        String date = "Date: " + LocalDateTime.now().format(DATE_ONLY);
        Paragraph dp = new Paragraph(date, F_REF);
        dp.setAlignment(Element.ALIGN_RIGHT);
        title.addElement(dp);

        // Status badge
        PdfPTable badge = new PdfPTable(1);
        badge.setWidthPercentage(50);
        badge.setHorizontalAlignment(Element.ALIGN_RIGHT);
        badge.setSpacingBefore(8);
        PdfPCell bc = new PdfPCell(new Phrase("✓  ACCEPTED", new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE)));
        bc.setBackgroundColor(GREEN);
        bc.setBorder(Rectangle.NO_BORDER);
        bc.setPadding(6);
        bc.setHorizontalAlignment(Element.ALIGN_CENTER);
        badge.addCell(bc);
        title.addElement(badge);

        t.addCell(title);
        doc.add(t);
    }

    // ── 2. Parties ────────────────────────────────────────────────────────

    private void addParties(Document doc, NegociationResponse neg) throws DocumentException {
        addSectionTitle(doc, "CONTRACTING PARTIES");

        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{1f, 1f});
        t.setSpacingAfter(14);

        // Client
        PdfPCell client = new PdfPCell();
        client.setBorderColor(BORDER_CLR);
        client.setBackgroundColor(STRIPE);
        client.setPadding(12);
        client.addElement(new Paragraph("CLIENT", F_LABEL));
        client.addElement(new Paragraph(
            neg.getClientFullName() != null ? neg.getClientFullName() : "N/A",
            new Font(Font.HELVETICA, 11, Font.BOLD, DARK)));
        client.addElement(new Paragraph("ID: " + shorten(neg.getClientId()), F_REF));
        t.addCell(client);

        // Provider
        PdfPCell provider = new PdfPCell();
        provider.setBorderColor(BORDER_CLR);
        provider.setPadding(12);
        provider.addElement(new Paragraph("PROVIDER / SELLER", F_LABEL));
        String itemOwner = neg.getServiceName() != null ? "Service Provider" : "Product Seller";
        provider.addElement(new Paragraph(itemOwner, new Font(Font.HELVETICA, 11, Font.BOLD, DARK)));
        provider.addElement(new Paragraph("EspritMarket Platform", F_REF));
        t.addCell(provider);

        doc.add(t);
    }

    // ── 3. Service / Product details ──────────────────────────────────────

    private void addServiceDetails(Document doc, NegociationResponse neg) throws DocumentException {
        addSectionTitle(doc, "SUBJECT OF CONTRACT");

        PdfPTable t = new PdfPTable(4);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{1.3f, 2f, 1.3f, 2f});
        t.setSpacingAfter(14);

        String itemName = neg.getServiceName() != null ? neg.getServiceName()
                        : neg.getProductName() != null ? neg.getProductName() : "N/A";
        String itemType = neg.getServiceName() != null ? "Service" : "Product";
        Double originalPrice = neg.getServiceOriginalPrice() != null ? neg.getServiceOriginalPrice()
                             : neg.getProductOriginalPrice();
        Double agreedPrice = getLastProposalAmount(neg);

        addRow(t, "Item Name",     itemName);
        addRow(t, "Type",          itemType);
        addRow(t, "Listed Price",  originalPrice != null ? String.format("%.3f TND", originalPrice) : "N/A");
        addRow(t, "Agreed Price",  agreedPrice   != null ? String.format("%.3f TND", agreedPrice)   : "N/A");
        addRow(t, "Negotiation ID", shorten(neg.getId()));
        addRow(t, "Contract Date", LocalDateTime.now().format(DATE_ONLY));

        doc.add(t);
    }

    // ── 4. Proposal history ───────────────────────────────────────────────

    private void addProposalHistory(Document doc, NegociationResponse neg) throws DocumentException {
        if (neg.getProposals() == null || neg.getProposals().isEmpty()) return;

        addSectionTitle(doc, "NEGOTIATION HISTORY");

        PdfPTable t = new PdfPTable(5);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{0.4f, 1.4f, 1.2f, 1.2f, 2f});
        t.setSpacingAfter(14);

        for (String h : new String[]{"#", "Party", "Amount (TND)", "Type", "Date"}) {
            PdfPCell c = new PdfPCell(new Phrase(h, F_TH));
            c.setBackgroundColor(PRIMARY);
            c.setBorderColor(PRIMARY);
            c.setPadding(7);
            c.setHorizontalAlignment(Element.ALIGN_CENTER);
            t.addCell(c);
        }

        int i = 1;
        for (ProposalResponse p : neg.getProposals()) {
            Color bg = (i % 2 == 0) ? STRIPE : Color.WHITE;
            addTd(t, String.valueOf(i),                                          bg, Element.ALIGN_CENTER);
            addTd(t, p.getSenderFullName() != null ? p.getSenderFullName() : "-", bg, Element.ALIGN_LEFT);
            addTd(t, p.getAmount() != null ? String.format("%.3f", p.getAmount()) : "-", bg, Element.ALIGN_RIGHT);
            addTd(t, p.getType() != null ? p.getType().toString() : "-",         bg, Element.ALIGN_CENTER);
            addTd(t, p.getCreatedAt() != null ? p.getCreatedAt().format(DATE_FMT) : "-", bg, Element.ALIGN_LEFT);
            i++;
        }

        doc.add(t);
    }

    // ── 5. Pricing summary ────────────────────────────────────────────────

    private void addPricingSummary(Document doc, NegociationResponse neg) throws DocumentException {
        addSectionTitle(doc, "PRICING SUMMARY");

        Double originalPrice = neg.getServiceOriginalPrice() != null ? neg.getServiceOriginalPrice()
                             : neg.getProductOriginalPrice() != null ? neg.getProductOriginalPrice() : 0.0;
        Double agreedPrice   = getLastProposalAmount(neg);
        if (agreedPrice == null) agreedPrice = originalPrice;

        double tva      = agreedPrice * 0.19;
        double total    = agreedPrice + tva;
        double savings  = originalPrice - agreedPrice;

        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(55);
        t.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.setSpacingAfter(16);

        addSummaryRow(t, "Listed Price",   String.format("%.3f TND", originalPrice), Color.WHITE);
        addSummaryRow(t, "Agreed Price",   String.format("%.3f TND", agreedPrice),   STRIPE);
        if (savings > 0)
            addSummaryRow(t, "You Saved",  String.format("- %.3f TND", savings),     new Color(240, 255, 245));
        addSummaryRow(t, "TVA (19%)",      String.format("%.3f TND", tva),           STRIPE);

        // Total row
        PdfPCell lbl = new PdfPCell(new Phrase("TOTAL DUE", F_TOTAL_LBL));
        lbl.setBackgroundColor(HEADER_BG);
        lbl.setBorderColor(HEADER_BG);
        lbl.setPadding(10);
        lbl.setHorizontalAlignment(Element.ALIGN_LEFT);
        t.addCell(lbl);

        PdfPCell val = new PdfPCell(new Phrase(String.format("%.3f TND", total), F_TOTAL_VAL));
        val.setBackgroundColor(HEADER_BG);
        val.setBorderColor(HEADER_BG);
        val.setPadding(10);
        val.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(val);

        doc.add(t);
    }

    // ── 6. Terms ──────────────────────────────────────────────────────────

    private void addTerms(Document doc) throws DocumentException {
        addSectionTitle(doc, "TERMS & CONDITIONS");

        String[] terms = {
            "1. This contract is valid for 30 days from the acceptance date.",
            "2. Payment must be completed within 7 business days.",
            "3. The agreed price is final and cannot be renegotiated after acceptance.",
            "4. Delivery or service provision will be scheduled within 5 business days after payment.",
            "5. Any dispute shall be resolved through EspritMarket's mediation service.",
            "6. This document serves as official proof of the negotiation agreement."
        };

        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        t.setSpacingAfter(16);

        for (String term : terms) {
            PdfPCell c = new PdfPCell(new Phrase(term, F_LEGAL));
            c.setBorderColor(BORDER_CLR);
            c.setBackgroundColor(STRIPE);
            c.setPadding(5);
            t.addCell(c);
        }

        doc.add(t);
    }

    // ── 7. Stamp ──────────────────────────────────────────────────────────

    private void addStamp(Document doc) throws DocumentException {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setSpacingBefore(10);

        // Signature block
        PdfPCell sig = new PdfPCell();
        sig.setBorderColor(BORDER_CLR);
        sig.setPadding(12);
        sig.addElement(new Paragraph("Client Signature", F_LABEL));
        sig.addElement(new Paragraph("\n\n_______________________", F_VALUE));
        sig.addElement(new Paragraph("Date: _______________", F_REF));
        t.addCell(sig);

        // Official stamp
        PdfPCell stamp = new PdfPCell();
        stamp.setBorderColor(BORDER_CLR);
        stamp.setBackgroundColor(new Color(240, 255, 245));
        stamp.setPadding(12);
        stamp.setHorizontalAlignment(Element.ALIGN_CENTER);
        stamp.addElement(new Paragraph("OFFICIAL STAMP", F_LABEL));
        Paragraph accepted = new Paragraph("✓ ACCEPTED & VALIDATED", F_STAMP);
        accepted.setAlignment(Element.ALIGN_CENTER);
        stamp.addElement(accepted);
        Paragraph by = new Paragraph("EspritMarket Platform\n" + LocalDateTime.now().format(DATE_ONLY),
            new Font(Font.HELVETICA, 8, Font.NORMAL, GRAY_TEXT));
        by.setAlignment(Element.ALIGN_CENTER);
        stamp.addElement(by);
        t.addCell(stamp);

        doc.add(t);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private void addSectionTitle(Document doc, String text) throws DocumentException {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        t.setSpacingBefore(12);
        t.setSpacingAfter(6);
        PdfPCell c = new PdfPCell(new Phrase("  " + text, F_SECTION));
        c.setBackgroundColor(new Color(245, 238, 228));
        c.setBorderColor(GOLD);
        c.setBorderWidthLeft(4);
        c.setBorderWidthTop(0);
        c.setBorderWidthRight(0);
        c.setBorderWidthBottom(0);
        c.setPadding(7);
        t.addCell(c);
        doc.add(t);
    }

    private void addRow(PdfPTable t, String label, String value) {
        PdfPCell lc = new PdfPCell(new Phrase(label, F_LABEL));
        lc.setBackgroundColor(STRIPE);
        lc.setBorderColor(BORDER_CLR);
        lc.setPadding(7);
        t.addCell(lc);
        PdfPCell vc = new PdfPCell(new Phrase(value, F_VALUE));
        vc.setBorderColor(BORDER_CLR);
        vc.setPadding(7);
        t.addCell(vc);
    }

    private void addTd(PdfPTable t, String text, Color bg, int align) {
        PdfPCell c = new PdfPCell(new Phrase(text, F_TD));
        c.setBackgroundColor(bg);
        c.setBorderColor(BORDER_CLR);
        c.setPadding(6);
        c.setHorizontalAlignment(align);
        t.addCell(c);
    }

    private void addSummaryRow(PdfPTable t, String label, String value, Color bg) {
        PdfPCell lc = new PdfPCell(new Phrase(label, F_LABEL));
        lc.setBackgroundColor(bg);
        lc.setBorderColor(BORDER_CLR);
        lc.setPadding(7);
        t.addCell(lc);
        PdfPCell vc = new PdfPCell(new Phrase(value, F_VALUE));
        vc.setBackgroundColor(bg);
        vc.setBorderColor(BORDER_CLR);
        vc.setPadding(7);
        vc.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(vc);
    }

    private Double getLastProposalAmount(NegociationResponse neg) {
        if (neg.getProposals() == null || neg.getProposals().isEmpty()) return null;
        return neg.getProposals().get(neg.getProposals().size() - 1).getAmount();
    }

    private String shorten(String id) {
        if (id == null) return "N/A";
        return id.length() > 8 ? id.substring(0, 8).toUpperCase() + "..." : id.toUpperCase();
    }
}
