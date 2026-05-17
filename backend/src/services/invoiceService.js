const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class InvoiceService {
    /**
     * Generate PDF Invoice for Medicine Order
     */
    async generateMedicineInvoice(order, res) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });

                // Stream the PDF directly to the response
                doc.pipe(res);

                // --- Header Section ---
                this.generateHeader(doc);
                
                // --- Invoice Info ---
                this.generateCustomerInformation(doc, order);
                
                // --- Items Table ---
                this.generateInvoiceTable(doc, order);
                
                // --- Footer ---
                this.generateFooter(doc);

                doc.end();
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    generateHeader(doc) {
        doc
            .fillColor('#444444')
            .fontSize(20)
            .text('THE DHARMARTH FOUNDATION', 110, 57)
            .fontSize(10)
            .text('DharmArth Bhawan, Main Road,', 200, 65, { align: 'right' })
            .text('Nagaur, Rajasthan, India - 341001', 200, 80, { align: 'right' })
            .text('Support: +91 8000 000 000', 200, 95, { align: 'right' })
            .moveDown();
        
        // Draw a line
        doc.moveTo(50, 115).lineTo(550, 115).strokeColor('#eeeeee').stroke();
    }

    generateCustomerInformation(doc, order) {
        doc
            .fillColor('#444444')
            .fontSize(20)
            .text('Invoice', 50, 140);

        this.generateHr(doc, 165);

        const customerInfoTop = 185;

        doc
            .fontSize(10)
            .text('Invoice No:', 50, customerInfoTop)
            .font('Helvetica-Bold')
            .text(order._id.toString().toUpperCase(), 150, customerInfoTop)
            .font('Helvetica')
            .text('Invoice Date:', 50, customerInfoTop + 15)
            .text(new Date(order.createdAt).toLocaleDateString(), 150, customerInfoTop + 15)
            .text('Payment Status:', 50, customerInfoTop + 30)
            .text(order.paymentDetails.status || 'Paid', 150, customerInfoTop + 30)

            .font('Helvetica-Bold')
            .text('Shipping Address', 300, customerInfoTop)
            .font('Helvetica')
            .text(order.user?.name || 'Customer', 300, customerInfoTop + 15)
            .text(`${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''}`, 300, customerInfoTop + 30)
            .text(`${order.shippingAddress?.state || ''}, ${order.shippingAddress?.zip || ''}`, 300, customerInfoTop + 45)
            .moveDown();

        this.generateHr(doc, 252);
    }

    generateInvoiceTable(doc, order) {
        let i;
        let invoiceTableTop = 330;

        doc.font('Helvetica-Bold');
        this.generateTableRow(doc, invoiceTableTop, 'Item', 'Dosage', 'Qty', 'Price', 'Total');
        this.generateHr(doc, invoiceTableTop + 20);
        doc.font('Helvetica').fillColor('#444444');

        let position = invoiceTableTop + 30;

        for (i = 0; i < order.items.length; i++) {
            const item = order.items[i];
            
            // Prevent overlapping at bottom
            if (position > 680) {
                doc.addPage();
                position = 50;
                
                doc.font('Helvetica-Bold');
                this.generateTableRow(doc, position, 'Item', 'Dosage', 'Qty', 'Price', 'Total');
                this.generateHr(doc, position + 20);
                doc.font('Helvetica').fillColor('#444444');
                position += 30;
            }

            this.generateTableRow(
                doc,
                position,
                item.name,
                item.dosage || '-',
                item.quantity.toString(),
                `₹${item.price.toFixed(2)}`,
                `₹${(item.price * item.quantity).toFixed(2)}`
            );

            // Add sub-row for MARG details if they exist
            let hasMargDetails = item.margBatch || item.margExpiry || item.margBillNo || item.margPack;
            if (hasMargDetails) {
                position += 15;
                doc.fontSize(8).fillColor('#666666');
                let detailsStr = [];
                if (item.margBatch) detailsStr.push(`Batch: ${item.margBatch}`);
                if (item.margExpiry) detailsStr.push(`Exp: ${item.margExpiry.substring(0, 7)}`);
                if (item.margBillNo) detailsStr.push(`VCN: ${item.margBillNo}`);
                if (item.margPack && item.margPack > 1) {
                    detailsStr.push(`Conv: ${Math.floor(item.quantity/item.margPack)} Strip, ${item.quantity%item.margPack} Tab`);
                }
                doc.text(detailsStr.join(' | '), 50, position, { width: 450 });
                doc.fillColor('#444444').fontSize(10);
            }

            this.generateHr(doc, position + 20);
            position += 30;
        }

        const subtotalPosition = position + 10;
        this.generateTableRow(doc, subtotalPosition, '', '', '', 'Subtotal', `₹${order.totalAmount.toFixed(2)}`);

        const paidToDatePosition = subtotalPosition + 20;
        doc.font('Helvetica-Bold');
        this.generateTableRow(doc, paidToDatePosition, '', '', '', 'Amount Paid', `₹${order.totalAmount.toFixed(2)}`);
        doc.font('Helvetica');
    }

    generateFooter(doc) {
        doc
            .fontSize(10)
            .text(
                'This is a computer generated invoice and requires no signature.',
                50,
                780,
                { align: 'center', width: 500 }
            );
        
        doc
            .fillColor('#10b981')
            .fontSize(12)
            .text('Prescription Verified & Digitally Signed by DharmArth Pharmacy', 50, 750, { align: 'center' });
    }

    generateTableRow(doc, y, item, dosage, qty, price, total) {
        doc
            .fontSize(10)
            .text(item, 50, y, { width: 150 })
            .text(dosage, 200, y, { width: 100 })
            .text(qty, 300, y, { width: 50, align: 'right' })
            .text(price, 350, y, { width: 100, align: 'right' })
            .text(total, 450, y, { width: 100, align: 'right' });
    }

    generateHr(doc, y) {
        doc
            .strokeColor('#aaaaaa')
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
    }
}

module.exports = new InvoiceService();
