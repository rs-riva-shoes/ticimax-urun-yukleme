import { ProductForm } from "@/components/products/product-form";
import { adminDb } from "@/lib/firebase-admin";

// Force dynamic since we fetch data
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
    // Helper to fetch list from Firestore
    const fetchSettingList = async (docId: string) => {
        try {
            const doc = await adminDb.collection('settings').doc(docId).get();
            if (doc.exists) {
                return doc.data()?.list || [];
            }
        } catch (error) {
            console.error(`Error fetching ${docId} from Firestore:`, error);
        }
        return [];
    };

    const attributesRaw = await fetchSettingList('attributes');
    const brandsRaw = await fetchSettingList('brands');
    const suppliersRaw = await fetchSettingList('suppliers');

    // Normalize Data if needed (ensure numeric IDs for features/values if string)
    // The previous code parsedInt because JSON might have strings.
    // Firestore data should be clean if we saved it correctly, but let's be safe.

    const attributes = Array.isArray(attributesRaw) ? attributesRaw.map((attr: any) => ({
        featureId: Number(attr.featureId),
        name: attr.featureName,
        groupId: Number(attr.groupId || 0),
        values: Array.isArray(attr.values) ? attr.values.map((val: any) => ({
            valueId: Number(val.valueId),
            name: val.valueName
        })) : []
    })) : [];

    const brands = Array.isArray(brandsRaw) ? brandsRaw.map((b: any) => ({
        ...b,
        ticimaxId: Number(b.ticimaxId || b.id) // Ensure ID is number
    })) : [];

    const suppliers = Array.isArray(suppliersRaw) ? suppliersRaw.map((s: any) => ({
        ...s,
        ticimaxId: Number(s.ticimaxId || s.id)
    })) : [];

    return (
        <div className="min-h-screen p-4 md:p-8 bg-muted/20">
            <ProductForm
                attributes={attributes}
                brands={brands}
                suppliers={suppliers}
            />
        </div>
    );
}
