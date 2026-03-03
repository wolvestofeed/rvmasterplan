import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/utils';
import {
    ExpenseItem,
    ExpenseGroup,
    ExpenseCategory,
    MonthlyBudget,
    ElectricalDevice,
    SolarPanel,
    SolarBattery,
    SolarGenerator
} from '@/types';

// Extend jsPDF type to include autoTable methods which are patching the prototype
interface jsPDFWithPlugin extends jsPDF {
    lastAutoTable?: { finalY: number };
}

export class PDFGenerator {
    private doc: jsPDFWithPlugin;
    private currentY: number = 20;

    constructor() {
        this.doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
    }

    private addHeader(title: string) {
        this.doc.setFillColor(80, 136, 156); // Theme primary color
        this.doc.rect(0, 0, 210, 30, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(24);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, 14, 20);
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 210 - 14, 20, { align: 'right' });
        this.currentY = 40;
    }

    private checkPageBreak(neededSpace: number) {
        if (this.currentY + neededSpace > 280) {
            this.doc.addPage();
            this.currentY = 20;
        }
    }

    private addSectionTitle(title: string) {
        this.checkPageBreak(15);
        this.doc.setTextColor(51, 65, 85); // Slate 700
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, 14, this.currentY);
        this.currentY += 2;
        // Draw a subtle line under the title
        this.doc.setDrawColor(226, 232, 240); // Slate 200
        this.doc.line(14, this.currentY, 210 - 14, this.currentY);
        this.currentY += 8;
    }

    public generateLivingBudgetReport(expenses: ExpenseItem[], budgets: MonthlyBudget[]) {
        this.addHeader('RV Living Budget Report');

        // Quick Summary
        const totalExpenses = expenses.reduce((sum, e) => {
            const sub = e.costPerItem * e.quantity;
            return sum + (sub + (sub * e.tax / 100));
        }, 0);

        const annualBudget = budgets.reduce((sum, b) => sum + b.budgetedAmount, 0);

        this.checkPageBreak(30);
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`Total Year-to-Date Expenses: ${formatCurrency(totalExpenses)}`, 14, this.currentY);
        this.currentY += 7;
        this.doc.text(`Total Annual Budget: ${formatCurrency(annualBudget)}`, 14, this.currentY);
        this.currentY += 15;

        this.addSectionTitle('Expense Ledger');

        if (expenses.length === 0) {
            this.doc.setFont('helvetica', 'italic');
            this.doc.text('No expenses recorded.', 14, this.currentY);
            this.currentY += 10;
        } else {
            const tableData = expenses.map(e => {
                const total = (e.costPerItem * e.quantity) * (1 + e.tax / 100);
                return [
                    e.name,
                    e.category,
                    e.group,
                    `Month ${e.month}, ${e.year}`,
                    formatCurrency(total)
                ];
            });

            autoTable(this.doc, {
                startY: this.currentY,
                head: [['Expense Name', 'Category', 'Group', 'Period', 'Total Cost']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [80, 136, 156] },
                margin: { left: 14, right: 14 }
            });

            this.currentY = (this.doc.lastAutoTable?.finalY || this.currentY) + 15;
        }
    }

    public generatePowerStrategyReport(devices: ElectricalDevice[], solarPanels: SolarPanel[], batteries: SolarBattery[], generators: SolarGenerator[]) {
        this.addHeader('Power Strategy & Solar Report');

        // Devices
        this.addSectionTitle('Electrical Load Analysis');
        const totalLoad = devices.reduce((sum, d) => sum + (d.watts * d.hoursPerDay), 0);

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(12);
        this.doc.text(`Estimated Daily Consumption: ${totalLoad.toLocaleString()} Watt-hours`, 14, this.currentY);
        this.currentY += 10;

        if (devices.length > 0) {
            const deviceData = devices.map(d => [
                d.name,
                d.group,
                `${d.watts}W`,
                `${d.hoursPerDay} hrs`,
                `${(d.watts * d.hoursPerDay).toLocaleString()} Wh`
            ]);

            autoTable(this.doc, {
                startY: this.currentY,
                head: [['Device', 'Group', 'Draw (Watts)', 'Daily Usage', 'Total Wh/Day']],
                body: deviceData,
                theme: 'striped',
                headStyles: { fillColor: [80, 136, 156] },
            });
            this.currentY = (this.doc.lastAutoTable?.finalY || this.currentY) + 15;
        } else {
            this.doc.setFont('helvetica', 'italic');
            this.doc.setFontSize(10);
            this.doc.text('No electrical devices configured.', 14, this.currentY);
            this.currentY += 15;
        }

        // Solar Equipment
        this.addSectionTitle('Solar Implementation');

        const panelOutput = solarPanels.reduce((sum, p) => sum + (p.wattage * p.quantity), 0);
        const estGeneration = panelOutput * 5 * 0.85; // rough estimate

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(12);
        this.doc.text(`Total Panel Wattage: ${panelOutput}W`, 14, this.currentY);
        this.currentY += 7;
        this.doc.text(`Est. Daily Solar Generation: ${estGeneration.toLocaleString()} Wh`, 14, this.currentY);
        this.currentY += 15;

        if (solarPanels.length > 0) {
            autoTable(this.doc, {
                startY: this.currentY,
                head: [['Solar Panel Brand/Model', 'Wattage', 'Quantity', 'Tech', 'Total Array']],
                body: solarPanels.map(p => [`${p.make} ${p.model}`, `${p.wattage}W`, p.quantity, p.cellType, `${p.wattage * p.quantity}W`]),
                theme: 'plain',
                headStyles: { fillColor: [245, 158, 11] }, // Amber 500
            });
            this.currentY = (this.doc.lastAutoTable?.finalY || this.currentY) + 15;
        }
    }

    // Master Plan generator
    public generateMasterPlanReport(
        expenses: ExpenseItem[],
        budgets: MonthlyBudget[],
        devices: ElectricalDevice[],
        solarPanels: SolarPanel[],
        batteries: SolarBattery[],
        generators: SolarGenerator[]
    ) {
        this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        this.currentY = 20;

        // Cover Page
        this.addHeader('RV Master Plan');

        this.doc.setTextColor(51, 65, 85);
        this.doc.setFontSize(18);
        this.doc.text('Comprehensive Strategy Document', 105, 100, { align: 'center' });
        this.doc.setFontSize(12);
        this.doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 115, { align: 'center' });

        // Page break
        this.doc.addPage();
        this.currentY = 20;

        // Living Budget Section
        this.generateLivingBudgetReport(expenses, budgets);

        // Page break
        this.doc.addPage();
        this.currentY = 20;

        // Power Strategy Section
        this.generatePowerStrategyReport(devices, solarPanels, batteries, generators);
    }

    public saveReport(filename: string) {
        this.doc.save(filename);
    }

    public getBlob(): Blob {
        return this.doc.output('blob');
    }
}
