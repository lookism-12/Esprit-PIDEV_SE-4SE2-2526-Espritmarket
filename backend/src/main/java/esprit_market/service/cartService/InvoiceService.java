package esprit_market.service.cartService;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.config.Exceptions;
import esprit_market.entity.cart.Order;
import esprit_market.entity.cart.OrderItem;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.OrderItemRepository;
import esprit_market.repository.cartRepository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Invoice Service
 * 
 * Generates professional PDF invoices for paid orders.
 * 
 * Business Rules:
 * - Invoice can only be generated for PAID orders
 * - Includes customer info, order details, items, and financial breakdown
 * - Calculates TVA (19%) on net amount
 * - Professional formatting with company branding
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {
    
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final TaxConfigService taxConfigService;

    private static final double DEFAULT_TVA_RATE = 0.19; // fallback
    private static final double SHIPPING_COST = 7.0;
    
    /**
     * Generate PDF invoice for a paid order
     * 
     * @param orderId Order ID
     * @param userId User ID (for security verification)
     * @return PDF as byte array
     */
    public byte[] generateInvoicePDF(ObjectId orderId, ObjectId userId) {
        log.info("Generating invoice for order: {}", orderId.toHexString());
        
        // Get order and verify ownership
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Order not found"));
        
        if (!order.getUser().getId().equals(userId)) {
            throw new Exceptions.AccessDeniedException("You do not have permission to access this invoice");
        }
        
        // Get order items
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        
        if (items.isEmpty()) {
            throw new IllegalStateException("Cannot generate invoice for order with no items");
        }
        
        try {
            double tvaRate = taxConfigService.getEffectiveRate();
            // Generate FINAL invoice for PAID orders, PROFORMA for others
            boolean isProforma = order.getPaymentStatus() != esprit_market.Enum.cartEnum.PaymentStatus.PAID;
            return createPDF(order, items, isProforma, tvaRate);
        } catch (Exception e) {
            log.error("Error generating PDF invoice: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate invoice: " + e.getMessage());
        }
    }
    
    /**
     * Create professional PDF invoice document
     * 
     * @param order Order entity
     * @param items Order items
     * @param isProforma True for proforma invoice (unpaid), false for final invoice (paid)
     */
    private byte[] createPDF(Order order, List<OrderItem> items, boolean isProforma, double tvaRate) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc);
        
        // Set margins
        document.setMargins(40, 40, 40, 40);
        
        User customer = order.getUser();
        
        // Professional color scheme
        DeviceRgb brandColor = new DeviceRgb(128, 0, 0); // Maroon
        DeviceRgb proformaColor = new DeviceRgb(100, 100, 100); // Gray for proforma
        DeviceRgb textColor = new DeviceRgb(51, 51, 51); // Dark gray
        DeviceRgb borderColor = new DeviceRgb(221, 221, 221); // Light gray border
        DeviceRgb bgColor = new DeviceRgb(250, 250, 250); // Very light gray background
        
        // Use different color for proforma
        DeviceRgb titleColor = isProforma ? proformaColor : brandColor;
        
        // ==================== HEADER ====================
        Table headerTable = new Table(2);
        headerTable.setWidth(UnitValue.createPercentValue(100));
        headerTable.setMarginBottom(15);
        
        // Left: Logo + Company Name
        Cell logoCell = new Cell()
                .setBorder(null)
                .setPadding(0);
        
        Paragraph companyName = new Paragraph("ESPRIT MARKET")
                .setFontSize(18)
                .setBold()
                .setFontColor(brandColor)
                .setMarginBottom(2);
        
        Paragraph tagline = new Paragraph("Student Marketplace")
                .setFontSize(9)
                .setFontColor(textColor)
                .setMarginBottom(8);
        
        Paragraph companyAddress = new Paragraph("Ghazela Technopark, Ariana\nTunis, Tunisia 2083")
                .setFontSize(9)
                .setFontColor(textColor);
        
        logoCell.add(companyName);
        logoCell.add(tagline);
        logoCell.add(companyAddress);
        
        // Right: Invoice Title + Number
        Cell invoiceInfoCell = new Cell()
                .setBorder(null)
                .setPadding(0)
                .setTextAlignment(TextAlignment.RIGHT);
        
        // Different title for proforma
        String invoiceTitleText = isProforma ? "PROFORMA INVOICE" : "INVOICE";
        Paragraph invoiceTitle = new Paragraph(invoiceTitleText)
                .setFontSize(20)
                .setBold()
                .setFontColor(titleColor)
                .setMarginBottom(8);
        
        Paragraph invoiceNumber = new Paragraph("# " + order.getOrderNumber())
                .setFontSize(11)
                .setBold()
                .setFontColor(textColor)
                .setMarginBottom(5);
        
        Paragraph invoiceDate = new Paragraph("Date: " + formatDate(order.getCreatedAt()))
                .setFontSize(9)
                .setFontColor(textColor)
                .setMarginBottom(3);
        
        // Payment status
        String paymentStatusText = isProforma ? "Payment: PENDING (Cash on Delivery)" : "Payment: PAID";
        DeviceRgb statusColor = isProforma ? proformaColor : new DeviceRgb(0, 128, 0);
        Paragraph paymentStatus = new Paragraph(paymentStatusText)
                .setFontSize(9)
                .setBold()
                .setFontColor(statusColor);
        
        invoiceInfoCell.add(invoiceTitle);
        invoiceInfoCell.add(invoiceNumber);
        invoiceInfoCell.add(invoiceDate);
        invoiceInfoCell.add(paymentStatus);
        
        headerTable.addCell(logoCell);
        headerTable.addCell(invoiceInfoCell);
        document.add(headerTable);
        
        // Separator line
        Table separator = new Table(1);
        separator.setWidth(UnitValue.createPercentValue(100));
        separator.setMarginBottom(15);
        separator.addCell(new Cell()
                .setBorder(null)
                .setHeight(1)
                .setBackgroundColor(borderColor));
        document.add(separator);
        
        // Proforma notice
        if (isProforma) {
            Paragraph proformaNotice = new Paragraph("⚠ This is a provisional invoice. Payment will be completed upon delivery.")
                    .setFontSize(9)
                    .setItalic()
                    .setFontColor(proformaColor)
                    .setBackgroundColor(new DeviceRgb(245, 245, 245))
                    .setPadding(8)
                    .setMarginBottom(15);
            document.add(proformaNotice);
        }
        
        // ==================== BILL TO ====================
        Paragraph billToTitle = new Paragraph("BILL TO")
                .setFontSize(11)
                .setBold()
                .setFontColor(brandColor)
                .setMarginBottom(8);
        document.add(billToTitle);
        
        Table billToTable = new Table(1);
        billToTable.setWidth(UnitValue.createPercentValue(100));
        billToTable.setMarginBottom(15);
        
        Cell billToCell = new Cell()
                .setBorder(null)
                .setBackgroundColor(bgColor)
                .setPadding(12);
        
        Paragraph customerName = new Paragraph(customer.getFirstName() + " " + customer.getLastName())
                .setFontSize(11)
                .setBold()
                .setFontColor(textColor)
                .setMarginBottom(4);
        
        Paragraph customerEmail = new Paragraph(customer.getEmail())
                .setFontSize(9)
                .setFontColor(textColor)
                .setMarginBottom(2);
        
        Paragraph customerPhone = new Paragraph("Phone: " + (customer.getPhone() != null ? customer.getPhone() : "N/A"))
                .setFontSize(9)
                .setFontColor(textColor)
                .setMarginBottom(2);
        
        Paragraph shippingAddress = new Paragraph("Shipping: " + order.getShippingAddress())
                .setFontSize(9)
                .setFontColor(textColor);
        
        billToCell.add(customerName);
        billToCell.add(customerEmail);
        billToCell.add(customerPhone);
        billToCell.add(shippingAddress);
        
        billToTable.addCell(billToCell);
        document.add(billToTable);
        
        // ==================== ITEMS TABLE ====================
        Table itemsTable = new Table(new float[]{4, 1, 2, 2});
        itemsTable.setWidth(UnitValue.createPercentValue(100));
        itemsTable.setMarginBottom(15);
        
        // Table headers
        itemsTable.addHeaderCell(createProfessionalHeaderCell("Product"));
        itemsTable.addHeaderCell(createProfessionalHeaderCell("Qty"));
        itemsTable.addHeaderCell(createProfessionalHeaderCell("Unit Price"));
        itemsTable.addHeaderCell(createProfessionalHeaderCell("Total"));
        
        // Table rows
        double subtotal = 0.0;
        for (OrderItem item : items) {
            itemsTable.addCell(createProfessionalCell(item.getProductName(), TextAlignment.LEFT));
            itemsTable.addCell(createProfessionalCell(String.valueOf(item.getQuantity()), TextAlignment.CENTER));
            itemsTable.addCell(createProfessionalCell(String.format("%.2f TND", item.getProductPrice()), TextAlignment.RIGHT));
            itemsTable.addCell(createProfessionalCell(String.format("%.2f TND", item.getSubtotal()), TextAlignment.RIGHT).setBold());
            
            subtotal += item.getSubtotal();
        }
        
        document.add(itemsTable);
        
        // ==================== SUMMARY ====================
        Table summaryTable = new Table(new float[]{1, 1});
        summaryTable.setWidth(UnitValue.createPercentValue(45));
        summaryTable.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.RIGHT);
        summaryTable.setMarginTop(10);
        
        // Subtotal
        summaryTable.addCell(createSummaryCell("Subtotal:", false));
        summaryTable.addCell(createSummaryCell(String.format("%.2f TND", subtotal), false));
        
        // Discount (if applicable)
        double discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : 0.0;
        if (discount > 0) {
            String discountLabel = "Discount";
            if (order.getCouponCode() != null && !order.getCouponCode().isEmpty()) {
                discountLabel = "Discount (" + order.getCouponCode() + ")";
            }
            summaryTable.addCell(createSummaryCell(discountLabel + ":", false));
            summaryTable.addCell(createSummaryCell(String.format("-%.2f TND", discount), false)
                    .setFontColor(new DeviceRgb(200, 0, 0)));
        }
        
        // Net amount
        double netAmount = subtotal - discount;
        summaryTable.addCell(createSummaryCell("Net Amount:", false));
        summaryTable.addCell(createSummaryCell(String.format("%.2f TND", netAmount), false));
        
        // TVA
        double tva = netAmount * tvaRate;
        int tvaPct = (int) Math.round(tvaRate * 100);
        summaryTable.addCell(createSummaryCell("TVA (" + tvaPct + "%):", false));
        summaryTable.addCell(createSummaryCell(String.format("%.2f TND", tva), false));
        
        // Shipping
        summaryTable.addCell(createSummaryCell("Shipping:", false));
        summaryTable.addCell(createSummaryCell(String.format("%.2f TND", SHIPPING_COST), false));
        
        // Total
        double total = netAmount + tva + SHIPPING_COST;
        summaryTable.addCell(createSummaryCell("TOTAL:", true)
                .setBackgroundColor(brandColor)
                .setFontColor(ColorConstants.WHITE)
                .setPadding(8));
        summaryTable.addCell(createSummaryCell(String.format("%.2f TND", total), true)
                .setBackgroundColor(brandColor)
                .setFontColor(ColorConstants.WHITE)
                .setPadding(8));
        
        document.add(summaryTable);
        
        // ==================== FOOTER ====================
        document.add(new Paragraph("\n\n"));
        
        Paragraph thankYou = new Paragraph("Thank you for your purchase!")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(10)
                .setBold()
                .setFontColor(brandColor)
                .setMarginBottom(8);
        document.add(thankYou);
        
        // Proforma-specific footer note
        if (isProforma) {
            Paragraph proformaFooter = new Paragraph("PROFORMA INVOICE - Payment will be collected upon delivery")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(9)
                    .setBold()
                    .setFontColor(proformaColor)
                    .setMarginBottom(5);
            document.add(proformaFooter);
        }
        
        Paragraph footerInfo = new Paragraph("For questions, contact us at: contact@espritmarket.tn | +216 71 000 000")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(8)
                .setFontColor(textColor)
                .setMarginBottom(3);
        document.add(footerInfo);
        
        Paragraph terms = new Paragraph("This invoice is generated electronically and is valid without signature.")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(8)
                .setFontColor(textColor);
        document.add(terms);
        
        document.close();
        
        String invoiceType = isProforma ? "Proforma" : "Final";
        log.info("{} invoice PDF generated successfully for order: {}", invoiceType, order.getOrderNumber());
        
        return baos.toByteArray();
    }
    
    // ==================== HELPER METHODS ====================
    
    private Cell createProfessionalHeaderCell(String text) {
        return new Cell()
                .add(new Paragraph(text)
                        .setFontSize(10)
                        .setBold())
                .setBackgroundColor(new DeviceRgb(128, 0, 0))
                .setFontColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(8)
                .setBorder(null);
    }
    
    private Cell createProfessionalCell(String text, TextAlignment alignment) {
        return new Cell()
                .add(new Paragraph(text).setFontSize(9))
                .setTextAlignment(alignment)
                .setPadding(8)
                .setBorderTop(new com.itextpdf.layout.borders.SolidBorder(new DeviceRgb(221, 221, 221), 0.5f))
                .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(new DeviceRgb(221, 221, 221), 0.5f))
                .setBorderLeft(null)
                .setBorderRight(null);
    }
    
    private Cell createSummaryCell(String text, boolean isTotal) {
        Paragraph p = new Paragraph(text)
                .setFontSize(isTotal ? 12 : 10);
        
        if (isTotal) {
            p.setBold();
        }
        
        return new Cell()
                .add(p)
                .setBorder(null)
                .setPadding(4)
                .setTextAlignment(TextAlignment.RIGHT);
    }
    
    private String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "N/A";
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        return dateTime.format(formatter);
    }
    
    /**
     * Get user-friendly payment method label
     */
    private String getPaymentMethodLabel(String paymentMethod) {
        if (paymentMethod == null) {
            return "N/A";
        }
        
        switch (paymentMethod.toUpperCase()) {
            case "CASH":
            case "CASH_ON_DELIVERY":
                return "Cash on Delivery";
            case "CARD":
            case "CREDIT_CARD":
            case "DEBIT_CARD":
                return "Card Payment";
            case "ONLINE":
            case "STRIPE":
                return "Online Payment";
            default:
                return paymentMethod;
        }
    }
}
