import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function calculateLoanPayment(principal: number, annualInterestRate: number, years: number): number {
  if (principal <= 0) return 0;
  if (annualInterestRate <= 0) return principal / (years * 12);

  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const numberOfPayments = years * 12;

  const payment = principal *
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

  return payment;
}

export function calculateTotalInterest(principal: number, monthlyPayment: number, years: number): number {
  if (principal <= 0 || monthlyPayment <= 0) return 0;

  const totalPaid = monthlyPayment * years * 12;
  return Math.max(0, totalPaid - principal);
}
