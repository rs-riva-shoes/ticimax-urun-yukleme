import { ProductForm } from "@/components/products/product-form";
import attributesMapping from "@/data/attributes-mapping.json";

// Force dynamic since we fetch data
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
    // Use the cleaned attributes from attributes-mapping.json
    // No duplicates - source file is already cleaned
    const attributes = attributesMapping.map(attr => ({
        featureId: parseInt(attr.featureId),
        name: attr.featureName,
        values: attr.values.map(val => ({
            valueId: parseInt(val.valueId),
            name: val.valueName
        }))
    }));

    return (
        <div className="min-h-screen p-4 md:p-8 bg-muted/20">
            <ProductForm attributes={attributes} />
        </div>
    );
}
