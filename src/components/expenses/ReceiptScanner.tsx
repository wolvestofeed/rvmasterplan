"use client";

import { useState, useRef } from "react";
import { Camera, Fuel, Flame, ShoppingBag, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { saveExpense } from "@/app/actions/expenses";
import { useUploadThing } from "@/lib/uploadthing";

type ExpenseType = 'Fuel' | 'Propane' | 'General';

interface ExtractedData {
    type: ExpenseType;
    vendor: string;
    totalAmount: number;
    date: string;
    gallons?: number;
    pricePerGallon?: number;
    state?: string;
    notes?: string;
}

const CATEGORY_MAP: Record<ExpenseType, string> = {
    Fuel: 'Gasoline',
    Propane: 'Propane',
    General: 'Other',
};

function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas not supported"));
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error("Compression failed"));
                    const compressed = new File([blob], file.name, {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    });
                    resolve(compressed);
                },
                "image/jpeg",
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
        };

        img.src = url;
    });
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function ReceiptScanner({ planType = 'full' }: { planType?: string }) {
    const isStarter = planType === 'starter';
    const [isScanning, setIsScanning] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

    // Pre-scan expense type selection — user's choice overrides AI
    const [selectedType, setSelectedType] = useState<ExpenseType>('General');

    // Nomadic details
    const [odometer, setOdometer] = useState<number | undefined>();
    const [isHitched, setIsHitched] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { startUpload } = useUploadThing("receiptUploader");

    // Resolve the effective type: user toggle takes priority, but if General
    // and AI says Fuel/Propane, use the AI's detection
    const effectiveType: ExpenseType = extractedData
        ? (selectedType !== 'General' ? selectedType : extractedData.type)
        : selectedType;

    const isFuel = effectiveType === 'Fuel';
    const isPropane = effectiveType === 'Propane';

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);

        try {
            // Compress the image client-side
            const compressed = await compressImage(file);

            // Upload to Uploadthing and extract receipt data in parallel
            const [uploadResult, base64Image] = await Promise.all([
                startUpload([compressed]),
                fileToBase64(compressed),
            ]);

            const uploadedUrl = uploadResult?.[0]?.ufsUrl || uploadResult?.[0]?.url || null;
            setReceiptUrl(uploadedUrl);

            // Send compressed base64 to Gemini for extraction
            const response = await fetch('/api/extract-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image }),
            });

            if (!response.ok) throw new Error('Failed to extract data');

            const data = await response.json();
            setExtractedData(data);
            setIsDialogOpen(true);
        } catch (error) {
            console.error(error);
            toast.error("Failed to scan receipt. Please try again.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleSave = async () => {
        if (!extractedData) return;

        setIsSaving(true);
        try {
            await saveExpense({
                name: extractedData.vendor,
                amount: extractedData.totalAmount,
                category: CATEGORY_MAP[effectiveType],
                isFuelEvent: isFuel,
                isPropaneEvent: isPropane,
                gallons: extractedData.gallons,
                odometerReading: odometer,
                isHitched: isHitched,
                stateLocation: extractedData.state,
                date: extractedData.date,
                receiptUrl: receiptUrl || undefined,
            });

            toast.success("Expense saved!");
            setIsDialogOpen(false);
            setExtractedData(null);
            setReceiptUrl(null);
            setOdometer(undefined);
            setIsHitched(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save expense.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="flex flex-col gap-4">
                {/* Pre-scan expense type toggle */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setSelectedType('General')}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            selectedType === 'General'
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        General
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedType('Fuel')}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            selectedType === 'Fuel'
                                ? 'border-amber-500 bg-amber-50 text-amber-700'
                                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <Fuel className="h-4 w-4" />
                        Gas
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedType('Propane')}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            selectedType === 'Propane'
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <Flame className="h-4 w-4" />
                        Propane
                    </button>
                </div>

                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />

                <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning || isStarter}
                    className={`${isStarter ? 'bg-amber-100 text-amber-600 border-amber-200 cursor-not-allowed hover:bg-amber-100' : 'bg-purple-600 hover:bg-purple-700 text-white'} flex items-center gap-2 h-12 w-full shadow-lg transition-all active:scale-95`}
                >
                    {isScanning ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Camera className="h-5 w-5" />
                    )}
                    {isScanning ? "Processing Receipt..." : isStarter ? "Pro Feature Restored" : "Snap Receipt"}
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Verify Receipt Data</DialogTitle>
                    </DialogHeader>

                    {extractedData && (
                        <div className="grid gap-4 py-4">
                            {/* Type override toggle in dialog */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedType('General')}
                                    className={`flex-1 flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                                        effectiveType === 'General'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 bg-white text-gray-500'
                                    }`}
                                >
                                    <ShoppingBag className="h-3 w-3" />
                                    General
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedType('Fuel')}
                                    className={`flex-1 flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                                        effectiveType === 'Fuel'
                                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                                            : 'border-gray-200 bg-white text-gray-500'
                                    }`}
                                >
                                    <Fuel className="h-3 w-3" />
                                    Gas
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedType('Propane')}
                                    className={`flex-1 flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                                        effectiveType === 'Propane'
                                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                                            : 'border-gray-200 bg-white text-gray-500'
                                    }`}
                                >
                                    <Flame className="h-3 w-3" />
                                    Propane
                                </button>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="vendor" className="text-right">Vendor</Label>
                                <Input
                                    id="vendor"
                                    value={extractedData.vendor}
                                    onChange={(e) => setExtractedData({ ...extractedData, vendor: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="amount" className="text-right">Total $</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={extractedData.totalAmount}
                                    onChange={(e) => setExtractedData({ ...extractedData, totalAmount: parseFloat(e.target.value) })}
                                    className="col-span-3"
                                />
                            </div>

                            {isFuel && (
                                <>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="gallons" className="text-right">Gallons</Label>
                                        <Input
                                            id="gallons"
                                            type="number"
                                            value={extractedData.gallons}
                                            onChange={(e) => setExtractedData({ ...extractedData, gallons: parseFloat(e.target.value) })}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="ppg" className="text-right">$/Gal</Label>
                                        <Input
                                            id="ppg"
                                            type="number"
                                            value={extractedData.pricePerGallon}
                                            onChange={(e) => setExtractedData({ ...extractedData, pricePerGallon: parseFloat(e.target.value) })}
                                            className="col-span-3"
                                            placeholder="Price per gallon"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="odometer" className="text-right">Odometer</Label>
                                        <Input
                                            id="odometer"
                                            type="number"
                                            value={odometer}
                                            onChange={(e) => setOdometer(parseInt(e.target.value))}
                                            className="col-span-3"
                                            placeholder="Current mileage"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between px-2 pt-2">
                                        <Label htmlFor="hitched" className="text-sm font-medium">Was the trailer hitched?</Label>
                                        <Switch
                                            id="hitched"
                                            checked={isHitched}
                                            onCheckedChange={setIsHitched}
                                        />
                                    </div>
                                </>
                            )}

                            {isPropane && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="prop_gallons" className="text-right">Gal / Lbs</Label>
                                    <Input
                                        id="prop_gallons"
                                        type="number"
                                        value={extractedData.gallons}
                                        onChange={(e) => setExtractedData({ ...extractedData, gallons: parseFloat(e.target.value) })}
                                        className="col-span-3"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="state" className="text-right">State</Label>
                                <Input
                                    id="state"
                                    value={extractedData.state || ""}
                                    onChange={(e) => setExtractedData({ ...extractedData, state: e.target.value })}
                                    className="col-span-3"
                                    placeholder="e.g. TX, AZ"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Confirm & Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
