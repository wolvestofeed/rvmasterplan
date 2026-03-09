"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { saveExpense } from "@/app/actions/expenses";

interface ExtractedData {
    type: 'Fuel' | 'Propane' | 'General';
    vendor: string;
    totalAmount: number;
    date: string;
    gallons?: number;
    pricePerGallon?: number;
    state?: string;
    notes?: string;
}

export function ReceiptScanner({ planType = 'full' }: { planType?: string }) {
    const isStarter = planType === 'starter';
    const [isScanning, setIsScanning] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Nomadic details
    const [odometer, setOdometer] = useState<number | undefined>();
    const [isHitched, setIsHitched] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);

        // Convert to base64
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Image = event.target?.result as string;

            try {
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
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!extractedData) return;

        setIsSaving(true);
        try {
            await saveExpense({
                name: extractedData.vendor,
                amount: extractedData.totalAmount,
                category: extractedData.type === 'Fuel' ? 'Maintenance' : extractedData.type === 'Propane' ? 'Propane' : 'Other',
                isFuelEvent: extractedData.type === 'Fuel',
                isPropaneEvent: extractedData.type === 'Propane',
                gallons: extractedData.gallons,
                odometerReading: odometer,
                isHitched: isHitched,
                stateLocation: extractedData.state,
                date: extractedData.date,
            });

            toast.success("Expense saved!");
            setIsDialogOpen(false);
            setExtractedData(null);
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
                    className={`${isStarter ? 'bg-amber-100 text-amber-600 border-amber-200 cursor-not-allowed hover:bg-amber-100' : 'bg-blue-600 hover:bg-blue-700 text-white'} flex items-center gap-2 h-12 w-full shadow-lg transition-all active:scale-95`}
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

                            {extractedData.type === 'Fuel' && (
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

                            {extractedData.type === 'Propane' && (
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
