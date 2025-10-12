# PDF Report Generation Setup

## Installation

To enable PDF report generation, install the required dependencies:

```bash
npm install jspdf jspdf-autotable
```

## Features

The PDF reports now include:

### 📄 **Professional Layout**
- **Header with branding** - Blue header with "TRANSPARENCY REPORT" title
- **Structured sections** - Clear separation of content areas
- **Color-coded sections** - Different colors for achievements, challenges, next steps
- **Professional typography** - Proper fonts and sizing

### 📊 **Data Visualization**
- **Utilization summary tables** - Clean tables showing fund/item utilization
- **Expense breakdown tables** - Detailed expense categories with amounts
- **Total calculations** - Highlighted total expenses section
- **Campaign details** - Summary of campaign information

### 🎨 **Visual Elements**
- **Color-coded headers** - Blue for main sections, green for achievements, yellow for challenges
- **Proper spacing** - Well-structured layout with appropriate margins
- **Page numbering** - Footer with page numbers and generation timestamp
- **Responsive tables** - Auto-sizing tables that fit content properly

### 📋 **Content Sections**
1. **Report Header** - Title, campaign, NGO, date, status
2. **Description** - Detailed report description
3. **Utilization Summary** - Amount/items used with percentages
4. **Expense Breakdown** - Categorized expenses with supporting documents count
5. **Achievements** - Success stories and accomplishments
6. **Challenges** - Issues faced during implementation
7. **Next Steps** - Future plans and actions
8. **Campaign Details** - Target vs achieved metrics

## Usage

The PDF generation is automatically integrated into:

- **NGO View Report Page** - Download button generates PDF
- **Public Reports Page** - Download button for transparency
- **NGO Reports Listing** - Quick download from list view

## File Naming

PDFs are automatically named using the report title:
- Format: `report_title_report.pdf`
- Special characters are replaced with underscores
- Lowercase formatting for consistency

## Example Output

```
TRANSPARENCY REPORT
================================

Monthly Fund Utilization Report - December 2024
Campaign: Winter Clothing Drive for Street Children
NGO: Help Children Foundation
Report Type: Utilization
Date: 12/15/2024
Status: Published

DESCRIPTION
-----------
This report details how the ₹50,000 raised was utilized...

UTILIZATION SUMMARY
-------------------
| Metric          | Value                    |
|-----------------|--------------------------|
| Amount Utilized | ₹45,000                  |
| Utilization Rate| 90% of raised funds      |

EXPENSE BREAKDOWN
-----------------
| # | Category      | Amount  | Bills | Description        |
|---|---------------|---------|-------|--------------------|
| 1 | Winter Jackets| ₹25,000 | 3 files| Purchased 100...  |
| 2 | Blankets      | ₹12,000 | 2 files| Bought 120...     |

TOTAL EXPENSES: ₹45,000

✓ ACHIEVEMENTS
Successfully distributed winter clothing to 200 children...

⚠ CHALLENGES  
Weather conditions made distribution difficult...

→ NEXT STEPS
Planning summer clothing drive for April 2025...

Generated on: 12/15/2024, 3:30:00 PM
Page 1 of 2
```

## Benefits

- **Professional appearance** for donor presentations
- **Easy sharing** via email or print
- **Offline access** to transparency reports
- **Standardized format** across all reports
- **Print-ready** documents for meetings
- **Archive-friendly** format for record keeping