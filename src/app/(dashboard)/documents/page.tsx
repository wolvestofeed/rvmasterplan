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
import { getDocuments, addDocument, deleteDocument } from "@/app/actions/documents";
import { useEffect } from "react";
import { useUploadThing } from "@/lib/uploadthing";

// Make sure formatCurrency exists in lib/utils, if not we will just use basic formatting

type DocumentItem = {
    id: string;
    title: string;
    fileType: string;
    fileUrl: string | null;
    createdAt: Date;
    renewalDate: Date | null;
    renewalCost: string | null;
};

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const [title, setTitle] = useState("");
    const [renewalDate, setRenewalDate] = useState("");
    const [renewalCost, setRenewalCost] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { startUpload } = useUploadThing("documentUploader");

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        setIsLoading(true);
        const res = await getDocuments();
        if (res.success && res.data) {
            setDocuments(res.data as any);
        } else {
            toast.error("Failed to load documents.");
        }
        setIsLoading(false);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title) {
            toast.error("Please provide a title down for the document.");
            return;
        }

        if (!selectedFile) {
            toast.error("Please select a file to upload.");
            return;
        }

        setIsUploading(true);

        try {
            // 1. Upload to UploadThing
            const res = await startUpload([selectedFile]);
            if (!res || res.length === 0) {
                throw new Error("Upload to third-party storage failed.");
            }

            const fileUrl = res[0].url;

            // 2. Save metadata to database
            const dbRes = await addDocument({
                title,
                fileType: selectedFile.type.includes('pdf') ? 'pdf' : 'image',
                fileUrl: fileUrl,
                renewalDate: renewalDate ? new Date(renewalDate) : null,
                renewalCost: renewalCost || null
            });

            if (!dbRes.success) throw new Error(dbRes.error);

            // 3. Reset form and reload
            setTitle("");
            setRenewalDate("");
            setRenewalCost("");
            setSelectedFile(null);

            // Quick optimistic update or full reload
            await loadDocuments();
            toast.success("Document uploaded successfully!");

        } catch (error: any) {
            toast.error(error.message || "Something went wrong.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const res = await deleteDocument(id);
        if (res.success) {
            setDocuments(documents.filter(doc => doc.id !== id));
            toast.success("Document removed.");
        } else {
            toast.error("Failed to delete document.");
        }
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
                            <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50 overflow-hidden hover:bg-slate-100 transition focus-within:ring-2 focus-within:ring-[#2a4f3f] focus-within:border-transparent">
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                                {selectedFile ? (
                                    <>
                                        <FileText className="h-8 w-8 text-[#2a4f3f] mb-2" />
                                        <p className="text-sm font-medium text-slate-800 truncate px-4">{selectedFile.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                        <p className="text-sm font-medium text-slate-600">Click to browse or drag and drop</p>
                                        <p className="text-xs text-slate-400 mt-1">Supported: PDF, JPG, PNG (Max 10MB)</p>
                                    </>
                                )}
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

                            <Button disabled={isUploading} type="submit" className="w-full bg-[#2a4f3f] hover:bg-[#1a3a2d] text-white">
                                {isUploading ? "Uploading..." : "Upload & Save"}
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
                                                {isLoading ? "Loading documents..." : "No documents uploaded yet."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        documents.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center">
                                                        {doc.fileType === 'pdf' ? (
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
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {doc.renewalDate ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                            {new Date(doc.renewalDate).toLocaleDateString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {doc.renewalCost !== null ? formatCurrency(Number(doc.renewalCost)) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-2">
                                                        {doc.fileUrl && (
                                                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                                                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                                                    <Eye className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                        )}
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
