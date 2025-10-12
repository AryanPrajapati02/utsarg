import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const generateReportPDF = (report, campaign, ngoName = null) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let yPosition = 20

  // Colors
  const primaryColor = [59, 130, 246] // Blue
  const secondaryColor = [107, 114, 128] // Gray
  const successColor = [34, 197, 94] // Green
  const warningColor = [245, 158, 11] // Yellow

  // Helper function to add text with word wrap
  const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y)
    return y + (lines.length * fontSize * 0.4)
  }

  // Header
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('TRANSPARENCY REPORT', pageWidth / 2, 25, { align: 'center' })
  
  yPosition = 50

  // Report Title
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  yPosition = addWrappedText(report.title, 20, yPosition, pageWidth - 40, 18)
  yPosition += 10

  // Basic Info Section
  doc.setFillColor(248, 250, 252)
  doc.rect(15, yPosition - 5, pageWidth - 30, 35, 'F')
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  
  const basicInfo = [
    ['Campaign:', campaign?.title || 'N/A'],
    ['NGO:', ngoName || campaign?.ngo_profiles?.ngo_name || 'N/A'],
    ['Report Type:', report.report_type?.charAt(0).toUpperCase() + report.report_type?.slice(1) || 'N/A'],
    ['Date:', new Date(report.published_at || report.created_at).toLocaleDateString()],
    ['Status:', report.is_published ? 'Published' : 'Draft']
  ]

  let infoY = yPosition + 5
  basicInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, infoY)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 80, infoY)
    infoY += 6
  })
  
  yPosition += 45

  // Description Section
  if (report.description) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('DESCRIPTION', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)
    yPosition = addWrappedText(report.description, 20, yPosition, pageWidth - 40, 10)
    yPosition += 15
  }

  // Utilization Summary
  if (report.amount_utilized || report.items_utilized) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('UTILIZATION SUMMARY', 20, yPosition)
    yPosition += 15

    const utilizationData = []
    
    if (report.amount_utilized) {
      utilizationData.push(['Amount Utilized', `₹${report.amount_utilized.toLocaleString()}`])
      if (campaign?.raised_amount) {
        const percentage = Math.round((report.amount_utilized / campaign.raised_amount) * 100)
        utilizationData.push(['Utilization Rate', `${percentage}% of raised funds`])
      }
    }
    
    if (report.items_utilized) {
      utilizationData.push(['Items Utilized', report.items_utilized.toLocaleString()])
      if (campaign?.collected_items) {
        const percentage = Math.round((report.items_utilized / campaign.collected_items) * 100)
        utilizationData.push(['Utilization Rate', `${percentage}% of collected items`])
      }
    }

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: utilizationData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    })
    
    yPosition = doc.lastAutoTable.finalY + 20
  }

  // Expense Breakdown
  if (report.expenses && report.expenses.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('EXPENSE BREAKDOWN', 20, yPosition)
    yPosition += 15

    const expenseData = report.expenses.map((expense, index) => [
      (index + 1).toString(),
      expense.category || 'N/A',
      `₹${expense.amount?.toLocaleString() || '0'}`,
      expense.bills?.length ? `${expense.bills.length} file(s)` : 'No files',
      expense.description || 'No description'
    ])

    doc.autoTable({
      startY: yPosition,
      head: [['#', 'Category', 'Amount', 'Bills', 'Description']],
      body: expenseData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 60 }
      },
      margin: { left: 20, right: 20 }
    })

    yPosition = doc.lastAutoTable.finalY + 10

    // Total Expenses
    const totalExpenses = report.expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
    doc.setFillColor(...successColor)
    doc.rect(20, yPosition, pageWidth - 40, 15, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL EXPENSES:', 25, yPosition + 10)
    doc.text(`₹${totalExpenses.toLocaleString()}`, pageWidth - 25, yPosition + 10, { align: 'right' })
    
    yPosition += 25
  }

  // Achievements Section
  if (report.achievements) {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFillColor(...successColor)
    doc.rect(15, yPosition - 5, pageWidth - 30, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('✓ ACHIEVEMENTS', 20, yPosition)
    yPosition += 15

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    yPosition = addWrappedText(report.achievements, 20, yPosition, pageWidth - 40, 10)
    yPosition += 15
  }

  // Challenges Section
  if (report.challenges) {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFillColor(...warningColor)
    doc.rect(15, yPosition - 5, pageWidth - 30, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('⚠ CHALLENGES', 20, yPosition)
    yPosition += 15

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    yPosition = addWrappedText(report.challenges, 20, yPosition, pageWidth - 40, 10)
    yPosition += 15
  }

  // Next Steps Section
  if (report.next_steps) {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFillColor(...primaryColor)
    doc.rect(15, yPosition - 5, pageWidth - 30, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('→ NEXT STEPS', 20, yPosition)
    yPosition += 15

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    yPosition = addWrappedText(report.next_steps, 20, yPosition, pageWidth - 40, 10)
    yPosition += 15
  }

  // Campaign Details Section
  if (campaign) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFillColor(248, 250, 252)
    doc.rect(15, yPosition - 5, pageWidth - 30, 45, 'F')
    
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('CAMPAIGN DETAILS', 20, yPosition + 5)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)
    
    const campaignDetails = []
    if (campaign.campaign_type === 'money') {
      campaignDetails.push(
        ['Target Amount:', `₹${campaign.target_amount?.toLocaleString() || '0'}`],
        ['Amount Raised:', `₹${campaign.raised_amount?.toLocaleString() || '0'}`]
      )
    } else {
      campaignDetails.push(
        ['Target Items:', `${campaign.target_items?.toLocaleString() || '0'}`],
        ['Items Collected:', `${campaign.collected_items?.toLocaleString() || '0'}`]
      )
    }
    
    let detailY = yPosition + 15
    campaignDetails.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, 20, detailY)
      doc.setFont('helvetica', 'normal')
      doc.text(value, 80, detailY)
      detailY += 8
    })
    
    yPosition += 55
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFillColor(...secondaryColor)
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 10)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' })
  }

  return doc
}

export const downloadReportPDF = (report, campaign, ngoName = null) => {
  try {
    const doc = generateReportPDF(report, campaign, ngoName)
    const filename = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`
    doc.save(filename)
    return true
  } catch (error) {
    console.error('PDF generation failed:', error)
    return false
  }
}