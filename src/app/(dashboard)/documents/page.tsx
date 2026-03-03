"use client";

import { useState } from "react";
import { HeaderHero } from "@/components/layout/header-hero";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Image as ImageIcon, Upload, Trash2, Eye, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

// Make sure formatCurrency exists in lib/utils, if not we will just use basic formatting

type DocumentItem = {
    id: string;
    title: string;
    type: "pdf" | "image";
    dateAdded: string;
    renewalDate: string;
    renewalCost: number | null;
};

const initialDocuments: DocumentItem[] = [
    {
        id: "1",
        title: "Progressive RV Insurance Policy",
        type: "pdf",
        dateAdded: "2024-05-15",
        renewalDate: "2025-05-15",
        renewalCost: 705.00
    },
    {
        id: "2",
        title: "State Driver's License",
        type: "image",
        dateAdded: "2024-01-10",
        renewalDate: "2028-01-10",
        renewalCost: null
    },
    {
        id: "3",
        title: "Good Sam Membership",
        type: "pdf",
        dateAdded: "2024-06-01",
        renewalDate: "2025-06-01",
        renewalCost: 29.00
    },
    {
        id: "4",
        title: "RV Extended Warranty",
        type: "pdf",
        dateAdded: "2024-05-20",
        renewalDate: "2029-05-20",
        renewalCost: 0
    }
];

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
    const [title, setTitle] = useState("");
    const [renewalDate, setRenewalDate] = useState("");
    const [renewalCost, setRenewalCost] = useState("");

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title) {
            toast.error("Please provide a title down for the document.");
            return;
        }

        const newDoc: DocumentItem = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            type: "pdf", // default mock type
            dateAdded: new Date().toISOString().split('T')[0],
            renewalDate: renewalDate || "-",
            renewalCost: renewalCost ? parseFloat(renewalCost) : null
        };

        setDocuments([newDoc, ...documents]);
        setTitle("");
        setRenewalDate("");
        setRenewalCost("");

        toast.success("Document uploaded successfully!");
    };

    const handleDelete = (id: string) => {
        setDocuments(documents.filter(doc => doc.id !== id));
        toast.success("Document removed.");
    };

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <HeaderHero
                title="Document Library"
                description="Store your insurance policies, licenses, and memberships. Expiring documents will automatically appear on your dashboard."
                imageUrl="/images/page-headers/documents-header.png"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

                {/* Upload Form */}
                <Card className="lg:col-span-1 border border-slate-200 h-fit">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg">Upload Document</CardTitle>
                        <CardDescription>Supported formats: PDF, JPG, PNG</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                <p className="text-sm font-medium text-slate-600">Click to browse or drag and drop</p>
                                <p className="text-xs text-slate-400 mt-1">Max file size: 10MB</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Document Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Geico Insurance Policy"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="renewalDate">Renewal Date (Optional)</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="renewalDate"
                                        type="date"
                                        className="pl-9"
                                        value={renewalDate}
                                        onChange={(e) => setRenewalDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="renewalCost">Renewal Cost (Optional)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="renewalCost"
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-9"
                                        value={renewalCost}
                                        onChange={(e) => setRenewalCost(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-[#2a4f3f] hover:bg-[#1a3a2d] text-white">
                                Upload & Save
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Documents Table */}
                <Card className="lg:col-span-2 border border-slate-200">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Your Library</CardTitle>
                            <CardDescription>Manage administrative and compliance documents.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="w-[300px]">Document</TableHead>
                                        <TableHead>Added</TableHead>
                                        <TableHead>Renewal Date</TableHead>
                                        <TableHead className="text-right">Renewal Cost</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                                                No documents uploaded yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        documents.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center">
                                                        {doc.type === 'pdf' ? (
                                                            <div className="h-8 w-8 rounded bg-red-100 flex items-center justify-center mr-3 text-red-600">
                                                                <FileText className="h-4 w-4" />
                                                            </div>
                                                        ) : (
                                                            <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center mr-3 text-blue-600">
                                                                <ImageIcon className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                        {doc.title}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-500">
                                                    {new Date(doc.dateAdded).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {doc.renewalDate !== "-" && doc.renewalDate ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                            {new Date(doc.renewalDate).toLocaleDateString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {doc.renewalCost !== null ? formatCurrency(doc.renewalCost) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-500" onClick={() => handleDelete(doc.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
